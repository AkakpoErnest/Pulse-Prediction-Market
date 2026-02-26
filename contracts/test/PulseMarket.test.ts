import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { PulseMarket, SomniaEventHandler } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = ethers.keccak256(
  ethers.toUtf8Bytes("Transfer(address,address,uint256)")
);
const CHAIN_ID     = 31337n;
const MIN_BET      = ethers.parseEther("0.001");
const CREATION_BOND = ethers.parseEther("0.01");

enum ComparisonOp { GT, GTE, LT, LTE, EQ }

function encodeCondition(op: ComparisonOp, threshold: bigint): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint8", "uint256"],
    [op, threshold]
  );
}

describe("PulseMarket", () => {
  let pulseMarket:    PulseMarket;
  let eventHandler:   SomniaEventHandler;
  let owner:          SignerWithAddress;
  let creator:        SignerWithAddress;
  let bettorYes:      SignerWithAddress;
  let bettorNo:       SignerWithAddress;
  let watchedContract: SignerWithAddress;

  beforeEach(async () => {
    [owner, creator, bettorYes, bettorNo, watchedContract] =
      await ethers.getSigners();

    const PulseMarket = await ethers.getContractFactory("PulseMarket");
    pulseMarket = await PulseMarket.deploy(owner.address);

    const SomniaEventHandler = await ethers.getContractFactory("SomniaEventHandler");
    // Use address(0) for reactive service so react() can be called by anyone in tests
    eventHandler = await SomniaEventHandler.deploy(
      await pulseMarket.getAddress(),
      ethers.ZeroAddress,
      owner.address
    );

    await pulseMarket.setEventHandler(await eventHandler.getAddress());
  });

  // ─── Market Creation ──────────────────────────────────────────────────────

  describe("createMarket", () => {
    it("creates a market with valid params", async () => {
      const condition = encodeCondition(ComparisonOp.GT, ethers.parseEther("100"));

      await expect(
        pulseMarket.connect(creator).createMarket(
          "Will the next transfer be > 100 STT?",
          watchedContract.address,
          TRANSFER_TOPIC,
          condition,
          3600, // 1 hour
          { value: CREATION_BOND }
        )
      )
        .to.emit(pulseMarket, "MarketCreated")
        .withArgs(
          0n,
          creator.address,
          watchedContract.address,
          TRANSFER_TOPIC,
          "Will the next transfer be > 100 STT?",
          (v: bigint) => v > 0n
        );

      const market = await pulseMarket.getMarket(0n);
      expect(market.id).to.equal(0n);
      expect(market.creator).to.equal(creator.address);
      expect(market.totalYesBets).to.equal(CREATION_BOND);
      expect(market.status).to.equal(0); // Active
    });

    it("reverts if creation bond is too low", async () => {
      await expect(
        pulseMarket.connect(creator).createMarket(
          "Test?",
          watchedContract.address,
          TRANSFER_TOPIC,
          encodeCondition(ComparisonOp.GT, 1n),
          3600,
          { value: ethers.parseEther("0.001") } // below MIN_CREATION_BOND
        )
      ).to.be.revertedWith("PM: insufficient creation bond");
    });

    it("reverts with empty question", async () => {
      await expect(
        pulseMarket.connect(creator).createMarket(
          "",
          watchedContract.address,
          TRANSFER_TOPIC,
          encodeCondition(ComparisonOp.GT, 1n),
          3600,
          { value: CREATION_BOND }
        )
      ).to.be.revertedWith("PM: empty question");
    });

    it("increments market counter", async () => {
      for (let i = 0; i < 3; i++) {
        await pulseMarket.connect(creator).createMarket(
          `Market ${i}?`,
          watchedContract.address,
          TRANSFER_TOPIC,
          encodeCondition(ComparisonOp.GT, 1n),
          3600,
          { value: CREATION_BOND }
        );
      }
      expect(await pulseMarket.getMarketCount()).to.equal(3n);
    });
  });

  // ─── Betting ──────────────────────────────────────────────────────────────

  describe("placeBet", () => {
    beforeEach(async () => {
      await pulseMarket.connect(creator).createMarket(
        "Will the next transfer be > 100 STT?",
        watchedContract.address,
        TRANSFER_TOPIC,
        encodeCondition(ComparisonOp.GT, ethers.parseEther("100")),
        3600,
        { value: CREATION_BOND }
      );
    });

    it("accepts a YES bet", async () => {
      await expect(
        pulseMarket.connect(bettorYes).placeBet(0n, true, { value: MIN_BET })
      )
        .to.emit(pulseMarket, "BetPlaced")
        .withArgs(0n, bettorYes.address, true, MIN_BET);

      const bet = await pulseMarket.getBet(0n, bettorYes.address);
      expect(bet.isYes).to.be.true;
      expect(bet.amount).to.equal(MIN_BET);
    });

    it("accepts a NO bet", async () => {
      await expect(
        pulseMarket.connect(bettorNo).placeBet(0n, false, { value: MIN_BET })
      ).to.emit(pulseMarket, "BetPlaced");

      const market = await pulseMarket.getMarket(0n);
      expect(market.totalNoBets).to.equal(MIN_BET);
    });

    it("reverts if bet is below minimum", async () => {
      await expect(
        pulseMarket.connect(bettorYes).placeBet(0n, true, {
          value: ethers.parseEther("0.0001"),
        })
      ).to.be.revertedWith("PM: bet below minimum");
    });

    it("reverts if bettor bets twice", async () => {
      await pulseMarket.connect(bettorYes).placeBet(0n, true, { value: MIN_BET });
      await expect(
        pulseMarket.connect(bettorYes).placeBet(0n, false, { value: MIN_BET })
      ).to.be.revertedWith("PM: already bet");
    });

    it("reverts if market is expired", async () => {
      await time.increase(3700);
      await expect(
        pulseMarket.connect(bettorYes).placeBet(0n, true, { value: MIN_BET })
      ).to.be.revertedWith("PM: market expired");
    });
  });

  // ─── Reactive Settlement ──────────────────────────────────────────────────

  describe("reactive settlement via SomniaEventHandler", () => {
    let marketId: bigint;
    const threshold = ethers.parseEther("100");

    beforeEach(async () => {
      await pulseMarket.connect(creator).createMarket(
        "Will the next transfer be > 100 STT?",
        watchedContract.address,
        TRANSFER_TOPIC,
        encodeCondition(ComparisonOp.GT, threshold),
        3600,
        { value: CREATION_BOND }
      );
      marketId = 0n;

      await pulseMarket.connect(bettorYes).placeBet(marketId, true, {
        value: ethers.parseEther("1"),
      });
      await pulseMarket.connect(bettorNo).placeBet(marketId, false, {
        value: ethers.parseEther("0.5"),
      });

      // Subscribe market to reactive handler
      await eventHandler.subscribeMarket(marketId);
    });

    it("settles YES when transfer value > threshold", async () => {
      const triggerValue = ethers.parseEther("200"); // > 100 STT → YES
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [triggerValue]
      );

      await expect(
        eventHandler.react(
          CHAIN_ID,
          watchedContract.address,
          TRANSFER_TOPIC,
          ethers.zeroPadValue(bettorYes.address, 32),
          ethers.zeroPadValue(bettorNo.address, 32),
          ethers.ZeroHash,
          data
        )
      )
        .to.emit(eventHandler, "MarketSettledByReactivity")
        .withArgs(marketId, true, triggerValue);

      const market = await pulseMarket.getMarket(marketId);
      expect(market.status).to.equal(1);  // Resolved
      expect(market.outcome).to.equal(1); // Yes
    });

    it("settles NO when transfer value <= threshold", async () => {
      const triggerValue = ethers.parseEther("50"); // <= 100 STT → NO
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [triggerValue]
      );

      await eventHandler.react(
        CHAIN_ID,
        watchedContract.address,
        TRANSFER_TOPIC,
        ethers.ZeroHash,
        ethers.ZeroHash,
        ethers.ZeroHash,
        data
      );

      const market = await pulseMarket.getMarket(marketId);
      expect(market.outcome).to.equal(2); // No
    });

    it("does not settle already-resolved markets", async () => {
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [ethers.parseEther("200")]
      );

      await eventHandler.react(CHAIN_ID, watchedContract.address, TRANSFER_TOPIC, ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash, data);
      // Second react should not revert, but market stays resolved
      await expect(
        eventHandler.react(CHAIN_ID, watchedContract.address, TRANSFER_TOPIC, ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash, data)
      ).to.not.be.reverted;

      const market = await pulseMarket.getMarket(marketId);
      expect(market.status).to.equal(1); // still Resolved
    });
  });

  // ─── Claim Winnings ───────────────────────────────────────────────────────

  describe("claimWinnings", () => {
    beforeEach(async () => {
      await pulseMarket.connect(creator).createMarket(
        "Test market",
        watchedContract.address,
        TRANSFER_TOPIC,
        encodeCondition(ComparisonOp.GT, ethers.parseEther("100")),
        3600,
        { value: CREATION_BOND }
      );

      await pulseMarket.connect(bettorYes).placeBet(0n, true, {
        value: ethers.parseEther("1"),
      });
      await pulseMarket.connect(bettorNo).placeBet(0n, false, {
        value: ethers.parseEther("0.5"),
      });

      await eventHandler.subscribeMarket(0n);

      // Trigger YES outcome
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [ethers.parseEther("200")]
      );
      await eventHandler.react(
        CHAIN_ID,
        watchedContract.address,
        TRANSFER_TOPIC,
        ethers.ZeroHash,
        ethers.ZeroHash,
        ethers.ZeroHash,
        data
      );
    });

    it("YES bettor can claim winnings", async () => {
      const balBefore = await ethers.provider.getBalance(bettorYes.address);
      await pulseMarket.connect(bettorYes).claimWinnings(0n);
      const balAfter = await ethers.provider.getBalance(bettorYes.address);
      expect(balAfter).to.be.gt(balBefore - ethers.parseEther("0.01")); // net positive after gas
    });

    it("NO bettor cannot claim winnings on YES outcome", async () => {
      await expect(
        pulseMarket.connect(bettorNo).claimWinnings(0n)
      ).to.be.revertedWith("PM: not a winner");
    });

    it("cannot claim twice", async () => {
      await pulseMarket.connect(bettorYes).claimWinnings(0n);
      await expect(
        pulseMarket.connect(bettorYes).claimWinnings(0n)
      ).to.be.revertedWith("PM: already claimed");
    });
  });

  // ─── Expiry & Refunds ─────────────────────────────────────────────────────

  describe("expiry and refunds", () => {
    beforeEach(async () => {
      await pulseMarket.connect(creator).createMarket(
        "Will expire",
        watchedContract.address,
        TRANSFER_TOPIC,
        encodeCondition(ComparisonOp.GT, 1n),
        3600,
        { value: CREATION_BOND }
      );
      await pulseMarket.connect(bettorYes).placeBet(0n, true, { value: MIN_BET });
    });

    it("can cancel an expired market", async () => {
      await time.increase(3700);
      await expect(pulseMarket.cancelExpiredMarket(0n))
        .to.emit(pulseMarket, "MarketCancelled");

      const market = await pulseMarket.getMarket(0n);
      expect(market.status).to.equal(2); // Cancelled
    });

    it("bettor can claim refund after cancellation", async () => {
      await time.increase(3700);
      await pulseMarket.cancelExpiredMarket(0n);

      const balBefore = await ethers.provider.getBalance(bettorYes.address);
      await pulseMarket.connect(bettorYes).claimRefund(0n);
      const balAfter = await ethers.provider.getBalance(bettorYes.address);
      // Should get back approximately MIN_BET (minus gas)
      expect(balAfter).to.be.gt(balBefore);
    });
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  describe("getMarkets pagination", () => {
    it("returns correct page of markets", async () => {
      for (let i = 0; i < 5; i++) {
        await pulseMarket.connect(creator).createMarket(
          `Market ${i}?`,
          watchedContract.address,
          TRANSFER_TOPIC,
          encodeCondition(ComparisonOp.GT, 1n),
          3600,
          { value: CREATION_BOND }
        );
      }
      const page = await pulseMarket.getMarkets(2n, 2n);
      expect(page.length).to.equal(2);
      expect(page[0].id).to.equal(2n);
      expect(page[1].id).to.equal(3n);
    });
  });
});

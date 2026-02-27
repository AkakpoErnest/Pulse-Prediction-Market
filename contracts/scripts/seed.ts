import { ethers, network } from "hardhat";

/**
 * Seed script — creates 3 demo markets on Pulse Market.
 *
 * These markets watch Pulse Market itself for internal events.
 * The SomniaEventHandler's generic fallback resolves non-Transfer events
 * as conditionMet=true the instant any matching event fires.
 *
 * Run: npx hardhat run scripts/seed.ts --network somnia
 */

const PULSE_MARKET    = "0xF996C610619C0376840d4634af8477e9CBFF1AE2";
const EVENT_HANDLER   = "0x2a3563D707E4d61797D80832CA76F1621221cdc1";
const BOND            = ethers.parseEther("0.01");

// conditionData for the generic fallback (non-Transfer events ignore this,
// but it must be ABI-valid for storage). GT threshold=0.
function defaultCondition(): string {
  return ethers.AbiCoder.defaultAbiCoder().encode(["uint8", "uint256"], [0, 0n]);
}

// Topic helpers
const topic = (sig: string) => ethers.id(sig);

const MARKETS = [
  {
    question:        "Will anyone place a bet on Pulse Market in the next 3 days?",
    watchedContract: PULSE_MARKET,
    eventTopic:      topic("BetPlaced(uint256,address,bool,uint256)"),
    conditionData:   defaultCondition(),
    duration:        3 * 24 * 3600,
    description:     "Self-settling: resolves YES the instant any bet is placed",
  },
  {
    question:        "Will a new Pulse Market be created in the next 3 days?",
    watchedContract: PULSE_MARKET,
    eventTopic:      topic("MarketCreated(uint256,address,address,bytes32,string,uint256)"),
    conditionData:   defaultCondition(),
    duration:        3 * 24 * 3600,
    description:     "Self-settling: resolves YES the instant any new market is created",
  },
  {
    question:        "Will a winner claim their payout on Pulse Market this week?",
    watchedContract: PULSE_MARKET,
    eventTopic:      topic("WinningsClaimed(uint256,address,uint256)"),
    conditionData:   defaultCondition(),
    duration:        7 * 24 * 3600,
    description:     "Self-settling: resolves YES the instant any winner claims",
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     PULSE MARKET — Market Seeder       ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`Network:  ${network.name}`);
  console.log(`Signer:   ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} STT\n`);

  const pulseMarket  = await ethers.getContractAt("PulseMarket",        PULSE_MARKET,  deployer);
  const eventHandler = await ethers.getContractAt("SomniaEventHandler", EVENT_HANDLER, deployer);

  const MARKET_CREATED_TOPIC = topic("MarketCreated(uint256,address,address,bytes32,string,uint256)");

  for (const [i, m] of MARKETS.entries()) {
    console.log(`▸ Creating market ${i + 1}/${MARKETS.length}`);
    console.log(`  "${m.question}"`);
    console.log(`  ${m.description}`);

    const tx      = await pulseMarket.createMarket(
      m.question,
      m.watchedContract,
      m.eventTopic,
      m.conditionData,
      BigInt(m.duration),
      { value: BOND }
    );
    const receipt = await tx.wait();

    // Parse market ID from MarketCreated log (topic[1] is indexed marketId)
    const log      = receipt?.logs.find((l: any) => l.topics[0] === MARKET_CREATED_TOPIC);
    const marketId = log ? BigInt(log.topics[1]) : null;

    if (marketId === null) {
      console.log("  ⚠ Could not parse market ID from logs — skipping subscribe");
      continue;
    }
    console.log(`  ✓ Created market #${marketId}`);

    // Subscribe to reactivity
    const subTx = await eventHandler.subscribeMarket(marketId);
    await subTx.wait();
    console.log(`  ✓ Subscribed market #${marketId} to Somnia Reactivity\n`);
  }

  console.log("╔════════════════════════════════════════╗");
  console.log("║          Seeding Complete!             ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`Explorer: https://shannon-explorer.somnia.network/address/${PULSE_MARKET}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

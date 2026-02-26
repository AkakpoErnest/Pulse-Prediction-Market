// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IPulseMarket.sol";

/// @title PulseMarket
/// @notice Core prediction market contract for Pulse Market on Somnia.
///         Markets are settled automatically by the SomniaEventHandler reactive
///         contract when a watched on-chain event fires.
///
///         Fee structure:
///           - 1% platform fee (to owner)
///           - 2% creator fee (to market creator)
///           - 97% to winning bettors (proportional to stake)
///
///         A minimum bet of 0.001 STT prevents dust attacks.
///         A minimum creation bond of 0.01 STT is required to create a market.
contract PulseMarket is IPulseMarket, ReentrancyGuard, Ownable, Pausable {
    // ─── Constants ───────────────────────────────────────────────────────────

    uint256 public constant PLATFORM_FEE_BPS = 100;   // 1%
    uint256 public constant CREATOR_FEE_BPS  = 200;   // 2%
    uint256 public constant BPS_DENOMINATOR  = 10_000;
    uint256 public constant MIN_BET          = 0.001 ether;
    uint256 public constant MIN_CREATION_BOND = 0.01 ether;
    uint256 public constant MIN_DURATION     = 5 minutes;
    uint256 public constant MAX_DURATION     = 30 days;
    uint256 public constant MAX_QUESTION_LEN = 280;

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 private _marketCounter;

    /// @notice Address of the authorised reactive settler (SomniaEventHandler).
    address public eventHandler;

    /// @notice Accumulated platform fees available to withdraw.
    uint256 public platformFeeBalance;

    mapping(uint256 => Market) private _markets;
    /// @dev marketId => bettor => Bet
    mapping(uint256 => mapping(address => Bet)) private _bets;
    /// @dev marketId => list of bettors (for iteration in cancel/refund)
    mapping(uint256 => address[]) private _bettors;

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyEventHandler() {
        require(msg.sender == eventHandler, "PM: caller not event handler");
        _;
    }

    modifier marketExists(uint256 marketId) {
        require(marketId < _marketCounter, "PM: market does not exist");
        _;
    }

    modifier marketActive(uint256 marketId) {
        require(_markets[marketId].status == MarketStatus.Active, "PM: market not active");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Set the address of the SomniaEventHandler reactive contract.
    ///         Must be called after deploying SomniaEventHandler.
    function setEventHandler(address handler) external onlyOwner {
        require(handler != address(0), "PM: zero address");
        eventHandler = handler;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Withdraw accumulated platform fees.
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeeBalance;
        require(amount > 0, "PM: no fees");
        platformFeeBalance = 0;
        _transfer(owner(), amount);
    }

    // ─── Market Lifecycle ─────────────────────────────────────────────────────

    /// @inheritdoc IPulseMarket
    function createMarket(
        string calldata question,
        address watchedContract,
        bytes32 eventTopic,
        bytes calldata conditionData,
        uint256 duration
    ) external payable override whenNotPaused nonReentrant returns (uint256 marketId) {
        require(bytes(question).length > 0, "PM: empty question");
        require(bytes(question).length <= MAX_QUESTION_LEN, "PM: question too long");
        require(watchedContract != address(0), "PM: zero watched contract");
        require(eventTopic != bytes32(0), "PM: zero event topic");
        require(duration >= MIN_DURATION, "PM: duration too short");
        require(duration <= MAX_DURATION, "PM: duration too long");
        require(msg.value >= MIN_CREATION_BOND, "PM: insufficient creation bond");

        marketId = _marketCounter++;

        _markets[marketId] = Market({
            id:                  marketId,
            creator:             msg.sender,
            question:            question,
            watchedContract:     watchedContract,
            eventTopic:          eventTopic,
            conditionData:       conditionData,
            endTime:             block.timestamp + duration,
            totalYesBets:        0,
            totalNoBets:         0,
            status:              MarketStatus.Active,
            outcome:             Outcome.None,
            createdAt:           block.timestamp,
            resolvedAt:          0,
            creatorFeeCollected: 0
        });

        // Creation bond counts as the creator's YES bet (signals conviction)
        _recordBet(marketId, msg.sender, true, msg.value);

        emit MarketCreated(
            marketId,
            msg.sender,
            watchedContract,
            eventTopic,
            question,
            block.timestamp + duration
        );
    }

    /// @inheritdoc IPulseMarket
    function placeBet(uint256 marketId, bool isYes)
        external
        payable
        override
        whenNotPaused
        nonReentrant
        marketExists(marketId)
        marketActive(marketId)
    {
        require(msg.value >= MIN_BET, "PM: bet below minimum");
        require(block.timestamp < _markets[marketId].endTime, "PM: market expired");
        require(_bets[marketId][msg.sender].amount == 0, "PM: already bet");

        _recordBet(marketId, msg.sender, isYes, msg.value);

        emit BetPlaced(marketId, msg.sender, isYes, msg.value);
    }

    // ─── Settlement (called by SomniaEventHandler) ────────────────────────────

    /// @notice Settle the market with a given outcome.
    ///         Only callable by the authorised SomniaEventHandler.
    function resolveMarket(uint256 marketId, bool conditionMet)
        external
        onlyEventHandler
        marketExists(marketId)
        marketActive(marketId)
        nonReentrant
    {
        Market storage market = _markets[marketId];
        require(block.timestamp <= market.endTime, "PM: market already expired");

        market.status     = MarketStatus.Resolved;
        market.outcome    = conditionMet ? Outcome.Yes : Outcome.No;
        market.resolvedAt = block.timestamp;

        emit MarketResolved(
            marketId,
            market.outcome,
            market.totalYesBets,
            market.totalNoBets
        );
    }

    // ─── Claims ───────────────────────────────────────────────────────────────

    /// @inheritdoc IPulseMarket
    function claimWinnings(uint256 marketId)
        external
        override
        nonReentrant
        marketExists(marketId)
    {
        Market storage market = _markets[marketId];
        require(market.status == MarketStatus.Resolved, "PM: not resolved");

        Bet storage bet = _bets[marketId][msg.sender];
        require(bet.amount > 0, "PM: no bet");
        require(!bet.claimed, "PM: already claimed");

        bool isWinner = (market.outcome == Outcome.Yes && bet.isYes) ||
                        (market.outcome == Outcome.No  && !bet.isYes);
        require(isWinner, "PM: not a winner");

        bet.claimed = true;

        uint256 totalPool    = market.totalYesBets + market.totalNoBets;
        uint256 winningPool  = market.outcome == Outcome.Yes
            ? market.totalYesBets
            : market.totalNoBets;

        // Calculate fees on total pool
        uint256 platformFee = (totalPool * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 creatorFee  = (totalPool * CREATOR_FEE_BPS)  / BPS_DENOMINATOR;
        uint256 netPool     = totalPool - platformFee - creatorFee;

        // Proportional winnings
        uint256 winnings = (bet.amount * netPool) / winningPool;

        platformFeeBalance += platformFee;

        // Creator fee — collected once on first claim (stored separately)
        if (market.creatorFeeCollected == 0) {
            market.creatorFeeCollected = creatorFee;
        }

        emit WinningsClaimed(marketId, msg.sender, winnings);
        _transfer(msg.sender, winnings);
    }

    /// @notice Creator withdraws their 2% fee after market resolution.
    function withdrawCreatorFee(uint256 marketId)
        external
        nonReentrant
        marketExists(marketId)
    {
        Market storage market = _markets[marketId];
        require(market.status == MarketStatus.Resolved, "PM: not resolved");
        require(market.creator == msg.sender, "PM: not creator");

        uint256 fee = market.creatorFeeCollected;
        require(fee > 0, "PM: no fee available yet");
        market.creatorFeeCollected = 0;

        emit CreatorFeeWithdrawn(marketId, msg.sender, fee);
        _transfer(msg.sender, fee);
    }

    /// @inheritdoc IPulseMarket
    function cancelExpiredMarket(uint256 marketId)
        external
        override
        nonReentrant
        marketExists(marketId)
        marketActive(marketId)
    {
        Market storage market = _markets[marketId];
        require(block.timestamp > market.endTime, "PM: not yet expired");

        market.status = MarketStatus.Cancelled;
        emit MarketCancelled(marketId, "Market expired without on-chain trigger");
    }

    /// @inheritdoc IPulseMarket
    function claimRefund(uint256 marketId)
        external
        override
        nonReentrant
        marketExists(marketId)
    {
        require(_markets[marketId].status == MarketStatus.Cancelled, "PM: not cancelled");

        Bet storage bet = _bets[marketId][msg.sender];
        require(bet.amount > 0, "PM: no bet");
        require(!bet.claimed, "PM: already refunded");

        bet.claimed = true;
        uint256 refund = bet.amount;

        _transfer(msg.sender, refund);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @inheritdoc IPulseMarket
    function getMarket(uint256 marketId)
        external
        view
        override
        marketExists(marketId)
        returns (Market memory)
    {
        return _markets[marketId];
    }

    /// @inheritdoc IPulseMarket
    function getBet(uint256 marketId, address bettor)
        external
        view
        override
        returns (Bet memory)
    {
        return _bets[marketId][bettor];
    }

    /// @inheritdoc IPulseMarket
    function getMarketCount() external view override returns (uint256) {
        return _marketCounter;
    }

    /// @notice Returns all markets (paginated).
    function getMarkets(uint256 offset, uint256 limit)
        external
        view
        returns (Market[] memory markets)
    {
        uint256 total = _marketCounter;
        if (offset >= total) return new Market[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 count = end - offset;

        markets = new Market[](count);
        for (uint256 i = 0; i < count; i++) {
            markets[i] = _markets[offset + i];
        }
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    function _recordBet(
        uint256 marketId,
        address bettor,
        bool isYes,
        uint256 amount
    ) internal {
        Market storage market = _markets[marketId];

        _bets[marketId][bettor] = Bet({
            bettor:   bettor,
            marketId: marketId,
            isYes:    isYes,
            amount:   amount,
            claimed:  false
        });

        _bettors[marketId].push(bettor);

        if (isYes) {
            market.totalYesBets += amount;
        } else {
            market.totalNoBets += amount;
        }
    }

    function _transfer(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "PM: ETH transfer failed");
    }

    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPulseMarket
/// @notice Public interface for the PulseMarket core contract.
interface IPulseMarket {
    // ─── Enums ───────────────────────────────────────────────────────────────

    enum MarketStatus {
        Active,
        Resolved,
        Cancelled
    }

    enum Outcome {
        None,  // Market not yet resolved
        Yes,   // Condition was TRUE
        No     // Condition was FALSE
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Market {
        uint256 id;
        address creator;
        string question;
        /// @notice Address of the contract whose event will trigger settlement
        address watchedContract;
        /// @notice keccak256 of the event signature, e.g. keccak256("Transfer(address,address,uint256)")
        bytes32 eventTopic;
        /// @notice ABI-encoded condition parameters (e.g., threshold value)
        bytes   conditionData;
        uint256 endTime;          // Deadline; market auto-cancels if not triggered by then
        uint256 totalYesBets;
        uint256 totalNoBets;
        MarketStatus status;
        Outcome outcome;
        uint256 createdAt;
        uint256 resolvedAt;
        uint256 creatorFeeCollected;
    }

    struct Bet {
        address bettor;
        uint256 marketId;
        bool    isYes;
        uint256 amount;
        bool    claimed;
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        address indexed watchedContract,
        bytes32 eventTopic,
        string  question,
        uint256 endTime
    );

    event BetPlaced(
        uint256 indexed marketId,
        address indexed bettor,
        bool    indexed isYes,
        uint256 amount
    );

    event MarketResolved(
        uint256 indexed marketId,
        Outcome indexed outcome,
        uint256 totalYesBets,
        uint256 totalNoBets
    );

    event MarketCancelled(uint256 indexed marketId, string reason);

    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed bettor,
        uint256 amount
    );

    event CreatorFeeWithdrawn(uint256 indexed marketId, address indexed creator, uint256 amount);

    // ─── Core Functions ───────────────────────────────────────────────────────

    function createMarket(
        string calldata question,
        address watchedContract,
        bytes32 eventTopic,
        bytes calldata conditionData,
        uint256 duration
    ) external payable returns (uint256 marketId);

    function placeBet(uint256 marketId, bool isYes) external payable;

    function claimWinnings(uint256 marketId) external;

    function cancelExpiredMarket(uint256 marketId) external;

    function claimRefund(uint256 marketId) external;

    /// @notice Called exclusively by the authorised SomniaEventHandler to settle a market.
    function resolveMarket(uint256 marketId, bool conditionMet) external;

    // ─── Views ────────────────────────────────────────────────────────────────

    function getMarket(uint256 marketId) external view returns (Market memory);

    function getBet(uint256 marketId, address bettor) external view returns (Bet memory);

    function getMarketCount() external view returns (uint256);
}

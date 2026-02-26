// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IReactiveContract.sol";
import "./interfaces/IPulseMarket.sol";

/// @title SomniaEventHandler
/// @notice Reactive contract that subscribes to on-chain events via Somnia's
///         native reactivity layer and automatically settles PulseMarket markets
///         the instant the watched event fires — no oracles, no backends, no cron jobs.
///
/// ┌─────────────────────────────────────────────────────────────────┐
/// │  HOW SOMNIA REACTIVITY WORKS                                    │
/// │                                                                 │
/// │  1. This contract implements IReactiveContract.                 │
/// │  2. On deployment it is registered with Somnia's Reactive       │
/// │     Service. The service calls getSubscriptions() to learn      │
/// │     which (contract, eventTopic) pairs to watch.                │
/// │  3. When any watched event fires on-chain, the Reactive         │
/// │     Service calls react() on this contract within the same      │
/// │     block, passing the raw event data.                          │
/// │  4. react() evaluates the market condition and calls            │
/// │     PulseMarket.resolveMarket() to settle.                      │
/// └─────────────────────────────────────────────────────────────────┘
///
/// CONDITION ENCODING (conditionData in PulseMarket)
/// ─────────────────────────────────────────────────
///  For Transfer(address,address,uint256) events:
///    conditionData = abi.encode(ComparisonOp, uint256 threshold)
///
///  ComparisonOp enum:
///    0 = GT  (value > threshold)
///    1 = GTE (value >= threshold)
///    2 = LT  (value < threshold)
///    3 = LTE (value <= threshold)
///    4 = EQ  (value == threshold)
///
contract SomniaEventHandler is IReactiveContract, Ownable {
    // ─── Types ───────────────────────────────────────────────────────────────

    enum ComparisonOp { GT, GTE, LT, LTE, EQ }

    // ─── State ────────────────────────────────────────────────────────────────

    IPulseMarket public pulseMarket;

    /// @notice Tracks which marketIds are subscribed to each (contract, topic) pair.
    ///         key = keccak256(abi.encodePacked(contractAddr, topic))
    mapping(bytes32 => uint256[]) private _subscriptions;

    /// @notice Reverse lookup: marketId => subscription key (for deduplication)
    mapping(uint256 => bytes32) private _marketSubscriptionKey;

    /// @notice Dynamic list of unique subscriptions to return in getSubscriptions().
    Subscription[] private _subscriptionList;

    /// @notice Tracks unique (contract, topic) pairs already in the list.
    mapping(bytes32 => bool) private _subscriptionExists;

    /// @notice Address of the Somnia Reactive Service (whitelist).
    address public reactiveService;

    // ─── Events ───────────────────────────────────────────────────────────────

    event MarketSubscribed(
        uint256 indexed marketId,
        address indexed watchedContract,
        bytes32 indexed eventTopic
    );

    event MarketSettledByReactivity(
        uint256 indexed marketId,
        bool    conditionMet,
        uint256 triggeringValue
    );

    event ReactiveServiceUpdated(address indexed newService);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyReactiveService() {
        require(
            reactiveService == address(0) || msg.sender == reactiveService,
            "SEH: caller not reactive service"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    /// @param _pulseMarket Address of the deployed PulseMarket contract.
    /// @param _reactiveService Address of Somnia's Reactive Service. Pass
    ///        address(0) during local testing (skips the whitelist check).
    constructor(
        address _pulseMarket,
        address _reactiveService,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_pulseMarket != address(0), "SEH: zero pulseMarket");
        pulseMarket    = IPulseMarket(_pulseMarket);
        reactiveService = _reactiveService;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setReactiveService(address service) external onlyOwner {
        reactiveService = service;
        emit ReactiveServiceUpdated(service);
    }

    function setPulseMarket(address market) external onlyOwner {
        require(market != address(0), "SEH: zero address");
        pulseMarket = IPulseMarket(market);
    }

    // ─── Subscription Registration ────────────────────────────────────────────

    /// @notice Called by PulseMarket (or owner) to register a new market
    ///         for reactive settlement. Typically called right after createMarket().
    /// @dev    In practice the frontend calls this transaction immediately after
    ///         createMarket so the market is always registered before bets close.
    function subscribeMarket(uint256 marketId) external {
        IPulseMarket.Market memory market = pulseMarket.getMarket(marketId);
        require(market.status == IPulseMarket.MarketStatus.Active, "SEH: market not active");

        bytes32 key = _pairKey(market.watchedContract, market.eventTopic);
        require(_marketSubscriptionKey[marketId] == bytes32(0), "SEH: already subscribed");

        _subscriptions[key].push(marketId);
        _marketSubscriptionKey[marketId] = key;

        // Register unique pair if not seen before
        if (!_subscriptionExists[key]) {
            _subscriptionExists[key] = true;
            _subscriptionList.push(
                Subscription({
                    contractAddress: market.watchedContract,
                    topic0:          market.eventTopic
                })
            );
        }

        emit MarketSubscribed(marketId, market.watchedContract, market.eventTopic);
    }

    // ─── IReactiveContract ────────────────────────────────────────────────────

    /// @inheritdoc IReactiveContract
    function getSubscriptions()
        external
        view
        override
        returns (Subscription[] memory)
    {
        return _subscriptionList;
    }

    /// @inheritdoc IReactiveContract
    /// @notice Called by the Somnia Reactive Service when a watched event fires.
    ///         Evaluates each market subscribed to this (contract, topic) pair
    ///         and settles any active ones whose condition is met.
    function react(
        uint256 /*chainId*/,
        address contractAddr,
        bytes32 topic0,
        bytes32 topic1,
        bytes32 topic2,
        bytes32 topic3,
        bytes calldata data
    ) external override onlyReactiveService {
        bytes32 key = _pairKey(contractAddr, topic0);
        uint256[] storage marketIds = _subscriptions[key];
        uint256 count = marketIds.length;

        for (uint256 i = 0; i < count; i++) {
            uint256 marketId = marketIds[i];

            // Skip markets that are no longer active
            IPulseMarket.Market memory market;
            try pulseMarket.getMarket(marketId) returns (IPulseMarket.Market memory m) {
                market = m;
            } catch {
                continue;
            }

            if (market.status != IPulseMarket.MarketStatus.Active) continue;
            if (block.timestamp > market.endTime) continue;

            // Evaluate the condition
            (bool conditionMet, uint256 triggeringValue) = _evaluateCondition(
                topic0,
                topic1,
                topic2,
                topic3,
                data,
                market.conditionData
            );

            // Settle the market
            try pulseMarket.resolveMarket(marketId, conditionMet) {
                emit MarketSettledByReactivity(marketId, conditionMet, triggeringValue);
            } catch {
                // If settle fails (e.g. race condition), continue gracefully
            }
        }
    }

    // ─── Condition Evaluation ─────────────────────────────────────────────────

    /// @notice Evaluates whether the on-chain event satisfies the market condition.
    /// @dev    Currently supports Transfer(address,address,uint256) as the
    ///         primary event type. Extend this function for additional event shapes.
    ///
    ///         topic0 = keccak256("Transfer(address,address,uint256)")
    ///         topic1 = from (indexed)
    ///         topic2 = to   (indexed)
    ///         data   = abi.encode(uint256 value)
    function _evaluateCondition(
        bytes32 topic0,
        bytes32 /*topic1*/,
        bytes32 /*topic2*/,
        bytes32 /*topic3*/,
        bytes calldata data,
        bytes memory conditionData
    ) internal pure returns (bool conditionMet, uint256 triggeringValue) {
        // ERC-20 Transfer event
        bytes32 TRANSFER_TOPIC = keccak256("Transfer(address,address,uint256)");

        if (topic0 == TRANSFER_TOPIC) {
            if (data.length >= 32) {
                triggeringValue = abi.decode(data, (uint256));
                (ComparisonOp op, uint256 threshold) = abi.decode(
                    conditionData,
                    (ComparisonOp, uint256)
                );
                conditionMet = _compare(triggeringValue, op, threshold);
            }
            return (conditionMet, triggeringValue);
        }

        // Generic fallback: condition is always true (event itself is the trigger)
        conditionMet    = true;
        triggeringValue = 0;
    }

    function _compare(
        uint256 value,
        ComparisonOp op,
        uint256 threshold
    ) internal pure returns (bool) {
        if (op == ComparisonOp.GT)  return value >  threshold;
        if (op == ComparisonOp.GTE) return value >= threshold;
        if (op == ComparisonOp.LT)  return value <  threshold;
        if (op == ComparisonOp.LTE) return value <= threshold;
        if (op == ComparisonOp.EQ)  return value == threshold;
        return false;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function _pairKey(address contractAddr, bytes32 topic)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(contractAddr, topic));
    }

    receive() external payable {}
}

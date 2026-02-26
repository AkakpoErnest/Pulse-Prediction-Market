// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IReactiveContract
/// @notice Interface for Somnia's reactive contract system.
///         A reactive contract subscribes to on-chain events emitted by other
///         contracts and automatically executes a callback when those events fire.
interface IReactiveContract {
    // ─── Structs ────────────────────────────────────────────────────────────────

    /// @notice Describes a single reactive subscription.
    struct Subscription {
        address contractAddress; // The emitting contract to watch
        bytes32 topic0; // The event topic (keccak256 of the event signature)
    }

    // ─── Core Reactive Interface ─────────────────────────────────────────────

    /// @notice Returns the list of subscriptions this reactive contract wants.
    ///         Called by the Somnia Reactivity layer during registration.
    function getSubscriptions() external view returns (Subscription[] memory);

    /// @notice Called by the Somnia Reactivity layer when a subscribed event fires.
    /// @param chainId      Chain ID where the event was emitted
    /// @param contractAddr Address of the contract that emitted the event
    /// @param topic0       keccak256 of the event signature
    /// @param topic1       Indexed parameter 1 (padded to 32 bytes), or bytes32(0)
    /// @param topic2       Indexed parameter 2 (padded to 32 bytes), or bytes32(0)
    /// @param topic3       Indexed parameter 3 (padded to 32 bytes), or bytes32(0)
    /// @param data         ABI-encoded non-indexed event parameters
    function react(
        uint256 chainId,
        address contractAddr,
        bytes32 topic0,
        bytes32 topic1,
        bytes32 topic2,
        bytes32 topic3,
        bytes calldata data
    ) external;
}

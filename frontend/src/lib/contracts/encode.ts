import { encodeAbiParameters, decodeAbiParameters, keccak256, toHex } from "viem";
import { ComparisonOp, DecodedCondition } from "@/types";

// ─── Condition Encoding ────────────────────────────────────────────────────────

export function encodeCondition(op: ComparisonOp, thresholdWei: bigint): `0x${string}` {
  return encodeAbiParameters(
    [{ type: "uint8" }, { type: "uint256" }],
    [op, thresholdWei]
  );
}

export function decodeCondition(conditionData: `0x${string}`): DecodedCondition {
  const [op, threshold] = decodeAbiParameters(
    [{ type: "uint8" }, { type: "uint256" }],
    conditionData
  );
  return { op: op as ComparisonOp, threshold };
}

// ─── Event Topic Helpers ───────────────────────────────────────────────────────

export function getEventTopic(signature: string): `0x${string}` {
  return keccak256(toHex(signature));
}

export const WELL_KNOWN_TOPICS: Record<string, `0x${string}`> = {
  "Transfer(address,address,uint256)":     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  "Approval(address,address,uint256)":     "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
  "Swap(address,uint256,uint256,uint256,uint256,address)": "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
};

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatConditionLabel(conditionData: `0x${string}`, topic: string): string {
  try {
    const { op, threshold } = decodeCondition(conditionData);
    const opSymbol = ["›", "≥", "‹", "≤", "="][op] ?? "?";
    const stt = Number(threshold) / 1e18;
    return `value ${opSymbol} ${stt} STT`;
  } catch {
    return "custom condition";
  }
}

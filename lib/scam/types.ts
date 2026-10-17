import type { Lang } from "../settings";

// Shared types for Scam Check. Pure data: no React, no network.

/**
 * The only three answers we ever give. There is deliberately no "safe":
 * a message with no warning signs can still be a scam.
 */
export const VERDICTS = ["cant-tell", "warning-signs", "likely-scam"] as const;
export type Verdict = (typeof VERDICTS)[number];

/** How strongly a single signal points to a scam. */
export type Severity = "low" | "medium" | "high";

/** Overall risk, from the signals found. "low" never means "safe". */
export type RiskLevel = "low" | "medium" | "high";

export type SignalId =
  | "payment-method"
  | "guarantee"
  | "pay-to-speed-up"
  | "fake-official-channel"
  | "threats"
  | "urgency"
  | "asks-for-otp-or-bank"
  | "asks-for-documents"
  | "non-gov-link"
  | "short-link"
  | "grammar-and-pressure"
  | "job-or-lottery";

export interface SignalMatch {
  id: SignalId;
  severity: Severity;
  weight: number;
  /** Plain-language reason. Hindi is a draft for a native reader. */
  explanation: Record<Lang, string>;
  /** The exact words in the message that triggered the signal. */
  phrases: string[];
}

export interface ScamCheckResult {
  verdict: Verdict;
  risk: RiskLevel;
  /** Sum of the weights of the matched signals. */
  score: number;
  signals: SignalMatch[];
  /**
   * The lowest verdict anything downstream (for example an AI review) may
   * give. Pass it to enforceFloor() before showing a verdict.
   */
  floor: Verdict;
}

// Scam Check, layer 1: deterministic rules. Works with no network or API key.
export * from "./types";
export { MAX_MESSAGE_CHARS, validateMessage } from "./text";
export { SIGNALS, getSignal } from "./signals";
export { checkMessage, checkInput, enforceFloor, isStronger, VERDICT_TEXT, OFFICIAL_LINKS } from "./check";
export { redact, type Redaction, type RedactionKind } from "./redact";

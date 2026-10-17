// Removes obvious personal details from a message before any part of it is
// sent to an AI service. Run checkMessage() on the original first: the rules
// need the real text, the AI does not.
//
// This is a best-effort filter for the obvious cases, not a guarantee.

export type RedactionKind = "email" | "payment-id" | "phone" | "number" | "id" | "name";

export interface Redaction {
  text: string;
  /** How many of each kind were replaced. */
  counts: Record<RedactionKind, number>;
}

const TOKEN: Record<RedactionKind, string> = {
  email: "[email]",
  "payment-id": "[payment id]",
  phone: "[phone]",
  number: "[number]",
  id: "[id]",
  name: "[name]",
};

// Greeting words that are not names: keep them, they help spot scams.
const GENERIC = new Set([
  "sir", "madam", "maam", "ma'am", "customer", "applicant", "candidate", "beneficiary", "user", "friend",
  "friends", "all", "team", "client", "member", "traveller", "traveler", "visitor", "parent", "parents",
  "आवेदक", "ग्राहक", "मित्र", "महोदय", "महोदया",
]);
const HONORIFIC = "(?:Mr\\.?|Mrs\\.?|Ms\\.?|Miss|Dr\\.?|Shri|Shrimati|Smt\\.?|श्री|श्रीमती)\\s+";

export function redact(text: string): Redaction {
  const counts: Record<RedactionKind, number> = { email: 0, "payment-id": 0, phone: 0, number: 0, id: 0, name: 0 };
  const swap = (kind: RedactionKind) => {
    counts[kind]++;
    return TOKEN[kind];
  };

  let out = text;

  // Emails, then UPI handles (name@bank, no dot after the @).
  out = out.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, () => swap("email"));
  out = out.replace(/[\w.-]{2,}@[a-z]{2,}(?!\w|\.\w)/gi, () => swap("payment-id"));

  // Names after a greeting: "Dear Sharda Devi," / "प्रिय शारदा जी".
  out = out.replace(
    new RegExp(`([Dd]ear|DEAR|प्रिय)(\\s+)(${HONORIFIC})?([\\p{L}\\p{M}'.]+(?:\\s+\\p{Lu}[\\p{L}\\p{M}'.]*){0,2})`, "gu"),
    (all, greet: string, space: string, hon: string | undefined, name: string) => {
      const first = name.split(/\s+/)[0].toLowerCase().replace(/[.,]$/, "");
      if (!hon && GENERIC.has(first)) return all;
      return `${greet}${space}${hon ?? ""}${swap("name")}`;
    },
  );

  // Passport-like and other ID numbers: K1234567, AB1234567, DS-160 AA00ABC123, PAN ABCDE1234F.
  out = out.replace(/(?<![\p{L}\d])(?:[A-Z]{1,2}\d{7,8}|AA[0-9A-Z]{8}|[A-Z]{5}\d{4}[A-Z])(?![\p{L}\d])/gu, () =>
    swap("id"),
  );

  // Phone numbers and other long digit runs (Aadhaar, account numbers, OTPs).
  // Amounts after a currency sign and dates like 12-11-2026 are kept.
  out = out.replace(/(?<![\d₹$])(?<!(?:rs|inr|usd)\.?\s?)(?:\+?\d[\d\s-]{4,}\d|\d{6,})(?!\d)/gi, (m) => {
    const digits = m.replace(/\D/g, "");
    if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(m.trim())) return m;
    if (digits.length < 6) return m;
    const isPhone =
      (digits.length === 10 && /^[6-9]/.test(digits)) ||
      (digits.length === 12 && digits.startsWith("91")) ||
      (digits.length === 11 && digits.startsWith("0")) ||
      m.trim().startsWith("+");
    // Keep the space or dash that ended the match, if any.
    const tail = m.match(/[\s-]+$/)?.[0] ?? "";
    return swap(isPhone ? "phone" : "number") + tail;
  });

  return { text: out, counts };
}

// Building blocks for the Help page's mini mockups. Every graphic is drawn
// with these (site colour tokens only, so contrast modes keep working), and
// every callout number in a graphic matches the numbered list under it.

/** A callout number. The same badge starts each line of the list below. */
export function N({ n }: { n: number }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-surface">
      {n}
    </span>
  );
}

const BTN = {
  primary: "bg-accent text-accent-ink",
  outline: "border-2 border-line-strong bg-surface text-ink",
  accentOutline: "border-2 border-accent bg-surface text-accent",
  danger: "border-2 border-danger bg-surface text-danger",
} as const;

/** A small, flat stand-in for a site button. */
export function Btn({ kind = "primary", children }: { kind?: keyof typeof BTN; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold ${BTN[kind]}`}>{children}</span>;
}

/** A grey line standing in for text. */
export function Bar({ w = "w-full" }: { w?: string }) {
  return <span className={`block h-2 rounded bg-line ${w}`} />;
}

/** A card, like the site's bordered boxes. */
export function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-2 rounded-lg border-2 border-line-strong bg-surface p-2.5 ${className}`}>{children}</div>;
}

/** A label with its callout number in front. */
export function Marked({ n, children, className = "" }: { n: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2 ${className}`}>
      <N n={n} />
      {children}
    </div>
  );
}

/**
 * One page graphic and its numbered list. The graphic is a single image for
 * screen readers (its summary is `label`); the list carries the details.
 * Static: nothing moves, so reduced motion needs nothing extra.
 */
export function Walkthrough({ label, items, children }: { label: string; items: string[]; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <figure
        role="img"
        aria-label={label}
        className="@container overflow-hidden rounded-2xl border-2 border-line-strong bg-bg p-3 text-sm text-ink sm:p-4"
      >
        {children}
      </figure>
      <ol className="space-y-2 text-lg">
        {items.map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5">
              <N n={i + 1} />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

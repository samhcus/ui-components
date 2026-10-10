type RevealProps = {
  children: React.ReactNode;
  /** Deprecated no-op. The site no longer animates its content in on load — a
   *  brief loading screen (see <LoadingScreen>) covers the entrance instead, so
   *  content is simply present once the curtain lifts. Kept so existing call
   *  sites still type-check without a sweep. */
  index?: number;
  className?: string;
};

/** A plain block wrapper. Intentionally does nothing but render its children in
 *  the given box — the entrance is owned by the loading screen, not per-section. */
export function Reveal({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>;
}

/**
 * The site has a few floating panels that each own the screen when open — the
 * nav menu, the "Meet Samuel" widget. Only one should be open at a time. This
 * is a tiny dependency-free coordinator: when a panel opens it announces itself,
 * and every other panel closes.
 */
type Listener = (owner: string) => void;

const listeners = new Set<Listener>();

/** Announce that `owner`'s panel just opened; all others should close. */
export function openExclusivePanel(owner: string): void {
  for (const l of listeners) l(owner);
}

/**
 * Subscribe to exclusive-open events. The callback fires with the owner that
 * opened; close yourself when it isn't you. Returns an unsubscribe function.
 */
export function onExclusivePanel(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

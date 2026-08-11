// Entry point: the global hotkey that toggles the overlay.
//
// There's no API to ask a page whether it already owns Cmd+K, so we infer it:
// a site with its own command palette almost always calls preventDefault() on
// the keydown (otherwise Chrome's Cmd+K focuses the omnibox). We let the page's
// handlers run first and only open our overlay if nobody cancelled the event.
const HOTKEY = (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

// Capture phase (runs first): handles the cases where WE must win — closing on
// Escape, and toggling our overlay shut when it's already open. When the overlay
// is closed we deliberately do nothing here and let the event keep propagating,
// so the page's own Cmd+K handler (if any) gets its turn.
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape" && overlay) {
      closeOverlay();
      return;
    }
    if (HOTKEY(e) && overlay) {
      e.preventDefault();
      closeOverlay();
    }
  },
  true,
);

// Bubble phase on window (runs last): by now every other handler has run, so
// defaultPrevented reliably tells us whether the page claimed Cmd+K. If it did,
// we stand down; if it didn't, the page has no palette and we open ours.
window.addEventListener(
  "keydown",
  (e) => {
    if (!HOTKEY(e) || overlay) return;
    if (e.defaultPrevented) return; // the page already handled Cmd+K
    e.preventDefault();
    openOverlay();
  },
  false,
);

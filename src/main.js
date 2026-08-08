// Entry point: the global hotkey that toggles the overlay.
const HOTKEY = (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

document.addEventListener(
  "keydown",
  (e) => {
    if (HOTKEY(e)) {
      e.preventDefault();
      toggleOverlay();
    } else if (e.key === "Escape" && overlay) {
      closeOverlay();
    }
  },
  true,
);

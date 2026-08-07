// antimouse — everything you edit lives in this file.
//
// A Spotlight-style overlay: press Cmd+K (or Ctrl+K) to toggle a centered,
// focused search bar on the current page. Esc closes it. This is just the
// skeleton — the actual page-traversal / search logic goes in onQuery().

const HOTKEY = (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

let overlay = null;

const closeOverlay = () => {
  overlay?.remove();
  overlay = null;
};

const openOverlay = () => {
  if (overlay) return;

  overlay = document.createElement("div");
  overlay.attachShadow({ mode: "open" }); // isolate our styles from the page
  overlay.shadowRoot.innerHTML = `
    <style>
      :host { all: initial; }
      .backdrop {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: flex-start; justify-content: center;
        padding-top: 20vh; background: rgba(0, 0, 0, 0.35);
        font-family: system-ui, sans-serif;
      }
      .bar {
        width: min(560px, 90vw); padding: 16px 20px;
        background: #fff; border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }
      input {
        width: 100%; border: none; outline: none;
        font-size: 20px; background: transparent; color: #111;
      }
    </style>
    <div class="backdrop">
      <div class="bar"><input type="text" placeholder="Search this page…" /></div>
    </div>
  `;

  const input = overlay.shadowRoot.querySelector("input");
  const backdrop = overlay.shadowRoot.querySelector(".backdrop");

  input.addEventListener("input", () => onQuery(input.value));
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeOverlay();
  });

  document.body.append(overlay);
  input.focus();
};

// Called on every keystroke in the search bar. Wire up real logic here.
const onQuery = (query) => {
  console.log("[antimouse] query:", query);
};

document.addEventListener(
  "keydown",
  (e) => {
    if (HOTKEY(e)) {
      e.preventDefault();
      overlay ? closeOverlay() : openOverlay();
    } else if (e.key === "Escape" && overlay) {
      closeOverlay();
    }
  },
  true, // capture: run before the page's own handlers
);

// The search overlay: a focused, centered command bar rendered in a Shadow DOM
// so the host page's styles and shortcuts can't reach it.

let overlay = null; // the shadow-host element, or null when closed
let overlayRefs = null; // { input, list } for the open overlay
let pageLinks = {}; // links indexed when the overlay opened
let suggestions = []; // current suggestions shown in the list
let selected = 0; // highlighted suggestion index

let styleSheet = null;
const loadStyles = async () => {
  if (styleSheet) return styleSheet;
  const css = await fetch(chrome.runtime.getURL("styles.css")).then((r) =>
    r.text(),
  );
  styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(css);
  return styleSheet;
};
loadStyles(); // warm the cache so the first open has no unstyled flash

const navigateTo = (href) => {
  closeOverlay();
  location.href = href; // same-tab navigation
};

const renderSuggestions = () => {
  const { list } = overlayRefs;
  list.innerHTML = "";

  suggestions.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = i === selected ? "selected" : "";
    li.innerHTML = `<span class="label">${item.label}</span><span class="href">${item.hint}</span>`;
    li.addEventListener("click", () => item.run());
    list.append(li);
  });
};

const refreshSuggestions = (query) => {
  suggestions = search(query, pageLinks);
  selected = 0;
  renderSuggestions();
};

const moveSelection = (delta) => {
  selected = Math.max(0, Math.min(selected + delta, suggestions.length - 1));
  renderSuggestions();
};

const openOverlay = async () => {
  if (overlay) return;

  pageLinks = indexPageLinks();
  suggestions = [];
  selected = 0;

  overlay = document.createElement("div");
  overlay.attachShadow({ mode: "open" }); // isolate our styles from the page
  overlay.shadowRoot.adoptedStyleSheets = [await loadStyles()];
  overlay.shadowRoot.innerHTML = `
    <div class="backdrop">
      <div class="bar">
        <input type="text" placeholder="Search this page…" />
        <ul></ul>
      </div>
    </div>
  `;

  const input = overlay.shadowRoot.querySelector("input");
  const list = overlay.shadowRoot.querySelector("ul");
  const backdrop = overlay.shadowRoot.querySelector(".backdrop");
  overlayRefs = { input, list };

  input.addEventListener("input", () => refreshSuggestions(input.value));

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter" && suggestions[selected]) {
      suggestions[selected].run();
    }
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeOverlay();
  });

  // Keyboard events are `composed`, so they bubble out of the Shadow DOM to the
  // page's document-level listeners (e.g. GitHub's single-key shortcuts), which
  // steal focus. Stop them at the host so typing stays in our search bar. Our
  // own hotkey/Escape handler is unaffected — it runs in the earlier capture phase.
  for (const type of ["keydown", "keyup", "keypress"]) {
    overlay.addEventListener(type, (e) => {
      e.stopPropagation();
    });
  }

  document.body.append(overlay);
  input.focus();
};

const closeOverlay = () => {
  overlay?.remove();
  overlay = null;
  overlayRefs = null;
};

const toggleOverlay = () => {
  overlay ? closeOverlay() : openOverlay();
};

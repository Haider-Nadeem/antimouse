// The search overlay: a focused, centered command bar rendered in a Shadow DOM
// so the host page's styles and shortcuts can't reach it.

let overlay = null; // the shadow-host element, or null when closed
let overlayRefs = null; // { input, list } for the open overlay
let pageTargets = {}; // links & buttons indexed when the overlay opened
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

// Paint a theme onto the open overlay without persisting it — used for live
// preview. Dark is the default look; "light" flips the bar to the white palette.
const setBarTheme = (theme) => {
  overlayRefs?.bar?.classList.toggle("light", theme === "light");
};

// Restore the saved theme (undoes any unsaved preview).
const applyTheme = () => setBarTheme(readSetting("theme"));

const baseDpr = window.devicePixelRatio;
const applyZoomScale = () => {
  const bar = overlayRefs?.bar;
  if (bar) {
    bar.style.transform = `scale(${baseDpr / window.devicePixelRatio})`;
  }
};
window.addEventListener("resize", applyZoomScale); // zoom changes fire resize

const renderSuggestions = () => {
  const { list } = overlayRefs;
  list.innerHTML = "";

  suggestions.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = i === selected ? "selected" : "";
    li.innerHTML = `<span class="label">${item.label}</span><span class="href">${item.hint}</span>`;
    li.addEventListener("click", () => item.run());
    li.addEventListener("mouseenter", () => selectIndex(i));
    list.append(li);
  });
};

const refreshSuggestions = (query) => {
  suggestions = search(query, pageTargets);
  selectIndex(0);
};

// Preview the highlighted item's side effect (currently just a theme swap).
// Items without a preview restore the saved theme, so moving off a theme option
// — or leaving the menu entirely — reverts any unsaved preview.
const previewSelected = () => {
  const preview = suggestions[selected]?.preview;
  preview ? preview() : applyTheme();
};

// Move the highlight to a specific index and sync everything that tracks it.
const selectIndex = (i) => {
  selected = i;
  renderSuggestions();
  previewSelected();
  highlightSelected();
};

// Draw a box over the selected suggestion's link on the page so the user can see
// where they'll land. Settings (no element) and empty results hide the box.
const highlightSelected = () => {
  const { highlight } = overlayRefs;
  const el = suggestions[selected]?.el;
  const rect = el?.getBoundingClientRect();

  if (!rect || (rect.width === 0 && rect.height === 0)) {
    highlight.hidden = true;
    return;
  }

  // Scroll off-screen targets into view; on-screen links stay put (no jitter).
  const inView =
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= innerHeight &&
    rect.right <= innerWidth;
  if (!inView) {
    el.scrollIntoView({ block: "center", inline: "nearest" });
  }

  const r = el.getBoundingClientRect(); // re-read; scrolling may have moved it
  Object.assign(highlight.style, {
    top: `${r.top}px`,
    left: `${r.left}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  });
  highlight.hidden = false;
};

// Inline autocomplete like Spotlight: when the top hit starts with what the
// user typed, fill in the rest and select it (rendered highlighted) so the next
// keystroke overwrites it. Only on insertion, so backspacing still deletes.
const autocomplete = (e, typed) => {
  const inserting = !e.inputType || e.inputType.startsWith("insert");
  const top = suggestions[0];
  if (e.isComposing || !inserting || !typed || !top) return;
  if (!top.label.startsWith(typed.toLowerCase())) return;

  const { input } = overlayRefs;
  input.value = typed + top.label.slice(typed.length);
  input.setSelectionRange(typed.length, input.value.length); // select the completion
};

const moveSelection = (delta) =>
  selectIndex(Math.max(0, Math.min(selected + delta, suggestions.length - 1)));

const openOverlay = async () => {
  if (overlay) return;

  pageTargets = indexPageTargets();
  settingsView = "root"; // always start at the top of the settings menu
  suggestions = [];
  selected = 0;

  overlay = document.createElement("div");
  overlay.attachShadow({ mode: "open" });
  overlay.shadowRoot.adoptedStyleSheets = [await loadStyles()];
  overlay.shadowRoot.innerHTML = `
    <div class="backdrop">
      <div class="highlight" hidden></div>
      <div class="bar">
        <input type="text" placeholder="Search this page…" />
        <ul></ul>
      </div>
    </div>
  `;

  const input = overlay.shadowRoot.querySelector("input");
  const list = overlay.shadowRoot.querySelector("ul");
  const backdrop = overlay.shadowRoot.querySelector(".backdrop");
  const bar = overlay.shadowRoot.querySelector(".bar");
  const highlight = overlay.shadowRoot.querySelector(".highlight");
  overlayRefs = { input, list, bar, highlight };

  input.addEventListener("input", (e) => {
    const typed = input.value;
    refreshSuggestions(typed);
    autocomplete(e, typed);
  });

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
  applyTheme(); // paint the stored theme before showing
  applyZoomScale(); // match the current zoom before showing
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

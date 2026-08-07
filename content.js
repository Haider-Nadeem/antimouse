// antimouse — everything you edit lives in this file.
//
// A Spotlight-style overlay: press Cmd+K (or Ctrl+K) to toggle a centered,
// focused search bar on the current page. Type a route name (e.g. "home"),
// see live suggestions, and press Enter to navigate to its href. Esc closes.

const HOTKEY = (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
const MAX_SUGGESTIONS = 8;

let overlay = null;

// Build a fresh index of every navigable link on the current page.
// Returns a JSON object keyed by link text -> absolute href, e.g.
//   { "home": "https://site.com/", "about us": "https://site.com/about" }
// Not persisted — rebuilt each time the overlay opens.
const buildIndex = () => {
  const index = {};

  for (const a of document.querySelectorAll("a[href]")) {
    const label = a.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    const href = a.href; // browser resolves this to an absolute URL for us

    // Skip empty labels and non-navigational links (javascript:, empty).
    if (!label || !href || href.startsWith("javascript:")) continue;

    // First link wins on duplicate text; keeps the topmost/nav link.
    if (!(label in index)) index[label] = href;

    // Alt: index icon-only links by their aria-label/title when text is empty.
    // else if (!label) { const alt = (a.getAttribute("aria-label") || a.title || "").toLowerCase().trim(); if (alt && !(alt in index)) index[alt] = href; }
  }

  return index;
};

let index = {};
let entries = []; // [label, href][] — flattened view of the index for matching
let matches = []; // current filtered suggestions
let selected = 0; // highlighted suggestion index

const search = (query) => {
  const q = query.trim().toLowerCase();
  // Substring match; exact-prefix matches float to the top.
  matches = q
    ? entries
        .filter(([label]) => label.includes(q))
        .sort((a, b) => b[0].startsWith(q) - a[0].startsWith(q))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  // Alt: fuzzy (subsequence) matching so "hme" matches "home".
  // matches = q ? entries.filter(([label]) => [...q].reduce((i, c) => i >= 0 ? label.indexOf(c, i) + 1 : -1, 0) > 0).slice(0, MAX_SUGGESTIONS) : [];

  selected = 0;
  return matches;
};

let overlayRefs = null; // { input, list } cached for the open overlay

const renderSuggestions = () => {
  const { list } = overlayRefs;
  list.innerHTML = "";

  matches.forEach(([label, href], i) => {
    const li = document.createElement("li");
    li.className = i === selected ? "selected" : "";
    li.innerHTML = `<span class="label">${label}</span><span class="href">${href}</span>`;
    li.addEventListener("click", () => navigate(href));
    list.append(li);
  });
};

const navigate = (href) => {
  closeOverlay();
  location.href = href; // same-tab navigation
};

const closeOverlay = () => {
  overlay?.remove();
  overlay = null;
  overlayRefs = null;
};

const openOverlay = () => {
  if (overlay) return;

  index = buildIndex();
  entries = Object.entries(index);
  matches = [];
  selected = 0;

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
        width: min(560px, 90vw); background: #fff; border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden;
      }
      input {
        width: 100%; box-sizing: border-box; padding: 16px 20px; border: none;
        outline: none; font-size: 20px; background: transparent; color: #111;
      }
      ul { list-style: none; margin: 0; padding: 0; border-top: 1px solid #eee; }
      ul:empty { border-top: none; }
      li {
        display: flex; justify-content: space-between; gap: 16px; cursor: pointer;
        padding: 10px 20px; font-size: 14px; color: #333;
      }
      li.selected { background: #f0f4ff; }
      .href { color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 45%; }
    </style>
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

  input.addEventListener("input", () => {
    search(input.value);
    renderSuggestions();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selected = Math.min(selected + 1, matches.length - 1);
      renderSuggestions();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
      renderSuggestions();
    } else if (e.key === "Enter" && matches[selected]) {
      navigate(matches[selected][1]);
    }
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeOverlay();
  });

  document.body.append(overlay);
  input.focus();
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

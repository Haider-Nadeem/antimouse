// Collapse an element's visible text — or its accessible label / value when it
// has none — into a single lowercase key we can match a query against. Empty
// when nothing usable.
const labelFor = (el) =>
  (
    el.textContent.replace(/\s+/g, " ").trim() ||
    el.getAttribute("aria-label") ||
    el.title ||
    el.value ||
    ""
  )
    .toLowerCase()
    .trim();

// Index the page's actionable elements by their label, so a typed query can
// resolve to a link (navigate) or a button (click). A link entry carries an
// href; a button entry doesn't — that's how search.js picks the action.
const indexPageTargets = () => {
  const targets = {};
  // First match wins on duplicate labels, keeping the topmost element.
  const add = (label, target) => {
    if (label && !(label in targets)) {
      targets[label] = target;
    }
  };

  for (const a of document.querySelectorAll("a[href]")) {
    const href = a.href; // browser resolves this to an absolute URL for us
    // Skip non-navigational links (javascript:, empty href).
    if (!href || href.startsWith("javascript:")) continue;
    add(labelFor(a), { el: a, href });
  }

  // Links are indexed first, so on a collision a link wins over a role=button
  // sharing the same label. Skip disabled buttons so dead entries don't appear.
  for (const b of document.querySelectorAll(
    "button, input[type=button], input[type=submit], [role=button]",
  )) {
    if (b.disabled) continue;
    add(labelFor(b), { el: b });
  }

  return targets;
};

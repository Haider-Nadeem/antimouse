// Read the current page's navigable links into a plain map of
// { label -> absolute href }. Rebuilt on each open; never persisted.
const indexPageLinks = () => {
  const links = {};

  for (const a of document.querySelectorAll("a[href]")) {
    const label = a.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    const href = a.href; // browser resolves this to an absolute URL for us

    // Skip non-navigational links (javascript:, empty href).
    if (!href || href.startsWith("javascript:")) {
      continue;
    }

    if (label) {
      // First link wins on duplicate text; keeps the topmost/nav link.
      if (!(label in links)) {
        links[label] = href;
      }
    } else {
      // Index icon-only links by their aria-label/title when text is empty.
      const alt = (a.getAttribute("aria-label") || a.title || "")
        .toLowerCase()
        .trim();
      if (alt && !(alt in links)) {
        links[alt] = href;
      }
    }
  }

  return links;
};

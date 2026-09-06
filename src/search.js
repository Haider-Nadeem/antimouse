const MAX_SUGGESTIONS = 8;

// A link navigates; a button (no href) closes the palette and clicks in place.
const toSuggestion = ([label, target]) => ({
  label,
  hint: target.href ?? "",
  href: target.href, // openable URL for new-tab; undefined for buttons
  el: target.el,
  run: target.href
    ? () => navigateTo(target.href)
    : () => {
        closeOverlay();
        target.el.click();
      },
});

// Treat a query as a URL when it's already absolute, or looks like a bare
// domain (a dotted token with no spaces). Otherwise it's a web-search term.
const toUrl = (s) => {
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[^\s.]+\.[^\s]{2,}$/.test(s)) return `https://${s}`;
  return null;
};

// Last-resort suggestion so a query never dead-ends: open it as a URL if it
// looks like one, otherwise search the web for it.
const webFallback = (query) => {
  const raw = query.trim();
  const url = toUrl(raw);
  const href =
    url ?? `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
  return {
    label: url ? raw : `Search the web for "${raw}"`,
    hint: url ? "open URL" : "google",
    href,
    run: () => navigateTo(href),
  };
};

// Keep items whose label matches the query; exact-prefix matches float up.
const rankByLabel = (items, query) =>
  (query
    ? items
        .filter((it) => it.label.includes(query))
        .sort((a, b) => b.label.startsWith(query) - a.label.startsWith(query))
    : items
  ).slice(0, MAX_SUGGESTIONS);

// Turn a raw query into ranked suggestions. ">" switches to settings mode
// (empty lists all settings); otherwise search page targets once something's typed.
const search = (query, pageTargets) => {
  if (query.startsWith(SETTINGS_PREFIX)) {
    const q = query.slice(SETTINGS_PREFIX.length).trim().toLowerCase();
    return rankByLabel(settingsItems(), q);
  }

  settingsView = "root"; // left settings mode; reset the menu for next entry

  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Page matches first; the web/URL fallback always trails as the last option.
  const items = rankByLabel(Object.entries(pageTargets).map(toSuggestion), q);
  items.push(webFallback(query));
  return items;
};

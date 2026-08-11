const MAX_SUGGESTIONS = 8;

// A link navigates; a button (no href) closes the palette and clicks in place.
const toSuggestion = ([label, target]) => ({
  label,
  hint: target.href ?? "",
  el: target.el,
  run: target.href
    ? () => navigateTo(target.href)
    : () => {
        closeOverlay();
        target.el.click();
      },
});

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

  return q
    ? rankByLabel(Object.entries(pageTargets).map(toSuggestion), q)
    : [];
};

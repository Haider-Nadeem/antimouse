const MAX_SUGGESTIONS = 8;

// A suggestion is { label, hint, run }. Page links become suggestions that
// navigate; settings already are suggestions (see settings.js).
const toLinkSuggestion = ([label, href]) => ({
  label,
  hint: href,
  run: () => navigateTo(href),
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
// (empty lists all settings); otherwise search page links once something's typed.
const search = (query, pageLinks) => {
  if (query.startsWith(SETTINGS_PREFIX)) {
    const q = query.slice(SETTINGS_PREFIX.length).trim().toLowerCase();
    return rankByLabel(SETTINGS, q);
  }

  const q = query.trim().toLowerCase();

  // Alt: fuzzy (subsequence) matching so "hme" matches "home".
  // filter: (it) => [...q].reduce((i, c) => i >= 0 ? it.label.indexOf(c, i) + 1 : -1, 0) > 0
  return q
    ? rankByLabel(Object.entries(pageLinks).map(toLinkSuggestion), q)
    : [];
};

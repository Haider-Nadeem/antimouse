# antimouse

Spotlight-style search bar for the current web page. Press **Cmd+K** / **Ctrl+K** to toggle.

## Load it

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder

## Develop

Logic lives in `src/`, loaded in order by the manifest:

- `page-links.js` — index the page's links into `{label: href}`
- `settings.js` — the `>` settings registry
- `search.js` — turn a query into ranked suggestions
- `overlay.js` — the search bar: open/close, render, keyboard nav
- `main.js` — the global hotkey (entry point)

Styles are in `styles.css`. Reload the page (or hit the reload icon on the
extension card) to see changes.

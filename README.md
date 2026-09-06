# antimouse

A Spotlight-style command bar for any web page. Press **Cmd+K** (macOS) or
**Ctrl+K** (Windows/Linux) and start typing to jump to any link or button on
the page — no mouse required.

## What it does

- **Search the page** — every link and button is indexed by its label, so you
  can type a few letters and hit **Enter** to follow it.
- **See where you'll land** — the selected result is highlighted directly on the
  page, and off-screen targets scroll into view.
- **Open in a new tab** — **Cmd/Ctrl+Enter** on a link opens it in the background.
- **Jump to any site** — type a URL like `github.com` to go straight there, or
  any other text to search the web.
- **Stays out of the way** — on sites with their own Cmd+K palette (GitHub,
  Linear, Slack…), antimouse defers to them and does nothing.
- **Live results** — the list refreshes as the page changes, so it keeps up with
  dynamic single-page apps.

## Shortcuts

| Key | Action |
| --- | --- |
| `Cmd/Ctrl+K` | Open / close the bar |
| `↑` / `↓` | Move between results |
| `Enter` | Follow the selected result |
| `Cmd/Ctrl+Enter` | Open a link in a new tab |
| `Esc` | Close the bar |
| `>` | Open settings (e.g. light / dark theme) |

## Install

Once published, install from the Chrome Web Store. To run the current source
directly:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder

## Privacy

antimouse runs entirely in your browser. It reads the current page only to index
its links and buttons, and never sends page content or browsing activity
anywhere. Your one preference (the theme) is stored locally via
`chrome.storage`. See [PRIVACY.md](PRIVACY.md) for details.

## Develop

Logic lives in `src/`, loaded in order by the manifest:

- `page-links.js` — index the page's links and buttons into `{label: target}`
- `settings-store.js` — persist user settings via `chrome.storage`
- `settings.js` — the `>` settings registry
- `search.js` — turn a query into ranked suggestions
- `overlay.js` — the search bar: open/close, render, keyboard nav
- `main.js` — the global hotkey (entry point)

Styles are in `styles.css`. Reload the page (or hit the reload icon on the
extension card) to see changes.

## License

[Apache-2.0](LICENSE) © 2026 Haider Mirza

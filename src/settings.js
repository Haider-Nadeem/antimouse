// Settings mode: type ">" to browse/configure options instead of page links.
const SETTINGS_PREFIX = ">";

let settingsView = "root"; // "root" | "theme"

// Root menu. Plain actions run in place; settings with choices open a submenu.
const ROOT_SETTINGS = [
  { label: "theme", hint: "setting", run: () => enterThemeMenu() },
];

const enterThemeMenu = () => {
  settingsView = "theme";
  overlayRefs.input.value = SETTINGS_PREFIX; // stay in settings mode, clear the filter
  refreshSuggestions(SETTINGS_PREFIX);
};

// A theme choice. Highlighting it previews the look live without persisting;
// pressing enter saves it and drops back to the cleared page-search input.
const themeOption = (value) => ({
  label: value,
  hint: readSetting("theme") === value ? "current" : "theme",
  preview: () => setBarTheme(value),
  run: () => {
    writeSetting("theme", value);
    settingsView = "root";
    overlayRefs.input.value = "";
    refreshSuggestions("");
  },
});

// Current theme first, so opening the submenu previews what's already applied.
const themeOptions = () => {
  const current = readSetting("theme");
  return ["dark", "light"]
    .sort((a, b) => (a === current ? -1 : b === current ? 1 : 0))
    .map(themeOption);
};

// Items for whichever settings level is currently showing.
const settingsItems = () =>
  settingsView === "theme" ? themeOptions() : ROOT_SETTINGS;

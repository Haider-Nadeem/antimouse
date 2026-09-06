const SETTINGS_NS = "antimouse:";

const SETTING_DEFS = {
  theme: { default: "dark", values: ["dark", "light"] },
};

// Live cache of stored values, keyed by setting name. Starts at defaults and is
// backfilled from chrome.storage.local below.
const settingsCache = Object.fromEntries(
  Object.entries(SETTING_DEFS).map(([key, def]) => [key, def.default]),
);

// Seed the cache from storage on load. Values that fail validation (unset or
// corrupted) keep their default.
chrome.storage.local.get(
  Object.keys(SETTING_DEFS).map((k) => SETTINGS_NS + k),
  (stored) => {
    for (const [key, def] of Object.entries(SETTING_DEFS)) {
      const value = stored[SETTINGS_NS + key];
      if (def.values.includes(value)) settingsCache[key] = value;
    }
  },
);

// Read a setting synchronously from the cache.
const readSetting = (key) => settingsCache[key];

// Persist a setting; ignores values the schema doesn't allow.
const writeSetting = (key, value) => {
  if (!SETTING_DEFS[key]?.values.includes(value)) return;
  settingsCache[key] = value;
  chrome.storage.local.set({ [SETTINGS_NS + key]: value });
};

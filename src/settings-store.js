// Persistent user settings, namespaced in localStorage.
//
// To add a setting: append one entry to SETTING_DEFS with its default and the
// values it accepts. readSetting/writeSetting validate against the schema, so
// nothing else needs to change here — the UI just calls read/write by key.
const SETTINGS_NS = "antimouse:";

const SETTING_DEFS = {
  theme: { default: "dark", values: ["dark", "light"] },
};

// Read a setting, falling back to its default when unset or corrupted.
const readSetting = (key) => {
  const def = SETTING_DEFS[key];
  const stored = localStorage.getItem(SETTINGS_NS + key);
  return def.values.includes(stored) ? stored : def.default;
};

// Persist a setting; ignores values the schema doesn't allow.
const writeSetting = (key, value) => {
  if (!SETTING_DEFS[key]?.values.includes(value)) return;
  localStorage.setItem(SETTINGS_NS + key, value);
};

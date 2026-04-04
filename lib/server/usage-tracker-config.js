const path = require("path");
const {
  readOpenclawConfig,
  writeOpenclawConfig,
  normalizeUsageTrackerPluginPaths,
} = require("./openclaw-config");

const kUsageTrackerPluginPath = path.resolve(
  __dirname,
  "..",
  "plugin",
  "usage-tracker",
);

const ensurePluginsShell = (cfg = {}) => {
  if (!cfg.plugins || typeof cfg.plugins !== "object") cfg.plugins = {};
  if (!Array.isArray(cfg.plugins.allow)) cfg.plugins.allow = [];
  if (!cfg.plugins.load || typeof cfg.plugins.load !== "object") {
    cfg.plugins.load = {};
  }
  if (!Array.isArray(cfg.plugins.load.paths)) cfg.plugins.load.paths = [];
  if (!cfg.plugins.entries || typeof cfg.plugins.entries !== "object") {
    cfg.plugins.entries = {};
  }
};

const ensurePluginAllowed = ({ cfg = {}, pluginKey = "" }) => {
  const normalizedPluginKey = String(pluginKey || "").trim();
  if (!normalizedPluginKey) return;
  ensurePluginsShell(cfg);
  if (!cfg.plugins.allow.includes(normalizedPluginKey)) {
    cfg.plugins.allow.push(normalizedPluginKey);
  }
};

const ensureUsageTrackerPluginEntry = (cfg = {}, { fsModule } = {}) => {
  const before = JSON.stringify(cfg);
  ensurePluginAllowed({ cfg, pluginKey: "usage-tracker" });
  cfg.plugins.load.paths = normalizeUsageTrackerPluginPaths({
    fs: fsModule,
    paths: cfg.plugins.load.paths,
    fallbackPath: kUsageTrackerPluginPath,
  }).paths;
  cfg.plugins.entries["usage-tracker"] = {
    ...(cfg.plugins.entries["usage-tracker"] &&
    typeof cfg.plugins.entries["usage-tracker"] === "object"
      ? cfg.plugins.entries["usage-tracker"]
      : {}),
    enabled: true,
  };
  return JSON.stringify(cfg) !== before;
};

const ensureUsageTrackerPluginConfig = ({ fsModule, openclawDir }) => {
  const cfg = readOpenclawConfig({
    fsModule,
    openclawDir,
    fallback: {},
  });
  const changed = ensureUsageTrackerPluginEntry(cfg, { fsModule });
  if (!changed) return false;
  writeOpenclawConfig({
    fsModule,
    openclawDir,
    config: cfg,
    spacing: 2,
  });
  return true;
};

module.exports = {
  kUsageTrackerPluginPath,
  ensurePluginsShell,
  ensurePluginAllowed,
  ensureUsageTrackerPluginEntry,
  ensureUsageTrackerPluginConfig,
};

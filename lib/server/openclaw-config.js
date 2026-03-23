const fs = require("fs");
const path = require("path");

const stripTrailingSeparators = (value) =>
  String(value || "").trim().replace(/[\\/]+$/, "");

const isUsageTrackerPluginPath = (value) => {
  const normalized = stripTrailingSeparators(value);
  if (!normalized) return false;
  return normalized.split(/[\\/]/).pop() === "usage-tracker";
};

const resolveOpenclawConfigPath = ({ openclawDir }) =>
  path.join(openclawDir, "openclaw.json");

const readOpenclawConfig = ({
  fsModule = fs,
  openclawDir,
  fallback = {},
} = {}) => {
  const configPath = resolveOpenclawConfigPath({ openclawDir });
  try {
    return JSON.parse(fsModule.readFileSync(configPath, "utf8"));
  } catch {
    return fallback;
  }
};

const writeOpenclawConfig = ({
  fsModule = fs,
  openclawDir,
  config = {},
  spacing = 2,
} = {}) => {
  const configPath = resolveOpenclawConfigPath({ openclawDir });
  fsModule.mkdirSync(path.dirname(configPath), { recursive: true });
  fsModule.writeFileSync(configPath, JSON.stringify(config, null, spacing));
  return configPath;
};

const normalizeUsageTrackerPluginPaths = ({
  paths,
  fs: fsModule = fs,
  fallbackPath,
}) => {
  const inputPaths = Array.isArray(paths) ? paths : [];
  const nextPaths = [];
  let selectedPath = null;

  for (const currentPath of inputPaths) {
    if (!isUsageTrackerPluginPath(currentPath)) {
      nextPaths.push(currentPath);
      continue;
    }

    const normalizedPath = stripTrailingSeparators(currentPath);
    if (!normalizedPath || !fsModule.existsSync(normalizedPath)) {
      continue;
    }
    if (selectedPath) {
      continue;
    }

    selectedPath = normalizedPath;
    nextPaths.push(normalizedPath);
  }

  if (!selectedPath && fallbackPath) {
    selectedPath = fallbackPath;
    nextPaths.push(fallbackPath);
  }

  const changed =
    nextPaths.length !== inputPaths.length
    || nextPaths.some((pathValue, index) => pathValue !== inputPaths[index]);

  return {
    changed,
    paths: nextPaths,
    selectedPath,
  };
};

module.exports = {
  resolveOpenclawConfigPath,
  readOpenclawConfig,
  writeOpenclawConfig,
  normalizeUsageTrackerPluginPaths,
};

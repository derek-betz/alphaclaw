const stripTrailingSeparators = (value) =>
  String(value || "").trim().replace(/[\\/]+$/, "");

const isUsageTrackerPluginPath = (value) => {
  const normalized = stripTrailingSeparators(value);
  if (!normalized) return false;
  return normalized.split(/[\\/]/).pop() === "usage-tracker";
};

const normalizeUsageTrackerPluginPaths = ({ paths, fs, fallbackPath }) => {
  const inputPaths = Array.isArray(paths) ? paths : [];
  const nextPaths = [];
  let selectedPath = null;

  for (const currentPath of inputPaths) {
    if (!isUsageTrackerPluginPath(currentPath)) {
      nextPaths.push(currentPath);
      continue;
    }

    const normalizedPath = stripTrailingSeparators(currentPath);
    if (!normalizedPath || !fs.existsSync(normalizedPath)) {
      continue;
    }
    if (selectedPath) {
      continue;
    }

    selectedPath = normalizedPath;
    nextPaths.push(normalizedPath);
  }

  if (!selectedPath) {
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
  normalizeUsageTrackerPluginPaths,
};

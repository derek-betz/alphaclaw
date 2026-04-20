const path = require("path");

const loadPluginModule = () => {
  const modulePath = require.resolve("../../lib/plugin/usage-tracker");
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("plugin/usage-tracker root resolution", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("derives the root dir from OPENCLAW_STATE_DIR when direct root envs are absent", () => {
    delete process.env.ALPHACLAW_ROOT_DIR;
    delete process.env.OPENCLAW_HOME;
    delete process.env.OPENCLAW_ROOT_DIR;
    process.env.OPENCLAW_STATE_DIR = "/tmp/alphaclaw-runtime/.openclaw";
    delete process.env.OPENCLAW_CONFIG_PATH;

    const plugin = loadPluginModule();

    expect(plugin.resolveRootDir()).toBe("/tmp/alphaclaw-runtime");
  });

  it("derives the root dir from OPENCLAW_CONFIG_PATH when only the config path is present", () => {
    delete process.env.ALPHACLAW_ROOT_DIR;
    delete process.env.OPENCLAW_HOME;
    delete process.env.OPENCLAW_ROOT_DIR;
    delete process.env.OPENCLAW_STATE_DIR;
    process.env.OPENCLAW_CONFIG_PATH = path.join(
      "/tmp",
      "alphaclaw-runtime",
      ".openclaw",
      "openclaw.json",
    );

    const plugin = loadPluginModule();

    expect(plugin.resolveRootDir()).toBe("/tmp/alphaclaw-runtime");
  });
});

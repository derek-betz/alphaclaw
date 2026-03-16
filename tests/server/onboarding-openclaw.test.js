const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  writeManagedImportOpenclawConfig,
  writeSanitizedOpenclawConfig,
} = require("../../lib/server/onboarding/openclaw");

const createTempOpenclawDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-onboarding-openclaw-test-"));
const runtimePluginPath = path.resolve(__dirname, "../../lib/plugin/usage-tracker");

describe("server/onboarding/openclaw", () => {
  it("only scrubs exact secret string values in JSON", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    const pluginPath = path.join(
      openclawDir,
      "node_modules",
      "@chrysb",
      "alphaclaw",
      "lib",
      "plugin",
      "usage-tracker",
    );
    fs.mkdirSync(pluginPath, { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: {
            allow: ["memory-core"],
            load: { paths: [pluginPath] },
            entries: {},
          },
          channels: {},
          notes: "alphaclaw",
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: { GOG_KEYRING_PASSWORD: "alphaclaw" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.notes).toBe("${GOG_KEYRING_PASSWORD}");
    expect(next.plugins.allow).toEqual(["memory-core", "usage-tracker"]);
    expect(next.plugins.load.paths).toContain(pluginPath);
    expect(next.plugins.load.paths).not.toContain(
      "/app/node_modules/@chrysb/${GOG_KEYRING_PASSWORD}/lib/plugin/usage-tracker",
    );
  });

  it("creates plugins.allow when missing before adding usage-tracker", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: { load: { paths: [] }, entries: {} },
          channels: {},
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: {},
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.plugins.allow).toEqual(["usage-tracker"]);
    expect(next.plugins.entries["usage-tracker"]).toEqual({ enabled: true });
  });

  it("deduplicates usage-tracker paths while preserving the first valid path", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    const customPluginPath = path.join(openclawDir, "plugins", "usage-tracker");
    fs.mkdirSync(customPluginPath, { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: {
            allow: [],
            load: {
              paths: [
                customPluginPath,
                runtimePluginPath,
              ],
            },
            entries: {},
          },
          channels: {},
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: {},
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.plugins.load.paths).toEqual([customPluginPath]);
  });

  it("replaces invalid usage-tracker paths with the runtime fallback path", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: {
            allow: [],
            load: {
              paths: [
                path.join(openclawDir, "missing", "usage-tracker"),
              ],
            },
            entries: {},
          },
          channels: {},
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: {},
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.plugins.load.paths).toEqual([runtimePluginPath]);
  });

  it("resets imported allowlist dmPolicy to pairing when re-enabling discord", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: { allow: [], load: { paths: [] }, entries: {} },
          channels: {
            discord: {
              enabled: false,
              dmPolicy: "allowlist",
              allowFrom: [],
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    writeManagedImportOpenclawConfig({
      fs,
      openclawDir,
      varMap: { DISCORD_BOT_TOKEN: "discord-live-secret" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.discord.enabled).toBe(true);
    expect(next.channels.discord.dmPolicy).toBe("pairing");
    expect(next.channels.discord.token).toBe("${DISCORD_BOT_TOKEN}");
  });

  it("preserves existing telegram groups during fresh onboarding sanitize", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: { allow: [], load: { paths: [] }, entries: {} },
          channels: {
            telegram: {
              groups: {
                "-1003648762617": {
                  requireMention: true,
                },
              },
              groupAllowFrom: ["7817744781"],
              streaming: "partial",
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    writeSanitizedOpenclawConfig({
      fs,
      openclawDir,
      varMap: { TELEGRAM_BOT_TOKEN: "telegram-live-secret" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.telegram.botToken).toBe("${TELEGRAM_BOT_TOKEN}");
    expect(next.channels.telegram.groups["-1003648762617"]).toEqual({
      requireMention: true,
    });
    expect(next.channels.telegram.groupAllowFrom).toEqual(["7817744781"]);
    expect(next.channels.telegram.streaming).toBe("partial");
  });

  it("preserves existing telegram groups during managed import", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugins: { allow: [], load: { paths: [] }, entries: {} },
          channels: {
            telegram: {
              groups: {
                "-1003648762617": {
                  requireMention: true,
                },
              },
              groupAllowFrom: ["7817744781"],
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    writeManagedImportOpenclawConfig({
      fs,
      openclawDir,
      varMap: { TELEGRAM_BOT_TOKEN: "telegram-live-secret" },
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.telegram.botToken).toBe("${TELEGRAM_BOT_TOKEN}");
    expect(next.channels.telegram.groups["-1003648762617"]).toEqual({
      requireMention: true,
    });
    expect(next.channels.telegram.groupAllowFrom).toEqual(["7817744781"]);
  });
});

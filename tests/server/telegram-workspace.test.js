const fs = require("fs");
const os = require("os");
const path = require("path");

const { syncConfigForTelegram } = require("../../lib/server/telegram-workspace");

const createTempOpenclawDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-telegram-workspace-test-"));

describe("server/telegram-workspace", () => {
  it("preserves an existing requireMention value when topic sync omits it", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          channels: {
            telegram: {
              groups: {
                "-1003648762617": {
                  requireMention: true,
                },
              },
            },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry: {
        getGroup: () => ({
          topics: {
            "12": {
              systemInstructions: "Keep responses tight.",
            },
          },
        }),
        getTotalTopicCount: () => 1,
      },
      groupId: "-1003648762617",
      resolvedUserId: "",
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.telegram.groups["-1003648762617"]).toEqual({
      requireMention: true,
      topics: {
        "12": {
          systemPrompt: "Keep responses tight.",
        },
      },
    });
  });

  it("defaults requireMention to false for a newly created group when omitted", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(configPath, "{}", "utf8");

    syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry: {
        getGroup: () => ({ topics: {} }),
        getTotalTopicCount: () => 0,
      },
      groupId: "-1003648762617",
      resolvedUserId: "",
    });

    const next = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(next.channels.telegram.groups["-1003648762617"]).toEqual({
      requireMention: false,
    });
  });
});

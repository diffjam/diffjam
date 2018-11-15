const cli = require("../");
const _ = require("lodash");
const expect = require("expect");

const triggers = [
  "TODO",
  "TODO",
  "TODO",
];

triggers.length; // satisfy eslint

describe("diffkit-cli", () => {

  describe("#count", () => {

    it("errors if you exceed the baseline", async () => {
      const config = createConfig({
        quests: {
          killTODOs: {
            command: "git grep TODO | wc -l",
            minimize: true,
            baseline: 2,
          },
        },
      });

      const err = await getRejection(cli("check", null, {}, config))
      expect(err.name).toBe("NonZeroExitError");
    });

    it("succeeds if you are below the baseline", async () => {
      const config = createConfig({
        quests: {
          killTODOs: {
            command: "git grep some_long_string_that_will_never_appear | wc -l",
            minimize: true,
            baseline: 2,
          },
        },
      });

      await cli("check", null, {}, config)
    });

  })

})

function createConfig (obj) {
  return {
    get: key => _.get(obj, key),
    set: (key, value) => _.set(obj, key, value),
  }
}

async function getRejection (p) {
  try {
    await p;
  } catch (err) {
    return err;
  }
  throw new Error("Expected promise to reject but it fulfilled")
}

#!/usr/bin/env node

// @ts-ignore
import meow from "meow";
import { actionCheck } from "./src/actions/check";
import { actionCinch } from "./src/actions/cinch";
import { actionCount } from "./src/actions/count";
import { actionNewPolicy } from "./src/actions/newPolicy";
import { actionRemovePolicy } from "./src/actions/remove";
import { actionPolicyModify } from "./src/actions/policyModify";
import { CurrentWorkingDirectory } from "./src/CurrentWorkingDirectory";
import { Flags } from "./src/flags";
import { join } from "path";
import { Runner } from "./src/Runner";
import { Config } from "./src/Config";
import { actionMainMenu } from "./src/actions/mainMenu";

// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

process.on("unhandledRejection", (err: unknown) => {
  console.error("err: ", err);
  throw err;
});

const cli = meow(
  `
    Usage
      $ diffjam <action>

    Examples
      $ diffjam init
      $ diffjam add
      $ diffjam check
      $ diffjam cinch
      $ diffjam count
      $ diffjam modify [name]
      $ diffjam remove [name]
`,
  {
    flags: {
      config: {
        type: "string",
        alias: "c"
      },
      verbose: {
        type: "boolean",
        alias: "v"
      },
      record: {
        type: "boolean",
        alias: "r"
      },
      ci: {
        type: "boolean",
      }
    }
  }
);

// run!
const run = async function (action: string, policyName: string, flags: Flags) {
  const dir = process.cwd();
  const configFilePath = flags.config || join(dir, "diffjam.yaml");

  if (action === "init") {
    return Config.init(configFilePath);
  }

  const cwd = new CurrentWorkingDirectory(dir);
  const conf = Config.read(configFilePath);
  const runner = new Runner(await conf, flags, cwd);

  switch (action) {
    case "add":
      return actionNewPolicy(runner); // add a policy to the config
    case "remove":
      return actionRemovePolicy(policyName, runner); // remove a policy to the config
    case "modify":
      return actionPolicyModify(policyName, runner); // add a policy to the config
    case "count":
      return actionCount(runner); // run the policy counter
    case "check":
      return actionCheck(runner); // count + fail if warranted
    case "cinch":
      return actionCinch(runner); // if there are no breaches, update the baselines to the strictest possible
    case "menu":
      return actionMainMenu(runner); // show the main menu
    default:
      console.error(`unknown command: ${action}`);
      console.error(cli.help);
      process.exit(1);
  }
};

// eslint-disable-next-line no-void
void run(cli.input[0], cli.input[1], cli.flags);

#!/usr/bin/env node

// @ts-ignore
import meow from "meow";
import * as configFile from "./src/configFile";
import { clientVersion } from "./src/clientVersion";
import { actionCheck } from "./src/actions/check";
// import { actionCinch } from "./src/actions/cinch";
// import { actionCount } from "./src/actions/count";
import { actionInit } from "./src/actions/init";
import { actionNewPolicy } from "./src/actions/newPolicy";
import { actionRemovePolicy } from "./src/actions/remove";
import { actionPolicyModify } from "./src/actions/policyModify";
import { CurrentWorkingDirectory } from "./src/CurrentWorkingDirectory";
// import { actionMainMenu } from "./src/actions/mainMenu";

const clientVers = clientVersion();

// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

process.on("unhandledRejection", (err: unknown) => {
  console.error("err: ", err);
  throw err;
});



// run!
const run = async function (action: string, policyName: string, flags: { dir?: string, config?: string; }) {
  const dir = flags.dir || process.cwd();

  // if (!action || action === "menu") {
  //   return actionMainMenu(clientVers, flags);
  // }
  if (action === "init") {
    return actionInit(flags.config);
  }

  const conf = await configFile.getConfig(flags.config);
  const cwd = new CurrentWorkingDirectory(dir);

  switch (action) {
    case "add":
      return actionNewPolicy(flags.config); // add a policy to the config
    case "remove":
      return actionRemovePolicy(policyName, flags.config); // add a policy to the config
    case "modify":
      return actionPolicyModify(policyName); // add a policy to the config
    // case "count":
    //   return actionCount(flags, clientVers); // run the policy counter
    case "check":
      return actionCheck(conf, cwd); // count + fail if warranted
    // case "cinch":
    //   return actionCinch(); // if there are no breaches, update the baselines to the strictest possible
    default:
      throw new Error(`unknown action: ${action}`);
  }
};

const cli = meow(
  `
    Usage
      $ diffjam <action>

    Examples
      $ diffjam menu
      $ diffjam count
      $ diffjam check
      $ diffjam report
`,
  {
    flags: {
      config: {
        type: "string",
        alias: "c"
      }
    }
  }
);

// eslint-disable-next-line no-void
void run(cli.input[0], cli.input[1], cli.flags);

import _ from "lodash";
// @ts-ignore
import meow from "meow";
import * as configObj from "./src/config";
import { clientVersion } from "./src/clientVersion";
import { actionCheck } from "./src/actions/check";
import { actionCinch } from "./src/actions/cinch";
import { actionCount } from "./src/actions/count";
import { actionNewPolicy } from "./src/actions/newPolicy";
import { actionPolicyModify } from "./src/actions/policyModify";
import { actionInit } from "./src/actions/init";
import { actionMainMenu } from "./src/actions/mainMenu";

const clientVers = clientVersion();

// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

process.on("unhandledRejection", (err: any) => {
  console.error("err: ", err);
  throw err;
});



// run!
const run = async function (action: string, param1: any, flags: { config: any; }) {
  await configObj.getConfig(flags.config);
  if (!action || action === "menu") {
    return actionMainMenu(clientVers);
  }
  switch (action) {
    case "init":
      return actionInit(); // create the config
    case "policy":
      return actionNewPolicy(); // add a policy to the config
    case "modify":
      return actionPolicyModify(param1); // add a policy to the config
    case "count":
      return actionCount(flags, clientVers); // run the policy counter
    case "check":
      return actionCheck(); // count + fail if warranted
    case "cinch":
      return actionCinch(); // if there are no breaches, update the baselines to the strictest possible
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

run(cli.input[0], cli.input[1], cli.flags);

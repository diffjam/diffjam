import { extend } from "lodash";
import { actionCheck } from "./check";
import { actionCinch } from "./cinch";
import { actionCount } from "./count";
import { actionNewPolicy } from "./newPolicy";
import { actionPolicyModify } from "./policyModify";
import { logo } from "../logo";
import { Runner } from "../Runner";
import { clientVersion } from "../clientVersion";

export const actionMainMenu = async (runner: Runner) => {
  const ui = require("../ui");
  const clientVers = clientVersion();

  console.log(logo(clientVers) + "\n");

  const policyNames = runner.config.getPolicyNames();
  const editChoicesMap: { [key: string]: { type: string, name: string } } = {};
  policyNames.forEach((name: string) => {
    editChoicesMap[`edit "${name}"`] = {
      type: "edit_policy",
      name
    };
  });

  const mainMenuChoice = await ui.select(
    "Choose an action",
    extend(
      {
        "new policy": { type: "new_policy" },
        "cinch - record the latest counts to the local config": {
          type: "cinch"
        },
        "count - count the current state of all policies": { type: "count" },
        "check - check that the current counts for the policies are not worse than the recorded counts": {
          type: "check"
        }
      },
      editChoicesMap
    )
  );

  switch (mainMenuChoice.type) {
    case "new_policy":
      return actionNewPolicy(runner);
    case "cinch":
      return actionCinch(runner);
    case "count":
      return actionCount(runner);
    case "check":
      return actionCheck(runner); // count + fail if warranted
    case "edit_policy":
      return actionPolicyModify(mainMenuChoice.name, runner);
    default:
      throw new Error(`unknown choice: ${mainMenuChoice}`);
  }
};


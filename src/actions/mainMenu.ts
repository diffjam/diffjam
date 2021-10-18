import { actionCheck } from "./check";
import { actionCinch } from "./cinch";
import { actionCount } from "./count";
import { actionNewPolicy } from "./newPolicy";
import { actionPolicyModify } from "./policyModify";
import * as configObj from "../config";
import { logo } from "../logo";
import * as ui from "../ui";
import _ from "lodash";

export const actionMainMenu = async (clientVers: string) => {
  console.log(logo(clientVers) + "\n");
  configObj.ensureConfig();
  const policyNames = configObj.getPolicyNames();
  const editChoicesMap: {[key: string]: {type: string, name: string}} = {};
  policyNames.forEach((name: string) => {
    editChoicesMap[`edit "${name}"`] = {
      type: "edit_policy",
      name
    };
  });

  const mainMenuChoice = await ui.select(
    "Choose an action",
    _.extend(
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
      return actionNewPolicy();
    case "cinch":
      return actionCinch();
    case "count":
      return actionCount({}, clientVers);
    case "check":
      return actionCheck(); // count + fail if warranted
    case "edit_policy":
      return actionPolicyModify(mainMenuChoice.name);
    default:
      throw new Error(`unknown choice: ${mainMenuChoice}`);
  }
};


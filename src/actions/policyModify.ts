
import * as configObj from "../config";
import { countMatches, findAndCountMatches, findMatches } from "../match";
import * as ui from "../ui";

const actionPolicyDescriptionEdit = async function (name: any) {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  if (!policy.description) {
    console.log("There currently is no description");
  } else {
    console.log("The current description is: ");
    console.log(policy.description);
  }

  policy.description = await ui.textInput("Give a new description: ");

  configObj.savePolicy(name, policy);
};

const actionPolicyBaselineFix = async function (name: any) {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const count = countMatches(await findMatches(policy.filePattern, policy.search));

  if (policy.isCountAcceptable(count)) {
    console.error(
      `The baseline for that policy doesn't need to be fixed.  The count is ${count} and the baseline is ${policy.baseline}`
    );
    return process.exit(1);
  }

  const oldBaseline = policy.baseline;

  configObj.setPolicyBaseline(name, count);
  console.log(
    `The baseline for that policy was changed from ${oldBaseline} to ${count}`
  );
};

const actionPolicyDelete = async function (name: any) {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  if (
    !(await ui.confirm(
      `Are you sure you want to delete the policy named "${name}"?`
    ))
  ) {
    console.log("Deletion cancelled.");
    return process.exit(0);
  }

  configObj.deletePolicy(`policies.${name}`);
};

const actionHideFromOutput = async function (name: string) {
  const policy = configObj.getPolicy(name);
  const currentValue = policy.hiddenFromOutput;
  console.log(
    `Output for "${name}" is currently ${currentValue ? "hidden" : "not hidden"}`
  );
  const menuChoice = await ui.select("Please choose", {
    "Show output (Check for regressions, show results, report metrics.  This is the default.)": false,
    "Hide output (Check for regressions but don't show results or report metrics)": true
  });
  policy.hiddenFromOutput = menuChoice;
  configObj.savePolicy(name, policy);
  console.log(
    `Output for "${name}" is now set to ${menuChoice ? "hidden" : "not hidden"}`
  );
};

export const actionPolicyModify = async (name: any) => {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const modifyMenuChoice = await ui.select("Choose an action", {
    delete: { type: "delete_policy" },
    "edit description": { type: "policy_description_edit" },
    "fix baseline": { type: "policy_baseline_fix" },
    "hide from output (unless there are regressions)": {
      type: "hideFromOutput"
    },
    exit: { type: "exit" }
  });

  switch (modifyMenuChoice.type) {
    case "policy_description_edit":
      return actionPolicyDescriptionEdit(name);
    case "delete_policy":
      return actionPolicyDelete(name);
    case "policy_baseline_fix":
      return actionPolicyBaselineFix(name);
    case "hideFromOutput":
      return actionHideFromOutput(name);
    case "exit":
      return process.exit(0);
    default:
      throw new Error(`unknown choice: ${modifyMenuChoice}`);
  }
}

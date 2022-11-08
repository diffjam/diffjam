
import { Runner } from "./Runner";

const actionPolicyDescriptionEdit = async function (name: string, runner: Runner) {
  const ui = require("./ui");

  const policy = runner.config.getPolicy(name);

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

  return runner.config.savePolicy(policy);
};

const actionCurrentState = async function (name: string, runner: Runner) {
  const result = await runner.runSinglePolicy(name);

  console.log("Policy: ");
  console.log("===============================");
  console.log("name: ", name);
  console.log("description: ", result.policy.description);
  console.log("filePattern: ", result.policy.filePattern);
  if (result.policy.ignoreFilePatterns) console.log("ignoreFilePatterns: ", result.policy.ignoreFilePatterns);
  console.log("search: ", result.policy.search);
  console.log("regexes: ", result.policy.needles);
  console.log("baseline: ", result.policy.baseline);
  console.log("Current count is: ", result.matches.length);
  console.log("matches: ");
  console.log(result.matches);
};


const actionPolicyBaselineFix = async function (name: string, runner: Runner) {
  const result = await runner.runSinglePolicy(name);

  if (result.policy.isCountAcceptable(result.matches)) {
    console.error(
      `The baseline for that policy doesn't need to be fixed.  The count is ${result.matches.length} and the baseline is ${result.policy.baseline}`
    );
    return process.exit(1);
  }

  const oldBaseline = result.policy.baseline;

  result.policy.baseline = result.matches.length;
  console.log(
    `The baseline for that policy was changed from ${oldBaseline} to ${result.matches.length}`
  );
  await runner.config.write();
};

const actionPolicyDelete = async function (name: string, runner: Runner) {
  const ui = require("./ui");
  const policy = runner.config.getPolicy(name);

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

  runner.config.deletePolicy(`policies.${name}`);
  await runner.config.write();
};

const actionHideFromOutput = async function (name: string, runner: Runner) {
  const ui = require("./ui");

  const policy = runner.config.getPolicy(name);
  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }
  const currentValue = policy.hiddenFromOutput;
  console.log(
    `Output for "${name}" is currently ${currentValue ? "hidden" : "not hidden"}`
  );
  const menuChoice = await ui.select("Please choose", {
    "Show output (Check for regressions, show results, report metrics.  This is the default.)": false,
    "Hide output (Check for regressions but don't show results or report metrics)": true
  });
  policy.hiddenFromOutput = menuChoice;
  await runner.config.savePolicy(policy);
  console.log(
    `Output for "${name}" is now set to ${menuChoice ? "hidden" : "not hidden"}`
  );
};

export const actionPolicyModify = async (runner: Runner) => {
  const ui = require("./ui");

  const policy = await ui.select("Choose a policy to modify", runner.config.policyMap);

  const modifyMenuChoice = await ui.select("Choose an action", {
    "see current state": { type: "see_current_state" },
    "delete": { type: "delete_policy" },
    "edit description": { type: "policy_description_edit" },
    "fix baseline": { type: "policy_baseline_fix" },
    "hide from output (unless there are regressions)": {
      type: "hideFromOutput"
    },
    "exit": { type: "exit" }
  });

  switch (modifyMenuChoice.type) {
    case "see_current_state":
      return actionCurrentState(policy.name, runner);
    case "policy_description_edit":
      return actionPolicyDescriptionEdit(policy.name, runner);
    case "delete_policy":
      return actionPolicyDelete(policy.name, runner);
    case "policy_baseline_fix":
      return actionPolicyBaselineFix(policy.name, runner);
    case "hideFromOutput":
      return actionHideFromOutput(policy.name, runner);
    case "exit":
      return process.exit(0);
    default:
      throw new Error(`unknown choice: ${modifyMenuChoice}`);
  }
}

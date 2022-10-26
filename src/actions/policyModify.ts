
import * as configFile from "../configFile";
import { countMatches, findMatches } from "../match";
import * as ui from "../ui";

const actionPolicyDescriptionEdit = async function (name: string) {
  const conf = await configFile.getConfig();
  const policy = conf.getPolicy(name);

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

  configFile.savePolicy(name, policy);
};

const actionCurrentState = async function (name: string) {
  const conf = await configFile.getConfig();
  const policy = conf.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const matches = await policy.findMatches();
  const count = countMatches(matches);
  console.log("Policy: ");
  console.log("===============================");
  console.log("name: ", name);
  console.log("description: ", policy.description);
  console.log("filePattern: ", policy.filePattern);
  if (policy.ignoreFilePatterns) console.log("ignoreFilePatterns: ", policy.ignoreFilePatterns);
  console.log("search: ", policy.search);
  console.log("regexes: ", policy.needles);
  console.log("baseline: ", policy.baseline);
  console.log("Current count is: ", count);
  console.log("matches: ");
  console.log(matches);

};


const actionPolicyBaselineFix = async function (name: string) {
  const conf = await configFile.getConfig();
  const policy = conf.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const count = countMatches(await policy.findMatches());

  if (policy.isCountAcceptable(count)) {
    console.error(
      `The baseline for that policy doesn't need to be fixed.  The count is ${count} and the baseline is ${policy.baseline}`
    );
    return process.exit(1);
  }

  const oldBaseline = policy.baseline;

  configFile.setPolicyBaseline(name, count);
  console.log(
    `The baseline for that policy was changed from ${oldBaseline} to ${count}`
  );
};

const actionPolicyDelete = async function (name: string) {
  const conf = await configFile.getConfig();
  const policy = conf.getPolicy(name);

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

  configFile.deletePolicy(`policies.${name}`);
};

const actionHideFromOutput = async function (name: string) {
  const conf = await configFile.getConfig();
  const policy = conf.getPolicy(name);
  const currentValue = policy.hiddenFromOutput;
  console.log(
    `Output for "${name}" is currently ${currentValue ? "hidden" : "not hidden"}`
  );
  const menuChoice = await ui.select("Please choose", {
    "Show output (Check for regressions, show results, report metrics.  This is the default.)": false,
    "Hide output (Check for regressions but don't show results or report metrics)": true
  });
  policy.hiddenFromOutput = menuChoice;
  configFile.savePolicy(name, policy);
  console.log(
    `Output for "${name}" is now set to ${menuChoice ? "hidden" : "not hidden"}`
  );
};

export const actionPolicyModify = async (name: string) => {
  const conf = await configFile.getConfig();
  const policy = conf.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const modifyMenuChoice = await ui.select("Choose an action", {
    "see current state": { type: "see_current_state" },
    delete: { type: "delete_policy" },
    "edit description": { type: "policy_description_edit" },
    "fix baseline": { type: "policy_baseline_fix" },
    "hide from output (unless there are regressions)": {
      type: "hideFromOutput"
    },
    exit: { type: "exit" }
  });

  switch (modifyMenuChoice.type) {
    case "see_current_state":
      return actionCurrentState(name);
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

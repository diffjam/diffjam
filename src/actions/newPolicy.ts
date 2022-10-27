
import { checkFilesAndAddMatches } from "../checkFilesAndAddMatches";
import { Policy } from "../Policy";
import { Runner } from "../Runner";

// create a policy
export const actionNewPolicy = async (runner: Runner) => {
  // Requiring ui 
  const ui = require("../ui");

  const name = await ui.textInput("Enter a name for this policy: ");

  const search = await ui.textInput(
    "Enter the search criteria for this policy: "
  );

  const filePattern = await ui.textInput(
    "Enter the filePattern to search for this policy: "
  );

  const ignoreFilePatterns = []
  while (true) {
    const ignoreFilePattern = await ui.textInput(
      "Enter any filePatterns to ignore (or leave blank to continue): "
    );

    if (ignoreFilePattern.trim()) {
      ignoreFilePatterns.push(ignoreFilePattern);
    } else {
      break;
    }
  }

  const policy = new Policy(name, "", filePattern, [search], 0, ignoreFilePatterns);

  policy.description = await ui.textInput(
    "Give a description for this policy: "
  );

  runner.config.setPolicy(policy);
  await runner.checkFilesAndAddMatchesForPolicy(policy.name)
  policy.baseline = policy.matches.length;

  if (
    await ui.confirm(
      `There are currently ${policy.baseline} matches for that configuration. Save it?`
    )
  ) {

    runner.config.write();
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
}


import * as configObj from "../config";
import { countMatches, findAndCountMatches, findMatches } from "../match";
import { Policy } from "../Policy";
import * as ui from "../ui";

// create a policy
export const actionNewPolicy = async (name?: string, search?: string, filePattern?: string) => {
  configObj.ensureConfig();

  if (!name) {
    name = await ui.textInput("Enter a name for this policy: ");
  }

  if (!search) {
    search = await ui.textInput(
      "Enter the search criteria for this policy: "
    );
  }

  if (!filePattern) {
    filePattern = await ui.textInput(
      "Enter the filePattern to search for this policy: "
    );
  }

  const policy = new Policy("", filePattern, search, 0);

  policy.description = await ui.textInput(
    "Give a description for this policy: "
  );
  const count = countMatches(await findMatches(policy.filePattern, policy.search));

  policy.baseline = count;

  if (
    await ui.confirm(
      `There are currently ${count} matches for that configuration. Save it?`
    )
  ) {
    configObj.savePolicy(name, policy);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
}

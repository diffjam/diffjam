
import * as configObj from "../config";
import { countPolicy } from "../countPolicy";
import { Policy } from "../Policy";
import * as ui from "../ui";

// create a policy
export const actionNewPolicy = async (name?: string, command?: string) => {
  configObj.ensureConfig();

  if (!name) {
    name = await ui.textInput("Enter a name for this policy: ");
  }

  if (!command) {
    command = await ui.textInput(
      "Enter the command that will return your metric: "
    );
  }

  const policy = new Policy("", command, 0);

  policy.description = await ui.textInput(
    "Give a description for this policy: "
  );

  const { count } = await countPolicy(policy);

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

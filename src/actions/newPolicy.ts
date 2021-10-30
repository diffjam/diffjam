
import * as configFile from "../configFile";
import { countMatches, findMatches } from "../match";
import { Policy } from "../Policy";
import * as ui from "../ui";

// @ts-ignore
import toRegex from "to-regex";

// create a policy
export const actionNewPolicy = async (name?: string, search?: string, filePattern?: string) => {
  const conf = await configFile.getConfig();

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

  const policy = new Policy("", filePattern, [search], 0);

  policy.description = await ui.textInput(
    "Give a description for this policy: "
  );
  const count = countMatches(await findMatches(policy.filePattern, policy.needles));

  policy.baseline = count;

  if (
    await ui.confirm(
      `There are currently ${count} matches for that configuration. Save it?`
    )
  ) {
    conf.setPolicy(name, policy);
    configFile.writeConfig(conf);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
}

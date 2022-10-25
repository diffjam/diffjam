
import * as configFile from "../configFile";
import { countMatches, findMatches } from "../match";
import { Policy } from "../Policy";
import * as ui from "../ui";

// create a policy
export const actionNewPolicy = async (filePath: string | undefined) => {
  const conf = await configFile.getConfig();

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

  const policy = new Policy("", filePattern, [search], 0, ignoreFilePatterns);

  policy.description = await ui.textInput(
    "Give a description for this policy: "
  );
  const count = countMatches(await policy.findMatches());

  policy.baseline = count;

  if (
    await ui.confirm(
      `There are currently ${count} matches for that configuration. Save it?`
    )
  ) {
    conf.setPolicy(name, policy);
    configFile.writeConfig(conf, filePath);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
}

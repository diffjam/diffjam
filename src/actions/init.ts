
import * as configFile from "../configFile";

export const actionInit = async function (filePath?: string) {
  if (await configFile.exists(filePath)) {
    console.error("A diffjam.yaml already exists.  Skipping initialization.");
    process.exitCode = 1;
    return;
  }

  configFile.writeConfig(configFile.exampleConfig(), filePath);
};
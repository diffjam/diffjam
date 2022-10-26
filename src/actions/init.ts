
import * as configFile from "../configFile";

export const actionInit = async function (filePath: string | undefined) {
  if (filePath && await configFile.exists(filePath)) {
    console.error(`A ${filePath} already exists. Skipping initialization.`);
    process.exit(1);
  }

  configFile.writeConfig(configFile.exampleConfig(), filePath);
};
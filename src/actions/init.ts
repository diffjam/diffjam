
import * as configFile from "../configFile";

export const actionInit = async function () {
  if (!configFile.exists()) {
    configFile.getConfig();
    console.log("Created diffjam.yaml for diffjam configuration.");
  } else {
    console.error("A diffjam.yaml already exists.  Skipping initialization.");
    process.exitCode = 1;
  }
};
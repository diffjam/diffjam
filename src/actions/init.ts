
import * as configObj from "../config";

export const actionInit = async function () {
  if (!configObj.exists()) {
    configObj.ensureConfig();
    console.log("Created diffjam.json for diffjam configuration.");
  } else {
    console.error("A diffjam.json already exists.  Skipping initialization.");
    process.exitCode = 1;
  }
};
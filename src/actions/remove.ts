
import * as configFile from "../configFile";

export const actionRemovePolicy = async function (name: string, filePath: string | undefined) {
  const conf = await configFile.getConfig();
  const policy = conf.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  conf.deletePolicy(name);

  configFile.writeConfig(conf, filePath);
};

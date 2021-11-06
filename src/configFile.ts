import { exists as fileExists, readFileSync, writeFileSync } from "mz/fs";
import { Config } from "./Config";
import { Policy } from "./Policy";
let config: Config;
const defaultFilePath = './diffjam.yaml';

export async function exists(file = defaultFilePath){
  return await fileExists(file);
}

export async function getConfig(file = defaultFilePath): Promise<Config> {
  if (Boolean(config)) {
    return config;
  }
  const exists = await fileExists(file);
  if (exists) {
    config = Config.fromYaml(readFileSync(file).toString());
  } else {
    config = new Config({});
  }
  return config;
}

export const writeConfig = (conf: Config, filePath = defaultFilePath) => {
  writeFileSync(filePath, conf.toYaml());
};

export function savePolicy(name: string, policy: Policy) {
  config.setPolicy(name, policy);
  writeConfig(config);
}

export function deletePolicy(name: string) {
  config.deletePolicy(name);
  writeConfig(config);
}

export function setPolicyBaseline(name: string, count: number) {
  const policy = config.getPolicy(name);
  policy.baseline = count;
  writeConfig(config);
}

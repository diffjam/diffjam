import { exists as fileExists, readFileSync, writeFileSync } from "mz/fs";
import { Config } from "./Config";
import { Policy } from "./Policy";
let config: Config;
let configLoaded = false;
const defaultFilePath = "./diffjam.yaml";

export async function exists(file = defaultFilePath) {
  return fileExists(file);
}

export async function refresh(file = defaultFilePath): Promise<Config> {
  const exists = await fileExists(file);
  if (exists) {
    config = Config.fromYaml(readFileSync(file).toString());
    configLoaded = true;
  } else {
    config = new Config({});
  }
  return config;
}

export async function getConfig(file = defaultFilePath): Promise<Config> {
  if (configLoaded) {
    return config;
  }
  return refresh(file);
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

export function clear() {
  config = new Config({});
}

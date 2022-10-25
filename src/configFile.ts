import { exists as fileExists, readFileSync, writeFileSync } from "mz/fs";
import { join } from "path";
import { Config } from "./Config";
import { Policy } from "./Policy";
let config: Config;
let configLoaded = false;

const defaultFilePath = join(process.cwd(), "diffjam.yaml");

export async function exists(file = defaultFilePath) {
  return fileExists(file);
}

export function exampleConfig(): Config {
  return new Config({
    "No console.log": new Policy(
      "An example policy enforcing no console.log calls in src/",
      "src/**/*.*",
      ["regex:console.log\\\\(.*\\\\)"],
      0
    )
  });
}

export async function refresh(file = defaultFilePath): Promise<Config> {
  let fileContents
  try {
    fileContents = readFileSync(file).toString()
  } catch (e) { }

  if (fileContents) {
    config = Config.fromYaml(fileContents);
  } else {
    config = new Config({});
  }
  configLoaded = true;
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

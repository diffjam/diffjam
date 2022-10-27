import { exists as fileExists, readFile, writeFileSync } from "mz/fs";
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
    "Example policy": new Policy(
      "Example policy",
      "An example policy ensuring there are no TODOs in the code",
      "src/**/*.*",
      ["regex:TODO"],
      0
    )
  });
}

export function refresh(file = defaultFilePath): Promise<Config> {
  return new Promise((resolve, reject) => {
    readFile(file, { encoding: "utf8" }, (err, fileContents) => {
      if (err) {
        config = new Config({});
        configLoaded = true;
        return resolve(config);
      }
      try {
        config = Config.fromYaml(fileContents);
        configLoaded = true;
        return resolve(config);
      } catch (e) {
        return reject(e);
      }
    });
  });
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

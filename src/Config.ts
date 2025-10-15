/*
  Read/parse/write a config diffjam.yaml file with policies.
*/

import { dump, load } from "js-yaml";
import { hasProp } from "./hasProp";
import { Policy, PolicyJson } from "./Policy";
import { access as fileAccess, readFile, writeFile } from "fs/promises";
import { constants as fsConstants } from "fs";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fileAccess(filePath, fsConstants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function exampleConfig(filePath: string): Config {
  return new Config(
    {
      "Example policy": new Policy(
        "Example policy",
        "An example policy ensuring there are no TODOs in the code",
        "src/**/*.*",
        ["regex:TODO"],
        0
      ),
    },
    filePath
  );
}

export type PolicyMap = { [name: string]: Policy };

export interface ConfigJson {
  policies: { [key: string]: PolicyJson };
}

export class Config {
  constructor(public policyMap: PolicyMap, public filePath: string) {}

  static fromYaml(yaml: string, filePath: string) {
    const obj = load(yaml) as any;
    const policyMap: PolicyMap = {};
    if (!hasProp(obj, "policies")) {
      return new Config(policyMap, filePath);
    }
    for (const key of Object.keys(obj.policies)) {
      policyMap[key] = Policy.fromJson(key, obj.policies[key]);
    }
    return new Config(policyMap, filePath);
  }

  static fromJson(json: ConfigJson, filePath: string) {
    const policyMap: PolicyMap = {};
    for (const key of Object.keys(json.policies)) {
      policyMap[key] = Policy.fromJson(key, json.policies[key]);
    }
    return new Config(policyMap, filePath);
  }

  getPolicy(name: string): Policy | undefined {
    return this.policyMap[name];
  }

  deletePolicy(name: string): void {
    delete this.policyMap[name];
  }

  setPolicy(policy: Policy): void {
    this.policyMap[policy.name] = policy;
  }

  getPolicyNames(): string[] {
    return Object.keys(this.policyMap);
  }

  toJson(): ConfigJson {
    const retval: ConfigJson = { policies: {} };
    for (const key of Object.keys(this.policyMap)) {
      retval.policies[key] = this.policyMap[key].toJson();
    }
    return retval;
  }

  toYaml(): string {
    const object = this.toJson();
    return dump(object, {
      styles: {
        "!!null": "canonical", // dump null as ~
      },
      sortKeys: true, // sort object keys
      quotingType: '"',
    });
  }

  async write() {
    await writeFile(this.filePath, this.toYaml(), { encoding: "utf8" });
  }

  async savePolicy(policy: Policy) {
    this.setPolicy(policy);
    await this.write();
  }

  static async read(filePath: string): Promise<Config> {
    let fileContents: string;
    try {
      fileContents = await readFile(filePath, { encoding: "utf8" });
    } catch (e) {
      return new Config({}, filePath);
    }
    return Config.fromYaml(fileContents, filePath);
  }

  static async init(filePath: string) {
    if (await fileExists(filePath)) {
      console.error(`A ${filePath} already exists. Skipping initialization.`);
      process.exit(1);
    }

    const config = exampleConfig(filePath);
    return config.write();
  }
}

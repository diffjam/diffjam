import { dump, load } from "js-yaml";
import { hasProp } from "./hasProp";
import { Policy, PolicyJson } from "./Policy";
import { exists as fileExists, readFile, writeFile } from "mz/fs";


function exampleConfig(filePath: string): Config {
  return new Config({
    "Example policy": new Policy(
      "Example policy",
      "An example policy ensuring there are no TODOs in the code",
      "src/**/*.*",
      ["regex:TODO"],
      0
    )
  }, filePath);
}

export type PolicyMap = { [name: string]: Policy };

export interface ConfigJson {
  policies: { [key: string]: PolicyJson };
}

export class Config {
  constructor(
    public policyMap: PolicyMap,
    public filePath: string
  ) { }

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

  getPolicy(name: string): Policy {
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
      'styles': {
        '!!null': 'canonical' // dump null as ~
      },
      'sortKeys': true        // sort object keys
    });
  }

  async write() {
    return new Promise<void>((resolve, reject) => {
      writeFile(this.filePath, this.toYaml(), { encoding: "utf8" }, err => {
        if (err) return reject(err);
        return resolve();
      })
    });
  }

  async savePolicy(policy: Policy) {
    this.setPolicy(policy);
    await this.write();
  }

  static async read(filePath: string): Promise<Config> {
    return new Promise((resolve, reject) => {
      readFile(filePath, { encoding: "utf8" }, (err, fileContents) => {
        if (err) {
          return resolve(new Config({}, filePath));
        }
        try {
          return resolve(Config.fromYaml(fileContents, filePath));
        } catch (e) {
          return reject(e);
        }
      });
    });
  }

  static async init(filePath: string) {
    if (await fileExists(filePath)) {
      console.error(`A ${filePath} already exists. Skipping initialization.`);
      process.exit(1);
    }

    const config = exampleConfig(filePath)
    return config.write();
  }
}
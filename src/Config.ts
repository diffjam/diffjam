import { dump, load } from "js-yaml";
import { Policy, PolicyJson } from "./Policy";

type PolicyMap = {[name: string]: Policy};

export interface ConfigJson {
    policies: {[key: string]: PolicyJson};
}

export class Config {
    constructor (public policyMap: PolicyMap) {

    }

    static fromYaml(yaml: string) {
        const obj = load(yaml) as any;
        const policyMap: PolicyMap = {};
        if (!obj.hasOwnProperty("policies")) {
            return new Config(policyMap);
        }
        for (const key of Object.keys(obj.policies)){
            policyMap[key] = Policy.fromJson(obj.policies[key]);
        }
        return new Config(policyMap);
    }

    getPolicy(name: string): Policy {
        return this.policyMap[name];
    }

    deletePolicy(name: string): void {
        delete this.policyMap[name];
    }

    setPolicy(name: string, policy: Policy): void {
        this.policyMap[name] = policy;
    }

    getPolicyNames(): string[] {
        return Object.keys(this.policyMap);
    }

    toJson (): ConfigJson {
        const retval: ConfigJson = { policies: {}};
        for (const key of Object.keys(this.policyMap)){
            retval.policies[key] = this.policyMap[key].toJson();
        }
        return retval;
    }

    toYaml (): string {
        const object = this.toJson();
        return dump(object, {
            'styles': {
              '!!null': 'canonical' // dump null as ~
            },
            'sortKeys': true        // sort object keys
          });
    }
}
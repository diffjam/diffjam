import { dump, load } from "js-yaml";
import { Policy } from "./Policy";

type PolicyMap = {[name: string]: Policy};

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

    toJson () {
        const policies: {[key: string]: unknown} = {};
        for (const key of Object.keys(this.policyMap)){
            policies[key] = this.policyMap[key].toJson();
        }
        return {
            policies,
        }        
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
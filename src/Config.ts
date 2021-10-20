import { dump, load } from "js-yaml";
import { Policy } from "./Policy";



export class Config {
    constructor (public policyMap: {[name: string]: Policy}) {

    }

    static fromYaml(yaml: string) {
        const obj = load(yaml) as any;
        const policyMap: {[name: string]: Policy} = {};
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
        return {
            policies: this.policyMap,
        }        
    }

    toYaml (): string {
        const object = {
            policies: this.policyMap
        };
        return dump(object, {
            'styles': {
              '!!null': 'canonical' // dump null as ~
            },
            'sortKeys': true        // sort object keys
          });
    }
}
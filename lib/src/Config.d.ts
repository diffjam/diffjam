import { Policy, PolicyJson } from "./Policy";
declare type PolicyMap = {
    [name: string]: Policy;
};
export interface ConfigJson {
    policies: {
        [key: string]: PolicyJson;
    };
}
export declare class Config {
    policyMap: PolicyMap;
    constructor(policyMap: PolicyMap);
    static fromYaml(yaml: string): Config;
    getPolicy(name: string): Policy;
    deletePolicy(name: string): void;
    setPolicy(name: string, policy: Policy): void;
    getPolicyNames(): string[];
    toJson(): ConfigJson;
    toYaml(): string;
}
export {};

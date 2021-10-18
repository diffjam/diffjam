
import { exists as fileExists } from "mz/fs";
// @ts-ignore
import Conf from "conf";
import { basename, extname } from "path";
let config: any;

export interface Policy {
  baseline: number;
  minimize: boolean;
  command: string;
  description: string;
  mode?: {
    guard?: boolean;
  }
}


export function exists() {
    return Boolean(config);
}
export function ensureConfig() {
    if (!config) {
        config = new Conf({
            configName: "diffjam",
            cwd: ".",
            serialize: (value: any) => JSON.stringify(value, null, 2)
        });
        config.set("policies", {});
        config.set("tags", []);
    }
}
export async function getConfig(file = "./diffjam.json") {
    const configName = basename(file)
        .slice(0, -1 * extname(file).length);
    const exists = await fileExists(file);
    if (exists) {
        config = new Conf({
            configName,
            cwd: "."
        });
    }
}
export function savePolicy(name: string, policy: Policy) {
    config.set(`policies.${name}`, policy);
}
export function getPolicyGuardMode(name: string) {
    const key = `policies.${name}.mode.guard`;
    return config.get(key) || false;
}
export function setPolicyGuardMode(name: string, value: boolean) {
    const key = `policies.${name}.mode.guard`;
    return config.set(key, value);
}
export function getPolicyNames() {
    const policies = config.get("policies");
    return Object.keys(policies);
}
export function getTags() { return config.get("tags") || []; }
export function setTags(tags: string[]) { return config.set("tags", tags); }
export function getPolicies() { return config.get("policies"); }
export function getPolicy(name: string) { return config.get(`policies.${name}`); }
export function deletePolicy(name: string) { return config.delete(`policies.${name}`); }
export function setPolicyBaseline(name: string, count: number) {
    config.set(`policies.${name}.baseline`, count);
}
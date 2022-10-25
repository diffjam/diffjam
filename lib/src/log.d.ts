import { Policy } from "./Policy";
import { SuccessOrBreach } from "./getResults";
export declare const GREEN_CHECK: string;
export declare const logCheckFailedError: () => void;
export declare const logPolicyResult: (name: string, policy: Policy, result: number, duration: number) => void;
export declare const logResults: () => Promise<{
    results: import("./getResults").ResultMap;
    successes: SuccessOrBreach[];
    breaches: SuccessOrBreach[];
}>;

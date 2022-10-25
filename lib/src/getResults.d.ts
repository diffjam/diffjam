import { Match } from "./match";
import { Policy } from "./Policy";
export interface SuccessOrBreach {
    name: string;
    policy: Policy;
    result: number;
    duration: number;
    examples: Match[];
}
interface ThingWithTick {
    tick: () => void;
}
export declare const getPolicyResults: (name: string, policy: Policy) => Promise<{
    breaches: SuccessOrBreach[];
    successes: SuccessOrBreach[];
    results: {
        duration: number;
        measurement: number;
    };
}>;
export declare type ResultMap = {
    [key: string]: {
        duration: number;
        measurement: number;
    };
};
export declare const getResults: (ticker: ThingWithTick) => Promise<{
    results: ResultMap;
    successes: SuccessOrBreach[];
    breaches: SuccessOrBreach[];
}>;
export {};

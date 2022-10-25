import { Needle } from "./Policy";
export interface Match {
    number: number;
    line: string;
    match: string;
    path: string;
}
declare type MatchDict = {
    [key: string]: Match[];
};
export declare const findMatches: (filePattern: string, ignorePatterns: string[], search: Needle[], dir?: string) => Promise<MatchDict>;
export declare const countMatches: (matches: MatchDict) => number;
export {};

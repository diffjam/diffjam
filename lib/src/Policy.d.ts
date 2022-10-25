import { ReverseRegExp } from "./ReverseRegExp";
export declare type StringOrRegexp = string | RegExp;
export declare type Needle = RegExp | ReverseRegExp | string;
export interface PolicyJson {
    description: string;
    filePattern: string;
    ignoreFilePatterns?: string[];
    search: string[];
    baseline: number;
    hiddenFromOutput?: boolean;
}
export declare const testNeedle: (needle: Needle, haystack: string) => boolean;
export declare const findFirstNeedle: (needle: Needle, haystack: string) => string | never;
export declare class Policy {
    description: string;
    filePattern: string;
    search: string[];
    baseline: number;
    hiddenFromOutput: boolean;
    needles: Needle[];
    ignoreFilePatterns: undefined | string[];
    constructor(description: string, filePattern: string, search: string[], baseline: number, ignoreFilePatterns?: string | string[], hiddenFromOutput?: boolean);
    toJson(): PolicyJson;
    isCountAcceptable(count: number): boolean;
    isCountCinchable(count: number): boolean;
    evaluateFileContents(path: string, contents: string): import("./match").Match[];
    findMatches(): Promise<{
        [key: string]: import("./match").Match[];
    }>;
    static searchConfigToNeedles(search: string[]): Needle[];
    static fromJson(obj: any): Policy;
}

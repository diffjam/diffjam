import cluster from "cluster";
import { isBoolean, isNumber, isString, partition } from "lodash";
import mm from 'micromatch';
import { FileMatcher } from "./FileMatcher";
import { hasProp } from "./hasProp";
import { Match } from "./match";

const regexPrefix = "regex:";
const inversePrefix = "-:";

export type Needles = {
  regex: RegExp;
  otherRegexes: RegExp[];
  positive: string[];
  negative: string[];
}
export interface PolicyJson {
  description: string;
  filePattern: string;
  ignoreFilePatterns?: string[];
  search: string | string[];
  baseline: number;
  hiddenFromOutput?: boolean;
  baselineStrictEqual?: boolean;
}

const escapeStringRegexp = (str: string) =>
  str
    .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
    .replace(/-/g, "\\x2d");


export class Policy {
  public ran: boolean = false;
  public needles: Needles
  public ignoreFilePatterns: undefined | string[];

  constructor(
    public name: string,
    public description: string,
    public filePattern: string,
    public search: string[],
    public baseline: number,
    ignoreFilePatterns?: string | string[],
    public hiddenFromOutput: boolean = false,
    public baselineStrictEqual: boolean = false,
  ) {
    try {
      this.needles = Policy.searchConfigToNeedles(this.search);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Error in policy (${name}): ${err.message}`);
      } else {
        throw new Error(`Error in policy (${name})`);
      }
    }

    this.description = description;
    this.filePattern = filePattern;
    this.search = Array.isArray(search) ? search : [search];
    this.baseline = baseline;
    this.hiddenFromOutput = hiddenFromOutput;
    if (ignoreFilePatterns && ignoreFilePatterns.length) {
      if (!Array.isArray(ignoreFilePatterns)) {
        this.ignoreFilePatterns = [ignoreFilePatterns];
      } else {
        this.ignoreFilePatterns = ignoreFilePatterns;
      }
    }
    this.baselineStrictEqual = baselineStrictEqual;
  }

  toJson(): PolicyJson {
    const json: PolicyJson = {
      description: this.description,
      filePattern: this.filePattern,
      search: this.search.length === 1 ? this.search[0] : this.search,
      baseline: this.baseline,
    };
    if (this.hiddenFromOutput) json.hiddenFromOutput = this.hiddenFromOutput;
    if (this.ignoreFilePatterns) json.ignoreFilePatterns = this.ignoreFilePatterns;
    if (this.baselineStrictEqual) json.baselineStrictEqual = this.baselineStrictEqual;
    return json
  }

  isFileUnderPolicy(filePath: string): boolean {
    return mm.any(filePath, this.filePattern) && (
      !this.ignoreFilePatterns ||
      !mm.any(filePath, this.ignoreFilePatterns)
    );
  }

  processFile(file: FileMatcher, onMatch: (match: Match, policy: this) => void): void {
    if (!this.isFileUnderPolicy(file.path)) return;
    return file.findMatches(this.needles, match => onMatch(match, this));
  }

  isCountAcceptable(matches: Match[]): boolean {
    if (this.baselineStrictEqual) return matches.length === this.baseline
    return matches.length <= this.baseline;
  }

  isCountCinchable(matches: Match[]): boolean {
    return matches.length < this.baseline;
  }

  // Converts array of `search` strings to a `Needles` object. This will include a regex to search for
  // but also includes other search terms that may be used that will determine if we either include or exclude
  // a match.
  static searchConfigToNeedles(search: string[]): Needles {
    const [inverseTerms, positiveTerms] = partition(search, term => term.startsWith(inversePrefix));
    const [regexTerms, simplePositiveTerms] = partition(positiveTerms, term => term.startsWith(regexPrefix));

    if (regexTerms.length) {
      if (inverseTerms.length) {
        throw new Error(`regex search terms (${regexTerms[0]}) cannot be combined with inverse search terms (${inverseTerms[0]})`);
      }
    } else if (!simplePositiveTerms.length) {
      throw new Error(`no positive search terms found`);
    }

    const [firstRegexTerm, ...otherRegexTerms] = regexTerms.map(term => term.slice(regexPrefix.length));

    const positive = simplePositiveTerms.map(escapeStringRegexp);

    return {
      regex: new RegExp(firstRegexTerm || positive.shift()!, "gm"),
      negative: inverseTerms.map(term => term.slice(inversePrefix.length)),
      positive,
      otherRegexes: otherRegexTerms.map(term => new RegExp(term)),
    };
  }

  static fromJson(name: string, obj: any): Policy {
    try {
      if (!obj) {
        throw new Error("input was empty");
      }

      if (!hasProp(obj, "baseline")) {
        throw new Error("baseline is required");
      }
      if (!isNumber(obj.baseline)) {
        throw new Error("baseline must be a number");
      }
      if (!hasProp(obj, "search")) {
        throw new Error("search is required");
      }
      if (!(isString(obj.search) || (Array.isArray(obj.search) && obj.search.every(isString)))) {
        throw new Error("search must be a string or an array of strings");
      }

      if (!Array.isArray(obj.search)) {
        obj.search = [obj.search];
      }

      if (!hasProp(obj, "filePattern")) {
        throw new Error("filePattern is required");
      }
      if (!isString(obj.filePattern)) {
        throw new Error("filePattern must be a string");
      }

      if (!hasProp(obj, "description")) {
        throw new Error("description is required");
      }
      if (!isString(obj.description)) {
        throw new Error("description must be a string");
      }

      if (hasProp(obj, "hiddenFromOutput") && !isBoolean(obj.hiddenFromOutput)) {
        throw new Error("hiddenFromOutput must be a boolean");
      }

      return new Policy(name, obj.description, obj.filePattern, obj.search, obj.baseline, obj.ignoreFilePatterns, Boolean(obj.hiddenFromOutput), Boolean(obj.baselineStrictEqual));
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Error in policy (${name}): ${err.message}`);
      } else {
        throw new Error(`Error in policy (${name})`);
      }
    }
  }
}
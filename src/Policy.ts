import { isBoolean, isNumber, isString } from "lodash";
import mm from 'micromatch';
import { findInString } from "./findInString";
import { hasProp } from "./hasProp";
import { Match } from "./match";
import { ReverseRegExp } from "./ReverseRegExp";

export type StringOrRegexp = string | RegExp;
export type Needle = RegExp | ReverseRegExp | string;
const regexPrefix = "regex:";
const inversePrefix = "-:";

export interface PolicyJson {
  description: string;
  filePattern: string;
  ignoreFilePatterns?: string[];
  search: string[];
  baseline: number;
  hiddenFromOutput?: boolean;
}

// eslint-disable-next-line arrow-body-style
const escapeStringRegexp = (str: string) => {
  return str
    .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
    .replace(/-/g, "\\x2d");
};

export const testNeedle = (needle: Needle, haystack: string): boolean => {
  if (isString(needle)) {
    return haystack.includes(needle);
  }
  return needle.test(haystack);
}

export const findFirstNeedle = (needle: Needle, haystack: string): string | never => {
  if (isString(needle) && haystack.indexOf(needle) !== -1) {
    return needle;
  }
  const matches = ((needle as RegExp).exec(haystack)) || [];
  return matches[0];
}


export class Policy {
  public ran: boolean = false;
  public needles: Needle[] = [];
  public ignoreFilePatterns: undefined | string[];
  public filesToCheck: Set<string>;
  public matches: Match[];
  // public matchCount: number;

  constructor(
    public name: string,
    public description: string,
    public filePattern: string,
    public search: string[],
    public baseline: number,
    ignoreFilePatterns?: string | string[],
    public hiddenFromOutput: boolean = false,
  ) {
    this.needles = Policy.searchConfigToNeedles(this.search);
    this.description = description;
    this.filePattern = filePattern;
    this.search = search;
    this.baseline = baseline;
    this.hiddenFromOutput = hiddenFromOutput;
    if (ignoreFilePatterns && ignoreFilePatterns.length) {
      if (!Array.isArray(ignoreFilePatterns)) {
        this.ignoreFilePatterns = [ignoreFilePatterns];
      } else {
        this.ignoreFilePatterns = ignoreFilePatterns;
      }
    }
    this.filesToCheck = new Set<string>();
    this.matches = [];
  }

  toJson(): PolicyJson {
    const json: PolicyJson = {
      description: this.description,
      filePattern: this.filePattern,
      search: this.search,
      baseline: this.baseline,
    };
    if (this.hiddenFromOutput) json.hiddenFromOutput = this.hiddenFromOutput;
    if (this.ignoreFilePatterns) json.ignoreFilePatterns = this.ignoreFilePatterns;
    return json
  }

  isFileUnderPolicy(filePath: string): boolean {
    return mm.any(filePath, this.filePattern) && (
      !this.ignoreFilePatterns ||
      !mm.any(filePath, this.ignoreFilePatterns)
    );
  }

  addFileToCheckIfUnderPolicy(filePath: string) {
    const underPolicy = this.isFileUnderPolicy(filePath);
    if (underPolicy) this.filesToCheck.add(filePath);
    return underPolicy;
  }

  processFile(filePath: string, fileContents: string) {
    const matches = findInString(filePath, this.needles, fileContents);
    this.filesToCheck.delete(filePath);
    this.matches.push(...matches);
    if (this.filesToCheck.size === 0) {
      this.ran = true;
    }
  }

  isCountAcceptable() {
    return this.matches.length <= this.baseline;
  }

  isCountCinchable() {
    return this.matches.length < this.baseline;
  }

  static searchConfigToNeedles(search: string[]): Needle[] {
    // optimization? inverse strings don't need to be regexes
    const needles = search.map((i: string) => {
      if (!i.startsWith(regexPrefix) && !i.startsWith(inversePrefix)) {
        // return i;
        return new RegExp(escapeStringRegexp(i));
      }
      if (i.startsWith(inversePrefix)) {
        const startIndex = inversePrefix.length;
        const inverseString = i.slice(startIndex);
        return new ReverseRegExp(escapeStringRegexp(inverseString));
      }
      const startIndex = regexPrefix.length;
      const regexString = i.slice(startIndex);
      return new RegExp(regexString);
    });
    return needles;
  }

  static fromJson(name: string, obj: any): Policy {
    if (!obj) {
      throw new Error("input was empty");
    }

    if (!hasProp(obj, "baseline") || !isNumber(obj.baseline)) {
      throw new Error("missing baseline");
    }

    if (!hasProp(obj, "search") || !isString(obj.search)) {
      if (Array.isArray(obj.search) && !obj.search.every(isString)) {
        console.error("obj: ", obj);
        throw new Error("missing search");
      }
    }

    if (!Array.isArray(obj.search)) {
      obj.search = [obj.search];
    }

    if (!hasProp(obj, "filePattern") || !isString(obj.filePattern)) {
      throw new Error("missing filePattern");
    }

    if (!hasProp(obj, "description") || !isString(obj.description)) {
      throw new Error("missing description");
    }

    if (hasProp(obj, "hiddenFromOutput") && !isBoolean(obj.hiddenFromOutput)) {
      console.error("obj: ", obj);
      throw new Error("missing hiddenFromOutput");
    }
    return new Policy(name, obj.description, obj.filePattern, obj.search, obj.baseline, obj.ignoreFilePatterns, Boolean(obj.hiddenFromOutput));
  }
}
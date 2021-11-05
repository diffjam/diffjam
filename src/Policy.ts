import { isBoolean, isNumber, isString } from "lodash";
import { findInString } from "./findInString";

// eslint-disable-next-line arrow-body-style
const escapeStringRegexp = (str: string) => {
  return str
    .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
    .replace(/-/g, "\\x2d");
};

import { hasProp } from "./hasProp";
import { ReverseRegExp } from "./ReverseRegExp";

export type StringOrRegexp = string | RegExp;
export type NeedleArray = Array<RegExp | ReverseRegExp>;
const regexPrefix = "regex:";
const inversePrefix = "-:";

export interface PolicyJson {
    description: string;
    filePattern: string;
    search: string[];
    baseline: number;
    hiddenFromOutput: boolean;
}

export class Policy {
  public needles: NeedleArray = [];

  constructor(
    public description: string,
    public filePattern: string,
    public search: string[],
    public baseline: number,
    public hiddenFromOutput: boolean = false,
  ) {
    this.needles = Policy.searchConfigToRegexes(this.search);
    this.description = description;
    this.filePattern = filePattern;
    this.search = search;
    this.baseline = baseline;
    this.hiddenFromOutput = hiddenFromOutput;
  }

  toJson(): PolicyJson {
    return {
      description: this.description,
      filePattern: this.filePattern,
      search: this.search,
      baseline: this.baseline,
      hiddenFromOutput: this.hiddenFromOutput,
    }

  }

  isCountAcceptable(count: number) {
    return count <= this.baseline;
  }

  isCountCinchable(count: number) {
    return count < this.baseline;
  }

  evaluateFileContents(path: string, contents: string) {
    return findInString(path, this.needles, contents);
  }

  static searchConfigToRegexes(search: string[]): NeedleArray {
    const needles = search.map((i: string) => {
      if (!i.startsWith(regexPrefix) && !i.startsWith(inversePrefix)){
        return new RegExp(escapeStringRegexp(i));
      }
      if (i.startsWith(inversePrefix)){
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

  static fromJson(obj: any): Policy {
    if (!obj) {
      throw new Error("input was empty");
    }

    if (!hasProp(obj, "baseline") || !isNumber(obj.baseline)) {
      throw new Error("missing baseline");
    }

    if (!hasProp(obj, "search") || !isString(obj.search)) {
      if (Array.isArray(obj.search) && !obj.search.every(isString)){
        console.error("obj: ", obj);
        throw new Error("missing search");
      }
    }

    if (!Array.isArray(obj.search)){
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
    return new Policy(obj.description, obj.filePattern, obj.search, obj.baseline, Boolean(obj.hiddenFromOutput));
  }
}
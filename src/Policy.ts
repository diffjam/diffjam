import { isBoolean, isNumber, isString } from "lodash";
import { findInString } from "./findInString";

const escapeStringRegexp = (string: string) => {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }

  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
};

import { hasProp } from "./hasProp";

export type StringOrRegexp = string | RegExp;
const regexPrefix = "regex:";

export interface PolicyJson {
    description: string;
    filePattern: string;
    search: string[];
    baseline: number;
    hiddenFromOutput: boolean;
}

export class Policy {
  public needles: RegExp[] = [];

  constructor(
    public description: string,
    public filePattern: string,
    public search: string[],
    public baseline: number,
    public hiddenFromOutput: boolean = false,
  ) {
    this.needles = this.search.map((i: string) => {
      if (!i.startsWith(regexPrefix)){
        return new RegExp(escapeStringRegexp(i));
      }
      const startIndex = regexPrefix.length;
      const regexString = i.slice(startIndex);
      return new RegExp(regexString);
    })
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

  static fromJson(obj: any) {
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
import { isBoolean, isNumber, isString } from "lodash";
import { findInString } from "./findInString";


// @ts-ignore
import toRegex from "to-regex";

export type StringOrRegexp = string | RegExp;
const regexPrefix = "regex:";

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
        return toRegex(i, {contains: true});
      }
      const startIndex = regexPrefix.length;
      const regexString = i.slice(startIndex);
      return new RegExp(regexString);
    })
  }

  toJson() {
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

    if (!obj.hasOwnProperty("baseline") || !isNumber(obj.baseline)) {
      throw new Error("missing baseline");
    }

    if (!obj.hasOwnProperty("search") || !isString(obj.search)) {
      if (Array.isArray(obj.search) && !obj.search.every(isString)){
        console.error("obj: ", obj);
        throw new Error("missing search");
      }
    }

    if (!Array.isArray(obj.search)){
      obj.search = [obj.search];
    }

    if (!obj.hasOwnProperty("filePattern") || !isString(obj.filePattern)) {
      throw new Error("missing filePattern");
    }

    if (!obj.hasOwnProperty("description") || !isString(obj.description)) {
      throw new Error("missing description");
    }

    if (obj.hasOwnProperty("hiddenFromOutput") && !isBoolean(obj.hiddenFromOutput)) {
      console.error("obj: ", obj);
      throw new Error("missing hiddenFromOutput");
    }
    
    return new Policy(obj.description, obj.filePattern, obj.search, obj.baseline, Boolean(obj.hiddenFromOutput));
  }
}
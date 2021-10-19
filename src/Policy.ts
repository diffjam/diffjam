import { isBoolean, isNumber, isString } from "lodash";
import { findInString } from "./findInString";


export class Policy {

  constructor(
    public description: string,
    public filePattern: string,
    public search: string,
    public baseline: number,
    public hiddenFromOutput: boolean = false
  ) {
  }

  isCountAcceptable(count: number) {
    return count <= this.baseline;
  }

  isCountCinchable(count: number) {
    return count < this.baseline;
  }

  evaluateFileContents(contents: string) {
    return findInString(this.search, contents);
  }

  static fromJson(obj: any) {
    if (!obj) {
      throw new Error("input was empty");
    }

    if (!obj.hasOwnProperty("baseline") || !isNumber(obj.baseline)) {
      throw new Error("missing baseline");
    }

    if (!obj.hasOwnProperty("search") || !isString(obj.search)) {
      throw new Error("missing search");
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
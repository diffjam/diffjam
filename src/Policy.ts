import { isBoolean, isNumber, isString } from "lodash";


export class Policy {

  constructor(
    public description: string,
    public command: string,
    public baseline: number,
    public hiddenFromOutput: boolean = false
  ) {
  }

  isCountAcceptable(count: number) {
    return count >= this.baseline;
  }


  isCountCinchable(count: number) {
    return count > this.baseline;
  }


  static fromJson(obj: any) {
    if (!obj) {
      throw new Error("input was empty");
    }

    if (!obj.hasOwnProperty("baseline") || !isNumber(obj.baseline)) {
      throw new Error("missing baseline");
    }

    if (!obj.hasOwnProperty("command") || !isString(obj.command)) {
      throw new Error("missing command");
    }

    if (!obj.hasOwnProperty("description") || !isString(obj.description)) {
      throw new Error("missing description");
    }

    if (obj.hasOwnProperty("hiddenFromOutput") && !isBoolean(obj.hiddenFromOutput)) {
      console.error("obj: ", obj);
      throw new Error("missing hiddenFromOutput");
    }

    return new Policy(obj.description, obj.command, obj.baseline, Boolean(obj.hiddenFromOutput));
  }
}
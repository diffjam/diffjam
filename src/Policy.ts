import { isBoolean, isNumber, isString, partition } from "lodash";
import mm from 'micromatch';
import { File } from "./File";
import { hasProp } from "./hasProp";
import { Match, ResultsMap } from "./match";

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
}

const escapeStringRegexp = (str: string) =>
  str
    .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
    .replace(/-/g, "\\x2d");


export const findFirstNeedle = (needle: RegExp, haystack: string): string | never => {
  if (isString(needle) && haystack.indexOf(needle) !== -1) {
    return needle;
  }
  const matches = ((needle as RegExp).exec(haystack)) || [];
  return matches[0];
}


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
  ) {
    this.needles = Policy.searchConfigToNeedles(this.search);
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
    return json
  }

  isFileUnderPolicy(filePath: string): boolean {
    return mm.any(filePath, this.filePattern) && (
      !this.ignoreFilePatterns ||
      !mm.any(filePath, this.ignoreFilePatterns)
    );
  }

  processFile(file: File, onMatch: (match: Match, policy: this) => void): void {
    if (!this.isFileUnderPolicy(file.path)) return;
    return file.findMatches(this.needles, match => onMatch(match, this));
  }

  isCountAcceptable(matches: Match[]): boolean {
    return matches.length <= this.baseline;
  }

  isCountCinchable(matches: Match[]): boolean {
    return matches.length < this.baseline;
  }

  // The array of search strings should include at least one positive term to search for
  // and may include negative terms to exclude from the search.
  static searchConfigToNeedles(search: string[]): Needles {
    const [inverseTerms, positiveTerms] = partition(search, term => term.startsWith(inversePrefix));
    const [regexTerms, simplePositiveTerms] = partition(positiveTerms, term => term.startsWith(regexPrefix));

    if (regexTerms.length) {
      if (inverseTerms.length) {
        console.error(`regex search terms (${regexTerms[0]}) cannot be combined with inverse search terms (${inverseTerms[0]})`);
        process.exit(1);
      }
    } else if (!simplePositiveTerms.length) {
      console.error(`no positive search terms found`);
      process.exit(1);
    }

    const [firstRegexTerm, ...otherRegexTerms] = regexTerms.map(term => term.slice(regexPrefix.length))

    const positive = simplePositiveTerms.map(escapeStringRegexp)

    return {
      regex: new RegExp(firstRegexTerm || positive.shift()!, "gm"),
      negative: inverseTerms.map(term => term.slice(inversePrefix.length)),
      positive,
      otherRegexes: otherRegexTerms.map(term => new RegExp(term)),
    }
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
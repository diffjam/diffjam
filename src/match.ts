import { flatten } from "lodash";
import { fs } from "mz";
import { findInString } from "./findInString";
import { getPathsMatchingPattern } from "./getPathsMatchingPattern";

export interface Match {
    number: number;
    line: string;
    match: string;
    path: string;
}
type MatchDict = { [key: string]: Match[] };

export const findMatches = async (filePattern: string, search: RegExp[]) => {
  const filePaths = await getPathsMatchingPattern(filePattern);
  const results: MatchDict = {};
  for (const path of filePaths) {
    // TODO do these in parallel
    const contents = fs.readFileSync(path, { encoding: "utf8", flag: "r" });
    results[path] = findInString(path, search, contents);
  }
  return results;
};

export const countMatches = (matches: MatchDict) => {
  const count = flatten(Object.values(matches)).length;
  return count;
}

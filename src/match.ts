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

export const findMatches = async (filePattern: string, search: RegExp[], dir: string = process.cwd()) => {
  // const dir = process.cwd();
  const filePaths = await getPathsMatchingPattern(dir, filePattern);
  const results: MatchDict = {};
  for (const path of filePaths) {
    // TODO do these in parallel
    const contents = fs.readFileSync(path, { encoding: "utf8", flag: "r" });
    const found = findInString(path, search, contents);
    if (found.length > 0){
      results[path] = found;
    }
  }
  return results;
};

export const countMatches = (matches: MatchDict) => {
  const count = flatten(Object.values(matches)).length;
  return count;
}

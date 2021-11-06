import { flatten } from "lodash";
import { findInString } from "./findInString";
import { getPathsMatchingPattern } from "./getPathsMatchingPattern";
import { Needle} from "./Policy";
import { readFile } from "./readFile";

const cwd = process.cwd()

export interface Match {
    number: number;
    line: string;
    match: string;
    path: string;
}
type MatchDict = { [key: string]: Match[] };

export const findMatches = async (filePattern: string, search: Needle[], dir: string = cwd) => {
  // const dir = process.cwd();
  const filePaths = await getPathsMatchingPattern(dir, filePattern);
  const results: MatchDict = {};
  // File contents are cached for subsequent calls
  // so we just use a plain for loop here instead of
  // doing things in parallel so we can make use of
  // the cache.
  for (const path of filePaths) {
    const contents = await readFile(path);
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

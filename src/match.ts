import { flatten } from "lodash";
import { findInString } from "./findInString";
import { getPathsMatchingPattern } from "./getPathsMatchingPattern";
import { Needle } from "./Policy";
import { readFile } from "./readFile";

export interface Match {
  number: number;
  line: string;
  match: string;
  path: string;
}
export type MatchDict = { [key: string]: Match[] };

export const findMatches = async (cwd: string, filePattern: string, ignorePatterns: string[], search: Needle[]) => {

  const filePaths = await getPathsMatchingPattern(cwd, filePattern, ignorePatterns);
  const results: MatchDict = {};
  // File contents are cached for subsequent calls
  // so we just use a plain for loop here instead of
  // doing things in parallel so we can make use of
  // the cache.
  for (const path of filePaths) {
    const contents = await readFile(path);
    const found = findInString(cwd, path, search, contents);
    if (found.length > 0) {
      results[path] = found;
    }
  }
  return results;
};

export const countMatches = (matches: MatchDict) => {
  const count = flatten(Object.values(matches)).length;
  return count;
}

import { compact, isString } from "lodash";
import {Match} from "./match";


export const findInString = (path: string, needles: RegExp[], haystack: string): Match[] => {
  const matchArray: Match[] = [];
  
  const lines = haystack.split(/\r?\n/);
  const needle = needles[0];
  compact(lines.map(function (line, i) {
    if (needle.test(line)) {
      const matches = line.match(needle) || [];
      const match = matches[0];
      const retval: Match = {
        line: line,
        number: i + 1,
        match,
        path,
      };
      matchArray.push(retval);
    }
  }));
  return findInMatches(needles, matchArray);
};

// filter out lines without a match on the entire sequence of regexps
const findInMatches = (needles: RegExp[], matches: Match[]): Match[] => {
  return matches.filter((match) => {
    return findInMatch(needles, match);
  })
}

// see if our sequence of regexes all match the line
const findInMatch = (needles: RegExp[], match: Match): boolean => {
  for (const needle of needles) {
    if (!needle.test(match.line)) {
      return false;
    }
  }
  return true;
}
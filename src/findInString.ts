import { hasProp } from "./hasProp";
import {Match} from "./match";
import { NeedleArray } from "./Policy";

// filter out lines without a match on the entire sequence of regexps
const findInMatches = (needles: NeedleArray, matches: Match[]): Match[] => {
  const retval = matches.filter((match) => {
    return findInMatch(needles, match);
  })
  return retval;
}

export const findInString = (path: string, needles: NeedleArray, haystack: string): Match[] => {
  const matchArray: Match[] = [];
  const lines = haystack.split(/\r?\n/);
  const needle = needles[0];
  lines.forEach((line, i) => {
    if (needle.test(line)) {
      if (hasProp(needle, "reversed")) {
        const retval: Match = {
          line: line,
          number: i + 1,
          match: line,
          path,
        };
        matchArray.push(retval);
      } else {
        const matches = line.match(needle as RegExp) || [];
        const match = matches[0];
        const retval: Match = {
          line: line,
          number: i + 1,
          match,
          path,
        };
        matchArray.push(retval);
      }
    }
  });
  return findInMatches(needles, matchArray);
};


// see if our sequence of regexes all match the line
const findInMatch = (needles: NeedleArray, match: Match): boolean => {
  for (const needle of needles) {
    if (!needle.test(match.line)) {
      return false;
    }
  }
  return true;
}
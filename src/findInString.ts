import { isString } from "lodash";
import { hasProp } from "./hasProp";
import { Match } from "./match";
import { Needle, testNeedle } from "./Policy";

const cwd = process.cwd();

// see if our sequence of regexes all match the line
const findInMatch = (needles: Needle[], match: Match): boolean => {
  for (const needle of needles) {
    if (!testNeedle(needle, match.line)) {
      return false;
    }
  }
  return true;
}

// filter out lines without a match on the entire sequence of regexps
const findInMatches = (needles: Needle[], matches: Match[]): Match[] => {
  const retval = matches.filter((match) => findInMatch(needles, match))
  return retval;
}

const newLineRegExp = "\n";

export const findInString = (path: string, needles: Needle[], haystack: string): Match[] => {
  const matchArray: Match[] = [];
  const lines = haystack.split(newLineRegExp);
  const needle = needles[0];
  lines.forEach((line, i) => {
    const number = i + 1;
    if (testNeedle(needle, line)) {
      if (isString(needle)) {
        const retval: Match = {
          line: line,
          number,
          match: needle,
          path: path.replace(cwd, ""),
        };
        matchArray.push(retval);
        return;
      }

      if (hasProp(needle, "reversed")) {
        const retval: Match = {
          line: line,
          number,
          match: line,
          path,
        };
        matchArray.push(retval);
        return;
      }

      // regexp
      const matches = needle.exec(line) || [];
      const match = matches[0];
      const retval: Match = {
        line: line,
        number,
        match,
        path,
      };
      matchArray.push(retval);
    }
  });
  if (needles.length === 1 || matchArray.length === 0) {
    return matchArray;
  }
  return findInMatches(needles.slice(1), matchArray);
};


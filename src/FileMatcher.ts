/*
  Finds matches for a given set of `needles` to search for, calling `onMatch`
  for each match found.

  The `needles` has a primary regex with the global and multiline flags, so
  we cycle through each of its matches using `.exec`. Any other regexes in 
  the `needles` are used to further filter whether the first line matched in 
  meets other terms.

  If this is indeed a match, we compute the line number and column number as 
  well as format the match for display.
*/
import chalk from "chalk";
import { findLastIndex, last } from "lodash";
import { Match } from "./match";
import { Needles } from "./Policy";

const newLineRegExp = new RegExp("\n", "gm");

export class FileMatcher {
  private newLineIndexes: number[] = [];

  constructor(public path: string, public contents: string) {
    let newLineRegExpMatch: RegExpExecArray | null;
    while ((newLineRegExpMatch = newLineRegExp.exec(contents))) {
      this.newLineIndexes.push(newLineRegExpMatch.index);
    }
  }

  findMatches(needles: Needles, onMatch: (match: Match) => void) {
    let regexMatch: RegExpExecArray | null;
    while (regexMatch = needles.regex.exec(this.contents)) {
      const found = regexMatch[0];
      const foundStartIndex = regexMatch.index;
      const foundLength = found.length;
      const foundEndIndex = foundStartIndex + foundLength;

      const startLineNumber = this.newLineIndexes.length && (
        foundStartIndex > last(this.newLineIndexes)!
          ? this.newLineIndexes.length
          : this.newLineIndexes.findIndex((index) => index > foundStartIndex)
      )

      const startLineIndex = startLineNumber === 0 ? 0 : this.newLineIndexes[startLineNumber - 1] + 1;
      const startLineEndsIndex = this.newLineIndexes[startLineNumber];

      const foundOnStartLine = foundEndIndex > startLineEndsIndex ? this.contents.substring(foundStartIndex, startLineEndsIndex) : found;
      const beforeInSameLine = this.contents.substring(startLineIndex, foundStartIndex);
      const afterInSameLine = foundEndIndex > startLineEndsIndex ? "" : this.contents.substring(foundStartIndex + foundLength, this.newLineIndexes[startLineNumber] || this.contents.length);

      const startWholeLine = beforeInSameLine + foundOnStartLine + afterInSameLine;

      if (needles.negative.some(term => startWholeLine.includes(term))) {
        continue;
      }
      if (!needles.positive.every(term => startWholeLine.includes(term))) {
        continue;
      }
      if (!needles.otherRegexes.every(term => term.test(startWholeLine))) {
        continue;
      }

      const endLineNumber = this.newLineIndexes.length && (
        1 + findLastIndex(this.newLineIndexes, (index) => index < foundEndIndex)
      );

      const endLineIndex = endLineNumber === 0 ? 0 : this.newLineIndexes[endLineNumber - 1] + 1;

      const startColumn = foundStartIndex - startLineIndex;
      const endColumn = foundEndIndex - endLineIndex;

      const startWholeLineFormatted = beforeInSameLine + chalk.bold(foundOnStartLine) + afterInSameLine;
      const breachPath = `${this.path}(${startLineNumber + 1}:${startColumn + 1})`;

      onMatch({
        startLineNumber,
        endLineNumber,
        startColumn,
        endColumn,
        found,
        startWholeLine,
        startWholeLineFormatted,
        breachPath,
        path: this.path,
      });
    }
  }
}

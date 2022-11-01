import chalk from "chalk";
import { findLastIndex, last } from "lodash";
import { Match } from "./match";
import { Needles } from "./Policy";

const newLineRegExp = new RegExp("\n", "gm");

export class File {
  private newLineIndexes: number[];

  constructor(public path: string, public contents: string) {
    const newLineIndexes: number[] = [];
    let newLineRegExpMatch: RegExpExecArray | null;
    while ((newLineRegExpMatch = newLineRegExp.exec(contents))) {
      newLineIndexes.push(newLineRegExpMatch.index);
    }
    this.newLineIndexes = newLineIndexes;
  }

  findMatches(needles: Needles): Match[] {
    const matchArray: Match[] = [];
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

      matchArray.push({
        startLineNumber,
        endLineNumber,
        startColumn,
        endColumn,
        found,
        path: this.path,
        startWholeLine,
        startWholeLineFormatted,
        breachPath
      });
    }

    return matchArray;
  }
}

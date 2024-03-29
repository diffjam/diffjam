/*
  Manually parse .gitignore files into glob patterns in case git ls-tree fails 
  or we are running the vscode extension.
*/
import mm from 'micromatch';
import fs from "fs";
import { partition } from 'lodash';

export class GitIgnore {
  ready: Promise<void>
  patterns: undefined | {
    positive: string[]
    include: string[]
  }

  constructor(public gitIgnoreFileName: string = '.gitignore') {
    this.ready = new Promise<void>((resolve) => {
      fs.readFile(gitIgnoreFileName, { encoding: "utf8" }, (err, fileContents) => {
        if (err) return resolve(undefined); // This is not an error, just means there is no .gitignore file
        const patterns = gitIgnoreToGlob(fileContents)

        const [positive, include] = partition(patterns, pattern => pattern.startsWith("!"));
        this.patterns = { positive, include };
        resolve();
      })
    });
  }

  isIgnored(file: string): boolean {
    if (!this.patterns) return false;
    return !mm.all(file, this.patterns.positive) || mm.any(file, this.patterns.include);
  }
}

// Copied with minor modifications from https://github.com/EE/gitignore-to-glob
// which is licensed under the MIT license.
export function gitIgnoreToGlob(fileContents: string) {
  return fileContents.split('\n')

    // Filter out empty lines and comments.
    .filter((pattern) => !!pattern && pattern[0] !== '#')

    // '!' in .gitignore and glob mean opposite things so we need to swap it.
    // Return pairt [ignoreFlag, pattern], we'll concatenate it later.
    .map((pattern) =>
      pattern[0] === '!'
        ? ['', pattern.substring(1)]
        : ['!', pattern],
    )

    // Filter out hidden files/directories (i.e. starting with a dot).
    .filter((patternPair) => {
      const pattern = patternPair[1];
      return (
        pattern.indexOf('/.') === -1 && pattern.indexOf('.') !== 0
      );
    })

    // Patterns not starting with '/' are in fact "starting" with '**/'. Since that would
    // catch a lot of files, restrict it to directories we check.
    // Patterns starting with '/' are relative to the project directory and glob would
    // treat them as relative to the OS root directory so strip the slash then.
    .map((patternPair) => {
      const pattern = patternPair[1];
      if (pattern[0] !== '/') {
        return [
          patternPair[0],
          `**/${pattern}`,
        ];
      }
      return [patternPair[0], pattern.substring(1)];
    })

    // We don't know whether a pattern points to a directory or a file and we need files.
    // Therefore, include both `pattern` and `pattern/**` for every pattern in the array.
    .reduce((result, patternPair) => {
      const pattern = patternPair.join('');
      result.push(pattern);
      result.push(`${pattern}/**`);
      return result;
    }, []);
}

import { fdir } from "fdir";
import findup from 'findup-sync';
import ignore from 'parse-gitignore';
import mm from 'micromatch';
import fs from "fs";

export const cleanIgnorePatterns = (ignorePatterns: string[]) => {
  const retval = ignorePatterns.map((p) => {
    if (p[0] && p[0] === "/") {
      return p.slice(1, p.length);
    }
    const lastChar = p[p.length - 1];
    if (lastChar && lastChar === "/") {
      return p.slice(0, p.length - 1);
    }
    return p;
  })
  return retval;
}

export class CurrentWorkingDirectory {
  gitignorePatterns: string[]

  constructor(public cwd: string) {
    const gitignoreFile = findup('.gitignore', { cwd });
    if (gitignoreFile) {
      const fileContents = fs.readFileSync(gitignoreFile).toString();
      this.gitignorePatterns = cleanIgnorePatterns(ignore(fileContents));
    } else {
      this.gitignorePatterns = [];
    }
  }

  private filterFile(matchPatterns: string[], path: string, isDirectory: boolean): boolean {
    return !isDirectory && !mm.any(path, this.gitignorePatterns) && mm.any(path, matchPatterns);
  }

  allNonGitIgnoredFilesMatchingPatterns(patterns: string[]) {
    return new fdir()
      .withRelativePaths()
      .withErrors()
      .filter(this.filterFile.bind(this, patterns))
      .crawl(this.cwd)
      .withPromise()
  }
}

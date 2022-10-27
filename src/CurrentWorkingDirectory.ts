import { fdir } from "fdir";
import ignore from 'parse-gitignore';
import mm from 'micromatch';
import fs from "fs";
import { join } from "path";

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
  gitignorePatterns: Promise<undefined | string[]>

  constructor(public cwd: string) {
    const gitignoreFilePath = join(this.cwd, '.gitignore');
    this.gitignorePatterns = new Promise((resolve) => {
      fs.readFile(gitignoreFilePath, { encoding: "utf8" }, (err, fileContents) => {
        if (err) return resolve(undefined);
        resolve(cleanIgnorePatterns(ignore(fileContents)))
      })
    });
  }

  private filterFile(matchPatterns: string[], path: string, isDirectory: boolean): boolean {
    return !isDirectory && mm.any(path, matchPatterns);
  }

  async allNonGitIgnoredFilesMatchingPatterns(patterns: string[]) {
    const gettingDirs = new fdir()
      .withRelativePaths()
      .withErrors()
      .filter(this.filterFile.bind(this, patterns))
      .crawl(this.cwd)
      .withPromise() as Promise<string[]>

    const gitignorePatterns = await this.gitignorePatterns;
    if (!gitignorePatterns) return gettingDirs;

    const dirs = await gettingDirs;
    return dirs.filter(dir => !mm.any(dir, gitignorePatterns));
  }
}

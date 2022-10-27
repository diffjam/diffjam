import { fdir } from "fdir";
import { gitIgnoreToGlob } from "./gitIgnoreToGlob"
import mm from 'micromatch';
import fs from "fs";
import { join } from "path";

export class CurrentWorkingDirectory {
  gitignorePatterns: Promise<undefined | string[]>

  constructor(public cwd: string, gitIgnoreFileName: string = '.gitignore') {
    const gitignoreFilePath = join(this.cwd, gitIgnoreFileName);
    this.gitignorePatterns = new Promise((resolve) => {
      fs.readFile(gitignoreFilePath, { encoding: "utf8" }, (err, fileContents) => {
        if (err) return resolve(undefined);
        resolve(gitIgnoreToGlob(fileContents));
      })
    });
  }

  private filterFile(matchPatterns: string[], path: string, isDirectory: boolean): boolean {
    return !isDirectory && mm.any(path, matchPatterns);
  }

  async allNonGitIgnoredFilesMatchingPatterns(patterns: string[]): Promise<string[]> {
    const gettingFiles = new fdir()
      .withRelativePaths()
      .withErrors()
      .filter(this.filterFile.bind(this, patterns))
      .crawl(this.cwd)
      .withPromise() as Promise<string[]>

    const gitignorePatterns = await this.gitignorePatterns;
    if (!gitignorePatterns) return gettingFiles;

    const files = await gettingFiles;
    return files.filter(file => mm.all(file, gitignorePatterns));
  }
}

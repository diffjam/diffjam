import { fdir } from "fdir";
import { GitIgnore } from "./GitIgnore"
import mm from 'micromatch';
import fs from "fs";
import { join } from "path";

export class CurrentWorkingDirectory {
  gitignore: GitIgnore

  constructor(public cwd: string, gitIgnoreFileName: string = '.gitignore') {
    this.gitignore = new GitIgnore(join(this.cwd, gitIgnoreFileName));
  }

  private filterFile(matchPatterns: string[], path: string, isDirectory: boolean): boolean {
    // if (!isDirectory) console.log(path);
    return !isDirectory && mm.any(path, matchPatterns);
  }

  async allNonGitIgnoredFilesMatchingPatterns(patterns: string[]): Promise<string[]> {
    const gettingFiles = new fdir()
      .withRelativePaths()
      .withErrors()
      .filter(this.filterFile.bind(this, patterns))
      .crawl(this.cwd)
      .withPromise() as Promise<string[]>

    await this.gitignore.ready;
    if (!this.gitignore.gitignorePatterns) return gettingFiles;

    console.log('this.gitignore.gitignorePatterns', this.gitignore.gitignorePatterns)

    const files = await gettingFiles;
    return files.filter(file => !this.gitignore.isIgnored(file));
  }
}

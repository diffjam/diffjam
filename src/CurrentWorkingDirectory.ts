import { fdir } from "fdir";
import mm from 'micromatch';
import { join } from "path";
import { GitIgnore } from "./GitIgnore"

export class CurrentWorkingDirectory {
  gitignore: GitIgnore

  constructor(public cwd: string, gitIgnoreFileName: string = '.gitignore') {
    this.gitignore = new GitIgnore(join(this.cwd, gitIgnoreFileName));
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

    await this.gitignore.ready;
    if (!this.gitignore.patterns) return gettingFiles;

    const files = await gettingFiles;
    return files.filter(file => !this.gitignore.isIgnored(file));
  }
}

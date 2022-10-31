import { fdir } from "fdir";
import mm from 'micromatch';
import { join } from "path";
import { spawn } from "child_process"
import { readline } from "mz";

export class CurrentWorkingDirectory {
  // gitignore: GitIgnore

  constructor(public cwd: string, gitIgnoreFileName: string = '.gitignore') {
    // this.gitignore = new GitIgnore(join(this.cwd, gitIgnoreFileName));
  }

  private filterFile(path: string, isDirectory: boolean): boolean {
    return !isDirectory
  }

  async allNonGitIgnoredFiles(onFile: (path: string) => void, onClose: () => void): Promise<void> {
    const x = spawn("git", ["ls-tree", "-r", "master", "--name-only"]);

    const nonGitIgnoredFiles = readline.createInterface({
      input: x.stdout,
    })

    nonGitIgnoredFiles.on("line", onFile);
    nonGitIgnoredFiles.on("close", onClose)
  }
}

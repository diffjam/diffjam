import { spawn } from "child_process"
import { createInterface } from "node:readline";
import { fdir } from "fdir";
import { join } from "path";
import { GitIgnore } from "./GitIgnore"

export class CurrentWorkingDirectory {
  queue: string[] = [];
  closed = false;
  listener: undefined | {
    onFile: (path: string) => void;
    onClose: () => void;
  }

  constructor(public cwd: string, gitIgnoreFileName?: string) {
    if (gitIgnoreFileName) {
      this.manualDirCrawl(gitIgnoreFileName);
    } else {
      const gitLsTree = spawn("git", ["ls-tree", "-r", "head", "--name-only"]);

      gitLsTree.on("error", () => this.manualDirCrawl());

      const nonGitIgnoredFiles = createInterface({
        input: gitLsTree.stdout,
      });

      nonGitIgnoredFiles.on("line", this.onFile.bind(this));
      nonGitIgnoredFiles.on("close", this.onClose.bind(this));
    }
  }

  async manualDirCrawl(gitIgnoreFileName?: string) {
    // git is not installed or this isn't a git repo, falling back to fdir
    const gitignore = new GitIgnore(join(this.cwd, gitIgnoreFileName || ".gitignore"));

    const gettingFiles = new fdir()
      .withRelativePaths()
      .withErrors()
      .filter((_, isDirectory) => !isDirectory)
      .crawl(this.cwd)
      .withPromise() as Promise<string[]>

    await gitignore.ready;

    const files = await gettingFiles;
    files.forEach(file => {
      if (!gitignore.isIgnored(file) && file !== gitIgnoreFileName) {
        this.onFile(file);
      }
    });

    this.onClose();
  }

  onFile(path: string) {
    if (this.listener) {
      this.listener.onFile(path);
    } else {
      this.queue.push(path);
    }
  }

  onClose() {
    this.closed = true;
    if (this.listener) {
      this.listener.onClose();
    }
  }

  allNonGitIgnoredFiles(
    onFile: (path: string) => void,
    onClose: () => void
  ) {
    if (this.listener) throw new Error("Already listening");
    this.listener = { onFile, onClose };

    if (this.queue.length) {
      this.queue.forEach(onFile);
      this.queue = [];
    }
    if (this.closed) {
      onClose();
    }
  }
}

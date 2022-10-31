import { spawn } from "child_process"
import { readline } from "mz";

export class CurrentWorkingDirectory {
  queue: string[] = [];
  closed = false;
  listeners: undefined | {
    onFile: (path: string) => void;
    onClose: () => void;
  }

  constructor(public cwd: string, gitIgnoreFileName: string = '.gitignore') {
    const gitLsTree = spawn("git", ["ls-tree", "-r", "head", "--name-only"]);

    const nonGitIgnoredFiles = readline.createInterface({
      input: gitLsTree.stdout,
    })

    nonGitIgnoredFiles.on("line", this.onFile.bind(this));
    nonGitIgnoredFiles.on("close", this.onClose.bind(this));
  }

  onFile(path: string) {
    if (this.listeners) {
      this.listeners.onFile(path);
    } else {
      this.queue.push(path);
    }
  }

  onClose() {
    this.closed = true;
    if (this.listeners) {
      this.listeners.onClose();
    }
  }

  allNonGitIgnoredFiles(
    onFile: (path: string) => void,
    onClose: () => void
  ) {
    if (this.listeners) throw new Error("Already listening");
    this.listeners = { onFile, onClose };
    if (this.queue.length) {
      this.queue.forEach(onFile);
      this.queue = [];
    }
    if (this.closed) {
      onClose();
    }
  }
}

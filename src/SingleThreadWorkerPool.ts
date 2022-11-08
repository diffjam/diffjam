import { readyWorker } from "./workerProcess";
import { ResultsMap } from './match';
import { Config } from './Config';
import { equal } from "node:assert";

// Has the same interface as `WorkerPool`, but operates in the same thread
// This is useful for testing purposes and for actions that modify the config.
export class SingleThreadWorkerPool {
  private closed: boolean = false;

  private inProgress = new Set<string>();
  private queued: string[] = [];
  private worker: {
    processFile: (filePath: string) => void;
  }

  public filesChecked: string[] = [];
  public resultsMap: ResultsMap = {};
  public onResults: () => void = () => { };

  constructor(config: Config, cwd: string) {
    this.worker = readyWorker(config, cwd, (match, policy) => {
      this.resultsMap[policy.name].matches.push(match);
    }, (filePath: string) => {
      this.inProgress.delete(filePath);
      if (this.queued.length) {
        this.checkFile(this.queued.shift()!);
      } else if (this.isWorkDone()) {
        this.onResults();
      }
    });
  }

  private isWorkDone(): boolean {
    return this.closed && !this.inProgress.size && !this.queued.length;
  }

  private checkFile(filePath: string) {
    this.filesChecked.push(filePath);
    this.inProgress.add(filePath);
    this.worker.processFile(filePath);
  }

  processFile(filePath: string): void {
    if (this.inProgress.size >= 3) {
      this.queued.push(filePath);
    } else {
      this.checkFile(filePath);
    }
  }

  onFilesDone(): void {
    equal(this.closed, false, "onFilesDone called twice");
    this.closed = true;
    if (this.isWorkDone()) {
      this.onResults();
    }
  }
}

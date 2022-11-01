import { readyWorker } from "./workerProcess";
import { ResultsMap } from './match';
import { Config } from './Config';

// Looks like a worker pool, but operates in the same thread
// used for testing purposes
export class SameThreadWorkerPool {
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
        const filePath = this.queued.shift()!;
        this.filesChecked.push(filePath);
        this.inProgress.add(filePath);
        this.worker.processFile(filePath);
      } else if (this.closed && !this.inProgress.size) {
        this.onResults();
      }
    });
  }

  processFile(filePath: string): void {
    if (this.inProgress.size >= 3) {
      this.queued.push(filePath);
    } else {
      this.filesChecked.push(filePath);
      this.inProgress.add(filePath);
      this.worker.processFile(filePath);
    }
  }

  onFilesDone(): void {
    this.closed = true;
    if (!this.inProgress.size) {
      this.onResults();
    }
  }
}

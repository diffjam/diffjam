import { cpus } from 'node:os';
import cluster, { Worker } from "node:cluster";
import { Message } from "./workerProcess";
import { ResultsMap } from './match';

type WorkerEntry = { worker: Worker, inProgress: Set<string> }

export class WorkerPool {
  private closed: boolean = false;
  private queued: string[] = [];
  private workers: WorkerEntry[] = [];

  public filesChecked: string[] = [];
  public resultsMap: ResultsMap = {};
  public onResults: () => void = () => { };

  constructor(
    private configFilePath: string,
    private cwd: string,
  ) {
    const numCpus = cpus().length;
    while (this.workers.length < numCpus - 1) {
      this.createWorker();
    }
  }

  private createWorker() {
    const inProgress = new Set<string>();
    const worker = cluster.fork({
      configFilePath: this.configFilePath,
      cwd: this.cwd,
    });

    const workerEntry = { worker, inProgress };

    worker.on("message", (msg: Message) => {
      if (msg.type === "match") {
        this.resultsMap[msg.policyName].matches.push(msg.match);
      } else if (msg.type === "processedFile") {
        if (!inProgress.has(msg.filePath)) {
          throw new Error('file not in progress: ' + msg.filePath)
        }

        inProgress.delete(msg.filePath);

        if (this.queued.length) {
          this.checkFile(workerEntry, this.queued.shift()!);
        } else if (this.closed && this.workers.every(({ inProgress }) => !inProgress.size)) {
          this.onDone();
        }
      }
    })

    this.workers.push(workerEntry);
  }

  private checkFile(worker: WorkerEntry, filePath: string) {
    this.filesChecked.push(filePath);
    worker.inProgress.add(filePath)
    worker.worker.send({ type: "processFile", filePath });
  }

  public processFile(filePath: string) {
    const worker = this.workers.find(({ inProgress }) => inProgress.size < 3);
    if (!worker) {
      this.queued.push(filePath);
    } else {
      this.checkFile(worker, filePath);
    }
  }

  private onDone() {
    this.workers.forEach(({ worker }) => worker.kill());
    this.onResults();
  }

  public onFilesDone() {
    this.closed = true;
    if (this.workers.every(({ inProgress }) => !inProgress.size)) {
      this.onDone();
    }
  }
}

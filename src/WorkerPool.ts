/*
  Manages a pool of workers, and distributes the file paths to process to each.
  The workers, defined by src/workerProcess.ts, each run in a separate process.
  Each communicates back to the master process with matches of the policies.
  The Runner, defined by src/Runner.ts, assigns a `resultsMap` with keys for each 
  policy and an `onResults` callback that the WorkerPool calls when all work is done.
*/
import { cpus } from 'node:os';
import cluster, { Worker } from "node:cluster";
import { equal } from 'node:assert';
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
      // console.log(msg.type, (msg as any).filePath, this.workers);
      if (msg.type === "match") {
        this.resultsMap[msg.policyName].matches.push(msg.match);
      } else if (msg.type === "processedFile") {
        if (!inProgress.has(msg.filePath)) {
          throw new Error('file not in progress: ' + msg.filePath)
        }

        inProgress.delete(msg.filePath);

        let queuedFilePath = this.queued.shift();

        if (queuedFilePath) {
          this.checkFile(workerEntry, queuedFilePath);
        } else if (this.isWorkDone()) {
          this.onDone();
        }
      }
    });

    worker.on("error", (error) => {
      this.killAllWorkers();
      throw error;
    });

    this.workers.push(workerEntry);
  }

  private isWorkDone(): boolean {
    return (
      this.closed
      && !this.queued.length
      && this.workers.every(({ inProgress }) => !inProgress.size)
    );
  }

  private workerWithLeastInProgress(): WorkerEntry {
    let leastSoFar: WorkerEntry = this.workers[0];
    for (const worker of this.workers) {
      // Exit early if we find a worker with no files in progress as this is the minimum
      if (!worker.inProgress) {
        return worker;
      }
      if (worker.inProgress.size < leastSoFar.inProgress.size) {
        leastSoFar = worker;
      }
    }
    return leastSoFar;
  }

  private checkFile(worker: WorkerEntry, filePath: string) {
    this.filesChecked.push(filePath);
    worker.inProgress.add(filePath);
    worker.worker.send({ type: "processFile", filePath });
  }

  public processFile(filePath: string) {
    const worker = this.workerWithLeastInProgress();
    if (worker.inProgress.size >= 3) {
      this.queued.push(filePath);
    } else {
      this.checkFile(worker, filePath);
    }
  }

  private killAllWorkers() {
    this.workers.forEach(({ worker }) => worker.kill());
  }

  private onDone() {
    this.killAllWorkers();
    this.onResults();
  }

  public onFilesDone() {
    equal(this.closed, false, "onFilesDone called twice");
    this.closed = true;
    if (this.isWorkDone()) {
      this.onDone();
    }
  }
}

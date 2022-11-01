import { isEmpty } from "lodash";
import { Config } from "./Config";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Flags } from "./flags";
import cluster, { Worker } from "node:cluster";
import { Policy } from "./Policy";
import { ResultsMap } from "./match";

export class Runner {
  public closed: boolean = false;
  public filesChecked: string[] = [];
  public queued: string[] = [];
  public policies: Policy[];
  public workers: { worker: Worker, inProgress: Set<string> }[] = [];
  public resultsMap: ResultsMap = {}

  constructor(
    public config: Config,
    public flags: Flags,
    public cwd: CurrentWorkingDirectory,
    public withResults: (resultsMap: ResultsMap, filesChecked: string[]) => void,
  ) {
    if (!cluster.isPrimary) throw new Error("not primary");

    this.policies = Object.values(config.policyMap);
    for (const policyName in config.policyMap) {
      this.resultsMap[policyName] = {
        policy: config.policyMap[policyName],
        matches: [],
      };
    }

    for (let i = 0; i < 7; i++) {
      this.createWorker();
    }

    cwd.allNonGitIgnoredFiles(
      this.processFile.bind(this),
      this.onFilesDone.bind(this)
    )
  }

  private createWorker() {
    const inProgress = new Set<string>();
    const worker = cluster.fork({ configFilePath: this.config.filePath });
    worker.on("message", (msg: any) => {
      if (msg.type === "match") {
        this.resultsMap[msg.policyName].matches.push(msg.match);
      } else if (msg.type === "processedFile") {
        if (!inProgress.has(msg.filePath)) {
          throw new Error('file not in progress: ' + msg.filePath)
        }

        inProgress.delete(msg.filePath);

        if (this.queued.length) {
          const filePath = this.queued.shift()!;
          inProgress.add(filePath)
          worker.send({ type: "processFile", filePath });
        } else if (this.closed && this.workers.every(w => !w.inProgress.size)) {
          this.onDone();
        }
      }
    })
    this.workers.push({ worker, inProgress });
  }

  private processFile(filePath: string) {
    const isUnderPolicy = this.policies.some(policy => policy.isFileUnderPolicy(filePath));
    if (!isUnderPolicy) return;

    const worker = this.workers.find(w => w.inProgress.size < 3);
    if (!worker) {
      this.queued.push(filePath);
    } else {
      worker.inProgress.add(filePath)
      worker.worker.send({ type: "processFile", filePath });
    }
  }

  private onDone() {
    this.workers.forEach(w => w.worker.kill());
    this.withResults(this.resultsMap, this.filesChecked);
  }

  private onFilesDone() {
    this.closed = true;
    if (this.workers.every(w => !w.inProgress.size)) {
      this.onDone();
    }
  }

  // checkFilesAndAddMatches() {
  //   if (isEmpty(this.config.policyMap)) {
  //     console.error("There are no policies specified.\nMake sure you have a diffjam.yaml file with policies.\nRun `diffjam add` to create a new policy");
  //     return process.exit(1);
  //   }
  //   if (this.ran) throw new Error("already ran")
  //   this.ran = true;
  //   return checkFilesAndAddMatches(this.cwd, Object.values(this.config.policyMap), this.flags, this.workers);
  // }

  // async checkFilesAndAddMatchesForPolicy(policyName: string) {
  //   const policy = this.config.getPolicy(policyName);
  //   if (!policy) {
  //     console.error("There was no policy named: ", policyName);
  //     return process.exit(1);
  //   }
  //   await checkFilesAndAddMatches(this.cwd, [policy], this.flags, []);
  //   return policy
  // }
}

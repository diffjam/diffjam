import cluster from "cluster";
import { Config } from "./Config";
import { Match } from "./match";
import { Policy } from "./Policy";
import { processFile } from "./processFile";

export type Message =
  | { type: "match", policyName: string, match: Match }
  | { type: "processedFile", filePath: string }

export function readyWorker(
  config: Config,
  cwd: string,
  onMatch: (match: Match, policy: Policy) => void,
  onDone: (filePath: string) => void,
) {
  const policies = Object.values(config.policyMap);

  return {
    processFile(filePath: string) {
      processFile(filePath, cwd, policies, onMatch, onDone);
    }
  }
}

export async function workerProcess() {
  if (cluster.isPrimary) throw new Error("not worker");

  let confReady = false;
  const queued: string[] = [];
  const conf = Config.read(process.env.configFilePath!);

  const cwd = process.env.cwd!;

  // We may receive messages while still loading the config.
  // We'll queue them up and process them once the config is ready.
  process.on("message", (message: any) => {
    const { filePath } = message
    if (!confReady) return queued.push(filePath);
    worker.processFile(filePath);
  });

  const config = await conf;
  confReady = true;

  const worker = readyWorker(config, cwd, (match, policy) => {
    process.send!({ type: "match", policyName: policy.name, match });
  }, (filePath) => {
    process.send!({ type: "processedFile", filePath });
  });

  let filePath
  while (filePath = queued.shift()) {
    worker.processFile(filePath);
  }
}

import { equal } from "node:assert";
import { join } from "node:path";
import cluster from "node:cluster";
import { Config } from "./Config";
import { Match } from "./match";
import { Policy } from "./Policy";
import { readFile } from "fs";
import { FileMatcher } from "./FileMatcher";


export type Message =
  | { type: "match", policyName: string, match: Match }
  | { type: "processedFile", filePath: string }


export function processFile(
  filePath: string,
  cwd: string,
  config: Config,
  onMatch: (match: Match, policy: Policy) => void,
  onDone: (filePath: string) => void,
) {
  readFile(join(cwd, filePath), { encoding: "utf8" }, (err, fileContents) => {
    if (err) throw err;
    const file = new FileMatcher(filePath, fileContents);
    for (const policy of Object.values(config.policyMap)) {
      policy.processFile(file, onMatch);
    }
    onDone(filePath);
  })
}

export function readyWorker(
  config: Config,
  cwd: string,
  onMatch: (match: Match, policy: Policy) => void,
  onDone: (filePath: string) => void,
) {
  return {
    processFile(filePath: string) {
      processFile(filePath, cwd, config, onMatch, onDone);
    }
  }
}

export async function workerProcess() {
  equal(cluster.isPrimary || cluster.isMaster, false, "workerProcess() should only be called in a worker process");

  let confReady = false;
  const queued: string[] = [];

  equal(!!process.env.configFilePath, true, "configFilePath not set");
  equal(!!process.env.cwd, true, "cwd not set");
  const conf = Config.read(process.env.configFilePath!);
  const cwd = process.env.cwd!;

  // We may receive messages while still loading the config.
  // We'll queue them up and process them once the config is ready.
  process.on("message", (message: any) => {
    const { filePath } = message
    if (!confReady) return queued.push(filePath);
    worker.processFile(filePath);
  });

  // Errors in reading the config should be caught and logged by the parent process.
  let config: Config;
  try {
    config = await conf;
  } catch (err) {
    return;
  }

  confReady = true;

  const worker = readyWorker(config, cwd, (match: Match, policy: Policy) => {
    process.send!({ type: "match", policyName: policy.name, match });
  }, (filePath: string) => {
    process.send!({ type: "processedFile", filePath });
  });

  let filePath: string | undefined;
  while (filePath = queued.shift()) {
    worker.processFile(filePath);
  }
}

#!/usr/bin/env node

// @ts-ignore
import meow from "meow";
import { join } from "node:path";
import cluster from "node:cluster"
// import { actionCheck } from "./src/actions/check";
// import { actionCinch } from "./src/actions/cinch";
// import { actionCount } from "./src/actions/count";
// import { actionNewPolicy } from "./src/actions/newPolicy";
// import { actionRemovePolicy } from "./src/actions/remove";
// import { actionPolicyModify } from "./src/actions/policyModify";
// import { actionMainMenu } from "./src/actions/mainMenu";

import { CurrentWorkingDirectory } from "./src/CurrentWorkingDirectory";
import { Flags } from "./src/flags";
import { File } from "./src/File";
import { Config } from "./src/Config";
import { readFile } from "node:fs";
import { ResultsMap } from "./src/match";
import { logResults } from "./src/log";


// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

process.on("unhandledRejection", (err: unknown) => {
  console.error("err: ", err);
  throw err;
});

if (cluster.isPrimary) {
  const cli = meow(
    `
      Usage
        $ diffjam <action>

      Examples
        $ diffjam init
        $ diffjam add
        $ diffjam check
        $ diffjam cinch
        $ diffjam count
        $ diffjam modify [name]
        $ diffjam remove [name]
  `,
    {
      flags: {
        config: {
          type: "string",
          alias: "c"
        },
        verbose: {
          type: "boolean",
          alias: "v"
        },
        record: {
          type: "boolean",
          alias: "r"
        },
        ci: {
          type: "boolean",
        }
      }
    }
  );

  // run!
  const run = async function (action: string, policyName: string, flags: Flags) {
    const dir = process.cwd();
    const configFilePath = flags.config || join(dir, "diffjam.yaml");

    const workers = [
      { worker: cluster.fork({ configFilePath }), inProgress: new Set() },
      { worker: cluster.fork({ configFilePath }), inProgress: new Set() },
      { worker: cluster.fork({ configFilePath }), inProgress: new Set() },
      { worker: cluster.fork({ configFilePath }), inProgress: new Set() },
      { worker: cluster.fork({ configFilePath }), inProgress: new Set() },
      { worker: cluster.fork({ configFilePath }), inProgress: new Set() },
      { worker: cluster.fork({ configFilePath }), inProgress: new Set() },
    ]

    if (action === "init") {
      return Config.init(configFilePath);
    }

    const cwd = new CurrentWorkingDirectory(dir);
    const conf = Config.read(configFilePath);

    const config = await conf;
    const policies = Object.values(config.policyMap);
    const queued: string[] = [];
    const filesChecked: string[] = [];

    const resultsMap: ResultsMap = {}
    for (const policyName in config.policyMap) {
      resultsMap[policyName] = {
        policy: config.policyMap[policyName],
        matches: [],
      };
    }

    await new Promise<void>((resolve, reject) => {
      let closed = false

      for (const worker of workers) {
        worker.worker.on("message", (msg: any) => {
          if (msg.type === "match") {
            resultsMap[msg.policyName].matches.push(msg.match);
          } else if (msg.type === "processedFile") {
            if (!worker.inProgress.has(msg.filePath)) {
              throw new Error('file not in progress: ' + msg.filePath)
            }
            worker.inProgress.delete(msg.filePath);

            if (queued.length) {
              const filePath = queued.shift()!;
              worker.inProgress.add(filePath)
              worker.worker.send({ type: "processFile", filePath });
            } else if (closed && workers.every(w => !w.inProgress.size)) {
              resolve();
            }
          }
        });
      }

      cwd.allNonGitIgnoredFiles(filePath => {
        let fileUnderPolicy = false
        for (const policy of policies) {
          if (policy.isFileUnderPolicy(filePath)) {
            fileUnderPolicy = true
            filesChecked.push(filePath)
            break;
          }
        }
        if (fileUnderPolicy) {
          const worker = workers.find(w => w.inProgress.size < 3);
          if (!worker) {
            queued.push(filePath);
          } else {
            worker.inProgress.add(filePath)
            worker.worker.send({ type: "processFile", filePath });
          }
        }
      }, () => {
        closed = true;
        if (workers.every(w => !w.inProgress.size)) {
          resolve();
        }
      })
    });

    for (const worker of workers) {
      worker.worker.kill();
    }

    logResults(resultsMap, filesChecked);
  };

  // eslint-disable-next-line no-void
  void run(cli.input[0], cli.input[1], cli.flags);
} else {
  const main = async () => {
    let confReady = false;
    const cwd = new CurrentWorkingDirectory(process.cwd());
    const conf = Config.read(process.env.configFilePath!);

    const processingFiles = new Set<string>();
    const queued: string[] = [];

    function processFile(filePath: string) {
      processingFiles.add(filePath);

      readFile(join(cwd.cwd, filePath), { encoding: "utf8" }, (err, fileContents) => {
        if (err) throw err;
        const file = new File(filePath, fileContents);
        policies.forEach(policy => {
          const matches = policy.processFile(file);
          for (const match of matches) {
            process.send!({
              type: "match",
              policyName: policy.name,
              match,
            })
          }
        });
        processingFiles.delete(filePath);
        process.send!({ type: "processedFile", filePath });
      })
    }

    process.on("message", (message: any) => {
      const { filePath } = message
      if (!confReady) return queued.push(filePath);
      processFile(filePath);
    });

    const config = await conf;
    confReady = true;
    const policies = Object.values(config.policyMap);

    let filePath
    while (filePath = queued.shift()) {
      processFile(filePath);
    }
  }

  main()
}

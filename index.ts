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
import { Runner } from "./src/Runner";


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

    if (action === "init") {
      return Config.init(configFilePath);
    }


    const cwd = new CurrentWorkingDirectory(dir);
    const conf = Config.read(configFilePath);

    const config = await conf;
    const runner = new Runner(config, flags, cwd, logResults);
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
          policy.processFile(file, match => {
            process.send!({
              type: "match",
              policyName: policy.name,
              match,
            })
          });
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

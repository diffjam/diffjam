#!/usr/bin/env node

import { join } from "node:path";
import cluster from "node:cluster"
import { CurrentWorkingDirectory } from "./src/CurrentWorkingDirectory";
import { cli, Flags } from "./src/cli";
import { Config } from "./src/Config";
import { Runner } from "./src/Runner";
import { workerProcess } from "./src/workerProcess";
import { WorkerPool } from "./src/WorkerPool";


// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

process.on("unhandledRejection", (err: unknown) => {
  console.error("err: ", err);
  throw err;
});

if (cluster.isPrimary) {

  // run!
  const run = async function (action: string, policyName: string, flags: Flags) {
    const dir = process.cwd();
    const configFilePath = flags.config || join(dir, "diffjam.yaml");

    if (action === "init") {
      return Config.init(configFilePath);
    }

    const workerPool = new WorkerPool(configFilePath, dir);

    const cwd = new CurrentWorkingDirectory(dir);
    const conf = Config.read(configFilePath);

    const config = await conf;
    const runner = new Runner(config, flags, cwd, workerPool);

    switch (action) {
      case "check":
        return runner.check(); // count + fail if warranted
      case "cinch":
        return runner.cinch(); // if there are no breaches, update the baselines to the strictest possible
      case "add":
        return runner.addPolicy(); // add a policy to the config
      case "remove":
        return runner.removePolicy(policyName); // remove a policy to the config
      case "modify":
        return runner.modifyPolicy(policyName); // add a policy to the config
      case "count":
        return runner.count(); // run the policy counter
      case "bump":
        return runner.bump();
      // case "menu":
      //   return actionMainMenu(runner); // show the main menu
      default:
        console.error(`unknown command: ${action}`);
        console.error(cli.help);
        process.exit(1);
    }
  };

  // eslint-disable-next-line no-void
  void run(cli.input[0], cli.input[1], cli.flags);
} else {
  workerProcess();
}

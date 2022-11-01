#!/usr/bin/env node

import { join } from "node:path";
import cluster from "node:cluster"
import { CurrentWorkingDirectory } from "./src/CurrentWorkingDirectory";
import { cli, Flags } from "./src/cli";
import { Config } from "./src/Config";
import { Runner } from "./src/Runner";
import { workerProcess } from "./src/workerProcess";
import { WorkerPool } from "./src/WorkerPool";
import { SingleThreadWorkerPool } from "./src/SingleThreadWorkerPool";


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

    // Some actions modify the config file, so for those we use a worker pool
    // in the same thread so that when we modify it the new policy is available
    async function createRunner(opts: { syncWorkerPool?: boolean } = {}) {
      const workerPool = !opts.syncWorkerPool && new WorkerPool(configFilePath, dir);

      const cwd = new CurrentWorkingDirectory(dir);
      const conf = Config.read(configFilePath);

      const config = await conf;
      return new Runner(config, flags, cwd, workerPool || new SingleThreadWorkerPool(config, dir));
    }

    switch (action) {
      case "check":
        return (await createRunner()).check(); // count + fail if warranted
      case "cinch":
        return (await createRunner()).cinch(); // if there are no breaches, update the baselines to the strictest possible
      case "add":
        return (await createRunner({ syncWorkerPool: true })).addPolicy(); // add a policy to the config
      case "remove":
        return (await createRunner()).removePolicy(policyName); // remove a policy to the config
      case "modify":
        return (await createRunner({ syncWorkerPool: true })).modifyPolicy(policyName); // add a policy to the config
      case "count":
        return (await createRunner()).count(); // run the policy counter
      case "bump":
        return (await createRunner()).bump();
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

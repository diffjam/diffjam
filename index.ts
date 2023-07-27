#!/usr/bin/env node

// Entrypoint for CLI
import { join } from "node:path";
import cluster from "node:cluster"
import { CurrentWorkingDirectory } from "./src/CurrentWorkingDirectory";
import { cli, Flags } from "./src/cli";
import { Config } from "./src/Config";
import { Runner } from "./src/Runner";
import { workerProcess } from "./src/workerProcess";
import { WorkerPool } from "./src/WorkerPool";
import { SingleThreadWorkerPool } from "./src/SingleThreadWorkerPool";


let workerPool: WorkerPool;

async function logAndQuit(msg: any): Promise<never> {
  console.error(msg);
  if (workerPool) {
    return workerPool.killAllWorkers().then(() => process.exit(1));
  } else {
    process.exit(1);
  }
}

if (cluster.isPrimary || cluster.isMaster) {
  process.on("unhandledRejection", (err: unknown) => {
    logAndQuit(err);
  });

  // run!
  const run = async function (action: string, flags: Flags) {
    const dir = process.cwd();
    const configFilePath = flags.config || join(dir, "diffjam.yaml");

    if (action === "init") {
      return Config.init(configFilePath);
    }

    // Some actions modify the config file, so for those we use a worker pool
    // in the same thread so that when we modify it the new policy is available
    async function createRunner(opts: { syncWorkerPool?: boolean } = {}): Promise<Runner | undefined> {
      if (!opts.syncWorkerPool) workerPool = new WorkerPool(configFilePath, dir);

      const cwd = new CurrentWorkingDirectory(dir);
      const conf = Config.read(configFilePath);
      let config: Config
      try {
        config = await conf;
        return new Runner(config, flags, cwd, workerPool || new SingleThreadWorkerPool(config, dir));
      } catch (err) {
        if (err instanceof Error) {
          await logAndQuit(err.message + "\nPlease check your config file at " + configFilePath);
        } else {
          await logAndQuit((err as any).message || err);
        }
      }
    }

    try {
      switch (action) {
        case "check":
          return await (await createRunner())!.check(); // count + fail if warranted
        case "cinch":
          return await (await createRunner())!.cinch(); // if there are no breaches, update the baselines to the strictest possible
        case "add":
          return await (await createRunner({ syncWorkerPool: true }))!.addPolicy(); // add a policy to the config
        case "remove":
          return await (await createRunner({ syncWorkerPool: true }))!.removePolicy(); // remove a policy to the config
        case "modify":
          return await (await createRunner({ syncWorkerPool: true }))!.modifyPolicy(); // add a policy to the config
        case "count":
          return await (await createRunner())!.count(); // run the policy counter
        case "bump":
          return await (await createRunner())!.bump();
        case "breaches":
          return await (await createRunner())!.checkBreachesForPolicy(); // 
        default:
          console.error(`unknown command: ${action}`);
          console.error(cli.help);
          process.exit(1);
      }
    } catch (err) {
      logAndQuit((err as any).message || err);
    }
  };

  // eslint-disable-next-line no-void
  void run(cli.input[0], cli.flags);
} else {
  workerProcess();
}

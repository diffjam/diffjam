import envCi from 'env-ci';
import chalk from "chalk";
import { Config } from "./Config";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Flags } from "./cli";
import { Policy } from "./Policy";
import { GREEN_CHECK, logCheckFailedError, logResults } from "./log";
import { clientVersion } from "./clientVersion";
import { commentResults, postMetrics, ResultMap } from "./count";
import { ResultsMap } from './match';

interface WorkerPool {
  resultsMap: ResultsMap;
  filesChecked: string[];
  processFile(filePath: string): void;
  onFilesDone(): void;
  onResults(): void;
}
export class Runner {
  private policies: Policy[];

  constructor(
    private config: Config,
    private flags: Flags,
    private cwd: CurrentWorkingDirectory,
    private workerPool: WorkerPool
  ) {
    this.policies = Object.values(config.policyMap);

    for (const policyName in config.policyMap) {
      this.workerPool.resultsMap[policyName] = {
        policy: config.policyMap[policyName],
        matches: [],
      };
    }
  }

  private run() {
    this.cwd.allNonGitIgnoredFiles(
      this.processFile.bind(this),
      this.workerPool.onFilesDone.bind(this.workerPool)
    )
  }

  check() {
    this.workerPool.onResults = () => {
      const { breaches } = logResults(this.workerPool.resultsMap, this.workerPool.filesChecked);
      if (breaches.length) {
        logCheckFailedError();
        process.exitCode = 1;
      } else {
        console.log(`\n${GREEN_CHECK} ${chalk.bold(`All policies passed with ${this.workerPool.filesChecked.length} matching files checked`)}`);
      }
    }

    this.run();
  }

  count() {
    const clientVers = clientVersion();
    const start = new Date();

    this.workerPool.onResults = async () => {
      const { breaches, successes, all } = logResults(this.workerPool.resultsMap, this.workerPool.filesChecked);

      const results: ResultMap = {};
      for (const result of all) {
        results[result.policy.name] = {
          measurement: result.matches.length
        };
      }

      const verbose = Boolean(this.flags.verbose);

      if (breaches.length) {
        logCheckFailedError();
      }

      // console.log("flags: ", flags);
      if (!this.flags.record && !this.flags.ci) {
        console.log(chalk.green.bold(`Done in ${Date.now() - start.getTime()} ms.`));
        return;
      }

      console.log(chalk.yellow("sending metrics to server..."));
      verbose &&
        console.log(chalk.cyan(`successes: ${JSON.stringify(successes)}`));
      verbose && console.log(chalk.cyan(`breaches: ${JSON.stringify(breaches)}`));
      const apiKey = process.env.DIFFJAM_API_KEY;
      if (!apiKey) {
        console.error(chalk.red("Missing api key!  Could not post metrics."));
        console.error(
          chalk.red(
            "You must have an api key in an environment variable named DIFFJAM_API_KEY"
          )
        );
        process.exitCode = 1;
        return;
      }
      const configJson = this.config.toJson();
      verbose && console.log("apiKey, config, results: ", apiKey, configJson, results);


      if (this.flags.record) {
        await postMetrics(apiKey, configJson, results, clientVers);
      }

      if (this.flags.ci) {
        if (!envCi().isCi) {
          throw new Error(`could not detect CI environment`);
        }
        await commentResults(apiKey, configJson, results, clientVers);
      }

      console.log(chalk.green.bold(`Done in ${Date.now() - start.getTime()} ms.`));
    }

    this.check();
  }

  cinch() {
    this.workerPool.onResults = () => {
      const { breaches, successes } = logResults(this.workerPool.resultsMap, this.workerPool.filesChecked);
      console.log();

      if (breaches.length > 0) {
        console.error(
          chalk.bold(
            "Cannot cinch a policy that doesn't even meet the baseline. \n"
          )
        );
        process.exitCode = 1;
        return;
      }

      let anyCinched = false;
      for (const success of successes) {
        if (success.policy.isCountCinchable(success.matches)) {
          anyCinched = true;
          const before = success.policy.baseline;
          success.policy.baseline = success.matches.length;
          console.log(
            `${GREEN_CHECK} cinching ${chalk.bold(success.policy.name)} from ${before
            } to ${chalk.bold(success.matches.length.toString())}!`
          );
        }
      }

      if (anyCinched) {
        this.config.write();
      } else {
        console.log(`${GREEN_CHECK} ${chalk.bold("All policies are already exactly at their baseline, so none were cinched")}`);
      }
    }

    this.run();
  }

  bump() {
    this.workerPool.onResults = () => {
      const { breaches } = logResults(this.workerPool.resultsMap, this.workerPool.filesChecked);
      console.log();

      for (const breach of breaches) {
        const before = breach.policy.baseline;
        breach.policy.baseline = breach.matches.length;
        console.log(
          `🎚 bumping ${chalk.bold(breach.policy.name)} from ${before
          } to ${chalk.bold(breach.matches.length.toString())}!`
        );
      }

      if (breaches.length) {
        this.config.write();
      } else {
        console.log(`${GREEN_CHECK} ${chalk.bold("All policies are already exactly at their baseline, so none were bumped")}`);
      }
    }

    this.run();
  }

  async addPolicy() {
    // Requiring ui inline as it adds a fair bit of time to startup
    const ui = require("./ui");

    const name = await ui.textInput("Enter a name for this policy: ");

    const isRegex = await ui.confirm("Is this a regex search?");

    let search: string
    const negativeSearchTerms = []

    if (isRegex) {
      const regex = await ui.textInput(
        "Enter the regex to search for: "
      );
      search = `regex:${regex}`;
    } else {
      search = await ui.textInput(
        "Enter the string to match : "
      );

      while (true) {
        const negativeSearchTerm = await ui.textInput(
          "Enter any string to negate (or leave blank to continue): "
        );

        if (negativeSearchTerm.trim()) {
          negativeSearchTerms.push(negativeSearchTerm);
        } else {
          break;
        }
      }
    }

    const filePattern = await ui.textInput(
      "Enter the filePattern to search for this policy: "
    );

    const ignoreFilePatterns = []
    while (true) {
      const ignoreFilePattern = await ui.textInput(
        "Enter any filePatterns to ignore (or leave blank to continue): "
      );

      if (ignoreFilePattern.trim()) {
        ignoreFilePatterns.push(ignoreFilePattern);
      } else {
        break;
      }
    }

    const policy = new Policy(name, "", filePattern, [search, ...negativeSearchTerms], 0, ignoreFilePatterns);

    policy.description = await ui.textInput(
      "Give a description for this policy: "
    );

    this.config.setPolicy(policy);
    this.policies = [policy];
    this.workerPool.resultsMap[policy.name] = {
      policy,
      matches: []
    };

    this.workerPool.onResults = async () => {
      const { matches } = this.workerPool.resultsMap[policy.name];
      policy.baseline = matches.length;

      if (
        await ui.confirm(
          `There are currently ${policy.baseline} matches for that configuration. Save it?`
        )
      ) {
        this.config.write();
        console.log("Saved!");
      } else {
        console.log("Cancelled save.");
      }
    }

    this.run();
  }

  async removePolicy(policyName: string) {
    const policy = this.config.getPolicy(policyName);

    if (!policy) {
      console.error("There was no policy named: ", policyName);
      return process.exit(1);
    }

    await this.config.deletePolicy(policyName);
  }

  modifyPolicy(policyName: string) {

  }

  private processFile(filePath: string) {
    const isUnderPolicy = this.policies.some(policy => policy.isFileUnderPolicy(filePath));
    if (!isUnderPolicy) return;
    this.workerPool.filesChecked.push(filePath);
    this.workerPool.processFile(filePath);
  }
}

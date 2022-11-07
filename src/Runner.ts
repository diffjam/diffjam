/*
  Performs top-level actions of the CLI. Connects the file paths found in the
  `CurrentWorkingDirectory` to the worker pool.
*/
import envCi from 'env-ci';
import chalk from "chalk";
import { equal } from 'node:assert';
import { Config } from "./Config";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Flags } from "./cli";
import { Policy } from "./Policy";
import { GREEN_CHECK, logCheckFailedError, logResults } from "./log";
import { clientVersion } from "./clientVersion";
import { commentResults, postMetrics, ResultMap } from "./count";
import { ResultsMap } from './match';
import { actionPolicyModify } from './policyModify';

interface WorkerPool {
  resultsMap: ResultsMap;
  filesChecked: string[];
  processFile(filePath: string): void;
  onFilesDone(): void;
  onResults(): void;
}
export class Runner {
  private policies: Policy[];
  private ran = false;

  constructor(
    public config: Config,
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

  private run(): Promise<{ resultsMap: ResultsMap, filesChecked: string[] }> {
    equal(this.ran, false, "Runner.run() should only be called once");
    return new Promise(resolve => {
      this.workerPool.onResults = () => {
        this.ran = true;
        resolve({
          resultsMap: this.workerPool.resultsMap,
          filesChecked: this.workerPool.filesChecked
        });
      }

      this.cwd.allNonGitIgnoredFiles(
        this.processFile.bind(this),
        this.workerPool.onFilesDone.bind(this.workerPool)
      );
    })
  }

  async check() {
    const { resultsMap, filesChecked } = await this.run();
    const { breaches } = logResults(resultsMap, filesChecked);
    if (breaches.length) {
      logCheckFailedError();
      process.exitCode = 1;
    } else {
      console.log(`\n${GREEN_CHECK} ${chalk.bold(`All policies passed with ${filesChecked.length} matching files checked`)}`);
    }
  }

  async count() {
    const clientVers = clientVersion();
    const start = new Date();

    const { resultsMap, filesChecked } = await this.run();

    const { breaches, successes, all } = logResults(resultsMap, filesChecked);

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

  async cinch() {
    const { resultsMap, filesChecked } = await this.run();
    const { breaches, successes } = logResults(resultsMap, filesChecked);
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

  async bump() {
    const { resultsMap, filesChecked } = await this.run();
    const { breaches } = logResults(resultsMap, filesChecked);
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

  async addPolicy() {
    // Requiring ui inline as it adds a fair bit of time to startup
    const ui = require("./ui");

    const name = await ui.textInput("Enter a name for this policy: ");

    const isRegex = await ui.confirm("Is this a regex search?");

    let search: string;
    const negativeSearchTerms = [];

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

    const description = await ui.textInput(
      "Give a description for this policy: "
    );

    const policy = new Policy(name, description, filePattern, [search, ...negativeSearchTerms], 0, ignoreFilePatterns);

    this.config.setPolicy(policy);
    this.policies = [policy];
    this.workerPool.resultsMap[policy.name] = {
      policy,
      matches: []
    };

    const { resultsMap, filesChecked } = await this.run();

    const { matches } = resultsMap[policy.name];
    policy.baseline = matches.length;

    if (
      await ui.confirm(
        `There are currently ${policy.baseline} matches for that configuration after checking ${filesChecked.length} files. Save it?`
      )
    ) {
      this.config.write();
      console.log("Saved!");
    } else {
      console.log("Cancelled save.");
    }
  }

  async runSinglePolicy(policyName: string) {
    const policy = this.config.getPolicy(policyName);
    if (!policy) {
      throw new Error(`Could not find policy ${policyName}`);
    }

    const { resultsMap } = await this.run();
    return resultsMap[policyName];
  }

  async removePolicy() {
    const ui = require("./ui");
    const policy = await ui.select("Select a policy to remove: ", this.config.policyMap);
    await this.config.deletePolicy(policy.name);
    await this.config.write();
    console.log(`Removed ${policy.name}`);
  }

  modifyPolicy() {
    return actionPolicyModify(this);
  }

  private processFile(filePath: string) {
    const isUnderPolicy = this.policies.some(policy => policy.isFileUnderPolicy(filePath));
    if (!isUnderPolicy) return;
    this.workerPool.processFile(filePath);
  }
}

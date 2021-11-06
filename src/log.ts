import chalk from "chalk";
import { Policy } from "./Policy";
import ProgressBar from 'progress';
import { getResults, SuccessOrBreach } from "./getResults";
import * as configFile from "./configFile";

const RED_X = chalk.red("❌️");
export const GREEN_CHECK = chalk.green("✔️");

export const logCheckFailedError = () => {
  console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
};


export const logPolicyResult = (name: string, policy: Policy, result: number, duration: number) => {
  if (!policy.isCountAcceptable(result)) {
    return console.error(
      `${RED_X} ${chalk.red.bold(name)}: ${result} (expected ${
      policy.baseline
      } or fewer`
    );
  }
  return console.log(
    `${GREEN_CHECK} ${chalk.bold(name)}: ${result} (in ${duration} ms)`
  );
};

const logBreachError = (breach: SuccessOrBreach) => {
  console.error(
    `${RED_X} ${chalk.red.bold(breach.name)}: ${breach.result} (expected ${
    breach.policy.baseline
    } or fewer`
  );

  const count = Math.min(10, breach.examples.length)
  console.log(count > 1 ? `Violation:` : `Last ${count} examples:`)
  const examples = breach.examples.slice(0, count).map(b => `${b.path}:${b.number} - ${b.line}`)
  console.log(examples.join("\n"));

  if (breach.policy.description) {
    console.error("", chalk.magenta(breach.policy.description));
  }
};

export const logResults = async () => {
  const conf = await configFile.getConfig();
  const policies = conf.policyMap;
  const policiesList = Object.keys(policies);
  const bar = new ProgressBar('searching for policy violations: [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: policiesList.length * 2,
  });

  const { results, successes, breaches } = await getResults(bar);

  breaches.forEach((b) => {
    logBreachError(b);
  });

  successes.forEach((s) => {
    if (!s.policy.hiddenFromOutput) {
      logPolicyResult(s.name, s.policy, s.result, s.duration);
    }
  });

  console.log("\n");
  return {
    results,
    successes,
    breaches
  };
};

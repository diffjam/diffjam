import chalk from "chalk";
import { Policy } from "./Policy";
import ProgressBar from 'progress';
import { getResults } from "./getResults";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Config } from "./Config";
import { partition } from "lodash";

const RED_X = chalk.red("❌️");
export const GREEN_CHECK = chalk.green("✔️");

export const logCheckFailedError = () => {
  console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
};


export const logPolicyResult = (policy: Policy) => {
  if (!policy.isCountAcceptable()) {
    return console.error(
      `${RED_X} ${chalk.red.bold(policy.name)}: ${policy.matches.length} (expected ${policy.baseline
      } or fewer)`
    );
  }
  return console.log(
    `${GREEN_CHECK} ${chalk.bold(policy.name)}: ${policy.matches.length}`
  );
};

const logBreachError = (breach: Policy) => {
  console.error(
    `${RED_X} ${chalk.red.bold(breach.name)}: ${breach.matches.length} (expected ${breach.baseline
    } or fewer)`
  );

  const count = Math.min(10, breach.matches.length)
  console.log(count > 1 ? `Violation:` : `Last ${count} examples:`)
  const examples = breach.matches.slice(0, count).map(b => `${b.path}:${b.number} - ${b.line}`)
  console.log(examples.join("\n"));

  if (breach.description) {
    console.error("", chalk.magenta(breach.description));
  }
};

export const logResults = async (conf: Config, cwd: CurrentWorkingDirectory) => {
  const policies = await getResults(cwd, conf);

  const [successes, breaches] = partition(policies, policy => policy.isCountAcceptable());

  breaches.forEach((b) => {
    logBreachError(b);
  });

  successes.forEach((s) => {
    if (!s.hiddenFromOutput) {
      logPolicyResult(s);
    }
  });

  console.log("\n");

  return {
    successes,
    breaches
  };
};

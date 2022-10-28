import chalk from "chalk";
import { Policy } from "./Policy";
import { maxBy, partition } from "lodash";
import { Runner } from "./Runner";

const RED_X = chalk.red("❌️");
export const GREEN_CHECK = chalk.green("✅");

export const logCheckFailedError = () => {
  console.error(`\n${RED_X} ${chalk.red.bold("Check failed.")}`);
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
  if (breach.matches.length > 10) {
    console.error("First 10 examples:")
  }
  const examples = breach.matches.slice(0, count)

  const longestFilePath = maxBy(examples, example => example.breachPath.length)!.breachPath.length

  const exampleLog = examples
    .map(b => `${b.breachPath}${" ".repeat(longestFilePath - b.breachPath.length)} ${b.startWholeLineFormatted}`)
    .join("\n")

  console.log(exampleLog);

  if (breach.description) {
    console.error(chalk.magenta(breach.description));
  }
};

export const logResults = async (runner: Runner) => {
  const { policies, filesChecked } = await runner.checkFilesAndAddMatches();

  const [successes, breaches] = partition(policies, policy => policy.isCountAcceptable());

  breaches.forEach((b) => {
    logBreachError(b);
  });

  successes.forEach((s) => {
    if (!s.hiddenFromOutput) {
      logPolicyResult(s);
    }
  });

  if (!breaches.length) {
    console.log(`\n${GREEN_CHECK} ${chalk.bold(`All policies passed with ${filesChecked.length} matching files checked`)}`);
  }

  return {
    successes,
    breaches,
    all: policies
  };
};

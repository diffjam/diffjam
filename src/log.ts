import chalk from "chalk";
import { maxBy, partition } from "lodash";
import { Result, ResultsMap } from "./match";

export const RED_X = "❌️";
export const GREEN_CHECK = "✅";

export const logCheckFailedError = () => {
  console.error(`\n${RED_X} ${chalk.red.bold("Check failed.")}`);
};

export const logPolicyResult = (result: Result) => {
  if (!result.policy.isCountAcceptable(result.matches)) {
    return console.error(
      `${RED_X} ${chalk.red.bold(result.policy.name)}: ${result.matches.length} (expected ${result.policy.baseline
      } or fewer)`
    );
  }
  return console.log(
    `${GREEN_CHECK} ${chalk.bold(result.policy.name)}: ${result.matches.length}`
  );
};

const logBreachError = (breach: Result) => {
  console.error(
    `${RED_X} ${chalk.red.bold(breach.policy.name)}: ${breach.matches.length} (expected ${breach.policy.baseline
    } or fewer)`
  );

  const count = Math.min(10, breach.matches.length)
  if (breach.matches.length > 10) {
    console.error("First 10 examples:")
  }
  const examples = breach.matches.slice(0, count)

  const longestFilePath = maxBy(examples, example => example.breachPath.length)!.breachPath.length

  const exampleLog = examples
    .map(b => `${chalk.magenta(b.breachPath)}${" ".repeat(longestFilePath - b.breachPath.length)} ${b.startWholeLineFormatted}`)
    .join("\n")

  console.log(exampleLog);

  if (breach.policy.description) {
    console.error(chalk.yellow(breach.policy.description));
  }
};

export const logAllResultDetails = (result: Result) => {
  console.log(
    `${chalk.yellow.bold(result.policy.name)} (found ${result.matches.length}, expecting ${result.policy.baseline
    } or fewer)`
  );

  const matches = result.matches;

  const longestFilePath = maxBy(matches, example => example.breachPath.length)!.breachPath.length

  const matchLog = matches
    .map(b => `${chalk.magenta(b.breachPath)}${" ".repeat(longestFilePath - b.breachPath.length)} ${b.startWholeLineFormatted}`)
    .join("\n")

  console.log(matchLog);

  if (result.policy.description) {
    console.error(chalk.yellow(result.policy.description));
  }
};

export const logResults = (resultsMap: ResultsMap, _filesChecked: string[]) => {
  const all = Object.values(resultsMap);
  const [successes, breaches] = partition(all, ({ policy, matches }) => policy.isCountAcceptable(matches));

  breaches.forEach(logBreachError);

  successes.forEach((s) => {
    if (!s.policy.hiddenFromOutput) {
      logPolicyResult(s);
    }
  });

  return { breaches, successes, all }
};

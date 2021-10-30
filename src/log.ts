import chalk from "chalk";
import { Policy } from "./Policy";
import * as configFile from "./configFile";
import { countMatches, findMatches, Match } from "./match";
import { flatten } from "lodash";

const RED_X = chalk.red("❌️");
export const GREEN_CHECK = chalk.green("✔️");

export const logCheckFailedError = () => {
  console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
};

interface SuccessOrBreach {
  name: string;
  policy: Policy;
  result: number;
  duration: number;
  examples: Match[];
}

export const logResults = async () => {

  const { results, successes, breaches } = await getResults();

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

export const logPolicyResult = (name: string, policy: Policy, result: any, duration: any) => {
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

export const getResults = async () => {
  const conf = await configFile.getConfig();
  const policies = conf.policyMap;
  const results: {[key: string]: {duration: number, measurement: number}} = {};
  const breaches: SuccessOrBreach[] = [];
  const successes: SuccessOrBreach[] = [];

  await Promise.all(
    Object.keys(policies).map(async name => {
      const policy = policies[name];
      const policyStart = new Date();
      const matches = await findMatches(policy.filePattern, policy.needles);
      const count = countMatches(matches);
      const examples = flatten(Object.values(matches));
      const duration = Date.now() - policyStart.getTime();
      if (!policy.isCountAcceptable(count)) {
        breaches.push({
          name,
          policy: policy,
          result: count,
          duration: Date.now() - policyStart.getTime(),
          examples,
        });
      } else {
        successes.push({
          name,
          policy: policy,
          result: count,
          examples,
          duration: Date.now() - policyStart.getTime(),
        });
      }
      results[name] = {
        duration,
        measurement: count
      };
    })
  );
  return {
    results,
    successes,
    breaches
  };
};

const logBreachError = async (breach: SuccessOrBreach) => {
  console.error(
    `${RED_X} ${chalk.red.bold(breach.name)}: ${breach.result} (expected ${
    breach.policy.baseline
    } or fewer`
  );

  const count = Math.min(10, breach.examples.length)
  console.log(count > 1 ? `Violation:` : `Last ${count} examples:`)
  console.log(breach.examples.slice(0, count).map(b => {
    return `${b.path}:${b.number} - ${b.line}`;
  }).join("\n"));

  if (breach.policy.description) {
    console.error("", chalk.magenta(breach.policy.description));
  }
};

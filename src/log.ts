import chalk from "chalk";
import { countPolicy } from "./countPolicy";
import { Policy } from "./Policy";
import * as configObj from "./config";

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
  examples: string[];
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
  const policies = configObj.getPolicies();
  const results: {[key: string]: {duration: number, measurement: number}} = {};
  const breaches: SuccessOrBreach[] = [];
  const successes: SuccessOrBreach[] = [];

  await Promise.all(
    Object.keys(policies).map(async name => {
      const policy = policies[name];
      const policyStart = new Date();
      const { count, examples } = await countPolicy(policy);
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

  console.log("Last 10 examples:")
  console.log(breach.examples.slice(0, 10).join("\n"));

  if (breach.policy.description) {
    console.error("", chalk.magenta(breach.policy.description));
  }
};

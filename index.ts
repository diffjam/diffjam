import _ from "lodash";
import axios from "axios";
// @ts-ignore
import meow from "meow";
import chalk from "chalk";
import * as ui from "./src/ui";
import {countPolicy} from "./src/countPolicy";
import fs from "fs";
import {gitUrlToSlug} from "./src/git";
const packageJson = JSON.parse(
  fs.readFileSync(`${__dirname}/package.json`).toString()
);
const clientVersion = packageJson.version;

const GREEN_CHECK = chalk.green("✔️");
const RED_X = chalk.red("❌️");

import envCi from 'env-ci';
import gitRemoteOriginUrl from "git-remote-origin-url";
import hostedGitInfo from "hosted-git-info";
import * as configObj from "./src/config";
import { Policy } from "./src/config";

// const logo =
//   "     _ _  __  __ _                 \n    | (_)/ _|/ _(_)                \n  __| |_| |_| |_ _  __ _ _ __ ___  \n / _` | |  _|  _| |/ _` | '_ ` _ \\ \n| (_| | | | | | | | (_| | | | | | |\n \\__,_|_|_| |_| | |\\__,_|_| |_| |_|\n               _/ |                \n              |__/   version: " +
//   clientVersion;
const logoBrown = chalk.rgb(74, 53, 47);
const logoYellow = chalk.rgb(241, 157, 56);

const logo = `
 ${logoBrown.bold("_____")}    ${logoYellow("_")}    ${logoBrown.bold("__    __")}        ${logoBrown("_")}
${logoBrown.bold("|  __ \\")}  ${logoYellow("(_)")}  ${logoBrown.bold("/ _|  / _|")}      ${logoBrown("| |")}
${logoBrown.bold("| |  | |  _  | |_  | |_")}       ${logoBrown("| |   __ _   _ __ ___")}
${logoBrown.bold("| |  | | | | |  _| |  _|")}  ${logoBrown("_   | |  / _\` | | '_ \` _ \\")}
${logoBrown.bold("| |__| | | | | |   | |")}   ${logoBrown("| |__| | | (_| | | | | | | |")}
${logoBrown.bold("|_____/  |_| |_|   |_|")}    ${logoBrown("\\____/   \\__,_| |_| |_| |_|")}
                          ${logoBrown("version: ")} ${logoYellow(clientVersion)}
`;

// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

process.on("unhandledRejection", (err: any) => {
  console.error("err: ", err);
  throw err;
});

const logBreachError = async (breach: { name: string; result: any; quest: { baseline: any; minimize: any; description: string; }; examples: any[]; }) => {
  console.error(
    `${RED_X} ${chalk.red.bold(breach.name)}: ${breach.result} (expected ${
    breach.quest.baseline
    } or ${breach.quest.minimize ? "fewer" : "more"})`
  );

  if (breach.quest.minimize) {
    console.log("Last 10 examples:")
    console.log(breach.examples.slice(0, 10).join("\n"));
  }

  if (breach.quest.description) {
    console.error("", chalk.magenta(breach.quest.description));
  }
};


// [2020-05-03T16:57:29.737Z] env:  { isCi: true,
//   [2020-05-03T16:57:29.737Z]   name: 'Jenkins',
//   [2020-05-03T16:57:29.737Z]   service: 'jenkins',
//   [2020-05-03T16:57:29.737Z]   commit: 'f8178999c68ff64127539b4d147e3df9a8ba99ad',
//   [2020-05-03T16:57:29.737Z]   branch: 'PR-3632',
//   [2020-05-03T16:57:29.737Z]   build: '3',
//   [2020-05-03T16:57:29.737Z]   buildUrl: 'https://jenkins.classdojo.com/job/api/job/PR-3632/3/',
//   [2020-05-03T16:57:29.737Z]   root: '/mnt/dockerstorageiops/jenkins/jobs/api/workspace_PR-3632_3',
//   [2020-05-03T16:57:29.737Z]   pr: '3632',
//   [2020-05-03T16:57:29.737Z]   isPr: true,
//   [2020-05-03T16:57:29.737Z]   prBranch: 'PR-3632',
//   [2020-05-03T16:57:29.737Z]   slug: 'classdojo/api' }


async function commentResults(apiKey: any, config: any, results: {}, tags?: any) {
  const env: any = envCi();
  const { name, service, commit, isPr, pr } = env;
  let { branch, slug, prBranch } = env;
  console.log("pre env: ", env);
  if (service === "jenkins") {
    // this envCI library seems to mess up the jenkins branch, so let's fix it.
    branch = process.env.CHANGE_BRANCH || branch;
    console.log("CHANGE_BRANCH", process.env.CHANGE_BRANCH);
    console.log("GIT_LOCAL_BRANCH", process.env.GIT_LOCAL_BRANCH);
    console.log("GIT_BRANCH", process.env.GIT_BRANCH);
    console.log("BRANCH_NAME", process.env.BRANCH_NAME);
    env.branch = branch;
    if (prBranch) {
      prBranch = branch;
      env.prBranch = prBranch;
    }
  }
  if (!slug) {
    slug = gitUrlToSlug(process.env.GIT_URL || "");
    env.slug = slug;
  }
  console.log("post env: ", env);
  let response;

  const remoteOriginUrl = await gitRemoteOriginUrl();
  const gitServiceInfo = hostedGitInfo.fromUrl(remoteOriginUrl)

  if (gitServiceInfo?.type !== "github") {
    throw new Error(`diffjam does not support your git host in this release ${gitServiceInfo?.type}`);
  }

  const body = {
    apiKey,
    clientVersion,
    config,
    results,
    tags,
    ci_env: {
      name,
      service,
      branch,
      commit,
      isPr,
      pr,
      prBranch,
      slug,
      remoteOriginUrl,
      gitService: gitServiceInfo.type,
    }
  };
  try {
    response = await axios.post(`https://diffjam.com/api/ci`, body);
    if (response.status < 200 || response.status > 299) {
      throw new Error(`Non-2xx response from diffjam.com: ${response.status}`);
    }
  } catch (ex: any) {
    if (ex.response && ex.response.status === 400) {
      // This is an expected error. Something is wrong (probably with the configuration);
      console.error(
        chalk.red.bold("The error reported an issue with your configuration")
      );
      console.error(chalk.red(JSON.stringify(ex.response.data)));
    } else {
      console.log("There was some error hitting diffjam.com: ", ex);
      console.log("ex.request.data: ", ex.request.data);
      console.log("ex.response.data: ", ex.response.data);
    }
  }
}

async function postMetrics(apiKey: string, config: any, results: {}, tags?: any) {
  let response;
  const body = {
    apiKey,
    clientVersion,
    config,
    results,
    tags
  };
  try {
    response = await axios.post(`https://diffjam.com/api/snapshot`, body);
    // TODO: Check if this is happening at all. Axios is failing if the status is not 200.
    if (response.status < 200 || response.status > 299) {
      throw new Error(`Non-2xx response from diffjam.com: ${response.status}`);
    }
  } catch (ex: any) {
    if (ex.response.status === 400) {
      // This is an expected error. Something is wrong (probably with the configuration);
      console.error(
        chalk.red.bold("The error reported an issue with your configuration")
      );
      console.error(chalk.red(JSON.stringify(ex.response.data)));
    } else {
      console.log("There was some error hitting diffjam.com: ", ex);
      console.log("ex.request.data: ", ex.request.data);
      console.log("ex.response.data: ", ex.response.data);
    }
  }
}

const logPolicyResult = (name: string, policy: Policy, result: any, duration: any) => {
  if (failedBaseline(policy, result)) {
    return console.error(
      `${RED_X} ${chalk.red.bold(name)}: ${result} (expected ${
      policy.baseline
      } or ${policy.minimize ? "less" : "more"})`
    );
  }
  return console.log(
    `${GREEN_CHECK} ${chalk.bold(name)}: ${result} (in ${duration} ms)`
  );
};

function failedBaseline(policy: Policy, result: number) {
  if (policy.minimize && policy.baseline < result) {
    return true;
  }
  if ((policy.minimize === false) && policy.baseline > result) {
    return true;
  }
  return false;
}


const policyIsInGuardMode = (policy: Policy) => policy.mode && policy.mode.guard;

const getResults = async () => {
  const policies = configObj.getPolicies();
  const results: {[key: string]: {duration: number, measurement: number}} = {};
  const breaches: { name: string; quest: any; result: any; duration: number; guardMode: any; examples: any; }[] = [];
  const successes: { name: string; quest: any; result: any; examples: any; duration: number; guardMode: any; }[] = [];

  await Promise.all(
    Object.keys(policies).map(async name => {
      const policy = policies[name];
      const policyStart = new Date();
      const { count, examples } = await countPolicy(policy);
      const duration = Date.now() - policyStart.getTime();
      if (failedBaseline(policy, count)) {
        breaches.push({
          name,
          quest: policy,
          result: count,
          duration: Date.now() - policyStart.getTime(),
          guardMode: policyIsInGuardMode(policy),
          examples,
        });
      } else {
        successes.push({
          name,
          quest: policy,
          result: count,
          examples,
          duration: Date.now() - policyStart.getTime(),
          guardMode: policyIsInGuardMode(policy),
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

const logResults = async () => {

  const { results, successes, breaches } = await getResults();

  breaches.forEach((b) => {
    logBreachError(b);
  });

  successes.forEach((s) => {
    if (!s.guardMode) {
      logPolicyResult(s.name, s.quest, s.result, s.duration);
    }
  });

  console.log("\n");
  return {
    results,
    successes,
    breaches
  };
};

const logCheckFailedError = () => {
  console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
};

const actionCheck = async function () {
  const start = new Date();
  const results = await logResults();
  const { breaches } = results;

  if (breaches.length) {
    logCheckFailedError();
    process.exitCode = 1;
  }
  console.log(`Done in ${Date.now() - start.getTime()} ms.`);
};


const actionCount = async function (flags: any = {}) {
  const start = new Date();
  const { breaches, successes, results } = await logResults();
  const verbose = Boolean(flags.verbose);

  if (breaches.length) {
    logCheckFailedError();
  }

  console.log("flags: ", flags);
  if (!flags.record && !flags.ci) {

    console.log(chalk.green.bold(`Done in ${Date.now() - start.getTime()} ms.`));
    return;
  }

  await promptForTags();
  const configJson = JSON.parse(fs.readFileSync(`./diffjam.json`).toString());
  if (
    !configJson.tags ||
    !Array.isArray(configJson.tags) ||
    configJson.tags.length === 0
  ) {
    console.error(chalk.red("Missing tags!  Could not post metrics."));
    console.error(
      chalk.red("You must have one or more tags for these metrics.")
    );
    process.exitCode = 1;
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
  verbose && console.log("apiKey, config, results: ", apiKey, configJson, results);


  if (flags.record) {
    await postMetrics(apiKey, configJson, results);
  }

  if (flags.ci) {
    if (!envCi().isCi) {
      throw new Error(`could not detect CI environment`);
    }
    await commentResults(apiKey, configJson, results);
  }

  console.log(chalk.green.bold(`Done in ${Date.now() - start.getTime()} ms.`));
};

const actionInit = async function () {
  if (!configObj.exists()) {
    configObj.ensureConfig();
    console.log("Created diffjam.json for diffjam configuration.");
  } else {
    console.error("A diffjam.json already exists.  Skipping initialization.");
    process.exitCode = 1;
  }
};

const actionMainMenu = async function () {
  console.log(logo + "\n");
  configObj.ensureConfig();
  const policyNames = configObj.getPolicyNames();
  const editChoicesMap: {[key: string]: {type: string, name: string}} = {};
  policyNames.forEach((name: string) => {
    editChoicesMap[`edit "${name}"`] = {
      type: "edit_policy",
      name
    };
  });

  const mainMenuChoice = await ui.select(
    "Choose an action",
    _.extend(
      {
        "new policy": { type: "new_policy" },
        "cinch - record the latest counts to the local config": {
          type: "cinch"
        },
        "count - count the current state of all policies": { type: "count" },
        "check - check that the current counts for the policies are not worse than the recorded counts": {
          type: "check"
        }
      },
      editChoicesMap
    )
  );

  switch (mainMenuChoice.type) {
    case "new_policy":
      return actionNewPolicy();
    case "cinch":
      return actionCinch();
    case "count":
      return actionCount();
    case "check":
      return actionCheck(); // count + fail if warranted
    case "edit_policy":
      return actionPolicyModify(mainMenuChoice.name);
    default:
      throw new Error(`unknown choice: ${mainMenuChoice}`);
  }
};

const actionPolicyDescriptionEdit = async function (name: any) {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  if (!policy.description) {
    console.log("There currently is no description");
  } else {
    console.log("The current description is: ");
    console.log(policy.description);
  }

  policy.description = await ui.textInput("Give a new description: ");

  configObj.savePolicy(name, policy);
};

const actionPolicyBaselineFix = async function (name: any) {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const { count } = await countPolicy(policy);
  const hadABreach = failedBaseline(policy, count);

  if (!hadABreach) {
    console.error(
      `The baseline for that policy doesn't need to be fixed.  The count is ${count} and the baseline is ${policy.baseline}`
    );
    return process.exit(1);
  }

  const oldBaseline = policy.baseline;

  configObj.setPolicyBaseline(name, count);
  console.log(
    `The baseline for that policy was changed from ${oldBaseline} to ${count}`
  );
};

const actionPolicyDelete = async function (name: any) {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  if (
    !(await ui.confirm(
      `Are you sure you want to delete the policy named "${name}"?`
    ))
  ) {
    console.log("Deletion cancelled.");
    return process.exit(0);
  }

  configObj.deletePolicy(`policies.${name}`);
};

const actionGuardMode = async function (name: any) {
  const key = `policies.${name}.mode.guard`;
  const currentValue = configObj.getPolicyGuardMode(key);
  console.log(
    `Guard mode for "${name}" is currently ${currentValue ? "on" : "off"}`
  );
  const menuChoice = await ui.select("Please choose", {
    "Turn guard mode OFF (Check for regressions, show results, report metrics.  This is the default.)": false,
    "Turn guard mode ON (Check for regressions but don't show results or report metrics)": true
  });
  configObj.setPolicyGuardMode(name, menuChoice);
  console.log(
    `Guard mode for "${name}" is now set to ${menuChoice ? "on" : "off"}`
  );
};

async function actionPolicyModify (name: any) {
  const policy = configObj.getPolicy(name);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const modifyMenuChoice = await ui.select("Choose an action", {
    delete: { type: "delete_policy" },
    "edit description": { type: "policy_description_edit" },
    "fix baseline": { type: "policy_baseline_fix" },
    "subscribe to hustle-mode (ensure that you're always making improvements)": {
      type: "mode_hustle"
    },
    "set to guard mode (hide all output unless there are regressions)": {
      type: "mode_guard"
    },
    exit: { type: "exit" }
  });

  switch (modifyMenuChoice.type) {
    case "policy_description_edit":
      return actionPolicyDescriptionEdit(name);
    case "delete_policy":
      return actionPolicyDelete(name);
    case "policy_baseline_fix":
      return actionPolicyBaselineFix(name);
    case "mode_guard":
      return actionGuardMode(name);
    case "exit":
      return process.exit(0);
    default:
      throw new Error(`unknown choice: ${modifyMenuChoice}`);
  }
}

// create a policy
async function actionNewPolicy (name?: string, command?: string) {
  configObj.ensureConfig();

  if (!name) {
    name = await ui.textInput("Enter a name for this policy: ");
  }

  if (!command) {
    command = await ui.textInput(
      "Enter the command that will return your metric: "
    );
  }

  const policy: Policy = {
    command,
    description: "",
    minimize: true,
    baseline: 0,
  };

  policy.description = await ui.textInput(
    "Give a description for this policy: "
  );

  const { count } = await countPolicy(policy);

  const trendDirection = await ui.select(
    `Do you want to minimize or maximize for this policy?`,
    {
      minimize: "minimize",
      maximize: "maximize"
    }
  );

  policy.minimize = trendDirection === "minimize";
  policy.baseline = count;

  if (
    await ui.confirm(
      `There are currently ${count} matches for that configuration. Save it?`
    )
  ) {
    configObj.savePolicy(name, policy);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
}

async function promptForTags () {
  const tags = configObj.getTags();
  if (tags.length === 0) {
    const tagInput = await ui.textInput("Enter the name of this codebase: ");
    tags.push(`codebase:${tagInput}`);
    configObj.setTags(tags);
  }
}

async function actionCinch () {
  configObj.ensureConfig();

  const { breaches, successes } = await logResults();

  /*
  const policies = config.get("policies");
  const quest = policies[questName];


  if (!quest) {
    console.error("No quest by that name exists.  Possible quest names: ");
    for (const name in policies) {
      console.error(`* ${name}`);
    }
    process.exitCode = 1;
    return;
  }

  const count = await countQuest(quest);
  const hadABreach = failedBaseline(quest, count);
  */
  if (breaches.length > 0) {
    console.error(
      chalk.bold(
        "Cannot cinch a metric that doesn't even meet the baseline. \n"
      )
    );
    process.exitCode = 1;
    return;
  }

  for (const result of successes) {
    let exceeds =
      result.quest.minimize && result.result < result.quest.baseline;
    exceeds =
      exceeds ||
      (result.quest.maximize && result.result > result.quest.baseline);

    if (exceeds) {
      configObj.setPolicyBaseline(result.name, result.result);
      console.log(
        `${GREEN_CHECK} ${chalk.bold(result.name)} was just cinched from ${
        result.quest.baseline
        } to ${chalk.bold(result.result)}!`
      );
    }
  }
}

function actionPR () {
  throw new Error("no implemented!");
}

// run!
const run = async function (action: string, param1: any, flags: { config: any; }) {
  await configObj.getConfig(flags.config);
  if (!action || action === "menu") {
    return actionMainMenu();
  }
  switch (action) {
    case "init":
      return actionInit(); // create the config
    case "policy":
      return actionNewPolicy(); // add a policy to the config
    case "modify":
      return actionPolicyModify(param1); // add a policy to the config
    case "count":
      return actionCount(flags); // run the policy counter
    case "check":
      return actionCheck(); // count + fail if warranted
    case "cinch":
      return actionCinch(); // if there are no breaches, update the baselines to the strictest possible
    case "ci":
      return actionPR(); // count + fail if warranted
    default:
      throw new Error(`unknown action: ${action}`);
  }
};

const cli = meow(
  `
    Usage
      $ diffjam <action>

    Examples
      $ diffjam menu
      $ diffjam count
      $ diffjam check
      $ diffjam report
`,
  {
    flags: {
      config: {
        type: "string",
        alias: "c"
      }
    }
  }
);

run(cli.input[0], cli.input[1], cli.flags);

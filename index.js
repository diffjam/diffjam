#!/usr/bin/env node

"use strict";

const path = require("path");
const _ = require("lodash");
const axios = require("axios");
const meow = require("meow");
const chalk = require("chalk");
const pshell = require("pshell");
const fileExists = require("mz/fs").exists;
const Conf = require("conf");
const ui = require("./ui");
const fs = require("fs");
const gitUrlToSlug = require("./git").gitUrlToSlug;
let packageJson = JSON.parse(
  fs.readFileSync(`${__dirname}/package.json`).toString()
);
const clientVersion = packageJson.version;

const GREEN_CHECK = chalk.green("✔️");
const RED_X = chalk.red("❌️");

const envCi = require('env-ci');
const gitRemoteOriginUrl = require("git-remote-origin-url");
const hostedGitInfo = require("hosted-git-info");

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

// conf for config? https://github.com/sindresorhus/conf
// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

process.on("unhandledRejection", err => {
  console.error("err: ", err);
  throw err;
});

let config;
const getConfig = async (file = "./diffjam.json") => {
  const configName = path
    .basename(file)
    .slice(0, -1 * path.extname(file).length);
  const exists = await fileExists(file);
  if (exists) {
    config = new Conf({
      configName,
      cwd: "."
    });
  }
};

const savePolicy = (name, policy) => {
  config.set(`policies.${name}`, policy);
};

const logBreachError = async breach => {
  console.error(
    `${RED_X} ${chalk.red.bold(breach.name)}: ${breach.result} (expected ${
      breach.quest.baseline
    } or ${breach.quest.minimize ? "less" : "more"})`
  );
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


async function commentResults(apiKey, config, results, tags) {
  const env = envCi();
  const {name, service, isCi, commit, tag, build, buildUrl, job, jobUrl, isPr, pr, root} = env;
  let { branch, slug, prBranch } = env;
  console.log("pre env: ", env);
  if (service === "jenkins"){
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
    slug = gitUrlToSlug(process.env.GIT_URL);
    env.slug = slug;
  }
  console.log("post env: ", env);
  let response;

  const remoteOriginUrl = await gitRemoteOriginUrl();
  const gitServiceInfo = hostedGitInfo.fromUrl(remoteOriginUrl)

  if (gitServiceInfo.type !== "github") {
    throw new Error(`diffjam does not support your git host in this release ${gitServiceInfo.type}`);
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
  } catch (ex) {
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

async function postMetrics(apiKey, config, results, tags) {
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
  } catch (ex) {
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

async function countPolicy(policy) {
  let res2;
  try {
    res2 = await pshell(policy.command, {
      echoCommand: false,
      captureOutput: true
    });
  } catch (ex) {
    console.error("error running shell command ", ex);
    console.error("policy: ", policy);
    throw new Error("some error getting matches for countPolicy");
  }
  if (res2.code !== 0) {
    throw new Error("some error getting matches for countPolicy");
  }
  const matches = Number.parseInt(res2.stdout, 10);
  return matches;
}

const logPolicyResult = (name, policy, result, duration) => {
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

function failedBaseline(policy, result) {
  if (policy.minimize && policy.baseline < result) {
    return true;
  }
  if (policy.maximize && policy.baseline > result) {
    return true;
  }
  return false;
}

const getPolicyNames = () => {
  const policies = config.get("policies");
  return Object.keys(policies);
};

const policyIsInGuardMode = policy => {
  return policy.mode && policy.mode.guard;
};

const getResults = async () => {
  const policies = config.get("policies");
  const results = {};
  const breaches = [];
  const successes = [];

  await Promise.all(
    Object.keys(policies).map(async name => {
      const policy = policies[name];
      const policyStart = new Date();
      const result = await countPolicy(policy);
      const duration = Date.now() - policyStart.getTime();
      if (failedBaseline(policy, result)) {
        breaches.push({
          name,
          quest: policy,
          result,
          duration: Date.now() - policyStart.getTime(),
          gaurdMode: policyIsInGuardMode(policy),
        });
      } else {
        if (!policyIsInGuardMode(policy)) {
          successes.push({
            name,
            quest: policy,
            result,
            duration: Date.now() - policyStart.getTime(),
            gaurdMode: policyIsInGuardMode(policy),
          });
        }
      }
      results[name] = {
        duration,
        measurement: result
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

  const {results, successes, breaches} = await getResults();

  breaches.forEach((b) => {
    logBreachError(b);
  });

  successes.forEach((s) => {
    if (!s.gaurdMode) {
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

const actionCheck = async function() {
  const start = new Date();
  const results = await logResults();
  const { breaches, successes } = results;

  if (breaches.length) {
    logCheckFailedError();
    process.exitCode = 1;
  }
  console.log(`Done in ${Date.now() - start.getTime()} ms.`);
};


const actionCount = async function(flags = {}) {
  const start = new Date();
  const { breaches, successes, results } = await logResults();
  const verbose = !!flags.verbose;

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




const ensureConfig = function() {
  if (!config) {
    config = new Conf({
      configName: "diffjam",
      cwd: ".",
      serialize: value => JSON.stringify(value, null, 2)
    });
    config.set("policies", {});
    config.set("tags", []);
  }
};

const actionInit = async function() {
  if (!config) {
    ensureConfig();
    console.log("Created diffjam.json for diffjam configuration.");
  } else {
    console.error("A diffjam.json already exists.  Skipping initialization.");
    process.exitCode = 1;
  }
};

const actionMainMenu = async function(name, command) {
  console.log(logo + "\n");
  ensureConfig();
  const policyNames = getPolicyNames();
  const editChoicesMap = {};
  policyNames.forEach(name => {
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

const actionPolicyDescriptionEdit = async function(name) {
  const key = `policies.${name}`;
  const policy = config.get(key);

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

  savePolicy(name, policy);
};

const actionPolicyBaselineFix = async function(name) {
  const policy = config.get(`policies.${name}`);

  if (!policy) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const count = await countPolicy(policy);
  const hadABreach = failedBaseline(policy, count);

  if (!hadABreach) {
    console.error(
      `The baseline for that policy doesn't need to be fixed.  The count is ${count} and the baseline is ${policy.baseline}`
    );
    return process.exit(1);
  }

  const oldBaseline = policy.baseline;

  config.set(`policies.${name}.baseline`, count);
  console.log(
    `The baseline for that policy was changed from ${oldBaseline} to ${count}`
  );
};

const actionPolicyDelete = async function(name) {
  const policy = config.get(`policies.${name}`);

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

  config.delete(`policies.${name}`);
};

const getId = async function() {
  const emailCommand = `git config user.email`;
  const res2 = await pshell(emailCommand, {
    echoCommand: false,
    captureOutput: true
  });
  if (res2.code !== 0) {
    throw new Error(
      "Sorry.  For some reason we can't determine who you are from your git config, so hustle-mode won't work."
    );
  }
  const emailAddress = res2.stdout.toString();
  return emailAddress;
};

const actionGuardMode = async function(name) {
  const key = `policies.${name}.mode.guard`;
  const currentValue = config.get(key) || false;
  console.log(
    `Guard mode for "${name}" is currently ${currentValue ? "on" : "off"}`
  );
  const menuChoice = await ui.select("Please choose", {
    "Turn guard mode OFF (Check for regressions, show results, report metrics.  This is the default.)": false,
    "Turn guard mode ON (Check for regressions but don't show results or report metrics)": true
  });
  config.set(key, menuChoice);
  console.log(
    `Guard mode for "${name}" is now set to ${menuChoice ? "on" : "off"}`
  );
};

/*

While `diffjam check` by default looks for regressions, when a user signs up for
hustle-mode, it will additionally check that the current codebase has improved in
a policy beyond the current stat.

*/
const actionHustleMode = async function(name) {
  const emailAddress = await getId();
  const hustleMenuChoice = await ui.select("Choose your difficulty mode!", {
    "warn for 5 seconds (diffjam check will pause for 5 seconds to warn you when you don't make progress and then it will continue)":
      "warn5",
    "warn for 15 seconds (diffjam check will pause for 15 seconds to warn you when you don't make progress and then it will continue)":
      "warn15",
    "prompt (diffjam check will interactively ask you to confirm if it's okay that you didn't make progress on a policy)":
      "prompt",
    "fail (diffjam check will simply fail if you don't make progress)": "fail",
    "none (stop hustle-mode)": "none"
  });

  console.log("hustle mode difficulty level: ", hustleMenuChoice);
  console.log("emailAddress: ", emailAddress);

  const subscriptionsKey = `policies.${name}.mode.hustle.subscriptions`;
  let subscriptions = config.get(subscriptionsKey) || [];
  console.log("subscriptions from file is: ", subscriptions);

  const newSubscription = {
    id: emailAddress,
    behaviour: hustleMenuChoice
  };

  const currentSubscriptionIdx = _.findIndex(
    subscriptions,
    sub => sub.id === emailAddress
  );
  if (currentSubscriptionIdx === -1) {
    if (hustleMenuChoice === "none") {
      console.log("You are currently not in hustle-mode");
      return;
    }
    subscriptions.push(newSubscription);
    config.set(subscriptionsKey, subscriptions);
    console.log("You have been subscribed to hustle-mode!");
    console.log("This doesn't actually work YET");
    return;
  }

  subscriptions[currentSubscriptionIdx] = newSubscription;
  subscriptions = subscriptions.filter(sub => sub.behaviour !== "none");
  console.log("setting...");
  console.log("subscriptionsKey: ", subscriptionsKey);
  console.log("subscriptions: ", subscriptions);
  if (!Array.isArray(subscriptions)) {
    throw new Error("subscriptions was not an array");
  }

  config.set(subscriptionsKey, subscriptions);

  if (hustleMenuChoice === "none") {
    console.log("You have been removed from hustle-mode.");
  } else {
    console.log("You have been subscribed to hustle-mode!");
  }
};

const actionPolicyModify = async function(name) {
  const policy = config.get(`policies.${name}`);

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
    case "mode_hustle":
      return actionHustleMode(name);
    case "mode_guard":
      return actionGuardMode(name);
    case "exit":
      return process.exit(0);
    default:
      throw new Error(`unknown choice: ${modifyMenuChoice}`);
  }
};

// create a policy
const actionNewPolicy = async function(name, command) {
  ensureConfig();

  if (!name) {
    name = await ui.textInput("Enter a name for this policy: ");
  }

  if (!command) {
    command = await ui.textInput(
      "Enter the command that will return your metric: "
    );
  }

  const policy = {
    command
  };

  policy.description = await ui.textInput(
    "Give a description for this policy: "
  );

  const matches = await countPolicy(policy);

  const trendDirection = await ui.select(
    `Do you want to minimize or maximize for this policy?`,
    {
      minimize: "minimize",
      maximize: "maximize"
    }
  );

  policy.minimize = trendDirection === "minimize";
  policy.baseline = matches;

  if (
    await ui.confirm(
      `There are currently ${matches} matches for that configuration.  Save it?`
    )
  ) {
    savePolicy(name, policy);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
};

const promptForTags = async () => {
  const tags = config.get("tags") || [];
  if (tags.length === 0) {
    const tagInput = await ui.textInput("Enter the name of this codebase: ");
    tags.push(`codebase:${tagInput}`);
    config.set("tags", tags);
  }
};


const actionCinch = async () => {
  ensureConfig();

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
      config.set(`policies.${result.name}.baseline`, result.result);
      console.log(
        `${GREEN_CHECK} ${chalk.bold(result.name)} was just cinched from ${
          result.quest.baseline
        } to ${chalk.bold(result.result)}!`
      );
    }
  }
};

// run!
const run = async function(action, param1, flags) {
  await getConfig(flags.config);
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
      return actionCinch(param1); // if there are no breaches, update the baselines to the strictest possible
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

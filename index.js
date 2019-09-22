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
let packageJson = JSON.parse(
  fs.readFileSync(`${__dirname}/package.json`).toString()
);
const clientVersion = packageJson.version;

const GREEN_CHECK = chalk.green("✔️");
const RED_X = chalk.red("❌️");

const logo =
  "     _ _  __  __ _                 \n    | (_)/ _|/ _(_)                \n  __| |_| |_| |_ _  __ _ _ __ ___  \n / _` | |  _|  _| |/ _` | '_ ` _ \\ \n| (_| | | | | | | | (_| | | | | | |\n \\__,_|_|_| |_| | |\\__,_|_| |_| |_|\n               _/ |                \n              |__/   version: " +
  clientVersion;

// TODO verify only when user is me

// should the diffjam.json contain the latest counts?  should it allow you to relock?
// need the readme to show examples of how to count.  usually you don't want counts to include ignored files

// conf for config? https://github.com/sindresorhus/conf
// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart

// TODO some old diffjam.jsons will use the field "quests" instead of "policies".  1.0.0 and after use "policies"

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
    console.error("", breach.quest.description);
  }
};

async function postMetrics(apiKey, config, results) {
  let response;
  const body = {
    apiKey,
    clientVersion,
    config,
    results: {}
  };
  try {
    response = await axios.post(`https://diffjam.com/api/snapshot`, {
      body
    });
    if (response.status !== 200) {
      throw new Error(`Non-200 response from diffjam.com: ${response.status}`);
    }
  } catch (ex) {
    console.log("There was some error hitting diffjam.com: ", ex);
    console.log("ex.request.data: ", ex.request.data);
    console.log("ex.response.data: ", ex.response.data);


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
  const policies = config.get("policies") || config.get("quests");
  return Object.keys(policies);
};

const policyIsInGuardMode = policy => {
  return policy.mode && policy.mode.guard;
};

const getResults = async () => {
  const policies = config.get("policies") || config.get("quests");
  const results = {};
  const breaches = [];
  const successes = [];

  await Promise.all(
    Object.keys(policies).map(async name => {
      const policy = policies[name];
      const policyStart = new Date();
      const result = await countPolicy(policy);
      let failed = false;
      const duration = Date.now() - policyStart.getTime();
      if (failedBaseline(policy, result)) {
        failed = true;
        breaches.push({
          name,
          quest: policy,
          result,
          duration: Date.now() - policyStart.getTime()
        });
      } else {
        if (!policyIsInGuardMode(policy)) {
          successes.push({
            name,
            quest: policy,
            result,
            duration: Date.now() - policyStart.getTime()
          });
        }
      }
      results[name] = {
        duration,
        measurement: result
      };
      if (failed) {
        // policy failed
        logBreachError(_.last(breaches));
      } else {
        // policy is okay
        if (!policyIsInGuardMode(policy)) {
          logPolicyResult(
            name,
            policy,
            result,
            Date.now() - policyStart.getTime()
          );
        }
      }
    })
  );
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
  const results = await getResults();
  const { breaches, successes } = results;

  if (breaches.length) {
    logCheckFailedError();
    process.exitCode = 1;
  }
  console.log(`Done in ${Date.now() - start.getTime()} ms.`);
};

const actionCount = async function(flags = {}) {
  const start = new Date();
  const { breaches, successes, results } = await getResults();

  if (breaches.length) {
    logCheckFailedError();
  }

  if (flags.record) {
    const configJson = JSON.parse(fs.readFileSync(`./diffjam.json`).toString());
    console.log("sending metrics to server...");
    console.log("successes: ", successes);
    console.log("breaches: ", breaches);
    const apiKey = process.env.DIFFJAM_API_KEY;
    if (!apiKey) {
      console.error("Missing api key!  Could not post metrics.");
      console.error(
        "You must have an api key in an environment variable named DIFFJAM_API_KEY"
      );
      process.exitCode = 1;
      return;
    }
    console.log("apiKey, config, results: ", apiKey, configJson, results);

    await postMetrics(apiKey, configJson, results);
  }

  console.log(`Done in ${Date.now() - start.getTime()} ms.`);
};

const ensureConfig = function() {
  if (!config) {
    config = new Conf({
      configName: "diffjam",
      cwd: ".",
      serialize: value => JSON.stringify(value, null, 2)
    });
    config.set("policies", {});
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
  const policy = config.get(key) || config.get(`quests.${name}`);

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
  const policy = config.get(`policies.${name}`) || config.get(`quests.${name}`);

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
  const policy = config.get(`policies.${name}`) || config.get(`quests.${name}`);

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
  const questsKey = `quests.${name}.mode.guard`;
  const currentValue = config.get(key) || config.get(questsKey) || false;
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
  const questsSubscriptionsKey = `policies.${name}.mode.hustle.subscriptions`;
  let subscriptions =
    config.get(subscriptionsKey) || config.get(questsSubscriptionsKey) || [];
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
  const policy = config.get(`policies.${name}`) || config.get(`quests.${name}`);

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

const actionCinch = async () => {
  ensureConfig();

  const { breaches, successes } = await getResults();

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
      return actionCinch(param1); // count + fail if warranted
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

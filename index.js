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

const GREEN_CHECK = chalk.green("✔️");
const RED_X = chalk.red("❌️");

const logo =
  "     _ _  __  __ _                 \n    | (_)/ _|/ _(_)                \n  __| |_| |_| |_ _  __ _ _ __ ___  \n / _` | |  _|  _| |/ _` | '_ ` _ \\ \n| (_| | | | | | | | (_| | | | | | |\n \\__,_|_|_| |_| | |\\__,_|_| |_| |_|\n               _/ |                \n              |__/                 ";

// TODO verify only when user is me

// should the diffjam.json contain the latest counts?  should it allow you to relock?
// need the readme to show examples of how to count.  usually you don't want counts to include ignored files

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

async function postMetrics(apiKey, successes, breaches) {
  let response;
  const body = {
    successes,
    breaches
  };
  try {
    response = await axios.post(
      `https://gitratchet.com/api/record?api_key=${apiKey}`,
      {
        body
      }
    );
    if (response.status !== 200) {
      throw new Error(`Non-200 response from diffjam.com: ${response.status}`);
    }
  } catch (ex) {
    console.log("There was some error hitting diffjam.com: ", ex);
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
    throw new Error("some error getting matches for countQuest");
  }
  if (res2.code !== 0) {
    throw new Error("some error getting matches for countQuest");
  }
  const matches = Number.parseInt(res2.stdout, 10);
  return matches;
}

const logQuestResult = (name, policy, result, duration) => {
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

const getQuestNames = () => {
  const quests = config.get("quests");
  return Object.keys(quests);
};

const questIsInGuardMode = policy => {
  return policy.mode && policy.mode.guard;
};

const getResults = async () => {
  const quests = config.get("quests");
  const successes = [];
  const breaches = [];

  await Promise.all(
    Object.keys(quests).map(async name => {
      const quest = quests[name];
      const questStart = new Date();
      const result = await countPolicy(quest);
      let failed = false;
      if (failedBaseline(quest, result)) {
        failed = true;
        breaches.push({
          name,
          quest,
          result,
          duration: Date.now() - questStart.getTime()
        });
      } else {
        if (!questIsInGuardMode(quest)) {
          successes.push({
            name,
            quest,
            result,
            duration: Date.now() - questStart.getTime()
          });
        }
      }
      if (failed || !questIsInGuardMode(quest)) {
        logQuestResult(name, quest, result, Date.now() - questStart.getTime());
      }
    })
  );
  return {
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
    breaches.map(logBreachError);
    logCheckFailedError();
    process.exitCode = 1;
  }
  console.log(`Done in ${Date.now() - start.getTime()} ms.`);
};

const actionCount = async function(flags = {}) {
  const start = new Date();
  const results = await getResults();
  const { breaches, successes } = results;

  if (breaches.length) {
    breaches.map(logBreachError);
    logCheckFailedError();
  }

  if (flags.record) {
    console.log("sending metrics to server...");
    console.log("successes: ", successes);
    console.log("breaches: ", breaches);
    const apiKey = process.env.DIFFJAM_API_KEY;
    if (!apiKey) {
      console.error("Missing api key!  Could not post metrics");
      process.exitCode = 1;
      return;
    }
    await postMetrics(apiKey, successes, breaches);
  }

  console.log(`Done in ${Date.now() - start.getTime()} ms.`);
};

const ensureConfig = function() {
  if (!config) {
    config = new Conf({
      configName: "diffjam",
      cwd: "."
    });
    config.set("quests", {});
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
  console.log(logo);
  ensureConfig();
  const questNames = getQuestNames();
  const editChoicesMap = {};
  questNames.forEach(name => {
    editChoicesMap[`edit "${name}"`] = {
      type: "edit_quest",
      name
    };
  });

  const mainMenuChoice = await ui.select(
    "Choose an action",
    _.extend(
      {
        "new policy": { type: "new_quest" },
        "cinch - record the latest counts to the local config": {
          type: "cinch"
        },
        "count - count the current state of all quests": { type: "count" },
        "check - check that the current counts for the quests are not worse than the recorded counts": {
          type: "check"
        }
      },
      editChoicesMap
    )
  );

  switch (mainMenuChoice.type) {
    case "new_quest":
      return actionNewPolicy();
    case "cinch":
      return actionCinch();
    case "count":
      return actionCount();
    case "check":
      return actionCheck(); // count + fail if warranted
    case "edit_quest":
      return actionPolicyModify(mainMenuChoice.name);
    default:
      throw new Error(`unknown choice: ${mainMenuChoice}`);
  }
};

const actionPolicyDescriptionEdit = async function(name) {
  const key = `quests.${name}`;
  const quest = config.get(key);

  if (!quest) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  if (!quest.description) {
    console.log("There currently is no description");
  } else {
    console.log("The current description is: ");
    console.log(quest.description);
  }

  quest.description = await ui.textInput("Give a new description: ");

  config.set(key, quest);
};

const actionPolicyDelete = async function(name) {
  const quest = config.get(`quests.${name}`);

  if (!quest) {
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

  config.delete(`quests.${name}`);
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
  const key = `quests.${name}.mode.guard`;
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

  const subscriptionsKey = `quests.${name}.mode.hustle.subscriptions`;
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
  const quest = config.get(`quests.${name}`);

  if (!quest) {
    console.error("There was no policy named: ", name);
    return process.exit(1);
  }

  const modifyMenuChoice = await ui.select("Choose an action", {
    delete: { type: "delete_quest" },
    "edit description": { type: "quest_description_edit" },
    "subscribe to hustle-mode (ensure that you're always making improvements)": {
      type: "mode_hustle"
    },
    "set to guard mode (hide all output unless there are regressions)": {
      type: "mode_guard"
    },
    exit: { type: "exit" }
  });

  switch (modifyMenuChoice.type) {
    case "quest_description_edit":
      return actionPolicyDescriptionEdit(name);
    case "delete_quest":
      return actionPolicyDelete(name);
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

  const quest = {
    command
  };

  quest.description = await ui.textInput(
    "Give a description for this policy: "
  );

  const matches = await countPolicy(quest);

  const trendDirection = await ui.select(
    `Do you want to minimize or maximize for this policy?`,
    {
      minimize: "minimize",
      maximize: "maximize"
    }
  );

  quest.minimize = trendDirection === "minimize";
  quest.baseline = matches;

  if (
    await ui.confirm(
      `There are currently ${matches} matches for that configuration.  Save it?`
    )
  ) {
    config.set(`quests.${name}`, quest);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
};

const logBreachError = async breach => {
  console.error(
    "\n",
    `${RED_X} ${chalk.red.bold(breach.name)}: ${breach.result} (expected ${
      breach.quest.baseline
    } or ${breach.quest.minimize ? "less" : "more"})`
  );
  if (breach.quest.description) {
    console.error("", breach.quest.description, "\n\n");
  }
};

const actionCinch = async questName => {
  ensureConfig();

  const results = await getResults();

  /*
  const quests = config.get("quests");
  const quest = quests[questName];


  if (!quest) {
    console.error("No quest by that name exists.  Possible quest names: ");
    for (const name in quests) {
      console.error(`* ${name}`);
    }
    process.exitCode = 1;
    return;
  }

  const count = await countQuest(quest);
  const hadABreach = failedBaseline(quest, count);
  */
  if (results.breaches.length > 0) {
    const [firstBreach] = results.breaches;
    logBreachError(firstBreach);
    console.error(
      "Cannot cinch a metric that doesn't even meet the baseline. \n"
    );
    process.exitCode = 1;
    return;
  }

  for (const result of results.successes) {
    let exceeds =
      result.quest.minimize && result.result < result.quest.baseline;
    exceeds =
      exceeds ||
      (result.quest.maximize && result.result > result.quest.baseline);

    if (exceeds) {
      config.set(`quests.${result.name}.baseline`, result.result);
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

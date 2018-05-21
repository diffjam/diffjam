#!/usr/bin/env node

const path = require("path");
const axios = require("axios");
const meow = require('meow');
const chalk = require("chalk");
const pshell = require("pshell");
const fileExists = require('mz/fs').exists;
const inquirer = require('inquirer');
const Conf = require('conf');

const GREEN_CHECK = chalk.green("✔️");
const RED_X = chalk.red("❌️");

// TODO verify only when user is me

// should the diffkit.json contain the latest counts?  should it allow you to relock?
// need the readme to show examples of how to count.  usually you don't want counts to include ignored files


// inquirer for getting input from prompts: https://www.npmjs.com/package/inquirer
// conf for config? https://github.com/sindresorhus/conf
// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart


process.on("unhandledRejection", (err) => { throw err });

let config;
const getConfig = async (file = "./diffkit.json") => {
  const configName = path.basename(file).slice(0, -1 * path.extname(file).length)
  const exists = await fileExists(file);
  if (exists) {
    config = new Conf({
      configName,
      cwd: ".",
    });
    return;
  }
};

async function postMetrics (apiKey, successes, breaches) {
  let response;
  const body = {
    successes,
    breaches,
  }
  try {
    response = await axios.post(
      `https://gitratchet.com/api/record?api_key=${apiKey}`, {
      body,
    });
    if (response.status !== 200) {
      throw new Error(`Non-200 response from diffkit.com: ${response.status}`)
    }
  } catch (ex) {
    console.log("There was some error hitting diffkit.com: ", ex);
  }
}

async function countQuest(quest) {
  const res2 = await pshell(quest.command, { echoCommand: false, captureOutput: true });
  if (res2.code !== 0) {
    throw new Error("some error getting matches for countQuest");
  }
  const matches = Number.parseInt(res2.stdout);
  return matches;
};

const logQuestResult = (name, quest, result, duration) => {
  if (failedBaseline(quest, result)) {
    return console.error(`${RED_X} ${chalk.red.bold(name)}: ${result} (expected ${quest.baseline} or ${quest.minimize ? "less" : "more"})`);
  }
  return console.log(`${GREEN_CHECK} ${chalk.bold(name)}: ${result} (in ${duration} ms)`);
}

const failedBaseline = (quest, result) => {
  if (quest.minimize && (quest.baseline < result)) {
    return true;
  }
  if (quest.maximize && (quest.baseline > result)) {
    return true;
  }
  return false;
}

const actionCount = async function(options = {}, flags = {}) {
  //console.log("options: ", options);
  //console.log("flags: ", flags);


  const quests = config.get("quests");
  const checks = [];
  const start = new Date();
  let hadABreach = false;  // the new code is worse than the old code for this quest
  const successes = [];
  const breaches = [];

  await Promise.all(Object.keys(quests).map(async name => {
    const quest = quests[name];
    const questStart = new Date();
    const result = await countQuest(quest);
    if (failedBaseline(quest, result)) {
      hadABreach = true;
      breaches.push({name, quest, result, duration: Date.now() - questStart.getTime()})
    } else {
      successes.push({name, quest, result, duration: Date.now() - questStart.getTime()})
    }
    logQuestResult(name, quest, result, Date.now() - questStart.getTime());
  }));

  if (hadABreach) {
    console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
  }

  if (flags.record) {
    console.log("sending metrics to server...");
    console.log("successes: ", successes);
    console.log("breaches: ", breaches);
    const apiKey = process.env.DIFFKIT_API_KEY;
    if (!apiKey) {
      console.error("Missing api key!  Could not post metrics");
      process.exitCode = 1;
      return;
    }
    await postMetrics(apiKey, successes, breaches);
  }

  if (hadABreach && options.check) {
    console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
    process.exitCode = 1;
  }
  console.log(`Done in ${(Date.now() - start.getTime())} ms.`);
}

const actionInit = async function () {
  if (!config) {
    config = new Conf({
      configName: "diffkit",
      cwd: ".",
    });
    config.set("quests", {});
    console.log("Created diffkit.json for diffkit configuration.");
  } else {
    console.error("A diffkit.json already exists.  Skipping initialization.");
    process.exit(1);
  }
}


// create a quest
const actionQuest = async function (name, command) {
  if (!config) {
    // TODO should just call actionInit instead of exiting
    console.error("Error: There's no config to add a quest to.  Use `diffkit init` to create one.");
    process.exitCode = 1;
    return;
  }

  if (!name) {
    name = (await inquirer.prompt({
      "type": "input",
      "name": "name",
      "message": "Enter a name for this quest: "
    })).name;
  }

  if (!command) {
    command = (await inquirer.prompt({
      "type": "input",
      "name": "command",
      "message": "Enter the command that will return your metric: ",
    })).command;
  }

  let quest = {
    command,
  };

  const matches = await countQuest(quest);

  const trendDirection = (await inquirer.prompt({
    "type": "list",
    "name": "trendDirection",
    "choices": ["minimize", "maximize"],
    "message": `Do you want to minimize or maximize for this quest?`,
  })).trendDirection;

  quest.minimize = trendDirection === "minimize";

  const shouldContinue = (await inquirer.prompt({
    "type": "confirm",
    "name": "shouldContinue",
    "message": `There are currently ${matches} matches for that configuration.  Save it?`,
  })).shouldContinue;

  quest.baseline = matches;

  if (shouldContinue) {
    config.set(`quests.${name}`, quest);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
    return;
  }
};

const actionCinch = async (questName) => {
  if (!config) {
    // TODO should just call actionInit instead of exiting
    console.error("Error: There's no config to add a quest to.  Use `diffkit init` to create one.");
    process.exitCode = 1;
    return;
  }

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
  if (hadABreach) {
    console.error("Cannot cinch a metric that doesn't even meet the baseline");
    console.error(`${RED_X} ${chalk.red.bold(questName)}: ${count} (expected ${quest.baseline} or ${quest.minimize ? "less" : "more"})`);
    process.exitCode = 1;
    return;
  }

  config.set(`quests.${questName}.baseline`, count);
  console.log(`Quest ${questName} cinched to ${count}`);
}

// run!
const run = async function(action, param1, flags) {
  await getConfig(flags.config);
  switch (action) {
    case "init": return actionInit();     // create the config
    case "quest": return actionQuest();   // add a quest to the config
    case "count": return actionCount({}, flags);   // run the quest counter
    case "check": return actionCount({check: true});   // count + fail if warranted
    case "cinch": return actionCinch(param1);   // count + fail if warranted
    default: throw new Error(`unknown action: ${action}`);
  }
};

const cli = meow(`
    Usage
      $ diffkit <action>

    Examples
      $ diffkit report
`, {
  flags: {
    config: {
      type: "string",
      alias: "c",
    }
  }
});

run(cli.input[0], cli.input[1], cli.flags);


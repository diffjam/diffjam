#!/usr/bin/env node


const axios = require("axios");
const meow = require('meow');
const chalk = require("chalk");
const pshell = require("pshell");
const fileExists = require('mz/fs').exists;
const inquirer = require('inquirer');

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

const Conf = require('conf');
let config;
const getConfig = async () => {
  const exists = await fileExists("./diffkit.json");
  if (exists) {
    config = new Conf({
      configName: "diffkit",
      cwd: ".",
    });
  }
};


/*
async function postMetric (apiKey, questId, value) {
  if (!questId) {
    throw new Error("diffkit.metric needs a QUESTID");
  }
  if (value == null) {
    throw new Error("diffkit.metric needs a VALUE");
  }
  if (!apiKey) {
    throw new Error("diffkit.metric needs an API_KEY");
  }
  let response;
  try {
    response = await axios.post(
      `https://diffkit.com/api/quest/${questId}/metric?api_key=${apiKey}`, {
      value,
    });
    if (response.status !== 200) {
      throw new Error(`Non-200 response from diffkit.com: ${response.status}`)
    }
  } catch (ex) {
    console.log("There was some error hitting diffkit.com: ", ex);
  }
}
*/

/* async function getLatestMetric (apiKey, questId, value) {
  if (!questId) {
    throw new Error("diffkit.metric needs a QUESTID");
  }
  if (!apiKey) {
    throw new Error("diffkit.metric needs an API_KEY");
  }
  let response;
  try {
    response = await axios.get(
      `https://diffkit.com/api/quest/${questId}/metric?api_key=${apiKey}`, {
      value,
    });
    if (response.status !== 200) {
      throw new Error(`Non-200 response from diffkit.com: ${response.status}`)
    }
  } catch (ex) {
    console.log("There was some error hitting diffkit.com: ", ex);
  }
}
 */
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

const actionCount = async function(options = {}) {
  const quests = config.get("quests");
  const checks = [];
  const start = new Date();
  let hadABreach = false;  // the new code is worse than the old code for this quest

  await Promise.all(Object.keys(quests).map(async name => {
    const quest = quests[name];
    const questStart = new Date();
    const result = await countQuest(quest);
    hadABreach = hadABreach || failedBaseline(quest, result);
    logQuestResult(name, quest, result, Date.now() - questStart.getTime());
  }));

  if (hadABreach && options.check) {
    console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
    process.exit(1);
  }
  console.log(`Done in ${(Date.now() - start.getTime())} ms.`);
  process.exit(0);
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
    process.exit(1);
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
    process.exit(0);
  }

};

const actionCinch = async (questName) => {
  if (!config) {
    // TODO should just call actionInit instead of exiting
    console.error("Error: There's no config to add a quest to.  Use `diffkit init` to create one.");
    process.exit(1);
  }
  const quests = config.get("quests");
  const quest = quests[questName];

  if (!quest) {
    console.error("No quest by that name exists.  Possible quest names: ");
    for (const name in quests) {
      console.error(`* ${name}`);
    }
    process.exit(1);
  }
  const count = await countQuest(quest);
  const hadABreach = failedBaseline(quest, count);
  if (hadABreach) {
    console.error("Cannot cinch a metric that doesn't even meet the baseline");
    console.error(`${RED_X} ${chalk.red.bold(questName)}: ${count} (expected ${quest.baseline} or ${quest.minimize ? "less" : "more"})`);
    process.exit(1);
  }
  config.set(`quests.${questName}.baseline`, count);
  console.log(`Quest ${questName} cinched to ${count}`);


}

// run!
const run = async function(action, param1, flags) {
  await getConfig();
  switch (action) {
    case "init": return actionInit();     // create the config
    case "quest": return actionQuest();   // add a quest to the config
    case "count": return actionCount();   // run the quest counter
    case "check": return actionCount({check: true});   // count + fail if warranted
    case "cinch": return actionCinch(param1);   // count + fail if warranted
    //case "report-from-build": return report(); // report a count from the build
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
        action: {
            type: 'string',
        }
    }
});

run(cli.input[0], cli.input[1]);


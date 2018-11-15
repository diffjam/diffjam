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

class NonZeroExitError extends Error {
  constructor(msg) {
    super(msg);
    this.name = this.constructor.name;
  }
}

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
  }
};

async function postMetrics (apiKey, successes, breaches) {
  let response;
  const body = {
    successes,
    breaches,
  };
  try {
    response = await axios.post(
      `https://gitratchet.com/api/record?api_key=${apiKey}`, {
      body,
    });
    if (response.status !== 200) {
      throw new Error(`Non-200 response from diffkit.com: ${response.status}`);
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
  const matches = Number.parseInt(res2.stdout, 10);
  return matches;
}

const logQuestResult = (name, quest, result, duration) => {
  if (failedBaseline(quest, result)) {
    return console.error(`${RED_X} ${chalk.red.bold(name)}: ${result} (expected ${quest.baseline} or ${quest.minimize ? "less" : "more"})`);
  }
  return console.log(`${GREEN_CHECK} ${chalk.bold(name)}: ${result} (in ${duration} ms)`);
};

function failedBaseline (quest, result) {
  if (quest.minimize && (quest.baseline < result)) {
    return true;
  }
  if (quest.maximize && (quest.baseline > result)) {
    return true;
  }
  return false;
}

const getResults = async () => {
  const quests = config.get("quests");
  const successes = [];
  const breaches = [];

  await Promise.all(Object.keys(quests).map(async name => {
    const quest = quests[name];
    const questStart = new Date();
    const result = await countQuest(quest);
    if (failedBaseline(quest, result)) {
      breaches.push({name, quest, result, duration: Date.now() - questStart.getTime()})
    } else {
      successes.push({name, quest, result, duration: Date.now() - questStart.getTime()})
    }
    logQuestResult(name, quest, result, Date.now() - questStart.getTime());
  }));
  return {
    successes,
    breaches,
  }
}

const actionCount = async function(options = {}, flags = {}) {
  //console.log("options: ", options);
  //console.log("flags: ", flags);
  const start = new Date();
  const results = await getResults();
  const {breaches, successes} = results;


  if (breaches.length) {
    console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
  }

  if (flags.record) {
    console.log("sending metrics to server...");
    console.log("successes: ", successes);
    console.log("breaches: ", breaches);
    const apiKey = process.env.DIFFKIT_API_KEY;
    if (!apiKey) {
      console.error("Missing api key!  Could not post metrics");
      throw new NonZeroExitError();
    }
    await postMetrics(apiKey, successes, breaches);
  }

  if (breaches.length && options.check) {
    console.error(`${RED_X} ${chalk.red.bold("Check failed.")}`);
  }
  console.log(`Done in ${(Date.now() - start.getTime())} ms.`);

  if (breaches.length && options.check) throw new NonZeroExitError();
}

const actionInit = async () => {
  if (!config) {
    config = new Conf({
      configName: "diffkit",
      cwd: ".",
    });
    config.set("quests", {});
    console.log("Created diffkit.json for diffkit configuration.");
  } else {
    console.error("A diffkit.json already exists.  Skipping initialization.");
    throw new NonZeroExitError();
  }
}


// create a quest
const actionQuest = async function (name, command) {
  if (!config) {
    // TODO should just call actionInit instead of exiting
    console.error("Error: There's no config to add a quest to.  Use `diffkit init` to create one.");
    throw new NonZeroExitError();
  }

  if (!name) {
    ({ name } = await inquirer.prompt({
      "type": "input",
      "name": "name",
      "message": "Enter a name for this quest: "
    }))
  }

  if (!command) {
    ({ command } = await inquirer.prompt({
      "type": "input",
      "name": "command",
      "message": "Enter the command that will return your metric: ",
    }))
  }

  const quest = {
    command,
  };

  const matches = await countQuest(quest);

  const { trendDirection } = await inquirer.prompt({
    "type": "list",
    "name": "trendDirection",
    "choices": ["minimize", "maximize"],
    "message": `Do you want to minimize or maximize for this quest?`,
  });

  quest.minimize = trendDirection === "minimize";

  const { shouldContinue } = await inquirer.prompt({
    "type": "confirm",
    "name": "shouldContinue",
    "message": `There are currently ${matches} matches for that configuration.  Save it?`,
  });

  quest.baseline = matches;

  if (shouldContinue) {
    config.set(`quests.${name}`, quest);
    console.log("Saved!");
  } else {
    console.log("Cancelled save.");
  }
};

const actionCinch = async (questName) => {
  if (!config) {
    // TODO should just call actionInit instead of exiting
    console.error("Error: There's no config to add a quest to.  Use `diffkit init` to create one.");
    throw new NonZeroExitError();
  }

  const results = await getResults();

  /*
  const quests = config.get("quests");
  const quest = quests[questName];


  if (!quest) {
    console.error("No quest by that name exists.  Possible quest names: ");
    for (const name in quests) {
      console.error(`* ${name}`);
    }
    throw DONE;
  }

  const count = await countQuest(quest);
  const hadABreach = failedBaseline(quest, count);
  */
  if (results.breaches.length > 0) {
    const [firstBreach] = results.breaches;
    console.error("Cannot cinch a metric that doesn't even meet the baseline");
    console.error(`${RED_X} ${chalk.red.bold(firstBreach.name)}: ${firstBreach.result} (expected ${firstBreach.quest.baseline} or ${firstBreach.quest.minimize ? "less" : "more"})`);
    throw new NonZeroExitError();
  }

  for (const result of results.successes) {

    let exceeds = (result.quest.minimize && result.result < result.quest.baseline);
    exceeds = exceeds || (result.quest.maximize && result.result > result.quest.baseline);

    if (exceeds) {
      config.set(`quests.${result.name}.baseline`, result.result);
      console.log(`${GREEN_CHECK} ${chalk.bold(result.name)} was just cinched from ${result.quest.baseline} to ${chalk.bold(result.result)}!`);
    }

  }
}


// run!
// the _config argument is provided for testing so we can avoid dealing with the
// file system and just pass in javascript objects. It must satisfy the same get/set
// interface as Conf
const run = async function(action, param1, flags, _config) {
  if (_config) config = _config;
  switch (action) {
    case "init": return actionInit(); // create the config
    case "quest": return actionQuest(); // add a quest to the config
    case "count": return actionCount({}, flags); // run the quest counter
    case "check": return actionCount({check: true}); // count + fail if warranted
    case "cinch": return actionCinch(param1); // count + fail if warranted
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

module.exports = run;
if (module.parent == null) {
  // we set it up this way so we can throw errors where we want to, which is nice
  // for testing and also for control flow – when we want to exit early we can
  // just throw from anywhere. We have a sentiel value error that indicates some
  // expected error occurred and we want to exit with 1. Other errors are rethrown
  (async () => {
    try {
      await getConfig(cli.flags.config);
      await run(cli.input[0], cli.input[1], cli.flags);
    } catch (err) {
      if (err instanceof NonZeroExitError) {
        process.exitCode = 1;
      } else {
        throw err
      }
    }
  })()
}

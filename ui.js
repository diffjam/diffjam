const inquirer = require("inquirer");
// inquirer for getting input from prompts: https://www.npmjs.com/package/inquirer

// questions is a map of questions to values
exports.select = async (prompt, questions) => {
  const choices = [];
  for (const key in questions) {
    choices.push({name: key, value: questions[key]});
  }
  const { choice } = await inquirer.prompt({
    "type": "list",
    "name": "choice",
    choices,
    "message": prompt,
  });
  return choice;
}


exports.confirm = async (promptText) => {
  const { retval } = await inquirer.prompt({
    type: "confirm",
    name: "retval",
    message: promptText,
  });
  return retval;
}

exports.textInput = async (promptText) => {
  const { text } = await inquirer.prompt({
    type: "input",
    name: "text",
    message: promptText,
  });
  return text;
}
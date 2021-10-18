import { prompt as _prompt } from "inquirer";
// inquirer for getting input from prompts: https://www.npmjs.com/package/inquirer

// questions is a map of questions to values
export async function select(prompt: string, questions: {[key: string]: unknown}) {
  const choices = [];
  for (const key in questions) {
    choices.push({name: key, value: questions[key]});
  }
  const { choice } = await _prompt({
    "type": "list",
    "name": "choice",
    choices,
    "message": prompt,
  });
  return choice;
}


export async function confirm(promptText: string) {
  const { retval } = await _prompt({
    type: "confirm",
    name: "retval",
    message: promptText,
  });
  return retval;
}

export async function textInput(promptText: string): Promise<string> {
  const { text } = await _prompt({
    type: "input",
    name: "text",
    message: promptText,
  });
  return text;
}
const pshell = require("pshell");

module.exports = async (policy) => {
  let commandOutput;
  const {command} = policy;
  console.log("command: ", command)
  try {
    commandOutput = await pshell(command, {
      echoCommand: false,
      captureOutput: true,
      ignoreError: true,  // `git grep` errors with code 1 if it finds nothing, so we need to ignoreErrors :\
    });
  } catch (ex) {
    console.error("error running shell command ", ex);
    console.error("policy: ", policy);
    throw new Error("some error getting matches for countPolicy");
  }
  if (commandOutput.code !== 0) {
    const errorIsOkay = commandOutput.code === 1 && !commandOutput.stderr && commandOutput.stdout === "";
    // try to identify empty `git grep` results and not make them error. ^^^ 
    if (!errorIsOkay) {
      console.log("commandOutput: ", commandOutput);
      console.error("policy: ", policy);
      throw new Error("non-zero exit getting matches for countPolicy");
    }
  }
  console.log("commandOutput: ", commandOutput);
  examples = commandOutput.stdout.split("\n").filter(Boolean);
  console.log("examples: ", examples);
  count = examples.length;
  return {count, examples};
}

import { Config } from "../Config";
import { CurrentWorkingDirectory } from "../CurrentWorkingDirectory";
import { logCheckFailedError, logResults } from "../log";

export const actionCheck = async function (conf: Config, cwd: CurrentWorkingDirectory) {
  const results = await logResults(conf, cwd);
  const { breaches } = results;

  if (breaches.length) {
    logCheckFailedError();
    process.exitCode = 1;
  }
};

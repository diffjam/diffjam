import { logCheckFailedError, logResults } from "../log";
import { Runner } from "../Runner";

export const actionCheck = async function (runner: Runner) {
  const results = await logResults(runner);
  const { breaches } = results;

  if (breaches.length) {
    logCheckFailedError();
    process.exitCode = 1;
  }
};

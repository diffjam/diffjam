import { logCheckFailedError, logResults } from "../log";

export const actionCheck = async function () {
  const start = new Date();
  const results = await logResults();
  const { breaches } = results;

  if (breaches.length) {
    logCheckFailedError();
    process.exitCode = 1;
  }
  console.log(`Done in ${Date.now() - start.getTime()} ms.`);
};

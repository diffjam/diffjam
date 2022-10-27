
import { Runner } from "../Runner";

export const actionRemovePolicy = async function (policyName: string, runner: Runner) {
  const policy = runner.config.getPolicy(policyName);

  if (!policy) {
    console.error("There was no policy named: ", policyName);
    return process.exit(1);
  }

  runner.config.deletePolicy(policyName);
};

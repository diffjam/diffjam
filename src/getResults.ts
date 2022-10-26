import { map } from "bluebird";
import { Match } from "./match";
import { Policy } from "./Policy";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Config } from "./Config";
import { readFile } from "fs"
import ProgressBar from "progress";


interface ThingWithTick {
  tick: () => void;
}

export const getResults = async (currentWorkingDirectory: CurrentWorkingDirectory, conf: Config): Promise<Policy[]> => {

  const policies = conf.policyMap;
  const policiesList = Object.values(policies);

  const patternsToMatch = new Set<string>()
  const policyList = Object.values(policies)
  policyList.forEach(policy => patternsToMatch.add(policy.filePattern))

  const filesMatchingAnyPattern: string[] = await currentWorkingDirectory.allNonGitIgnoredFilesMatchingPatterns(Array.from(patternsToMatch)) as string[]

  const bar = new ProgressBar('searching for policy violations: [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: filesMatchingAnyPattern.length,
  });

  const filesConfirmedToMatchFile = filesMatchingAnyPattern.filter(file => {
    let fileUnderPolicy = false
    for (const policy of policiesList) {
      if (policy.fileUnderPolicy(file)) {
        fileUnderPolicy = true
      }
    }
    if (!fileUnderPolicy) {
      bar.tick();
    }
    return fileUnderPolicy;
  });

  await map(filesConfirmedToMatchFile, (filePath: string) => {
    const interestedPolicies = policiesList.filter(policy => policy.filesToCheck.has(filePath))

    return new Promise<void>((resolve, reject) => {
      readFile(filePath, { encoding: "utf8" }, (err, fileContents) => {
        if (err) reject(err);
        interestedPolicies.forEach(policy => {
          policy.processFile(filePath, fileContents);
        })
        bar.tick();
        resolve();
      })
    })
  }, { concurrency: 10 });

  return policiesList
};

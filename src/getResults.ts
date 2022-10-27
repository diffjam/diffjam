import { map } from "bluebird";
import { Policy } from "./Policy";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Config } from "./Config";
import { readFile } from "fs"


export const getResults = async (currentWorkingDirectory: CurrentWorkingDirectory, conf: Config): Promise<Policy[]> => {

  const policies = conf.policyMap;
  const policiesList = Object.values(policies);

  const patternsToMatch = new Set<string>()
  const policyList = Object.values(policies)
  policyList.forEach(policy => patternsToMatch.add(policy.filePattern))

  const filesMatchingAnyPattern: string[] = await currentWorkingDirectory.allNonGitIgnoredFilesMatchingPatterns(Array.from(patternsToMatch)) as string[]

  const filesConfirmedToMatchFile = filesMatchingAnyPattern.filter(file => {
    let fileUnderPolicy = false
    for (const policy of policiesList) {
      if (policy.fileUnderPolicy(file)) {
        fileUnderPolicy = true
      }
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
        resolve();
      })
    })
  }, { concurrency: 10 });

  return policiesList
};

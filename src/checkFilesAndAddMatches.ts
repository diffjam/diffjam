import { map } from "bluebird";
import { readFile } from "fs"
import { join } from "path";
import { Policy } from "./Policy";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Flags } from "./flags";

// Note: this function is mutative, adding matches to the provided policies
export const checkFilesAndAddMatches = async (
  currentWorkingDirectory: CurrentWorkingDirectory,
  policies: Policy[],
  flags: Flags
): Promise<{
  policies: Policy[],
  filesChecked: string[],
}> => {
  const patternsToMatch = new Set<string>()
  const policyList = Object.values(policies)
  policyList.forEach(policy => patternsToMatch.add(policy.filePattern))

  const filesMatchingAnyPattern: string[] = await currentWorkingDirectory.allNonGitIgnoredFilesMatchingPatterns(Array.from(patternsToMatch)) as string[]

  const filesAtLeastOnePolicyNeedsToCheck = filesMatchingAnyPattern.filter(file => {
    let fileUnderPolicy = false
    for (const policy of policies) {
      if (policy.addFileToCheckIfUnderPolicy(file)) {
        fileUnderPolicy = true
      }
    }
    return fileUnderPolicy;
  });

  await map(filesAtLeastOnePolicyNeedsToCheck, (filePath: string) => {
    if (flags.verbose) console.log("checking", filePath)
    const interestedPolicies = policies.filter(policy => policy.filesToCheck.has(filePath))

    return new Promise<void>((resolve, reject) => {
      readFile(join(currentWorkingDirectory.cwd, filePath), { encoding: "utf8" }, (err, fileContents) => {
        if (err) reject(err);
        interestedPolicies.forEach(policy => {
          policy.processFile(filePath, fileContents);
        })
        resolve();
      })
    })
  }, { concurrency: 10 });

  return {
    policies,
    filesChecked: filesAtLeastOnePolicyNeedsToCheck
  }
};

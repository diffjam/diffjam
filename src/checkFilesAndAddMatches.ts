import { map } from "bluebird";
import { readFile } from "fs"
import { join } from "path";
import { Policy } from "./Policy";
import { File } from "./File";
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

  console.log(policyList);

  const filesMatchingAnyPattern = await currentWorkingDirectory.allNonGitIgnoredFilesMatchingPatterns(Array.from(patternsToMatch))

  console.log(filesMatchingAnyPattern)

  // While a file may have matched a given pattern, the ignoreFilePatterns may
  // have excluded it from the policy. So we only include files that match at
  // least one policy. This step also adds the files to the policy's filesToCheck
  // so we don't have to retest whether a file is under a policy later and we can
  // be sure we've checked all files under a policy.
  const filesAtLeastOnePolicyNeedsToCheck = filesMatchingAnyPattern.filter(file => {
    let fileUnderPolicy = false
    for (const policy of policies) {
      if (policy.addFileToCheckIfUnderPolicy(file)) {
        fileUnderPolicy = true
      }
    }
    return fileUnderPolicy;
  }).sort();

  // We can now process the files we know to be relevant in parallel.
  // 
  await map(filesAtLeastOnePolicyNeedsToCheck, (filePath: string) => {
    if (flags.verbose) console.log("checking", filePath)

    return new Promise<void>((resolve, reject) => {
      readFile(join(currentWorkingDirectory.cwd, filePath), { encoding: "utf8" }, (err, fileContents) => {
        if (err) return reject(err);
        const file = new File(filePath, fileContents);
        policies.forEach(policy => policy.processFile(file))
        resolve();
      })
    })
  }, { concurrency: 8 });

  return {
    policies,
    filesChecked: filesAtLeastOnePolicyNeedsToCheck
  }
};

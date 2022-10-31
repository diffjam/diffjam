import { readFile } from "fs"
import { join } from "path";
import { Policy } from "./Policy";
import { FileMatcher } from "./FileMatcher";
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

  return new Promise<any>((resolve, reject) => {
    let inProgress = 0;
    let closed = false
    const queued: string[] = [];
    const filesChecked: string[] = []

    function processFile(filePath: string) {
      inProgress++;
      readFile(join(currentWorkingDirectory.cwd, filePath), { encoding: "utf8" }, (err, fileContents) => {
        if (err) return reject(err);
        const fileMatcher = new FileMatcher(filePath, fileContents, policies);
        fileMatcher.findMatches();

        // policies.forEach(policy => policy.processFile(file))
        filesChecked.push(filePath);
        inProgress--;
        if (queued.length) {
          processFile(queued.shift()!);
        } else if (closed) {
          resolve({ policies, filesChecked });
        }
      })
    }

    currentWorkingDirectory.allNonGitIgnoredFiles(filePath => {
      let fileUnderPolicy = false
      for (const policy of policies) {
        if (policy.addFileToCheckIfUnderPolicy(filePath)) {
          fileUnderPolicy = true
        }
      }
      if (fileUnderPolicy) {
        if (inProgress < 8) {
          processFile(filePath);
        } else {
          queued.push(filePath);
        }
      }
    }, () => {
      closed = true;
      if (inProgress === 0) {
        resolve({ policies, filesChecked });
      }
    })
  })
};

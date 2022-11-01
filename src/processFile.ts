import { readFile } from "fs";
import { join } from "path";
import { File } from "./File";
import { Match } from "./match";
import { Policy } from "./Policy";

export function processFile(
  filePath: string,
  cwd: string,
  policies: Policy[],
  onMatch: (match: Match, policy: Policy) => void,
  onDone: (filePath: string) => void,
) {
  readFile(join(cwd, filePath), { encoding: "utf8" }, (err, fileContents) => {
    if (err) throw err;
    const file = new File(filePath, fileContents);
    policies.forEach(policy => policy.processFile(file, onMatch));
    onDone(filePath);
  })
}

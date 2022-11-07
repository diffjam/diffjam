// used by vs-code plugin
import { Config } from "./Config";
import { GitIgnore } from "./GitIgnore";
import { FileMatcher } from "./FileMatcher";
import { FileBreach } from "./match";


export const findBreachesInText = (
  filePath: string,
  text: string,
  conf: Config,
  gitignore: GitIgnore
): FileBreach[] => {
  const fileBreaches: FileBreach[] = [];
  const file = new FileMatcher(filePath, text);
  for (const policy of Object.values(conf.policyMap)) {
    if (gitignore.isIgnored(filePath)) continue;
    if (!policy.isFileUnderPolicy(filePath)) continue;
    file.findMatches(policy.needles, match =>
      fileBreaches.push({
        ...match,
        message: policy.description,
        severity: 1
      }));
  }
  return fileBreaches;
}

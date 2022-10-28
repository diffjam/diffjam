import { Config } from "./Config";
import { GitIgnore } from "./GitIgnore";
import { File } from "./File";
import { FileBreach } from "./match";


// used by vs-code plugin
export const findBreachesInText = (
  filePath: string,
  text: string,
  conf: Config,
  gitignore: GitIgnore
): FileBreach[] => {
  const fileBreaches: FileBreach[] = [];
  const file = new File(filePath, text);
  for (const policy of Object.values(conf.policyMap)) {
    if (gitignore.isIgnored(filePath)) continue;
    if (!policy.isFileUnderPolicy(filePath)) continue;
    const matches = file.findMatches(policy.needles)
    const breaches: FileBreach[] = matches.map((match) => ({
      ...match,
      message: policy.description,
      severity: 1
    }));
    fileBreaches.push(...breaches);
  }
  return fileBreaches;
}

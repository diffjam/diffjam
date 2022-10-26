// import { flatten, compact } from "lodash";
// import { Config } from "./Config";
// import * as configFile from "./configFile";
// import { pathMatchesPatterns } from "./getPathsMatchingPattern";
// import { findFirstNeedle, Needle, Policy, testNeedle } from "./Policy";

// interface FileBreach {
//     lineNumber: number; // the lineNumber, 1-indexed
//     found: string; // the match.  we can do squigglies based on its beginning/end
//     wholeLine: string; // the entire line that the match is in.  used for subsequent needles.
//     message: string; // the policy description.
// }

// // see if our sequence of regexes all match the line
// const findNeedleInBreach = (needles: Needle[], breach: FileBreach): boolean => {
//   for (const needle of needles) {
//     if (!testNeedle(needle, breach.wholeLine)) {
//       return false;
//     }
//   }
//   return true;
// }

// // filter out lines without a match on the entire sequence of regexps
// const filterBreachesWithMoreNeedles = (needles: Needle[], matches: FileBreach[]): FileBreach[] => {
//   const retval = matches.filter((match) => findNeedleInBreach(needles, match))
//   return retval;
// }

// const newLineRegExp = "\n";

// const findPolicyBreachesInString = (policy: Policy, haystack: string): FileBreach[] => {
//   const lines = haystack.split(newLineRegExp);
//   const needles = policy.needles;
//   const needle = needles[0];
//   const message = policy.description;
//   const matches: FileBreach[] = compact(
//     lines.map((line, i) => {
//       const lineNumber = i + 1;
//       const found = findFirstNeedle(needle, line);
//       if (found) {
//         return {
//           found,
//           lineNumber,
//           wholeLine: line,
//           message,
//         };
//       }
//       return null;
//     }),
//   );
//   if (needles.length === 1 || matches.length === 0){
//       return matches;
//   }
//   return filterBreachesWithMoreNeedles(needles.slice(1), matches);
// };

// // used by vs-code plugin
// export const findBreachesInText = async (filePath: string, text: string, conf?: Config): Promise<FileBreach[]> => {
//   if (!conf) {
//     conf = await configFile.getConfig();
//   }
//   const policies = conf.policyMap;
//   const fileBreaches: FileBreach[][] = [];
//   for (const policyName in policies) {
//       const policy = policies[policyName];
//       if (!pathMatchesPatterns(filePath, [policy.filePattern])) {
//         continue;
//       }
//       const policyBreaches = findPolicyBreachesInString(policy, text);
//       fileBreaches.push(policyBreaches);
//   }
//   return flatten(fileBreaches);

// }
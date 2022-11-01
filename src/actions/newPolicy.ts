// import { Policy } from "../Policy";
// import { Runner } from "../Runner";

// // create a policy
// export const actionNewPolicy = async (runner: Runner) => {
//   // Requiring ui inline as 
//   const ui = require("../ui");

//   const name = await ui.textInput("Enter a name for this policy: ");

//   const isRegex = await ui.confirm("Is this a regex search?");

//   let search: string
//   const negativeSearchTerms = []

//   if (isRegex) {
//     const regex = await ui.textInput(
//       "Enter the regex to search for: "
//     );
//     search = `regex:${regex}`;
//   } else {
//     search = await ui.textInput(
//       "Enter the string to match : "
//     );

//     while (true) {
//       const negativeSearchTerm = await ui.textInput(
//         "Enter any string to negate (or leave blank to continue): "
//       );

//       if (negativeSearchTerm.trim()) {
//         negativeSearchTerms.push(negativeSearchTerm);
//       } else {
//         break;
//       }
//     }
//   }

//   const filePattern = await ui.textInput(
//     "Enter the filePattern to search for this policy: "
//   );

//   const ignoreFilePatterns = []
//   while (true) {
//     const ignoreFilePattern = await ui.textInput(
//       "Enter any filePatterns to ignore (or leave blank to continue): "
//     );

//     if (ignoreFilePattern.trim()) {
//       ignoreFilePatterns.push(ignoreFilePattern);
//     } else {
//       break;
//     }
//   }

//   const policy = new Policy(name, "", filePattern, [search, ...negativeSearchTerms], 0, ignoreFilePatterns);

//   policy.description = await ui.textInput(
//     "Give a description for this policy: "
//   );

//   runner.config.setPolicy(policy);
//   await runner.checkFilesAndAddMatchesForPolicy(policy.name)
//   policy.baseline = policy.matches.length;

//   if (
//     await ui.confirm(
//       `There are currently ${policy.baseline} matches for that configuration. Save it?`
//     )
//   ) {
//     runner.config.write();
//     console.log("Saved!");
//   } else {
//     console.log("Cancelled save.");
//   }
// }

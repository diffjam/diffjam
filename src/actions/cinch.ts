// import chalk from "chalk";
// import { GREEN_CHECK, logResults } from "../log";
// import { Runner } from "../Runner";

// export const actionCinch = async (runner: Runner) => {
//   const { breaches, successes } = await logResults(runner);

//   /*
//   const policies = config.get("policies");
//   const quest = policies[questName];

//   if (!quest) {
//     console.error("No quest by that name exists.  Possible quest names: ");
//     for (const name in policies) {
//       console.error(`* ${name}`);
//     }
//     process.exitCode = 1;
//     return;
//   }

//   const count = await countQuest(quest);
//   const hadABreach = failedBaseline(quest, count);
//   */
//   if (breaches.length > 0) {
//     console.error(
//       chalk.bold(
//         "Cannot cinch a policy that doesn't even meet the baseline. \n"
//       )
//     );
//     process.exitCode = 1;
//     return;
//   }

//   let anyCinched = false;
//   for (const success of successes) {
//     if (success.isCountCinchable()) {
//       anyCinched = true;
//       const before = success.baseline;
//       success.baseline = success.matches.length;
//       console.log(
//         `${GREEN_CHECK} cinching ${chalk.bold(success.name)} from ${before
//         } to ${chalk.bold(success.matches.length.toString())}!`
//       );
//     }
//   }

//   if (anyCinched) {
//     runner.config.write();
//   } else {
//     console.log(`${GREEN_CHECK} ${chalk.bold("All policies are already exactly at their baseline, so none were cinched")}`);
//   }
// }
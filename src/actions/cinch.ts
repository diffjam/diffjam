// import chalk from "chalk";
// import { GREEN_CHECK, logResults } from "../log";
// import * as configFile from "../configFile";

// export const actionCinch = async () => {
//   const config = await configFile.getConfig();

//   const { breaches, successes } = await logResults();

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
//         "Cannot cinch a metric that doesn't even meet the baseline. \n"
//       )
//     );
//     process.exitCode = 1;
//     return;
//   }

//   for (const success of successes) {
//     if (success.policy.isCountCinchable(success.result)) {
//       const before = success.policy.baseline;
//       success.policy.baseline = success.result;
//       config.setPolicy(success.name, success.policy);
//       configFile.writeConfig(config);
//       console.log(
//         `${GREEN_CHECK} ${chalk.bold(success.name)} was just cinched from ${
//         before
//         } to ${chalk.bold(success.result.toString())}!`
//       );
//     }
//   }
// }
import chalk from "chalk";

const logoBrown = chalk.rgb(74, 53, 47);
const logoYellow = chalk.rgb(241, 157, 56);

export const logo = (clientVersion: string) => `
 ${logoBrown.bold("_____")}    ${logoYellow("_")}    ${logoBrown.bold("__    __")}        ${logoBrown("_")}
${logoBrown.bold("|  __ \\")}  ${logoYellow("(_)")}  ${logoBrown.bold("/ _|  / _|")}      ${logoBrown("| |")}
${logoBrown.bold("| |  | |  _  | |_  | |_")}       ${logoBrown("| |   __ _   _ __ ___")}
${logoBrown.bold("| |  | | | | |  _| |  _|")}  ${logoBrown("_   | |  / _\` | | '_ \` _ \\")}
${logoBrown.bold("| |__| | | | | |   | |")}   ${logoBrown("| |__| | | (_| | | | | | | |")}
${logoBrown.bold("|_____/  |_| |_|   |_|")}    ${logoBrown("\\____/   \\__,_| |_| |_| |_|")}
                          ${logoBrown("version: ")} ${logoYellow(clientVersion)}
`;

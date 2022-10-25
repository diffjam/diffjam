"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logo = void 0;
var chalk_1 = __importDefault(require("chalk"));
var logoBrown = chalk_1.default.rgb(74, 53, 47);
var logoYellow = chalk_1.default.rgb(241, 157, 56);
var logo = function (clientVersion) { return "\n " + logoBrown.bold("_____") + "    " + logoYellow("_") + "    " + logoBrown.bold("__    __") + "        " + logoBrown("_") + "\n" + logoBrown.bold("|  __ \\") + "  " + logoYellow("(_)") + "  " + logoBrown.bold("/ _|  / _|") + "      " + logoBrown("| |") + "\n" + logoBrown.bold("| |  | |  _  | |_  | |_") + "       " + logoBrown("| |   __ _   _ __ ___") + "\n" + logoBrown.bold("| |  | | | | |  _| |  _|") + "  " + logoBrown("_   | |  / _\` | | '_ \` _ \\") + "\n" + logoBrown.bold("| |__| | | | | |   | |") + "   " + logoBrown("| |__| | | (_| | | | | | | |") + "\n" + logoBrown.bold("|_____/  |_| |_|   |_|") + "    " + logoBrown("\\____/   \\__,_| |_| |_| |_|") + "\n                          " + logoBrown("version: ") + " " + logoYellow(clientVersion) + "\n"; };
exports.logo = logo;

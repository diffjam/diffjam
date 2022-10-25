#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var meow_1 = __importDefault(require("meow"));
var configFile = __importStar(require("./src/configFile"));
var clientVersion_1 = require("./src/clientVersion");
var check_1 = require("./src/actions/check");
var cinch_1 = require("./src/actions/cinch");
var count_1 = require("./src/actions/count");
var init_1 = require("./src/actions/init");
var newPolicy_1 = require("./src/actions/newPolicy");
var policyModify_1 = require("./src/actions/policyModify");
var mainMenu_1 = require("./src/actions/mainMenu");
var clientVers = (0, clientVersion_1.clientVersion)();
// multispinner for showing multiple efforts at once: https://github.com/codekirei/node-multispinner
// asciichart for ascii line charts: https://www.npmjs.com/package/asciichart
process.on("unhandledRejection", function (err) {
    console.error("err: ", err);
    throw err;
});
// run!
var run = function (action, policyName, flags) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!action || action === "menu") {
                        return [2 /*return*/, (0, mainMenu_1.actionMainMenu)(clientVers)];
                    }
                    if (action === "init") {
                        return [2 /*return*/, (0, init_1.actionInit)(flags.config)];
                    }
                    return [4 /*yield*/, configFile.getConfig(flags.config)];
                case 1:
                    _a.sent();
                    switch (action) {
                        case "policy":
                            return [2 /*return*/, (0, newPolicy_1.actionNewPolicy)()]; // add a policy to the config
                        case "modify":
                            return [2 /*return*/, (0, policyModify_1.actionPolicyModify)(policyName)]; // add a policy to the config
                        case "count":
                            return [2 /*return*/, (0, count_1.actionCount)(flags, clientVers)]; // run the policy counter
                        case "check":
                            return [2 /*return*/, (0, check_1.actionCheck)()]; // count + fail if warranted
                        case "cinch":
                            return [2 /*return*/, (0, cinch_1.actionCinch)()]; // if there are no breaches, update the baselines to the strictest possible
                        default:
                            throw new Error("unknown action: " + action);
                    }
                    return [2 /*return*/];
            }
        });
    });
};
var cli = (0, meow_1.default)("\n    Usage\n      $ diffjam <action>\n\n    Examples\n      $ diffjam menu\n      $ diffjam count\n      $ diffjam check\n      $ diffjam report\n", {
    flags: {
        config: {
            type: "string",
            alias: "c"
        }
    }
});
// eslint-disable-next-line no-void
void run(cli.input[0], cli.input[1], cli.flags);

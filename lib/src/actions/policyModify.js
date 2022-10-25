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
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionPolicyModify = void 0;
var configFile = __importStar(require("../configFile"));
var match_1 = require("../match");
var ui = __importStar(require("../ui"));
var actionPolicyDescriptionEdit = function (name) {
    return __awaiter(this, void 0, void 0, function () {
        var conf, policy, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, configFile.getConfig()];
                case 1:
                    conf = _b.sent();
                    policy = conf.getPolicy(name);
                    if (!policy) {
                        console.error("There was no policy named: ", name);
                        return [2 /*return*/, process.exit(1)];
                    }
                    if (!policy.description) {
                        console.log("There currently is no description");
                    }
                    else {
                        console.log("The current description is: ");
                        console.log(policy.description);
                    }
                    _a = policy;
                    return [4 /*yield*/, ui.textInput("Give a new description: ")];
                case 2:
                    _a.description = _b.sent();
                    configFile.savePolicy(name, policy);
                    return [2 /*return*/];
            }
        });
    });
};
var actionCurrentState = function (name) {
    return __awaiter(this, void 0, void 0, function () {
        var conf, policy, matches, count;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, configFile.getConfig()];
                case 1:
                    conf = _a.sent();
                    policy = conf.getPolicy(name);
                    if (!policy) {
                        console.error("There was no policy named: ", name);
                        return [2 /*return*/, process.exit(1)];
                    }
                    return [4 /*yield*/, policy.findMatches()];
                case 2:
                    matches = _a.sent();
                    count = (0, match_1.countMatches)(matches);
                    console.log("Policy: ");
                    console.log("===============================");
                    console.log("name: ", name);
                    console.log("description: ", policy.description);
                    console.log("filePattern: ", policy.filePattern);
                    if (policy.ignoreFilePatterns)
                        console.log("ignoreFilePatterns: ", policy.ignoreFilePatterns);
                    console.log("search: ", policy.search);
                    console.log("regexes: ", policy.needles);
                    console.log("baseline: ", policy.baseline);
                    console.log("Current count is: ", count);
                    console.log("matches: ");
                    console.log(matches);
                    return [2 /*return*/];
            }
        });
    });
};
var actionPolicyBaselineFix = function (name) {
    return __awaiter(this, void 0, void 0, function () {
        var conf, policy, count, _a, oldBaseline;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, configFile.getConfig()];
                case 1:
                    conf = _b.sent();
                    policy = conf.getPolicy(name);
                    if (!policy) {
                        console.error("There was no policy named: ", name);
                        return [2 /*return*/, process.exit(1)];
                    }
                    _a = match_1.countMatches;
                    return [4 /*yield*/, policy.findMatches()];
                case 2:
                    count = _a.apply(void 0, [_b.sent()]);
                    if (policy.isCountAcceptable(count)) {
                        console.error("The baseline for that policy doesn't need to be fixed.  The count is " + count + " and the baseline is " + policy.baseline);
                        return [2 /*return*/, process.exit(1)];
                    }
                    oldBaseline = policy.baseline;
                    configFile.setPolicyBaseline(name, count);
                    console.log("The baseline for that policy was changed from " + oldBaseline + " to " + count);
                    return [2 /*return*/];
            }
        });
    });
};
var actionPolicyDelete = function (name) {
    return __awaiter(this, void 0, void 0, function () {
        var conf, policy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, configFile.getConfig()];
                case 1:
                    conf = _a.sent();
                    policy = conf.getPolicy(name);
                    if (!policy) {
                        console.error("There was no policy named: ", name);
                        return [2 /*return*/, process.exit(1)];
                    }
                    return [4 /*yield*/, ui.confirm("Are you sure you want to delete the policy named \"" + name + "\"?")];
                case 2:
                    if (!(_a.sent())) {
                        console.log("Deletion cancelled.");
                        return [2 /*return*/, process.exit(0)];
                    }
                    configFile.deletePolicy("policies." + name);
                    return [2 /*return*/];
            }
        });
    });
};
var actionHideFromOutput = function (name) {
    return __awaiter(this, void 0, void 0, function () {
        var conf, policy, currentValue, menuChoice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, configFile.getConfig()];
                case 1:
                    conf = _a.sent();
                    policy = conf.getPolicy(name);
                    currentValue = policy.hiddenFromOutput;
                    console.log("Output for \"" + name + "\" is currently " + (currentValue ? "hidden" : "not hidden"));
                    return [4 /*yield*/, ui.select("Please choose", {
                            "Show output (Check for regressions, show results, report metrics.  This is the default.)": false,
                            "Hide output (Check for regressions but don't show results or report metrics)": true
                        })];
                case 2:
                    menuChoice = _a.sent();
                    policy.hiddenFromOutput = menuChoice;
                    configFile.savePolicy(name, policy);
                    console.log("Output for \"" + name + "\" is now set to " + (menuChoice ? "hidden" : "not hidden"));
                    return [2 /*return*/];
            }
        });
    });
};
var actionPolicyModify = function (name) { return __awaiter(void 0, void 0, void 0, function () {
    var conf, policy, modifyMenuChoice;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, configFile.getConfig()];
            case 1:
                conf = _a.sent();
                policy = conf.getPolicy(name);
                if (!policy) {
                    console.error("There was no policy named: ", name);
                    return [2 /*return*/, process.exit(1)];
                }
                return [4 /*yield*/, ui.select("Choose an action", {
                        "see current state": { type: "see_current_state" },
                        delete: { type: "delete_policy" },
                        "edit description": { type: "policy_description_edit" },
                        "fix baseline": { type: "policy_baseline_fix" },
                        "hide from output (unless there are regressions)": {
                            type: "hideFromOutput"
                        },
                        exit: { type: "exit" }
                    })];
            case 2:
                modifyMenuChoice = _a.sent();
                switch (modifyMenuChoice.type) {
                    case "see_current_state":
                        return [2 /*return*/, actionCurrentState(name)];
                    case "policy_description_edit":
                        return [2 /*return*/, actionPolicyDescriptionEdit(name)];
                    case "delete_policy":
                        return [2 /*return*/, actionPolicyDelete(name)];
                    case "policy_baseline_fix":
                        return [2 /*return*/, actionPolicyBaselineFix(name)];
                    case "hideFromOutput":
                        return [2 /*return*/, actionHideFromOutput(name)];
                    case "exit":
                        return [2 /*return*/, process.exit(0)];
                    default:
                        throw new Error("unknown choice: " + modifyMenuChoice);
                }
                return [2 /*return*/];
        }
    });
}); };
exports.actionPolicyModify = actionPolicyModify;

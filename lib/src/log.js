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
exports.logResults = exports.logPolicyResult = exports.logCheckFailedError = exports.GREEN_CHECK = void 0;
var chalk_1 = __importDefault(require("chalk"));
var progress_1 = __importDefault(require("progress"));
var getResults_1 = require("./getResults");
var configFile = __importStar(require("./configFile"));
var RED_X = chalk_1.default.red("❌️");
exports.GREEN_CHECK = chalk_1.default.green("✔️");
var logCheckFailedError = function () {
    console.error(RED_X + " " + chalk_1.default.red.bold("Check failed."));
};
exports.logCheckFailedError = logCheckFailedError;
var logPolicyResult = function (name, policy, result, duration) {
    if (!policy.isCountAcceptable(result)) {
        return console.error(RED_X + " " + chalk_1.default.red.bold(name) + ": " + result + " (expected " + policy.baseline + " or fewer");
    }
    return console.log(exports.GREEN_CHECK + " " + chalk_1.default.bold(name) + ": " + result + " (in " + duration + " ms)");
};
exports.logPolicyResult = logPolicyResult;
var logBreachError = function (breach) {
    console.error(RED_X + " " + chalk_1.default.red.bold(breach.name) + ": " + breach.result + " (expected " + breach.policy.baseline + " or fewer");
    var count = Math.min(10, breach.examples.length);
    console.log(count > 1 ? "Violation:" : "Last " + count + " examples:");
    var examples = breach.examples.slice(0, count).map(function (b) { return b.path + ":" + b.number + " - " + b.line; });
    console.log(examples.join("\n"));
    if (breach.policy.description) {
        console.error("", chalk_1.default.magenta(breach.policy.description));
    }
};
var logResults = function () { return __awaiter(void 0, void 0, void 0, function () {
    var conf, policies, policiesList, bar, _a, results, successes, breaches;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, configFile.getConfig()];
            case 1:
                conf = _b.sent();
                policies = conf.policyMap;
                policiesList = Object.keys(policies);
                bar = new progress_1.default('searching for policy violations: [:bar] :percent :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 20,
                    total: policiesList.length * 2,
                });
                return [4 /*yield*/, (0, getResults_1.getResults)(bar)];
            case 2:
                _a = _b.sent(), results = _a.results, successes = _a.successes, breaches = _a.breaches;
                breaches.forEach(function (b) {
                    logBreachError(b);
                });
                successes.forEach(function (s) {
                    if (!s.policy.hiddenFromOutput) {
                        (0, exports.logPolicyResult)(s.name, s.policy, s.result, s.duration);
                    }
                });
                console.log("\n");
                return [2 /*return*/, {
                        results: results,
                        successes: successes,
                        breaches: breaches
                    }];
        }
    });
}); };
exports.logResults = logResults;

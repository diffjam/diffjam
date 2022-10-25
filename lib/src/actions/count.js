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
exports.actionCount = void 0;
var chalk_1 = __importDefault(require("chalk"));
var log_1 = require("../log");
var axios_1 = __importDefault(require("axios"));
var env_ci_1 = __importDefault(require("env-ci"));
var git_remote_origin_url_1 = __importDefault(require("git-remote-origin-url"));
var hosted_git_info_1 = __importDefault(require("hosted-git-info"));
var configFile = __importStar(require("../configFile"));
var git_1 = require("../git");
var hasProp_1 = require("../hasProp");
function postMetrics(apiKey, config, results, clientVersion, tags) {
    return __awaiter(this, void 0, void 0, function () {
        var response, body, ex_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = {
                        apiKey: apiKey,
                        clientVersion: clientVersion,
                        config: config,
                        results: results,
                        tags: tags
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post("https://diffjam.com/api/snapshot", body)];
                case 2:
                    response = _a.sent();
                    // TODO: Check if this is happening at all. Axios is failing if the status is not 200.
                    if (response.status < 200 || response.status > 299) {
                        throw new Error("Non-2xx response from diffjam.com: " + response.status);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    ex_1 = _a.sent();
                    if (ex_1.response.status === 400) {
                        // This is an expected error. Something is wrong (probably with the configuration);
                        console.error(chalk_1.default.red.bold("The error reported an issue with your configuration"));
                        console.error(chalk_1.default.red(JSON.stringify(ex_1.response.data)));
                    }
                    else {
                        console.log("There was some error hitting diffjam.com: ", ex_1);
                        console.log("ex.request.data: ", ex_1.request.data);
                        console.log("ex.response.data: ", ex_1.response.data);
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// [2020-05-03T16:57:29.737Z] env:  { isCi: true,
//   [2020-05-03T16:57:29.737Z]   name: 'Jenkins',
//   [2020-05-03T16:57:29.737Z]   service: 'jenkins',
//   [2020-05-03T16:57:29.737Z]   commit: 'f8178999c68ff64127539b4d147e3df9a8ba99ad',
//   [2020-05-03T16:57:29.737Z]   branch: 'PR-3632',
//   [2020-05-03T16:57:29.737Z]   build: '3',
//   [2020-05-03T16:57:29.737Z]   buildUrl: 'https://jenkins.classdojo.com/job/api/job/PR-3632/3/',
//   [2020-05-03T16:57:29.737Z]   root: '/mnt/dockerstorageiops/jenkins/jobs/api/workspace_PR-3632_3',
//   [2020-05-03T16:57:29.737Z]   pr: '3632',
//   [2020-05-03T16:57:29.737Z]   isPr: true,
//   [2020-05-03T16:57:29.737Z]   prBranch: 'PR-3632',
//   [2020-05-03T16:57:29.737Z]   slug: 'classdojo/api' }
function commentResults(apiKey, config, results, clientVers, tags) {
    return __awaiter(this, void 0, void 0, function () {
        var env, name, service, commit, isPr, pr, branch, slug, prBranch, response, remoteOriginUrl, gitServiceInfo, body, ex_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    env = (0, env_ci_1.default)();
                    name = env.name, service = env.service, commit = env.commit, isPr = env.isPr, pr = env.pr;
                    branch = env.branch, slug = env.slug, prBranch = env.prBranch;
                    console.log("pre env: ", env);
                    if (service === "jenkins") {
                        // this envCI library seems to mess up the jenkins branch, so let's fix it.
                        branch = process.env.CHANGE_BRANCH || branch;
                        console.log("CHANGE_BRANCH", process.env.CHANGE_BRANCH);
                        console.log("GIT_LOCAL_BRANCH", process.env.GIT_LOCAL_BRANCH);
                        console.log("GIT_BRANCH", process.env.GIT_BRANCH);
                        console.log("BRANCH_NAME", process.env.BRANCH_NAME);
                        env.branch = branch;
                        if (prBranch) {
                            prBranch = branch;
                            env.prBranch = prBranch;
                        }
                    }
                    if (!slug) {
                        slug = (0, git_1.gitUrlToSlug)(process.env.GIT_URL || "");
                        env.slug = slug;
                    }
                    console.log("post env: ", env);
                    return [4 /*yield*/, (0, git_remote_origin_url_1.default)()];
                case 1:
                    remoteOriginUrl = _a.sent();
                    gitServiceInfo = hosted_git_info_1.default.fromUrl(remoteOriginUrl);
                    if ((gitServiceInfo === null || gitServiceInfo === void 0 ? void 0 : gitServiceInfo.type) !== "github") {
                        throw new Error("diffjam does not support your git host in this release " + (gitServiceInfo === null || gitServiceInfo === void 0 ? void 0 : gitServiceInfo.type));
                    }
                    body = {
                        apiKey: apiKey,
                        clientVers: clientVers,
                        config: config,
                        results: results,
                        tags: tags,
                        ci_env: {
                            name: name,
                            service: service,
                            branch: branch,
                            commit: commit,
                            isPr: isPr,
                            pr: pr,
                            prBranch: prBranch,
                            slug: slug,
                            remoteOriginUrl: remoteOriginUrl,
                            gitService: gitServiceInfo.type,
                        }
                    };
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, axios_1.default.post("https://diffjam.com/api/ci", body)];
                case 3:
                    response = _a.sent();
                    if (response.status < 200 || response.status > 299) {
                        console.log("There was a non-2xx response from diffjam.com: " + response.status);
                        console.log("response.data: ", response.data);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    ex_2 = _a.sent();
                    if ((0, hasProp_1.hasProp)(ex_2, "response") && (0, hasProp_1.hasProp)(ex_2.response, "status") && ex_2.response.status === 400) {
                        // This is an expected error. Something is wrong (probably with the configuration);
                        console.error(chalk_1.default.red.bold("The error reported an issue with your configuration"));
                        (0, hasProp_1.hasProp)(ex_2.response, "data") && console.error(chalk_1.default.red(JSON.stringify(ex_2.response.data)));
                    }
                    else {
                        console.log("There was some error hitting diffjam.com: ", ex_2);
                        (0, hasProp_1.hasProp)(ex_2, "request") && (0, hasProp_1.hasProp)(ex_2.request, "data") && console.log("ex.request.data: ", ex_2.request.data);
                        (0, hasProp_1.hasProp)(ex_2, "response") && (0, hasProp_1.hasProp)(ex_2.response, "data") && console.log("ex.response.data: ", ex_2.response.data);
                    }
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
var actionCount = function (flags, clientVersion) {
    if (flags === void 0) { flags = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var start, _a, breaches, successes, results, verbose, conf, apiKey, configJson;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    start = new Date();
                    return [4 /*yield*/, (0, log_1.logResults)()];
                case 1:
                    _a = _b.sent(), breaches = _a.breaches, successes = _a.successes, results = _a.results;
                    verbose = Boolean(flags.verbose);
                    return [4 /*yield*/, configFile.getConfig()];
                case 2:
                    conf = _b.sent();
                    if (breaches.length) {
                        (0, log_1.logCheckFailedError)();
                    }
                    // console.log("flags: ", flags);
                    if (!flags.record && !flags.ci) {
                        console.log(chalk_1.default.green.bold("Done in " + (Date.now() - start.getTime()) + " ms."));
                        return [2 /*return*/];
                    }
                    console.log(chalk_1.default.yellow("sending metrics to server..."));
                    verbose &&
                        console.log(chalk_1.default.cyan("successes: " + JSON.stringify(successes)));
                    verbose && console.log(chalk_1.default.cyan("breaches: " + JSON.stringify(breaches)));
                    apiKey = process.env.DIFFJAM_API_KEY;
                    if (!apiKey) {
                        console.error(chalk_1.default.red("Missing api key!  Could not post metrics."));
                        console.error(chalk_1.default.red("You must have an api key in an environment variable named DIFFJAM_API_KEY"));
                        process.exitCode = 1;
                        return [2 /*return*/];
                    }
                    configJson = conf.toJson();
                    verbose && console.log("apiKey, config, results: ", apiKey, configJson, results);
                    if (!flags.record) return [3 /*break*/, 4];
                    return [4 /*yield*/, postMetrics(apiKey, configJson, results, clientVersion)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!flags.ci) return [3 /*break*/, 6];
                    if (!(0, env_ci_1.default)().isCi) {
                        throw new Error("could not detect CI environment");
                    }
                    return [4 /*yield*/, commentResults(apiKey, configJson, results, clientVersion)];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    console.log(chalk_1.default.green.bold("Done in " + (Date.now() - start.getTime()) + " ms."));
                    return [2 /*return*/];
            }
        });
    });
};
exports.actionCount = actionCount;

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
exports.actionNewPolicy = void 0;
var configFile = __importStar(require("../configFile"));
var match_1 = require("../match");
var Policy_1 = require("../Policy");
var ui = __importStar(require("../ui"));
// create a policy
var actionNewPolicy = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var conf, name, search, filePattern, ignoreFilePatterns, ignoreFilePattern, policy, _a, count, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, configFile.getConfig()];
            case 1:
                conf = _c.sent();
                return [4 /*yield*/, ui.textInput("Enter a name for this policy: ")];
            case 2:
                name = _c.sent();
                return [4 /*yield*/, ui.textInput("Enter the search criteria for this policy: ")];
            case 3:
                search = _c.sent();
                return [4 /*yield*/, ui.textInput("Enter the filePattern to search for this policy: ")];
            case 4:
                filePattern = _c.sent();
                ignoreFilePatterns = [];
                _c.label = 5;
            case 5:
                if (!true) return [3 /*break*/, 7];
                return [4 /*yield*/, ui.textInput("Enter any filePatterns to ignore (or leave blank to continue): ")];
            case 6:
                ignoreFilePattern = _c.sent();
                if (ignoreFilePattern.trim()) {
                    ignoreFilePatterns.push(ignoreFilePattern);
                }
                else {
                    return [3 /*break*/, 7];
                }
                return [3 /*break*/, 5];
            case 7:
                policy = new Policy_1.Policy("", filePattern, [search], 0, ignoreFilePatterns);
                _a = policy;
                return [4 /*yield*/, ui.textInput("Give a description for this policy: ")];
            case 8:
                _a.description = _c.sent();
                _b = match_1.countMatches;
                return [4 /*yield*/, policy.findMatches()];
            case 9:
                count = _b.apply(void 0, [_c.sent()]);
                policy.baseline = count;
                return [4 /*yield*/, ui.confirm("There are currently " + count + " matches for that configuration. Save it?")];
            case 10:
                if (_c.sent()) {
                    conf.setPolicy(name, policy);
                    configFile.writeConfig(conf, filePath);
                    console.log("Saved!");
                }
                else {
                    console.log("Cancelled save.");
                }
                return [2 /*return*/];
        }
    });
}); };
exports.actionNewPolicy = actionNewPolicy;

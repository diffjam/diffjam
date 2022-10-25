"use strict";
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
exports.getPathsMatchingPattern = exports.filterFile = exports.excludeDirectory = exports.pathMatchesPatterns = exports.getGitIgnorePatterns = exports.cleanIgnorePatterns = void 0;
var fdir_1 = require("fdir");
var findup_sync_1 = __importDefault(require("findup-sync"));
var parse_gitignore_1 = __importDefault(require("parse-gitignore"));
var micromatch_1 = __importDefault(require("micromatch"));
var fs_1 = __importDefault(require("fs"));
// import minimatch from "minimatch";
var cleanIgnorePatterns = function (ignorePatterns) {
    var retval = ignorePatterns.map(function (p) {
        if (p[0] && p[0] === "/") {
            return p.slice(1, p.length);
        }
        var lastChar = p[p.length - 1];
        if (lastChar && lastChar === "/") {
            return p.slice(0, p.length - 1);
        }
        return p;
    });
    return retval;
};
exports.cleanIgnorePatterns = cleanIgnorePatterns;
var cwd = process.cwd();
var gitignoreFile = (0, findup_sync_1.default)('.gitignore', { cwd: cwd });
var gitIgnorePatterns = [];
if (gitignoreFile) {
    var fileContents = fs_1.default.readFileSync(gitignoreFile).toString();
    gitIgnorePatterns = (0, exports.cleanIgnorePatterns)((0, parse_gitignore_1.default)(fileContents));
}
var getGitIgnorePatterns = function () { return gitIgnorePatterns; };
exports.getGitIgnorePatterns = getGitIgnorePatterns;
var pathMatchesPatterns = function (path, patterns) {
    // console.log("path ===============: ", path);
    // console.log("patterns: ", patterns);
    var retval = micromatch_1.default.any(path, patterns);
    // console.log("should ignore? ", retval);
    return retval;
};
exports.pathMatchesPatterns = pathMatchesPatterns;
var excludeDirectory = function (cwd, ignorePatterns, dirName, fullPath) {
    // exclude() runs before the glob to save the glob from traversing dirs
    // that it doesn't need to.
    //
    // This means that a lot of stuff that doesn't match the glob will
    // be in here.
    // console.log("fullPath: ", fullPath);
    // console.log("dirName: ", dirName);
    // console.log("cwd: ", cwd);
    // console.log("ignorePatterns: ", ignorePatterns);
    var testPath = fullPath.slice(cwd.length + 1, fullPath.length);
    // console.log("testPath: ", testPath);
    if (dirName.startsWith(".")) {
        // console.log('excluding dotfile');
        return true;
    }
    // console.log('testing shouldIgnore in exclude()');
    // console.log("shouldIgnore(", testPath, "): ", shouldIgnorePath(testPath, ignorePatterns));
    // console.log("shouldIgnore(", testPath + '/', "): ", shouldIgnorePath(testPath + '/', ignorePatterns));
    // console.log("shouldIgnore(", fullPath, "): ", shouldIgnorePath(fullPath, ignorePatterns));
    // console.log("shouldIgnore(", dirName, "): ", shouldIgnorePath(dirName, ignorePatterns));
    if ((0, exports.pathMatchesPatterns)(testPath, ignorePatterns) || (0, exports.pathMatchesPatterns)(testPath + "/", ignorePatterns)) {
        // console.log('excluding ignored dir');
        return true;
    }
    // console.log("not excluding dir: ", testPath);
    return false;
};
exports.excludeDirectory = excludeDirectory;
var filterFile = function (basePath, includePattern, ignorePatterns, path, isDirectory) {
    // console.log('in the filter');
    // no directories (but recurse)
    if (isDirectory)
        return false;
    // no diffjam.yaml
    if (path === "diffjam.yaml")
        return false;
    // ignore based on .gitignore
    // console.log("path: ", path);
    // console.log("checking shouldIgnore for path: ", path);
    // console.log("ignorePatterns: ", ignorePatterns);
    if ((0, exports.pathMatchesPatterns)(path, ignorePatterns)) {
        return false;
    }
    if (path.startsWith(basePath)) {
        path = path.slice(basePath.length, path.length);
    }
    if (path.startsWith("/")) {
        path = path.slice(1, path.length);
    }
    if ((0, exports.pathMatchesPatterns)(path, [includePattern])) {
        return true;
    }
    return false;
};
exports.filterFile = filterFile;
var cachedPaths = {};
var getPathsMatchingPattern = function (basePath, includePattern, ignorePatterns) { return __awaiter(void 0, void 0, void 0, function () {
    var allIgnorePatterns_1, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!!cachedPaths[includePattern]) return [3 /*break*/, 2];
                allIgnorePatterns_1 = (0, exports.getGitIgnorePatterns)().concat(ignorePatterns);
                // fdir's globbing just seems broken, so we implement our own in filterFile()
                _a = cachedPaths;
                _b = includePattern;
                return [4 /*yield*/, new fdir_1.fdir()
                        .withBasePath()
                        .filter(function (path, isDirectory) {
                        return (0, exports.filterFile)(basePath, includePattern, allIgnorePatterns_1, path, isDirectory);
                    })
                        .exclude(function (dirName, dirPath) { return (0, exports.excludeDirectory)(cwd, allIgnorePatterns_1, dirName, dirPath); })
                        .withErrors()
                        .crawl(basePath)
                        .withPromise()];
            case 1:
                // fdir's globbing just seems broken, so we implement our own in filterFile()
                _a[_b] = (_c.sent());
                _c.label = 2;
            case 2: return [2 /*return*/, cachedPaths[includePattern]];
        }
    });
}); };
exports.getPathsMatchingPattern = getPathsMatchingPattern;

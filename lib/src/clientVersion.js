"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientVersion = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var clientVersion = function () {
    var packagePath = path_1.default.resolve(__dirname + "/../../package.json");
    if (!fs_1.default.existsSync(packagePath)) {
        // try local dev path
        packagePath = path_1.default.resolve(__dirname + "/../package.json");
    }
    var packageJson = JSON.parse(fs_1.default.readFileSync(packagePath).toString());
    return packageJson.version;
};
exports.clientVersion = clientVersion;

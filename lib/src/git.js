"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitUrlToSlug = void 0;
// @ts-ignore
var urlgrey_1 = __importDefault(require("urlgrey"));
var gitUrlToSlug = function (gitUrl) {
    // looks like: https://github.com/org/repo.git
    if (!gitUrl) {
        return null;
    }
    var path = (0, urlgrey_1.default)(gitUrl).path();
    var slug = path.split(".")[0].substr(1);
    return slug;
};
var _gitUrlToSlug = gitUrlToSlug;
exports.gitUrlToSlug = _gitUrlToSlug;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var gitUrlToSlug = require("../src/git").gitUrlToSlug;
var expect_1 = __importDefault(require("expect"));
describe("gitUrlToSlug", function () {
    it("returns slug when given an input url", function () {
        var input = "https://github.com/org/repo.git";
        var output = gitUrlToSlug(input);
        (0, expect_1.default)(output).toEqual("org/repo");
    });
    it("returns null when given a null input", function () {
        var output = gitUrlToSlug();
        (0, expect_1.default)(output).toBeNull();
    });
});

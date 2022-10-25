"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var expect_1 = __importDefault(require("expect"));
var getPathsMatchingPattern_1 = require("../src/getPathsMatchingPattern");
describe("getPathsMatchingPatterns", function () {
    describe("cleanIgnorePatterns", function () {
        it("cleans leading slashes", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.cleanIgnorePatterns)(["/asdf"])).toEqual(["asdf"]);
        });
        it("cleans trailing  slashes", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.cleanIgnorePatterns)(["/asdf"])).toEqual(["asdf"]);
        });
    });
    describe("pathMatchesPatterns", function () {
        it("ignores a direct match", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.pathMatchesPatterns)("node_modules", ["node_modules"])).toEqual(true);
        });
        it("does not ignore a non-match", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.pathMatchesPatterns)("node_modules", ["blah"])).toEqual(false);
        });
    });
    describe("filterFile", function () {
        it("denies directories", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.filterFile)("/home/diffjam/test", "**/*", [], "asdf", true)).toEqual(false);
        });
        it("denies diffjam.yaml", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.filterFile)("/home/diffjam/test", "**/*", [], "diffjam.yaml", false)).toEqual(false);
        });
        it("denies an ignored file", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.filterFile)("/home/diffjam/test", "**/*", ["asdf.txt"], "asdf.txt", false)).toEqual(false);
        });
        it("allows an acceptable file for the most open pattern", function () {
            (0, expect_1.default)((0, getPathsMatchingPattern_1.filterFile)("/home/diffjam/test", "**/*", [], "asdf.txt", false)).toEqual(true);
        });
    });
    describe("excludeDirFn", function () {
        describe("gitignored", function () {
            it("includes unignored directories", function () {
                var dirName = "apiIntegrationService";
                var cwd = "/home/cainus/api";
                var fullPath = "/home/cainus/api/apiIntegrationService";
                var ignorePaths = ["nomatch"];
                (0, expect_1.default)((0, getPathsMatchingPattern_1.excludeDirectory)(cwd, ignorePaths, dirName, fullPath)).toEqual(false);
            });
            it("excludes ignored directories (exact match)", function () {
                var dirName = "apiIntegrationService";
                var cwd = "/home/cainus/api";
                var fullPath = "/home/cainus/api/apiIntegrationService";
                var ignorePaths = ["apiIntegrationService"];
                (0, expect_1.default)((0, getPathsMatchingPattern_1.excludeDirectory)(cwd, ignorePaths, dirName, fullPath)).toEqual(true);
            });
            it("excludes ignored directories (match with trailing slash)", function () {
                var dirName = "apiIntegrationService";
                var cwd = "/home/cainus/api";
                var fullPath = "/home/cainus/api/apiIntegrationService";
                var ignorePaths = ["apiIntegrationService/"];
                (0, expect_1.default)((0, getPathsMatchingPattern_1.excludeDirectory)(cwd, ignorePaths, dirName, fullPath)).toEqual(true);
            });
        });
        it("excludes dot directories", function () {
            var dirName = ".adsf";
            var cwd = "/home/cainus/api";
            var fullPath = "/home/cainus/api/.asdf";
            var ignorePaths = [];
            (0, expect_1.default)((0, getPathsMatchingPattern_1.excludeDirectory)(cwd, ignorePaths, dirName, fullPath)).toEqual(true);
        });
    });
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Policy_1 = require("../src/Policy");
var expect_1 = __importDefault(require("expect"));
var lodash_1 = require("lodash");
describe("Policy", function () {
    describe("#constructor", function () {
        it("creates a policy with default hiddenFromOutput = false", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 0);
            (0, expect_1.default)(policy.description).toEqual("test description");
            (0, expect_1.default)(policy.filePattern).toEqual("*.ts");
            (0, expect_1.default)(policy.search).toEqual(["needle"]);
            (0, expect_1.default)(policy.baseline).toEqual(0);
            (0, expect_1.default)(policy.hiddenFromOutput).toEqual(false);
        });
    });
    describe("#searchConfigToRegexes", function () {
        describe("with regex: prefix", function () {
            it("makes a regular expression out of searches", function () {
                var needles = Policy_1.Policy.searchConfigToNeedles(["regex:[a-z]{4}"]);
                (0, expect_1.default)(needles[0]).toEqual(/[a-z]{4}/);
            });
        });
        describe("with -: prefix", function () {
            it("creates a negating / inverse search", function () {
                var needles = Policy_1.Policy.searchConfigToNeedles(["-:asdf"]);
                if ((0, lodash_1.isString)(needles[0]))
                    throw new Error("it's a string");
                (0, expect_1.default)((0, Policy_1.testNeedle)(needles[0], "asdf")).toEqual(false);
                (0, expect_1.default)((0, Policy_1.testNeedle)(needles[0], "asd1")).toEqual(true);
            });
        });
        describe("with no prefix", function () {
            it("makes a regular expressions out of plain text searches", function () {
                var needles = Policy_1.Policy.searchConfigToNeedles([" R."]);
                (0, expect_1.default)((0, Policy_1.testNeedle)(needles[0], "asdf asd fdsf R. asdfasdfdsf")).toEqual(true);
                (0, expect_1.default)((0, Policy_1.testNeedle)(needles[0], "asdf asd fdsf Rasdfasdfdsf")).toEqual(false);
            });
            it("makes a regular expressions out of plain text searches", function () {
                var needles = Policy_1.Policy.searchConfigToNeedles([" R."]);
                (0, expect_1.default)((0, Policy_1.testNeedle)(needles[0], "asdf asd fdsf R. asdfasdfdsf")).toEqual(true);
                (0, expect_1.default)((0, Policy_1.testNeedle)(needles[0], "asdf asd fdsf Rasdfasdfdsf")).toEqual(false);
            });
        });
    });
    describe("#evaluateFileContents", function () {
        it("finds matches in a file", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 0);
            var matches = policy.evaluateFileContents("path", "-----\n                this is a test to find\n                the needle in the\n                haystack (or maybe there\n                are two needles!).\n            ");
            (0, expect_1.default)(matches.length).toEqual(2);
            (0, expect_1.default)(matches[1].number).toEqual(5);
        });
    });
    describe("#isCountAcceptable", function () {
        it("false when count is greater than baseline", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 1);
            var acceptable = policy.isCountAcceptable(2);
            (0, expect_1.default)(acceptable).toEqual(false);
        });
        it("true when count is less than baseline", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 1);
            var acceptable = policy.isCountAcceptable(0);
            (0, expect_1.default)(acceptable).toEqual(true);
        });
        it("true when count equals baseline", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 0);
            var acceptable = policy.isCountAcceptable(0);
            (0, expect_1.default)(acceptable).toEqual(true);
        });
    });
    describe("#isCountCinchable", function () {
        it("false when count is greater than baseline", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 1);
            var acceptable = policy.isCountCinchable(2);
            (0, expect_1.default)(acceptable).toEqual(false);
        });
        it("true when count is less than baseline", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 1);
            var acceptable = policy.isCountCinchable(0);
            (0, expect_1.default)(acceptable).toEqual(true);
        });
        it("false when count equals baseline", function () {
            var policy = new Policy_1.Policy("test description", "*.ts", ["needle"], 0);
            var acceptable = policy.isCountCinchable(0);
            (0, expect_1.default)(acceptable).toEqual(false);
        });
    });
});

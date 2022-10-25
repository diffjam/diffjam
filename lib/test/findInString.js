"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var findInString_1 = require("../src/findInString");
var expect_1 = __importDefault(require("expect"));
var ReverseRegExp_1 = require("../src/ReverseRegExp");
describe("#findInString", function () {
    it("finds a simple regex", function () {
        (0, expect_1.default)((0, findInString_1.findInString)("path", [/needle/], "asdf needle asdf")).toEqual([
            {
                number: 1,
                line: "asdf needle asdf",
                match: "needle",
                path: "path",
            }
        ]);
    });
    describe("negated regex", function () {
        it("gives all non-matches for a reverseregex", function () {
            var found = (0, findInString_1.findInString)("path", [new ReverseRegExp_1.ReverseRegExp("needle")], "asdf needle asdf\nasdf");
            (0, expect_1.default)(found).toEqual([
                {
                    number: 2,
                    line: "asdf",
                    match: "asdf",
                    path: "path",
                }
            ]);
        });
        it("works when the negation is a second criteria", function () {
            var found = (0, findInString_1.findInString)("path", [/[a-z]{4}/, new ReverseRegExp_1.ReverseRegExp("asdf")], "asdf\nasde\nasdf1");
            (0, expect_1.default)(found).toEqual([
                {
                    line: "asde",
                    match: "asde",
                    number: 2,
                    path: "path",
                },
            ]);
        });
    });
    describe("with multiple search criteria", function () {
        it("finds substrings with all search matches", function () {
            (0, expect_1.default)((0, findInString_1.findInString)("path", [/needle/, /qwer/], "asdf needle asdf\nasdf needle qwer")).toEqual([
                {
                    number: 2,
                    line: "asdf needle qwer",
                    match: "needle",
                    path: "path",
                }
            ]);
        });
        it("rejects lines that don't match all criteria", function () {
            var found = (0, findInString_1.findInString)("path", [/needle/, /qwer/], "asdf needle asdf\nasdf");
            (0, expect_1.default)(found.length).toEqual(0);
        });
    });
});

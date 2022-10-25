"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findInString = void 0;
var lodash_1 = require("lodash");
var hasProp_1 = require("./hasProp");
var Policy_1 = require("./Policy");
var cwd = process.cwd();
// see if our sequence of regexes all match the line
var findInMatch = function (needles, match) {
    for (var _i = 0, needles_1 = needles; _i < needles_1.length; _i++) {
        var needle = needles_1[_i];
        if (!(0, Policy_1.testNeedle)(needle, match.line)) {
            return false;
        }
    }
    return true;
};
// filter out lines without a match on the entire sequence of regexps
var findInMatches = function (needles, matches) {
    var retval = matches.filter(function (match) { return findInMatch(needles, match); });
    return retval;
};
var newLineRegExp = "\n";
var findInString = function (path, needles, haystack) {
    var matchArray = [];
    var lines = haystack.split(newLineRegExp);
    var needle = needles[0];
    var pathToPrint = path;
    if (pathToPrint.startsWith(cwd)) {
        pathToPrint = pathToPrint.slice(cwd.length + 1, pathToPrint.length);
    }
    lines.forEach(function (line, i) {
        var number = i + 1;
        if ((0, Policy_1.testNeedle)(needle, line)) {
            if ((0, lodash_1.isString)(needle)) {
                var retval_1 = {
                    line: line,
                    number: number,
                    match: needle,
                    path: pathToPrint,
                };
                matchArray.push(retval_1);
                return;
            }
            if ((0, hasProp_1.hasProp)(needle, "reversed")) {
                var retval_2 = {
                    line: line,
                    number: number,
                    match: line,
                    path: pathToPrint,
                };
                matchArray.push(retval_2);
                return;
            }
            // regexp
            var matches = needle.exec(line) || [];
            var match = matches[0];
            var retval = {
                line: line,
                number: number,
                match: match,
                path: pathToPrint,
            };
            matchArray.push(retval);
        }
    });
    if (needles.length === 1 || matchArray.length === 0) {
        return matchArray;
    }
    return findInMatches(needles.slice(1), matchArray);
};
exports.findInString = findInString;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Policy = exports.findFirstNeedle = exports.testNeedle = void 0;
var lodash_1 = require("lodash");
var findInString_1 = require("./findInString");
// eslint-disable-next-line arrow-body-style
var escapeStringRegexp = function (str) {
    return str
        .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        .replace(/-/g, "\\x2d");
};
var hasProp_1 = require("./hasProp");
var match_1 = require("./match");
var ReverseRegExp_1 = require("./ReverseRegExp");
var regexPrefix = "regex:";
var inversePrefix = "-:";
var testNeedle = function (needle, haystack) {
    if ((0, lodash_1.isString)(needle)) {
        return haystack.includes(needle);
    }
    return needle.test(haystack);
};
exports.testNeedle = testNeedle;
var findFirstNeedle = function (needle, haystack) {
    if ((0, lodash_1.isString)(needle) && haystack.indexOf(needle) !== -1) {
        return needle;
    }
    var matches = (needle.exec(haystack)) || [];
    return matches[0];
};
exports.findFirstNeedle = findFirstNeedle;
var Policy = /** @class */ (function () {
    function Policy(description, filePattern, search, baseline, ignoreFilePatterns, hiddenFromOutput) {
        if (hiddenFromOutput === void 0) { hiddenFromOutput = false; }
        this.description = description;
        this.filePattern = filePattern;
        this.search = search;
        this.baseline = baseline;
        this.hiddenFromOutput = hiddenFromOutput;
        this.needles = [];
        this.needles = Policy.searchConfigToNeedles(this.search);
        this.description = description;
        this.filePattern = filePattern;
        this.search = search;
        this.baseline = baseline;
        this.hiddenFromOutput = hiddenFromOutput;
        if (ignoreFilePatterns && ignoreFilePatterns.length) {
            if (!Array.isArray(ignoreFilePatterns)) {
                this.ignoreFilePatterns = [ignoreFilePatterns];
            }
            else {
                this.ignoreFilePatterns = ignoreFilePatterns;
            }
        }
    }
    Policy.prototype.toJson = function () {
        var json = {
            description: this.description,
            filePattern: this.filePattern,
            search: this.search,
            baseline: this.baseline,
            hiddenFromOutput: this.hiddenFromOutput,
        };
        if (this.ignoreFilePatterns)
            json.ignoreFilePatterns = this.ignoreFilePatterns;
        return json;
    };
    Policy.prototype.isCountAcceptable = function (count) {
        return count <= this.baseline;
    };
    Policy.prototype.isCountCinchable = function (count) {
        return count < this.baseline;
    };
    Policy.prototype.evaluateFileContents = function (path, contents) {
        return (0, findInString_1.findInString)(path, this.needles, contents);
    };
    Policy.prototype.findMatches = function () {
        return (0, match_1.findMatches)(this.filePattern, this.ignoreFilePatterns || [], this.needles);
    };
    Policy.searchConfigToNeedles = function (search) {
        // optimization? inverse strings don't need to be regexes
        var needles = search.map(function (i) {
            if (!i.startsWith(regexPrefix) && !i.startsWith(inversePrefix)) {
                // return i;
                return new RegExp(escapeStringRegexp(i));
            }
            if (i.startsWith(inversePrefix)) {
                var startIndex_1 = inversePrefix.length;
                var inverseString = i.slice(startIndex_1);
                return new ReverseRegExp_1.ReverseRegExp(escapeStringRegexp(inverseString));
            }
            var startIndex = regexPrefix.length;
            var regexString = i.slice(startIndex);
            return new RegExp(regexString);
        });
        return needles;
    };
    Policy.fromJson = function (obj) {
        if (!obj) {
            throw new Error("input was empty");
        }
        if (!(0, hasProp_1.hasProp)(obj, "baseline") || !(0, lodash_1.isNumber)(obj.baseline)) {
            throw new Error("missing baseline");
        }
        if (!(0, hasProp_1.hasProp)(obj, "search") || !(0, lodash_1.isString)(obj.search)) {
            if (Array.isArray(obj.search) && !obj.search.every(lodash_1.isString)) {
                console.error("obj: ", obj);
                throw new Error("missing search");
            }
        }
        if (!Array.isArray(obj.search)) {
            obj.search = [obj.search];
        }
        if (!(0, hasProp_1.hasProp)(obj, "filePattern") || !(0, lodash_1.isString)(obj.filePattern)) {
            throw new Error("missing filePattern");
        }
        if (!(0, hasProp_1.hasProp)(obj, "description") || !(0, lodash_1.isString)(obj.description)) {
            throw new Error("missing description");
        }
        if ((0, hasProp_1.hasProp)(obj, "hiddenFromOutput") && !(0, lodash_1.isBoolean)(obj.hiddenFromOutput)) {
            console.error("obj: ", obj);
            throw new Error("missing hiddenFromOutput");
        }
        return new Policy(obj.description, obj.filePattern, obj.search, obj.baseline, obj.ignoreFilePatterns, Boolean(obj.hiddenFromOutput));
    };
    return Policy;
}());
exports.Policy = Policy;

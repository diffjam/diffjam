"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReverseRegExp = void 0;
var ReverseRegExp = /** @class */ (function () {
    function ReverseRegExp(str) {
        this.reversed = true;
        this.regex = new RegExp(str);
    }
    ReverseRegExp.prototype.test = function (str) {
        return !this.regex.test(str);
    };
    return ReverseRegExp;
}());
exports.ReverseRegExp = ReverseRegExp;

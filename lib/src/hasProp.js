"use strict";
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-prototype-builtins */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasProp = void 0;
// export const hasProp = (obj: unknown, key: string) => Object.prototype.hasOwnProperty.call(obj, key)
// eslint-disable-next-line arrow-body-style
var hasProp = function (obj, prop) {
    return obj.hasOwnProperty(prop);
};
exports.hasProp = hasProp;

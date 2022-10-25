"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
var js_yaml_1 = require("js-yaml");
var hasProp_1 = require("./hasProp");
var Policy_1 = require("./Policy");
var Config = /** @class */ (function () {
    function Config(policyMap) {
        this.policyMap = policyMap;
    }
    Config.fromYaml = function (yaml) {
        var obj = (0, js_yaml_1.load)(yaml);
        var policyMap = {};
        if (!(0, hasProp_1.hasProp)(obj, "policies")) {
            return new Config(policyMap);
        }
        for (var _i = 0, _a = Object.keys(obj.policies); _i < _a.length; _i++) {
            var key = _a[_i];
            policyMap[key] = Policy_1.Policy.fromJson(obj.policies[key]);
        }
        return new Config(policyMap);
    };
    Config.prototype.getPolicy = function (name) {
        return this.policyMap[name];
    };
    Config.prototype.deletePolicy = function (name) {
        delete this.policyMap[name];
    };
    Config.prototype.setPolicy = function (name, policy) {
        this.policyMap[name] = policy;
    };
    Config.prototype.getPolicyNames = function () {
        return Object.keys(this.policyMap);
    };
    Config.prototype.toJson = function () {
        var retval = { policies: {} };
        for (var _i = 0, _a = Object.keys(this.policyMap); _i < _a.length; _i++) {
            var key = _a[_i];
            retval.policies[key] = this.policyMap[key].toJson();
        }
        return retval;
    };
    Config.prototype.toYaml = function () {
        var object = this.toJson();
        return (0, js_yaml_1.dump)(object, {
            'styles': {
                '!!null': 'canonical' // dump null as ~
            },
            'sortKeys': true // sort object keys
        });
    };
    return Config;
}());
exports.Config = Config;

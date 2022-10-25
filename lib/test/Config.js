"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Config_1 = require("../src/Config");
var Policy_1 = require("../src/Policy");
var expect_1 = __importDefault(require("expect"));
describe("Config", function () {
    describe("#fromYaml", function () {
        it("loads data from yaml", function () {
            var yaml = "policies:\n  myPolicy:\n    baseline: 0\n    description: description\n    filePattern: '*.ts'\n    hiddenFromOutput: false\n    search: TODO\n";
            var conf = Config_1.Config.fromYaml(yaml);
            var policy = conf.policyMap["myPolicy"];
            (0, expect_1.default)(policy.baseline).toEqual(0);
            (0, expect_1.default)(policy.description).toEqual("description");
            (0, expect_1.default)(policy.search).toEqual(["TODO"]);
            (0, expect_1.default)(policy.filePattern).toEqual("*.ts");
            (0, expect_1.default)(policy.hiddenFromOutput).toEqual(false);
            (0, expect_1.default)(policy.ignoreFilePatterns).toEqual(undefined);
        });
        it("allows ignoreFilePatterns", function () {
            var yaml = "policies:\n  myPolicy:\n    baseline: 0\n    description: description\n    filePattern: '*.ts'\n    hiddenFromOutput: false\n    search: TODO\n    ignoreFilePatterns:\n            - 'foo.js'\n";
            var conf = Config_1.Config.fromYaml(yaml);
            var policy = conf.policyMap["myPolicy"];
            (0, expect_1.default)(policy.baseline).toEqual(0);
            (0, expect_1.default)(policy.description).toEqual("description");
            (0, expect_1.default)(policy.search).toEqual(["TODO"]);
            (0, expect_1.default)(policy.filePattern).toEqual("*.ts");
            (0, expect_1.default)(policy.hiddenFromOutput).toEqual(false);
            (0, expect_1.default)(policy.ignoreFilePatterns).toEqual(['foo.js']);
        });
        it("coerces string ignoreFilePatterns to an array", function () {
            var yaml = "policies:\n  myPolicy:\n    baseline: 0\n    description: description\n    filePattern: '*.ts'\n    hiddenFromOutput: false\n    search: TODO\n    ignoreFilePatterns: foo.js\n";
            var conf = Config_1.Config.fromYaml(yaml);
            var policy = conf.policyMap["myPolicy"];
            (0, expect_1.default)(policy.baseline).toEqual(0);
            (0, expect_1.default)(policy.description).toEqual("description");
            (0, expect_1.default)(policy.search).toEqual(["TODO"]);
            (0, expect_1.default)(policy.filePattern).toEqual("*.ts");
            (0, expect_1.default)(policy.hiddenFromOutput).toEqual(false);
            (0, expect_1.default)(policy.ignoreFilePatterns).toEqual(['foo.js']);
        });
    });
    describe("#getPolicy", function () {
        it("returns the policy by name", function () {
            var myOtherPolicy = new Policy_1.Policy("description", "*.ts", ["TODO"], 0);
            var conf = new Config_1.Config({
                myPolicy: new Policy_1.Policy("description", "*.ts", ["TODO"], 0),
                myOtherPolicy: myOtherPolicy,
            });
            (0, expect_1.default)(conf.getPolicy("myOtherPolicy")).toEqual(myOtherPolicy);
        });
    });
    describe("#deletePolicy", function () {
        it("removes the policy by name", function () {
            var myOtherPolicy = new Policy_1.Policy("description", "*.ts", ["TODO"], 0);
            var conf = new Config_1.Config({
                myPolicy: new Policy_1.Policy("description", "*.ts", ["TODO"], 0),
                myOtherPolicy: myOtherPolicy,
            });
            conf.deletePolicy("myOtherPolicy");
            (0, expect_1.default)(conf.policyMap.myOtherPolicy).toBeUndefined();
        });
    });
    describe("#setPolicy", function () {
        it("sets the policy by name", function () {
            var myOtherPolicy = new Policy_1.Policy("description", "*.ts", ["TODO"], 0);
            var conf = new Config_1.Config({
                myPolicy: new Policy_1.Policy("description", "*.ts", ["TODO"], 0),
            });
            conf.setPolicy("myOtherPolicy", myOtherPolicy);
            (0, expect_1.default)(conf.getPolicy("myOtherPolicy")).toEqual(myOtherPolicy);
        });
    });
    describe("#getPolicyNames", function () {
        it("returns the policy names", function () {
            var conf = new Config_1.Config({
                myPolicy: new Policy_1.Policy("description", "*.ts", ["TODO"], 0),
                myOtherPolicy: new Policy_1.Policy("description", "*.ts", ["TODO"], 0)
            });
            (0, expect_1.default)(conf.getPolicyNames()).toEqual(["myPolicy", "myOtherPolicy"]);
        });
    });
    describe("#toYaml", function () {
        it("serializes a basic config to yaml", function () {
            var conf = new Config_1.Config({
                myPolicy: new Policy_1.Policy("description", "*.ts", ["TODO"], 0)
            });
            (0, expect_1.default)(conf.toYaml()).toEqual("policies:\n  myPolicy:\n    baseline: 0\n    description: description\n    filePattern: '*.ts'\n    hiddenFromOutput: false\n    search:\n      - TODO\n");
        });
    });
});

import { Config } from "../src/Config";
import { Policy } from "../src/Policy";
import expect from "expect";

describe("Config", () => {
    describe("#fromYaml", () => {
        it("loads data from yaml", () => {
            const yaml =
                `policies:
  myPolicy:
    baseline: 0
    description: description
    filePattern: '*.ts'
    hiddenFromOutput: false
    search: TODO
`;
            const conf = Config.fromYaml(yaml);
            const policy = conf.policyMap["myPolicy"];
            expect(policy.baseline).toEqual(0);
            expect(policy.description).toEqual("description");
            expect(policy.search).toEqual(["TODO"]);
            expect(policy.filePattern).toEqual("*.ts");
            expect(policy.hiddenFromOutput).toEqual(false);
            expect(policy.ignoreFilePatterns).toEqual(undefined);
        })

        it("allows ignoreFilePatterns", () => {
            const yaml =
                `policies:
  myPolicy:
    baseline: 0
    description: description
    filePattern: '*.ts'
    hiddenFromOutput: false
    search: TODO
    ignoreFilePatterns:
            - 'foo.js'
`;
            const conf = Config.fromYaml(yaml);
            const policy = conf.policyMap["myPolicy"];
            expect(policy.baseline).toEqual(0);
            expect(policy.description).toEqual("description");
            expect(policy.search).toEqual(["TODO"]);
            expect(policy.filePattern).toEqual("*.ts");
            expect(policy.hiddenFromOutput).toEqual(false);
            expect(policy.ignoreFilePatterns).toEqual(['foo.js']);
        });

        it("coerces string ignoreFilePatterns to an array", () => {
            const yaml =
                `policies:
  myPolicy:
    baseline: 0
    description: description
    filePattern: '*.ts'
    hiddenFromOutput: false
    search: TODO
    ignoreFilePatterns: foo.js
`;
            const conf = Config.fromYaml(yaml);
            const policy = conf.policyMap["myPolicy"];
            expect(policy.baseline).toEqual(0);
            expect(policy.description).toEqual("description");
            expect(policy.search).toEqual(["TODO"]);
            expect(policy.filePattern).toEqual("*.ts");
            expect(policy.hiddenFromOutput).toEqual(false);
            expect(policy.ignoreFilePatterns).toEqual(['foo.js']);
        })
    });
    describe("#getPolicy", () => {
        it("returns the policy by name", () => {
            const myOtherPolicy = new Policy("description", "*.ts", ["TODO"], 0)
            const conf = new Config({
                myPolicy: new Policy("description", "*.ts", ["TODO"], 0),
                myOtherPolicy,
            });
            expect(conf.getPolicy("myOtherPolicy")).toEqual(myOtherPolicy);
        });
    });
    describe("#deletePolicy", () => {
        it("removes the policy by name", () => {
            const myOtherPolicy = new Policy("description", "*.ts", ["TODO"], 0)
            const conf = new Config({
                myPolicy: new Policy("description", "*.ts", ["TODO"], 0),
                myOtherPolicy,
            });
            conf.deletePolicy("myOtherPolicy");
            expect(conf.policyMap.myOtherPolicy).toBeUndefined();
        });
    });
    describe("#setPolicy", () => {
        it("sets the policy by name", () => {
            const myOtherPolicy = new Policy("description", "*.ts", ["TODO"], 0)
            const conf = new Config({
                myPolicy: new Policy("description", "*.ts", ["TODO"], 0),
            });
            conf.setPolicy("myOtherPolicy", myOtherPolicy);
            expect(conf.getPolicy("myOtherPolicy")).toEqual(myOtherPolicy);
        });
    });
    describe("#getPolicyNames", () => {
        it("returns the policy names", () => {
            const conf = new Config({
                myPolicy: new Policy("description", "*.ts", ["TODO"], 0),
                myOtherPolicy: new Policy("description", "*.ts", ["TODO"], 0)
            });
            expect(conf.getPolicyNames()).toEqual(["myPolicy", "myOtherPolicy"]);
        });
    });
    describe("#toYaml", () => {
        it("serializes a basic config to yaml", () => {
            const conf = new Config({
                myPolicy: new Policy("description", "*.ts", ["TODO"], 0)
            });
            expect(conf.toYaml()).toEqual(
                `policies:
  myPolicy:
    baseline: 0
    description: description
    filePattern: '*.ts'
    hiddenFromOutput: false
    search:
      - TODO
`
            );
        });
    });

});


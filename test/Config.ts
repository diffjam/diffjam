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
      const conf = Config.fromYaml(yaml, "foo.yaml");
      expect(conf.filePath).toEqual("foo.yaml");
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
      const conf = Config.fromYaml(yaml, "foo.yaml");
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
      const conf = Config.fromYaml(yaml, "foo.yaml");
      const policy = conf.policyMap["myPolicy"];
      expect(policy.baseline).toEqual(0);
      expect(policy.description).toEqual("description");
      expect(policy.search).toEqual(["TODO"]);
      expect(policy.filePattern).toEqual("*.ts");
      expect(policy.hiddenFromOutput).toEqual(false);
      expect(policy.ignoreFilePatterns).toEqual(['foo.js']);
    })

    it("allows baselineStrictEqual", () => {
      const yaml =
        `policies:
  myPolicy:
    baseline: 0
    description: description
    baselineStrictEqual: true
    filePattern: '*.ts'
    search: TODO  
`;
      const conf = Config.fromYaml(yaml, "foo.yaml");
      const policy = conf.policyMap["myPolicy"];
      expect(policy.baseline).toEqual(0);
      expect(policy.description).toEqual("description");
      expect(policy.search).toEqual(["TODO"]);
      expect(policy.filePattern).toEqual("*.ts");
      expect(policy.baselineStrictEqual).toEqual(true);
    });
  });

  describe("#getPolicy", () => {
    it("returns the policy by name", () => {
      const myOtherPolicy = new Policy("", "description", "*.ts", ["TODO"], 0)
      const conf = new Config({
        myPolicy: new Policy("myPolicy", "description", "*.ts", ["TODO"], 0),
        myOtherPolicy,
      }, "foo.yaml");
      expect(conf.getPolicy("myOtherPolicy")).toEqual(myOtherPolicy);
    });
  });
  describe("#deletePolicy", () => {
    it("removes the policy by name", () => {
      const myOtherPolicy = new Policy("myOtherPolicy", "description", "*.ts", ["TODO"], 0)
      const conf = new Config({
        myPolicy: new Policy("myPolicy", "description", "*.ts", ["TODO"], 0),
        myOtherPolicy,
      }, "foo.yaml");
      conf.deletePolicy("myOtherPolicy");
      expect(conf.policyMap.myOtherPolicy).toBeUndefined();
    });
  });
  describe("#setPolicy", () => {
    it("sets the policy by name", () => {
      const myOtherPolicy = new Policy("myOtherPolicy", "description", "*.ts", ["TODO"], 0)
      const conf = new Config({
        myPolicy: new Policy("myPolicy", "description", "*.ts", ["TODO"], 0),
      }, "foo.yaml");
      conf.setPolicy(myOtherPolicy);
      expect(conf.getPolicy("myOtherPolicy")).toEqual(myOtherPolicy);
    });
  });
  describe("#getPolicyNames", () => {
    it("returns the policy names", () => {
      const conf = new Config({
        myPolicy: new Policy("myPolicy", "description", "*.ts", ["TODO"], 0),
        myOtherPolicy: new Policy("myOtherPolicy", "description", "*.ts", ["TODO"], 0)
      }, "foo.yaml");
      expect(conf.getPolicyNames()).toEqual(["myPolicy", "myOtherPolicy"]);
    });
  });
  describe("#toYaml", () => {
    it("serializes a basic config to yaml", () => {
      const conf = new Config({
        myPolicy: new Policy("myPolicy", "description", "*.ts", ["TODO"], 0)
      }, "foo.yaml");
      expect(conf.toYaml()).toEqual(
        `policies:
  myPolicy:
    baseline: 0
    description: description
    filePattern: '*.ts'
    search: TODO
`
      );
    });

    it("serializes a config with optional params to yaml", () => {
      const conf = new Config({
        myPolicy: new Policy("myPolicy", "description", "*.ts", ["TODO"], 0, "test.ts", true, true)
      }, "foo.yaml");
      expect(conf.toYaml()).toEqual(
        `policies:
  myPolicy:
    baseline: 0
    baselineStrictEqual: true
    description: description
    filePattern: '*.ts'
    hiddenFromOutput: true
    ignoreFilePatterns:
      - test.ts
    search: TODO
`
      );
    });
  });

  describe("#read", async () => {
    it("loads data from yaml file", async () => {
      const conf = await Config.read("./test/config_for_test.yaml");
      const policy = conf.policyMap["myPolicy"];
      expect(policy.baseline).toEqual(129);
      expect(policy.description).toEqual("Don't add TODOS. DO IT NOW!");
      expect(policy.search).toEqual(["TODO"]);
      expect(policy.filePattern).toEqual("**/*.ts");
      expect(policy.hiddenFromOutput).toEqual(false);
    });

    it("loads data from a yaml file with 2 policies", async () => {
      const conf = await Config.read(
        "./test/config_for_test_updated.yaml"
      );

      const policy = conf.policyMap["myPolicy"];
      expect(policy.baseline).toEqual(10);
      expect(policy.description).toEqual("Don't add TODOS. DO IT NOW!");
      expect(policy.search).toEqual(["TODO1"]);
      expect(policy.filePattern).toEqual("**/*.ts");
      expect(policy.hiddenFromOutput).toEqual(false);

      const policy2 = conf.policyMap["myPolicy2"];
      expect(policy2.baseline).toEqual(10);
      expect(policy2.baselineStrictEqual).toEqual(true);
      expect(policy2.description).toEqual("updated policy file");
      expect(policy2.search).toEqual(["TODO2"]);
      expect(policy2.filePattern).toEqual("**/*.ts");
      expect(policy2.hiddenFromOutput).toEqual(false);
    });
  });
});



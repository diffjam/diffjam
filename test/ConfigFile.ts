// import expect from "expect";
// import * as configFile from "../src/configFile";

// describe("ConfigFile", async () => {
//   describe("#fromYaml file", async () => {
//     beforeEach(() => {
//       configFile.clear();
//     });

//     it("loads data from yaml file", async () => {
//       const conf = await configFile.getConfig("./test/config_for_test.yaml");
//       const policy = conf.policyMap["myPolicy"];
//       expect(policy.baseline).toEqual(129);
//       expect(policy.description).toEqual("Don't add TODOS. DO IT NOW!");
//       expect(policy.search).toEqual(["TODO"]);
//       expect(policy.filePattern).toEqual("**/*.ts");
//       expect(policy.hiddenFromOutput).toEqual(false);
//     });

//     it("loads data from yaml file using refresh and picks up changes", async () => {
//       const conf = await configFile.refresh(
//         "./test/config_for_test_updated.yaml"
//       );

//       const policy = conf.policyMap["myPolicy"];
//       expect(policy.baseline).toEqual(10);
//       expect(policy.description).toEqual("Don't add TODOS. DO IT NOW!");
//       expect(policy.search).toEqual(["TODO1"]);
//       expect(policy.filePattern).toEqual("**/*.ts");
//       expect(policy.hiddenFromOutput).toEqual(false);

//       const policy2 = conf.policyMap["myPolicy2"];
//       expect(policy2.baseline).toEqual(10);
//       expect(policy2.description).toEqual("updated policy file");
//       expect(policy2.search).toEqual(["TODO2"]);
//       expect(policy2.filePattern).toEqual("**/*.ts");
//       expect(policy2.hiddenFromOutput).toEqual(false);
//     });
//   });
// });

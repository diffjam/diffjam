import { Policy, testNeedle } from "../src/Policy";
import expect from "expect";
import { isString } from "lodash";

describe("Policy", () => {
  describe("#constructor", () => {
    it("creates a policy with default hiddenFromOutput = false", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 0);
      expect(policy.description).toEqual("test description");
      expect(policy.filePattern).toEqual("*.ts");
      expect(policy.search).toEqual(["needle"]);
      expect(policy.baseline).toEqual(0);
      expect(policy.hiddenFromOutput).toEqual(false);
    });
  });

  describe("#searchConfigToRegexes", () => {

    describe("with regex: prefix", () => {
      it("makes a regular expression out of searches", () => {
        const needles = Policy.searchConfigToNeedles(
          ["regex:[a-z]{4}"]
        );
        expect(needles[0]).toEqual(/[a-z]{4}/);
      });
    });

    describe("with -: prefix", () => {
      it("creates a negating / inverse search", () => {
        const needles = Policy.searchConfigToNeedles(
          ["-:asdf"]
        );
        if (isString(needles[0])) throw new Error("it's a string");
        expect(testNeedle(needles[0], "asdf")).toEqual(false);
        expect(testNeedle(needles[0], "asd1")).toEqual(true);
      });
    });

    describe("with no prefix", () => {
      it("makes a regular expressions out of plain text searches", () => {
        const needles = Policy.searchConfigToNeedles(
          [" R."]
        );
        expect(testNeedle(needles[0], "asdf asd fdsf R. asdfasdfdsf")).toEqual(true);
        expect(testNeedle(needles[0], "asdf asd fdsf Rasdfasdfdsf")).toEqual(false);
      });
      it("makes a regular expressions out of plain text searches", () => {
        const needles = Policy.searchConfigToNeedles(
          [" R."]
        );
        expect(testNeedle(needles[0], "asdf asd fdsf R. asdfasdfdsf")).toEqual(true);
        expect(testNeedle(needles[0], "asdf asd fdsf Rasdfasdfdsf")).toEqual(false);
      });
    });
  });

  describe("#isCountAcceptable", () => {
    it("false when match.length is greater than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      policy.matches = { length: 2 } as any;
      const acceptable = policy.isCountAcceptable();
      expect(acceptable).toEqual(false);
    });
    it("true when match.length is less than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      policy.matches = { length: 0 } as any;
      const acceptable = policy.isCountAcceptable();
      expect(acceptable).toEqual(true);
    });
    it("true when match.length equals baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 0);
      policy.matches = { length: 0 } as any;
      const acceptable = policy.isCountAcceptable();
      expect(acceptable).toEqual(true);
    });
  });
  describe("#isCountCinchable", () => {
    it("false when match.length is greater than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      policy.matches = { length: 2 } as any;
      const acceptable = policy.isCountCinchable();
      expect(acceptable).toEqual(false);
    });
    it("true when match.length is less than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      policy.matches = { length: 0 } as any;
      const acceptable = policy.isCountCinchable();
      expect(acceptable).toEqual(true);
    });
    it("false when match.length equals baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 0);
      policy.matches = { length: 0 } as any;
      const acceptable = policy.isCountCinchable();
      expect(acceptable).toEqual(false);
    });
  });
});

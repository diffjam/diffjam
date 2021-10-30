import { Policy } from "../src/Policy";
import expect from "expect";

describe("Policy", () => {
  describe("#constructor", () => {
    it("creates a policy with default hiddenFromOutput = false", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 0);
      expect(policy.description).toEqual("test description");
      expect(policy.filePattern).toEqual("*.ts");
      expect(policy.search).toEqual(["needle"]);
      expect(policy.baseline).toEqual(0);
      expect(policy.hiddenFromOutput).toEqual(false);
    });
  });

  describe("#evaluateFileContents", () => {
    it("finds matches in a file", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 0);
      const matches = policy.evaluateFileContents("path", `-----
                this is a test to find
                the needle in the
                haystack (or maybe there
                are two needles!).
            `);
      expect(matches.length).toEqual(2);
      expect(matches[1].number).toEqual(5);
    });
  });
  describe("#isCountAcceptable", () => {
    it("false when count is greater than baseline", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountAcceptable(2);
      expect(acceptable).toEqual(false);
    });
    it("true when count is less than baseline", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountAcceptable(0);
      expect(acceptable).toEqual(true);
    });
    it("true when count equals baseline", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 0);
      const acceptable = policy.isCountAcceptable(0);
      expect(acceptable).toEqual(true);
    });
  });
  describe("#isCountCinchable", () => {
    it("false when count is greater than baseline", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountCinchable(2);
      expect(acceptable).toEqual(false);
    });
    it("true when count is less than baseline", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountCinchable(0);
      expect(acceptable).toEqual(true);
    });
    it("false when count equals baseline", () => {
      const policy = new Policy("test description", "*.ts", ["needle"], 0);
      const acceptable = policy.isCountCinchable(0);
      expect(acceptable).toEqual(false);
    });
  });
});

import expect from "expect";
import chalk from "chalk";
import { Policy } from "../src/Policy";
import { findMatches } from "../src/FileMatcher";


describe("Policy", () => {
  describe("#constructor", () => {
    it("creates a policy with default hiddenFromOutput = false", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 0);
      expect(policy.description).toEqual("test description");
      expect(policy.filePattern).toEqual(["*.ts"]);
      expect(policy.search).toEqual(["needle"]);
      expect(policy.baseline).toEqual(0);
      expect(policy.hiddenFromOutput).toEqual(false);
    });
  });

  describe("#fromJson", () => {
    it("logs a descriptive error with the policy name and exits the process if the policy is missing a required field", () => {
      expect(() => {
        return Policy.fromJson("my great policy", {
          filePattern: "*.ts",
          search: ["needle"],
          baseline: 0,
        })
      }).toThrowError("Error in policy (my great policy): description is required");
    });
  });

  describe("#searchConfigToRegexes", () => {
    describe("with regex: prefix", () => {
      it("makes a regular expression out of searches", () => {
        const needles = Policy.searchConfigToNeedles(
          ["regex:[a-z]{4}"]
        );
        expect(needles.regex).toEqual(/[a-z]{4}/gm);
        expect(needles.negative).toEqual([]);
        expect(needles.positive).toEqual([]);
        expect(needles.otherRegexes).toEqual([]);
      });
    });

    describe("with -: prefix", () => {
      it("throws unless there is also a positive search term", () => {
        expect(() => {
          Policy.searchConfigToNeedles(
            ["-:asdf"]
          )
        }).toThrow("no positive search terms found");
      });

      it("creates a negating inverse search", () => {
        const needles = Policy.searchConfigToNeedles(
          ["foo", "-:asdf"]
        );
        expect(findMatches("foo asdf", needles)).toEqual([]);
        expect(findMatches("foo bar", needles)).toEqual([{
          "breachPath": "(1:1)",
          "endColumn": 3,
          "endLineNumber": 0,
          "found": "foo",
          "path": "",
          "startColumn": 0,
          "startLineNumber": 0,
          "startWholeLine": "foo bar",
          "startWholeLineFormatted": chalk.bold("foo") + " bar",
        }]);
      });
    });

    describe("with no prefix", () => {
      it("makes a regular expressions out of plain text searches", () => {
        const needles = Policy.searchConfigToNeedles(
          [" R."]
        );
        expect(findMatches("asdf asd fdsf R. asdfasdfdsf", needles)).toEqual([{
          "breachPath": "(1:14)",
          "endColumn": 16,
          "endLineNumber": 0,
          "found": " R.",
          "path": "",
          "startColumn": 13,
          "startLineNumber": 0,
          "startWholeLine": "asdf asd fdsf R. asdfasdfdsf",
          "startWholeLineFormatted": `asdf asd fdsf${chalk.bold(" R.")} asdfasdfdsf`,
        }]);
        expect(findMatches("asdf asd fdsf Rasdfasdfdsf", needles)).toEqual([]);
      });
    });
  });

  describe("#isCountAcceptable", () => {
    it("false when match.length is greater than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountAcceptable({ length: 2 } as any);
      expect(acceptable).toEqual(false);
    });
    it("true when match.length is less than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountAcceptable({ length: 0 } as any);
      expect(acceptable).toEqual(true);
    });
    it("true when match.length equals baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 0);
      const acceptable = policy.isCountAcceptable({ length: 0 } as any);
      expect(acceptable).toEqual(true);
    });
  });

  describe("#isCountCinchable", () => {
    it("false when match.length is greater than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountCinchable({ length: 2 } as any);
      expect(acceptable).toEqual(false);
    });
    it("true when match.length is less than baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 1);
      const acceptable = policy.isCountCinchable({ length: 0 } as any);
      expect(acceptable).toEqual(true);
    });
    it("false when match.length equals baseline", () => {
      const policy = new Policy("test name", "test description", "*.ts", ["needle"], 0);
      const acceptable = policy.isCountCinchable({ length: 0 } as any);
      expect(acceptable).toEqual(false);
    });
  });
});

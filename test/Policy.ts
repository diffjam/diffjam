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

  describe("#isFileUnderPolicy", () => {
    it("matches files against any filePattern", () => {
      const policy = new Policy("name", "description", ["src/**/*.ts", "test/**/*.ts"], ["needle"], 0);
      expect(policy.isFileUnderPolicy("src/a/b.ts")).toEqual(true);
      expect(policy.isFileUnderPolicy("test/c.ts")).toEqual(true);
      expect(policy.isFileUnderPolicy("lib/c.ts")).toEqual(false);
      expect(policy.isFileUnderPolicy("src/a/b.js")).toEqual(false);
    });

    it("excludes files matching any ignoreFilePattern", () => {
      const policy = new Policy("name", "description", "src/**/*.ts", ["needle"], 0, ["src/**/*.test.ts", "src/gen/**"]);
      expect(policy.isFileUnderPolicy("src/a/b.ts")).toEqual(true);
      expect(policy.isFileUnderPolicy("src/a/b.test.ts")).toEqual(false);
      expect(policy.isFileUnderPolicy("src/gen/x.ts")).toEqual(false);
    });

    it("gives the same answer when called repeatedly", () => {
      const policy = new Policy("name", "description", "src/**/*.ts", ["needle"], 0, ["src/**/*.test.ts"]);
      for (let i = 0; i < 3; i++) {
        expect(policy.isFileUnderPolicy("src/a.ts")).toEqual(true);
        expect(policy.isFileUnderPolicy("src/a.test.ts")).toEqual(false);
      }
    });

    it("picks up filePattern and ignoreFilePatterns that are reassigned after the first call", () => {
      const policy = new Policy("name", "description", "src/**/*.ts", ["needle"], 0);
      expect(policy.isFileUnderPolicy("lib/a.ts")).toEqual(false);
      expect(policy.isFileUnderPolicy("src/a.test.ts")).toEqual(true);

      policy.filePattern = ["lib/**/*.ts"];
      expect(policy.isFileUnderPolicy("lib/a.ts")).toEqual(true);
      expect(policy.isFileUnderPolicy("src/a.ts")).toEqual(false);

      policy.ignoreFilePatterns = ["lib/**/*.test.ts"];
      expect(policy.isFileUnderPolicy("lib/a.ts")).toEqual(true);
      expect(policy.isFileUnderPolicy("lib/a.test.ts")).toEqual(false);
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

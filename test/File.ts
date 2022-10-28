import { File } from "../src/File"
import expect from "expect";
import { Policy } from "../src/Policy";

describe("File", () => {
  describe("findMatches", () => {
    it("finds a simple regex", () => {
      const file = new File("test/File.ts", "asdf needle asdf");
      const needles = Policy.searchConfigToNeedles(["needle"]);
      const matches = file.findMatches(needles);

      expect(matches).toEqual([
        {
          startLineNumber: 0,
          endLineNumber: 0,
          startColumn: 5,
          endColumn: 11,
          found: 'needle',
          path: 'test/File.ts',
          startWholeLine: 'asdf needle asdf',
          startWholeLineFormatted: 'asdf \x1B[1mneedle\x1B[22m asdf',
          breachPath: "test/File.ts(1:6)",
        }
      ]);
    });

    it("can handle negations", () => {
      const file = new File("test/File.ts", "asdf needle asdf");
      const needles = Policy.searchConfigToNeedles(["needle", "-:asdf"]);
      const matches = file.findMatches(needles);
      expect(matches).toEqual([]);
    });
  });
});

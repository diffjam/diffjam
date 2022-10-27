import { findInString } from "../src/findInString"
import expect from "expect";
import { ReverseRegExp } from "../src/ReverseRegExp";

describe("#findInString", () => {
  it("finds a simple regex", () => {
    expect(findInString("path", [/needle/], "asdf needle asdf")).toEqual([
      {
        number: 1,
        line: "asdf needle asdf",
        match: "needle",
        path: "path",
      }
    ])
  })
  describe("negated regex", () => {
    it("gives all non-matches for a reverseregex", () => {
      const found = findInString("path", [new ReverseRegExp("needle")], "asdf needle asdf\nasdf");
      expect(found).toEqual([
        {
          number: 2,
          line: "asdf",
          match: "asdf",
          path: "path",
        }

      ]);
    });
    it("works when the negation is a second criteria", () => {
      const found = findInString("path", [/[a-z]{4}/, new ReverseRegExp("asdf")], "asdf\nasde\nasdf1");
      expect(found).toEqual([
        {
          line: "asde",
          match: "asde",
          number: 2,
          path: "path",
        },
      ]);
    });
  });
  describe("with multiple search criteria", () => {
    it("finds substrings with all search matches", () => {
      expect(findInString("path", [/needle/, /qwer/], "asdf needle asdf\nasdf needle qwer")).toEqual([
        {
          number: 2,
          line: "asdf needle qwer",
          match: "needle",
          path: "path",
        }
      ])
    })
    it("rejects lines that don't match all criteria", () => {
      const found = findInString("path", [/needle/, /qwer/], "asdf needle asdf\nasdf");
      expect(found.length).toEqual(0);
    });
  });
})
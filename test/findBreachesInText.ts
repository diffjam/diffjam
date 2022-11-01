import { Config } from "../src/Config";
import { findBreachesInText } from "../src/findBreachesInText";
import { Policy } from "../src/Policy";
import expect from "expect";

describe("#findBreachesInText", () => {
  it("can find a policy in a multi-line text", async () => {
    const conf = new Config({ "TODO": new Policy("TODO", "no more TODOs", "**/*.ts", ["TODO"], 0) }, "foo.yaml");
    const breaches = await findBreachesInText(
      "asdf.ts",
      "this\nis\na\n // TODO later \ntest",
      conf,
      { ready: Promise.resolve(), isIgnored() { return false } } as any
    );
    expect(breaches).toEqual([
      {
        startLineNumber: 3,
        endLineNumber: 3,
        startColumn: 4,
        endColumn: 8,
        found: 'TODO',
        path: 'asdf.ts',
        startWholeLine: ' // TODO later ',
        startWholeLineFormatted: ' // \x1B[1mTODO\x1B[22m later ',
        message: 'no more TODOs',
        severity: 1,
        breachPath: "asdf.ts(4:5)",
      }
    ]);
  });
  it("ignores when the file glob doesn't match", async () => {
    const conf = new Config({ "TODO": new Policy("TODO", "no more TODOs", "**/*.ts", ["TODO"], 0) }, "foo.yaml");
    const breaches = await findBreachesInText(
      "asdf.txt",
      "this\nis\na\n // TODO later \ntest",
      conf,
      { ready: Promise.resolve(), isIgnored() { return false } } as any
    );
    expect(breaches.length).toEqual(0);
  });
});
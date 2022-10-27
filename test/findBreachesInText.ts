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
    expect(breaches).toEqual([{
      found: "TODO",
      lineNumber: 4,
      message: "no more TODOs",
      wholeLine: " // TODO later ",
    }]);
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
import { Config } from "../src/Config";
import { findBreachesInText } from "../src/findBreachesInText";
import { Policy } from "../src/Policy";
import expect from "expect";

describe("#findInBreaches", () => {
    it("can find a policy in a multi-line text", async () => {
        const conf = new Config({"TODO": new Policy("no more TODOs", "**/*.ts", ["TODO"], 0)});
        const breaches = await findBreachesInText("this\nis\na\n // TODO later \ntest", conf);
        expect(breaches).toEqual([{
            found: "TODO",
            lineNumber: 4,
            message: "no more TODOs",
            wholeLine: " // TODO later ",
        }]);
    });
});
const gitUrlToSlug = require("../src/git").gitUrlToSlug;
import expect from "expect";

describe("gitUrlToSlug", () => {
    it("returns slug when given an input url", () => {
        const input = "https://github.com/org/repo.git";
        const output = gitUrlToSlug(input);
        expect(output).toEqual("org/repo");
    });
    it("returns null when given a null input", () => {
        const output = gitUrlToSlug();
        expect(output).toBeNull();
    });


});

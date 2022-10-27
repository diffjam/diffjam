import { checkFilesAndAddMatches } from "../src/checkFilesAndAddMatches";
import expect from "expect";
import { CurrentWorkingDirectory } from "../src/CurrentWorkingDirectory";
import { Policy } from "../src/Policy";

describe("checkFilesAndAddMatches", () => {
  it("searches a project, adding matches to the provided policies", async () => {
    const currentWorkingDirectory = new CurrentWorkingDirectory("test/example_project", "mock-gitignore");
    const policy = new Policy(
      "my policy",
      "a description",
      "nested/**/*.*",
      ["hamster"],
      0
    )

    const results = await checkFilesAndAddMatches(currentWorkingDirectory, [policy], {});

    expect(results.filesChecked).toEqual(["nested/1.txt", "nested/2.txt"]);

    expect(results.policies[0].matches).toEqual([
      {
        "line": "hamster",
        "match": "hamster",
        "number": 1,
        "path": "nested/1.txt",
      },
      {
        "line": "hamster",
        "match": "hamster",
        "number": 4,
        "path": "nested/1.txt",
      },
    ]);
  });
});
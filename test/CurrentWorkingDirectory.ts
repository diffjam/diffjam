import { CurrentWorkingDirectory } from "../src/CurrentWorkingDirectory";
import expect from "expect";

describe("CurrentWorkingDirectory", () => {
  it("correctly ignores files in the .gitignore", async () => {
    // Use a mock-gitignore because using an actual file called .gitignore
    // causes those files to be ignored by git.
    const currentWorkingDirectory = new CurrentWorkingDirectory("test/example_project", "mock-gitignore");

    const files = await currentWorkingDirectory.allNonGitIgnoredFilesMatchingPatterns([
      "**/*.*",
    ])

    expect(files).toEqual(["1.txt", "2.txt", "nested/1.txt", "nested/2.txt"])
  });

  it("can match provided patterns", async () => {
    const currentWorkingDirectory = new CurrentWorkingDirectory("test/example_project", "mock-gitignore");

    const files = await currentWorkingDirectory.allNonGitIgnoredFilesMatchingPatterns([
      "nested/**/*.*",
      "**/1.txt"
    ])

    expect(files).toEqual(["1.txt", "nested/1.txt", "nested/2.txt"])
  });
});
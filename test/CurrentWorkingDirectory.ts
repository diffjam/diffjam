import { CurrentWorkingDirectory } from "../src/CurrentWorkingDirectory";
import expect from "expect";

describe("CurrentWorkingDirectory", () => {
  it("correctly ignores files in the .gitignore", done => {
    // Use a mock-gitignore because using an actual file called .gitignore
    // causes those files to be ignored by git.
    const currentWorkingDirectory = new CurrentWorkingDirectory("test/example_project", "mock-gitignore");
    const files: string[] = []

    currentWorkingDirectory.allNonGitIgnoredFiles((file) => {
      files.push(file)
    }, () => {
      expect(files).toEqual(["1.txt", "2.txt", "nested/1.txt", "nested/2.txt", "nested/3.txt", "nested/4.txt"])
      done();
    })
  });

  it("correctly ignores files in the .gitignore", done => {
    const currentWorkingDirectory = new CurrentWorkingDirectory(process.cwd());
    const files: string[] = []

    currentWorkingDirectory.allNonGitIgnoredFiles((file) => {
      files.push(file)
    }, () => {
      files.forEach(file => {
        if (file.startsWith("node_modules")) {
          throw new Error("node_modules should not be included in the files list")
        }
      })
      done();
    })
  });
});
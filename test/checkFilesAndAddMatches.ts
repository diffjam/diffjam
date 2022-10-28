import expect from "expect";
import { checkFilesAndAddMatches } from "../src/checkFilesAndAddMatches";
import { CurrentWorkingDirectory } from "../src/CurrentWorkingDirectory";
import { Policy } from "../src/Policy";

describe("checkFilesAndAddMatches", () => {
  it("searches a project, adding matches to the provided policies", async () => {
    const currentWorkingDirectory = new CurrentWorkingDirectory("test/example_project", "mock-gitignore");

    const noHamsterPolicy = new Policy(
      "no hamster",
      "I don't like hamsters",
      "nested/**/*.*",
      ["hamster"],
      0
    )

    const noConsoleLogPolicy = new Policy(
      "no console.log",
      "don't leave console.logs in your code",
      "**/*.*",
      ["regex:console\\.log\\([\\s\\S]*\\)"],
      0,
      ["1.txt"]
    )

    const fireAndForgetMustBeAwaitedPolicy = new Policy(
      "fire and forget must be awaited",
      "please await calls to fireAndForget",
      "nested/**/*.*",
      ["fireAndForget(", "-:await"],
      0,
    )

    const results = await checkFilesAndAddMatches(
      currentWorkingDirectory,
      [noHamsterPolicy, noConsoleLogPolicy, fireAndForgetMustBeAwaitedPolicy],
      {}
    );

    expect(results.filesChecked).toEqual(["2.txt", "nested/1.txt", "nested/2.txt", "nested/3.txt", "nested/4.txt"]);

    expect(results.policies[0].matches).toEqual([
      {
        startLineNumber: 0,
        endLineNumber: 0,
        startColumn: 0,
        endColumn: 7,
        found: 'hamster',
        path: 'nested/1.txt',
        startWholeLine: 'hamster',
        startWholeLineFormatted: '\x1B[1mhamster\x1B[22m',
        breachPath: "nested/1.txt(1:1)",
      },
      {
        startLineNumber: 3,
        endLineNumber: 3,
        startColumn: 0,
        endColumn: 7,
        found: 'hamster',
        path: 'nested/1.txt',
        startWholeLine: 'hamster purple hamster',
        startWholeLineFormatted: '\x1B[1mhamster\x1B[22m purple hamster',
        breachPath: "nested/1.txt(4:1)",
      },
      {
        startLineNumber: 3,
        endLineNumber: 3,
        startColumn: 15,
        endColumn: 22,
        found: 'hamster',
        path: 'nested/1.txt',
        startWholeLine: 'hamster purple hamster',
        startWholeLineFormatted: 'hamster purple \x1B[1mhamster\x1B[22m',
        breachPath: "nested/1.txt(4:16)",
      },
      {
        startLineNumber: 0,
        endLineNumber: 0,
        startColumn: 0,
        endColumn: 7,
        found: 'hamster',
        path: 'nested/4.txt',
        startWholeLine: 'hamster',
        startWholeLineFormatted: '\x1B[1mhamster\x1B[22m',
        breachPath: "nested/4.txt(1:1)",
      },
    ]);

    expect(results.policies[1].matches).toEqual([
      {
        startLineNumber: 0,
        endLineNumber: 2,
        startColumn: 0,
        endColumn: 1,
        found: 'console.log(\n  "@something"\n)',
        path: 'nested/3.txt',
        startWholeLine: 'console.log(',
        startWholeLineFormatted: '\x1B[1mconsole.log(\x1B[22m',
        breachPath: "nested/3.txt(1:1)",
      }
    ]);

    expect(results.policies[2].matches).toEqual([
      {
        startLineNumber: 1,
        endLineNumber: 1,
        startColumn: 0,
        endColumn: 14,
        found: 'fireAndForget(',
        path: 'nested/2.txt',
        startWholeLine: 'fireAndForget()',
        startWholeLineFormatted: '\x1B[1mfireAndForget(\x1B[22m)',
        breachPath: "nested/2.txt(2:1)",
      },
      {
        startLineNumber: 2,
        endLineNumber: 2,
        startColumn: 4,
        endColumn: 18,
        found: 'fireAndForget(',
        path: 'nested/2.txt',
        startWholeLine: 'xyz fireAndForget()',
        startWholeLineFormatted: 'xyz \x1B[1mfireAndForget(\x1B[22m)',
        breachPath: "nested/2.txt(3:5)",
      }
    ]);
  });
});
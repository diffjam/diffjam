import expect from "expect";
import { cleanIgnorePatterns, excludeDirectory, filterFile, pathMatchesPatterns } from "../src/getPathsMatchingPattern";

describe("getPathsMatchingPatterns", () => {

  describe("cleanIgnorePatterns", () => {
      it("cleans leading slashes", () => {
        expect(cleanIgnorePatterns(["/asdf"])).toEqual(["asdf"]);
      });
      it("cleans trailing  slashes", () => {
        expect(cleanIgnorePatterns(["/asdf"])).toEqual(["asdf"]);
      });
  });

  describe("pathMatchesPatterns", () => {
    it("ignores a direct match", () => {
      expect(pathMatchesPatterns("node_modules", ["node_modules"])).toEqual(true);
    });
    it("does not ignore a non-match", () => {
      expect(pathMatchesPatterns("node_modules", ["blah"])).toEqual(false);
    });
  });

  describe("filterFile", () => {
      it("denies directories", () => {
          expect(filterFile("/home/diffjam/test", "**/*", [], "asdf", true)).toEqual(false);
      });
      it("denies diffjam.yaml", () => {
          expect(filterFile("/home/diffjam/test", "**/*", [], "diffjam.yaml", false)).toEqual(false);
      });
      it("denies an ignored file", () => {
          expect(filterFile("/home/diffjam/test", "**/*", ["asdf.txt"], "asdf.txt", false)).toEqual(false);
      });
      it("allows an acceptable file for the most open pattern", () => {
          expect(filterFile("/home/diffjam/test", "**/*", [], "asdf.txt", false)).toEqual(true);
      });
  });

  describe("excludeDirFn", () => {
    describe("gitignored", () => {
      it("includes unignored directories", () => {
        const dirName = "apiIntegrationService";
        const cwd = "/home/cainus/api";
        const fullPath = "/home/cainus/api/apiIntegrationService";
        const ignorePaths = ["nomatch"];
        expect(excludeDirectory(cwd, ignorePaths, dirName, fullPath)).toEqual(false);
      });
      it("excludes ignored directories (exact match)", () => {
        const dirName = "apiIntegrationService";
        const cwd = "/home/cainus/api";
        const fullPath = "/home/cainus/api/apiIntegrationService";
        const ignorePaths = ["apiIntegrationService"];
        expect(excludeDirectory(cwd, ignorePaths, dirName, fullPath)).toEqual(true);
      });

      it("excludes ignored directories (match with trailing slash)", () => {
        const dirName = "apiIntegrationService";
        const cwd = "/home/cainus/api";
        const fullPath = "/home/cainus/api/apiIntegrationService";
        const ignorePaths = ["apiIntegrationService/"];
        expect(excludeDirectory(cwd, ignorePaths, dirName, fullPath)).toEqual(true);
      });
    });
    it("excludes dot directories", () => {
      const dirName = ".adsf";
      const cwd = "/home/cainus/api";
      const fullPath = "/home/cainus/api/.asdf";
      const ignorePaths: string[] = [];
      expect(excludeDirectory(cwd, ignorePaths, dirName, fullPath)).toEqual(true);
    });
  });
});

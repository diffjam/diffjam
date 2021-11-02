import { fdir } from "fdir";
import findup from 'findup-sync';
import ignore from 'parse-gitignore';
import mm from 'micromatch';
import fs from "fs";
// import minimatch from "minimatch";

export const cleanIgnorePatterns = (ignorePatterns: string[]) => {
  const retval = ignorePatterns.map((p) => {
    if (p[0] && p[0] === "/") {
      return p.slice(1, p.length);
    }
    const lastChar = p[p.length - 1];
    if (lastChar && lastChar === "/"){
      return p.slice(0, p.length - 1);
    }
    return p;
  })
  return retval;
}

const cwd = process.cwd();

const gitignoreFile = findup('.gitignore', {cwd: cwd});
console.log("gitignoreFile: ", gitignoreFile);


let ignorePatterns: string[] = [];
if (gitignoreFile){
  const fileContents = fs.readFileSync(gitignoreFile).toString();
  ignorePatterns = cleanIgnorePatterns(ignore(fileContents));
}

export const getIgnorePatterns = () => ignorePatterns;


export const pathMatchesPatterns = (path: string, patterns: string[]) => {
  // console.log("path ===============: ", path);
  // console.log("patterns: ", patterns);

  const retval = mm.any(path, patterns);
  // console.log("should ignore? ", retval);

  return retval;
};

export const excludeDirectory = (cwd: string, ignorePatterns: string[], dirName: string, fullPath: string): boolean => {
  // exclude() runs before the glob to save the glob from traversing dirs
  // that it doesn't need to.
  //
  // This means that a lot of stuff that doesn't match the glob will
  // be in here.

  // console.log("fullPath: ", fullPath);
  // console.log("dirName: ", dirName);
  // console.log("cwd: ", cwd);
  // console.log("ignorePatterns: ", ignorePatterns);
  const testPath = fullPath.slice(cwd.length + 1, fullPath.length);
  // console.log("testPath: ", testPath);


  if (dirName.startsWith(".")) {
    // console.log('excluding dotfile');
    return true;
  }

  // console.log('testing shouldIgnore in exclude()');

  // console.log("shouldIgnore(", testPath, "): ", shouldIgnorePath(testPath, ignorePatterns));
  // console.log("shouldIgnore(", testPath + '/', "): ", shouldIgnorePath(testPath + '/', ignorePatterns));
  // console.log("shouldIgnore(", fullPath, "): ", shouldIgnorePath(fullPath, ignorePatterns));
  // console.log("shouldIgnore(", dirName, "): ", shouldIgnorePath(dirName, ignorePatterns));


  if (pathMatchesPatterns(testPath, ignorePatterns) || pathMatchesPatterns(testPath + "/", ignorePatterns)) {
    // console.log('excluding ignored dir');
    return true;
  }

  // console.log("not excluding dir: ", testPath);
  return false;
};


export const filterFile = (basePath: string, includePatterns: string, ignorePatterns: string[], path: string, isDirectory: boolean): boolean => {
    // console.log('in the filter');


    // no directories (but recurse)
    if (isDirectory) return false;

    // no diffjam.yaml
    if (path === "diffjam.yaml") return false;

    // ignore based on .gitignore
    // console.log("path: ", path);
    // console.log("checking shouldIgnore for path: ", path);
    // console.log("ignorePatterns: ", ignorePatterns);

    if (pathMatchesPatterns(path, ignorePatterns)) {
      return false;
    }

    if (path.startsWith(basePath)) {
      path = path.slice(basePath.length, path.length);
    }
    if (path.startsWith("/")) {
      path = path.slice(1, path.length);
    }

    if (pathMatchesPatterns(path, [includePatterns])) {
      return true;
    }

    return false;
  };



export const getPathsMatchingPattern = async (basePath: string, includePatterns: string) => {
  // console.log("dir: ", basePath);
  // console.log("patterns: ", patterns);
  const ignorePatterns = getIgnorePatterns();

  // fdir's globbing just seems broken, so we implement our own in filterFile()
  const files = (await new fdir()
    .withBasePath()
    .filter((path: string, isDirectory: boolean) => filterFile(basePath, includePatterns, ignorePatterns, path, isDirectory))
    .exclude((dirName: string, dirPath: string) => excludeDirectory(cwd, ignorePatterns, dirName, dirPath))
    .withErrors()
    .crawl(basePath)
    .withPromise()) as string[];

  return files;
};

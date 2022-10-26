import mm from 'micromatch';


export const pathMatchesPatterns = (path: string, patterns: string[]) => {
  // console.log("path ===============: ", path);
  // console.log("patterns: ", patterns);

  const retval = mm.any(path, patterns);
  // console.log("should ignore? ", retval);

  return retval;
};


export const filterFile = (basePath: string, includePattern: string, ignorePatterns: string[], path: string, isDirectory: boolean): boolean => {
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

  if (pathMatchesPatterns(path, [includePattern])) {
    return true;
  }

  return false;
};


export const getPathsMatchingPattern = async (basePath: string, includePattern: string, ignorePatterns: string[]) => {
  return [];
};

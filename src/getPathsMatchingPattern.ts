import { fdir } from "fdir";
import findup from 'findup-sync';
import ignore from 'parse-gitignore';
import mm from 'micromatch';
import fs from "fs";

const cwd = process.cwd();

const gitignoreFile = findup('.gitignore', {cwd: cwd});

let ignorePatterns: string[] = [];
if (gitignoreFile){
  const fileContents = fs.readFileSync(gitignoreFile);
  ignorePatterns = ignore(fileContents);
}
// console.log("ignorePatterns: ", ignorePatterns);


const shouldIgnore = (fp: string) => {
  // console.log("fp: ", fp);
  
  const retval = mm.any(fp, ignorePatterns);
  // console.log("should ignore? ", retval);
  
  return retval;
};

// const glob = require('glob-fs')({ dotfiles: false, gitignore:true })

// interface Pattern {
//     negated: boolean;
//     options: { withFileTypes: boolean };
//     original: string;
//     cwd: string;
//     isGlobstar: boolean;
//     parent: string;
//     base: string;
//     glob: string;
//     regex: RegExp;
// };

// interface Stats {
//     dev: number;
//     mode: number;
//     nlink: number;
//     uid: number;
//     gid: number;
//     rdev: number;
//     blksize: number;
//     ino: number;
//     size: number;
//     blocks: number;
//     atimeMs: number;
//     mtimeMs: number;
//     ctimeMs: number;
//     birthtimeMs: number;
//     atime: Date;
//     mtime: Date;
//     ctime: Date;
//     birthtime: Date;
// };

// interface GlobFile {
//     cache: unknown;
//     history: unknown[];
//     pattern: Pattern;
//     recurse: boolean;
//     dirname: string;
//     segment: string;
//     path: string;
//     orig: string;
//     stat: Stats;
//     isDirectory: () => boolean;
//     isFile: () => boolean;
//     isSymlink: () => boolean;
//     parse: () => string;
//     isDotfile: () => boolean;
//     isDotdir: () => boolean;
//     toAbsolute: () => string;
//     endsWith: (s: string) => boolean;
//     startsWith: (s: string) => boolean;
//     relative: string;
//     isAbsolute: true,
//     absolute: string;
//     root: string;
//     basename: string;
//     extname: string;
//     name: string;
//     exclude: boolean;
//   }
  

// const ignoreMore = (f: GlobFile) => {
//   if (f.isDotfile() || f.basename === "diffjam.yaml") {
//     f.exclude = true;
//   }
// //   console.log("f: ", f);
  
//   return f;
// };

// TODO it would be cool if this streamed instead
// FIXME
export const getPathsMatchingPattern = async (dir: string, patterns: string) => {
  const files = await new fdir()
    .withBasePath()
    .glob(patterns)
    .filter((path: string, isDir: boolean) => {

      // no directories (but recurse)
      if (isDir) return false;

      // no diffjam.yaml
      if (path === "diffjam.yaml") return false;

      // ignore based on .gitignore
      // console.log("path: ", path);
      
      if (shouldIgnore("./" + path)) {
        return false;
      }

      return true;
    })
    .exclude((dirName, fullPath) => {
      // console.log("fullPath: ", fullPath);
      // console.log("dirName: ", dirName);
      // console.log("cwd: ", cwd);
      const testPath = fullPath.slice(cwd.length + 1, fullPath.length);
      // console.log("testPath: ", testPath);
  
      if (dirName.startsWith(".")) {
        // console.log('excluding dotfile');
        return true;
      }
      
      if (shouldIgnore(testPath) || shouldIgnore(testPath + "/")) {
        // console.log('excluding ignored file');
        return true;
      }
      // console.log("not ignored: ", testPath);
      
      if (testPath === 'node_modules') {
        throw new Error("stop");
      }
      

      return false;
    })
    .crawl(dir)
    .withPromise() as string[];

    return files;
}

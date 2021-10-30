const glob = require('glob-fs')({ dotfiles: false, gitignore:true })

interface Pattern {
    negated: boolean;
    options: { withFileTypes: boolean };
    original: string;
    cwd: string;
    isGlobstar: boolean;
    parent: string;
    base: string;
    glob: string;
    regex: RegExp;
};

interface Stats {
    dev: number;
    mode: number;
    nlink: number;
    uid: number;
    gid: number;
    rdev: number;
    blksize: number;
    ino: number;
    size: number;
    blocks: number;
    atimeMs: number;
    mtimeMs: number;
    ctimeMs: number;
    birthtimeMs: number;
    atime: Date;
    mtime: Date;
    ctime: Date;
    birthtime: Date;
};

interface GlobFile {
    cache: unknown;
    history: unknown[];
    pattern: Pattern;
    recurse: boolean;
    dirname: string;
    segment: string;
    path: string;
    orig: string;
    stat: Stats;
    isDirectory: () => boolean;
    isFile: () => boolean;
    isSymlink: () => boolean;
    parse: () => string;
    isDotfile: () => boolean;
    isDotdir: () => boolean;
    toAbsolute: () => string;
    endsWith: (s: string) => boolean;
    startsWith: (s: string) => boolean;
    relative: string;
    isAbsolute: true,
    absolute: string;
    root: string;
    basename: string;
    extname: string;
    name: string;
    exclude: boolean;
  }
  

const ignoreMore = (f: GlobFile) => {
  if (f.isDotfile() || f.basename === "diffjam.yaml") {
    f.exclude = true;
  }
//   console.log("f: ", f);
  
  return f;
};

// TODO it would be cool if this streamed instead
// FIXME
export const getPathsMatchingPattern = async (patterns: string) => {
    const files = await glob
        .use(ignoreMore)
        .readdirSync(patterns, { withFileTypes: true }) as string[];
    // console.log("files: ", files);
    //    throw new Error("files ^^^^^^^^") 
    
    const retval = files.filter((file) => {return file !== "diffjam.yaml";});
    
    return retval;
}

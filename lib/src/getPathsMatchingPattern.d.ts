export declare const cleanIgnorePatterns: (ignorePatterns: string[]) => string[];
export declare const getGitIgnorePatterns: () => string[];
export declare const pathMatchesPatterns: (path: string, patterns: string[]) => boolean;
export declare const excludeDirectory: (cwd: string, ignorePatterns: string[], dirName: string, fullPath: string) => boolean;
export declare const filterFile: (basePath: string, includePattern: string, ignorePatterns: string[], path: string, isDirectory: boolean) => boolean;
export declare const getPathsMatchingPattern: (basePath: string, includePattern: string, ignorePatterns: string[]) => Promise<string[]>;

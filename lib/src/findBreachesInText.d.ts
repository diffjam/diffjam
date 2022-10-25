import { Config } from "./Config";
interface FileBreach {
    lineNumber: number;
    found: string;
    wholeLine: string;
    message: string;
}
export declare const findBreachesInText: (filePath: string, text: string, conf?: Config | undefined) => Promise<FileBreach[]>;
export {};

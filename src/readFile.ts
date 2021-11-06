
import {promisify} from "util";
import {readFile as readFileCb} from "fs";
const readFilePromise = promisify(readFileCb);

const files: {[key:string]: string} = {};

export const readFile = async (path:string) => {
    if (!files[path]) {
        files[path] = await readFilePromise(path, {encoding: "utf8"});
    }
    return files[path];

}

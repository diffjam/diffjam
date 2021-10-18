import fs from "fs";

export const clientVersion = () => {
    const packageJson = JSON.parse(
        fs.readFileSync(`${__dirname}/../package.json`).toString()
    );
    return packageJson.version;
}
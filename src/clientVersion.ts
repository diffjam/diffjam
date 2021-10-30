import fs from "fs";
import path from "path";

export const clientVersion = () => {
    let packagePath = path.resolve(`${__dirname}/../../package.json`);
    if (!fs.existsSync(packagePath)) {
      // try local dev path
      packagePath = path.resolve(`${__dirname}/../package.json`);
    }
    
    const packageJson = JSON.parse(
        fs.readFileSync(packagePath).toString()
    );
    return packageJson.version;
}
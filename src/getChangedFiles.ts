
// @ts-ignore
import gitChangedFiles from 'git-changed-files';

type GitChangeStatus = "Modified" | "Added" | "Copied" | "Deleted" | "Renamed" | "changed" | "Unmerged" | "Unknown" | "Broken";

interface GitChangedFile {
    fileName: string;
    status: GitChangeStatus;
}

interface GitChangedFiles {
    committedFiles: GitChangedFile[];
    uncommittedFiles: GitChangedFile[];
}


export const getChangedFiles = async (baseBranch: string = "main"): Promise<GitChangedFiles> => {
    try {
        const committedGitFiles = await gitChangedFiles({baseBranch, showStatus: true});
        return committedGitFiles as GitChangedFiles;
    } catch (ex) {
        if ((ex as Error).toString().indexOf("unknown revision or path not in the working tree") !== -1) {
            throw new Error(`Could not find baseBranch: ${baseBranch}`);
        }
        console.log("ex: ", ex);
        throw ex; 

    }
}

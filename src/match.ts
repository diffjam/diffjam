export interface Match {
  startLineNumber: number; // the startLineNumber, 1-indexed
  endLineNumber: number; // the ending line number, 1-indexed
  startColumn: number
  endColumn: number
  found: string; // the match.  we can do squigglies based on its beginning/end
  startWholeLine: string; // the entire line that the match is in.  used for subsequent needles.
  startWholeLineFormatted: string;
  path: string;
  breachPath: string;
}

export interface FileBreach {
  startLineNumber: number; // the startLineNumber, 1-indexed
  endLineNumber: number; // the ending line number, 1-indexed
  found: string; // the match.  we can do squigglies based on its beginning/end
  startColumn: number
  endColumn: number
  startWholeLine: string; // the entire line that the match is in.  used for subsequent needles.
  startWholeLineFormatted: string;
  message: string; // the policy description.
  severity: 1
}

export type MatchDict = { [filePath: string]: Match[] };

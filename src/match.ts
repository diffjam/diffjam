export interface Match {
  number: number;
  line: string;
  match: string;
  path: string;
}
export type MatchDict = { [filePath: string]: Match[] };

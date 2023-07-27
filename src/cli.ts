// @ts-ignore
import meow from "meow";

export interface Flags {
  config?: string;
  verbose?: boolean;
  record?: boolean;
  ci?: boolean;
}

export const cli = meow(
  `
    Usage
      $ diffjam <action>

    Examples
      $ diffjam init
      $ diffjam add
      $ diffjam check
      $ diffjam cinch
      $ diffjam bump
      $ diffjam count
      $ diffjam modify
      $ diffjam remove
      $ diffjam breaches
`,
  {
    flags: {
      config: {
        type: "string",
        alias: "c"
      },
      verbose: {
        type: "boolean",
        alias: "v"
      },
      record: {
        type: "boolean",
        alias: "r"
      },
      ci: {
        type: "boolean",
      }
    }
  }
);

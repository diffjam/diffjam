import { isEmpty } from "lodash";
import { Config } from "./Config";
import { CurrentWorkingDirectory } from "./CurrentWorkingDirectory";
import { Flags } from "./flags";
import { checkFilesAndAddMatches } from "./checkFilesAndAddMatches";

export class Runner {
  public ran: boolean = false

  constructor(
    public config: Config,
    public flags: Flags,
    public cwd: CurrentWorkingDirectory
  ) { }

  checkFilesAndAddMatches() {
    if (isEmpty(this.config.policyMap)) {
      console.error("There are no policies specified.\nMake sure you have a diffjam.yaml file with policies.\nRun `diffjam add` to create a new policy");
      return process.exit(1);
    }
    if (this.ran) throw new Error("already ran")
    this.ran = true;
    return checkFilesAndAddMatches(this.cwd, Object.values(this.config.policyMap), this.flags);
  }

  async checkFilesAndAddMatchesForPolicy(policyName: string) {
    const policy = this.config.getPolicy(policyName);
    if (!policy) {
      console.error("There was no policy named: ", policyName);
      return process.exit(1);
    }
    await checkFilesAndAddMatches(this.cwd, [policy], this.flags);
    return policy
  }
}

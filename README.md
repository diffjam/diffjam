# diffjam


## commands
* `diffjam init` : create a new diffjam configuration
* `diffjam quest` : add a new quest.  Quests are goals for your code.
* `diffjam count` : see the current values for all quests.

* `diffjam cinch` : Change the baselines to strictest passable valuable for the code.
* `diffjam check` : Same as `count`, but it exits with a code of 1 if the counts aren't good enough for the baselines.

### extended `diffjam count` usage:
* use `diffjam --check` to have the process fail when a count is below a baseline
* use `DIFFJAM_API_KEY=[your api key] diffjam --record` to record counts to diffjam.com.

### using an alernative configuration file
Specify it with the `--config` flag.  For a config named `filename.json`,
`diffjam [command] --config=filename.json`

### example searches
* count all javascript files: `git ls-files "*.js" | wc -l`
* count all instances of the string TODO: `git grep TODO | wc -l`

## Development
The development README is [here](devREADME.md).
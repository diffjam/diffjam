# diffjam

This utility is useful for creating policies that your
codebase should adhere to and for checking commits to make sure they're
adhering.

A policy is basically just any rule you want to enforce or pattern you want
to either maximize or minimize.  You tell diffjam how to count occurrences
by providing your own counting shell commands like `git grep TODO | wc -l`,
which looks for a counts instances of TODO in the codebase.

Adherence to the policies isn't all-or-nothing.  Diffjam can track the number of
violations and help you burn them down over time, or it can track the
number of good patterns and help you increase that number of over time.

## Running

* `yarn run diffjam`

## non-interactive commands
* `diffjam init` : create a new diffjam configuration
* `diffjam policy` : add a new policy.  Policies are goals for your code.
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
* count all instances of the string TODO in /src: `git grep TODO ./src | wc -l`

## Development
The development README is [here](devREADME.md).
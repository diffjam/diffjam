# diffjam

This is a command-line utility for documenting, tracking, and discouraging bad patterns in your codebase.

Diffjam allows you to create "policies" -- basically any rule you want to enforce or pattern you want
to minimize.  You tell diffjam how to count occurrences of violations of the policies
by providing strings to search for like `TODO`, and then diffjam counts instances of TODO in the codebase.
It can also be used in a githook to prevent new cases of a bad pattern.

Adherence to the policies isn't all-or-nothing.  Diffjam can be used in builds to track the number of
violations over time and help you burn them down, or it can track the
number of good patterns and help you increase that number of over time.

## Installing

* `yarn install diffjam --dev`


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
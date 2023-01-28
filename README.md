# diffjam

Diffjam is a command-line utility for documenting, tracking, and discouraging bad patterns in your codebase.

Diffjam allows you to create "policies" -- rules you want to enforce across your codebase. For example, if you wanted to prevent calls to `console.log` in your frontend you might define a configuration file

```yaml
policies:
  No console.log calls on frontend:
    baseline: 0
    description: Do not call console.log on the frontend
    filePattern: frontend/**/*.*
    hiddenFromOutput: false
    search:
      - regex:console.log\\(.*\\)
```

and run `yarn diffjam check` to enforce the policy

```
$ yarn diffjam check

searching for policy violations: [====================] 100% 0.0s
❌️ No console.log: 1 (expected 0 or fewer)
Violation:
src/effects/useQuota.tsx:8 -       console.log('abc');
 Do not call console.log on the frontend

❌️ Check failed.
Done in 519 ms.
error Command failed with exit code 1.
```

You tell diffjam how to count occurrences of violations of the policies
by providing strings to search for like `TODO`, and then diffjam counts instances of TODO in the codebase.
It can also be used in a githook to prevent new cases of a bad pattern.

Adherence to the policies isn't all-or-nothing.  Diffjam can be used in builds to track the number of
violations over time and help you burn them down, or it can track the
number of good patterns and help you increase that number of over time.

## Installing

* `yarn add diffjam --dev`


## Running

* `yarn run diffjam`

## non-interactive commands
* `diffjam init`: creates a new configuration file with an example policy.
* `diffjam add` : add a new policy to your configuration file.
* `diffjam count` : see the current values for all quests.

* `diffjam cinch` : Change the baselines to strictest passable valuable for the code.
* `diffjam check` : Same as `count`, but it exits with a code of 1 if the counts aren't good enough for the baselines.
* `diffjam modify [name]` : Interactively modify the policy with a given name
* `diffjam remove [name]` : Removes the policy with a given name from your configuration file

### extended `diffjam count` usage:
* use `DIFFJAM_API_KEY=[your api key] diffjam --record` to record counts to diffjam.com.

### using an alernative configuration file
diffjam uses diffjam.yaml as the default config file. To use another, specify it with the `--config` flag for any command
`diffjam [command] --config=alternate-config.yaml`

## Development
The development README is [here](devREADME.md).

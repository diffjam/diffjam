# diffkit-cli


## commands
* `diffkit init` : create a new diffkit configuration
* `diffkit quest` : add a new quest.  Quests are goals for your code.
* `diffkit count` : see the current values for all quests.
* `diffkit cinch` : Change the baselines to strictest passable valuable for the code.
* `diffkit check` : Same as `count`, but it exits with a code of 1 if the counts aren't good enough for the baselines.


## example searches
* count all javascript files: `git ls-files "*.js" | wc -l`
* count all instances of the string TODO: `git grep TODO | wc -l`

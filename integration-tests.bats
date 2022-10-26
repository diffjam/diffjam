#!/usr/bin/env bats

@test "test" {
  run node ./lib/index.js check --dir=./integration_test --config=./integration_test/config.yaml
  [ "$status" -eq 1 ]
  [ "${lines[0]}" = "No issues found." ]
  [ "$status" -eq 0 ]
  [ "$output" = "hello world" ]
}

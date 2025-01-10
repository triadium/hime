#!/bin/bash

SCRIPT="$(readlink -f "$0")"
ROOT="$(dirname "$SCRIPT")"

source "$ROOT/build-env.sh"

# echo "$OSTYPE"
# source "$ROOT/build-checks.sh"

echo "-- .TypeScript components --"
cd "$ROOT/runtime-ts/"
node ".yarn/yarn-4.5.1.cjs" workspaces focus
node ".yarn/yarn-4.5.1.cjs" lint
node ".yarn/yarn-4.5.1.cjs" build
node ".yarn/yarn-4.5.1.cjs" pack --out $ROOT/runtime-ts/dist/%s-%v.tgz
cp  $ROOT/runtime-ts/dist/*.tgz "$ROOT/sdk-rust/src/output/assembly_typescript_package/dist/"
cp  $ROOT/runtime-ts/dist/*.tgz "$ROOT/tests-executor-ts/packs/"

cd "$ROOT/tests-executor-ts/"
node ".yarn/yarn-4.5.1.cjs" workspaces focus
node ".yarn/yarn-4.5.1.cjs" lint
node ".yarn/yarn-4.5.1.cjs" build
cp $ROOT/tests-executor-ts/src/*.bin "$ROOT/tests-executor-ts/dist/"
cd "$ROOT"

echo "-- Rust components --"
cargo update
cargo build
cargo test
cargo clippy

# Setup the test components
rm -rf "$ROOT/tests-results"
mkdir -p "$ROOT/tests-results"
cp "$ROOT/target/debug/hime_tests_driver" "$ROOT/tests-results/hime_tests_driver"

## TypeScript
mkdir -p "$ROOT/tests-results/executor-ts/dist"
mkdir -p "$ROOT/tests-results/executor-ts/packs"
mkdir -p "$ROOT/tests-results/executor-ts/.yarn"
cp $ROOT/tests-executor-ts/dist/*.* "$ROOT/tests-results/executor-ts/dist/"
cp $ROOT/tests-executor-ts/packs/*.tgz "$ROOT/tests-results/executor-ts/packs/"
cp $ROOT/tests-executor-ts/.yarn/*.cjs "$ROOT/tests-results/executor-ts/.yarn/"
cp "$ROOT/tests-executor-ts/.yarnrc.yml" "$ROOT/tests-results/executor-ts/"
cp "$ROOT/tests-executor-ts/package.json" "$ROOT/tests-results/executor-ts/"

# Execute the tests
cd "$ROOT/tests-results"
./hime_tests_driver
cd "$ROOT"

# Cleanup the tests
# mv "$ROOT/tests-results/TestResults.xml" "$ROOT/TestResults.xml"
# rm -r "$ROOT/tests-results"

# exit

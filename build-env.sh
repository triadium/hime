#!/bin/bash

SCRIPT="$(readlink -f "$0")"
ROOT="$(dirname "$SCRIPT")"

GIT_HASH_SHORT=$(git rev-parse --short HEAD)
GIT_HASH=$(git rev-parse HEAD)
GIT_TAG=$(git tag -l --points-at HEAD)

LABEL=latest
if [[ ! -z "$GIT_TAG" ]]; then
  LABEL="$GIT_TAG"
fi

VERSION=$(grep "version" "$ROOT/runtime-rust/Cargo.toml" | grep -o -E "([[:digit:]]+\\.[[:digit:]]+\\.[[:digit:]])+")

MONO=$(which mono)
if [ -z "$MONO" ]
then
  echo "Mono is not installed!"
  exit 1
fi
MONO=$(mono --version | grep 'version')

MONO461=/usr/lib/mono/4.6.1-api
if [ ! -f "$MONO461/mscorlib.dll" ]; then
  echo "Required Mono assemblies for .Net Framework 4.6.1 not found!"
  exit 1
fi

MONO20=/usr/lib/mono/2.0-api
if [ ! -f "$MONO20/mscorlib.dll" ]; then
  echo "Required Mono assemblies for .Net Framework 2.0 not found!"
  exit 1
fi

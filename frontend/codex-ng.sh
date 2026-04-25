#!/bin/sh
set -eu

RUNTIME_NODE="/Users/hugoevangelista09/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
NPM_CLI="/Users/hugoevangelista09/Documents/Codex/angular-tooling/node-v22.22.2-darwin-arm64/lib/node_modules/npm/bin/npm-cli.js"

exec "$RUNTIME_NODE" "$NPM_CLI" "$@"

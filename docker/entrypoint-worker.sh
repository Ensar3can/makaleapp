#!/bin/sh
set -eu

pnpm --filter @aip/database db:wait

exec "$@"

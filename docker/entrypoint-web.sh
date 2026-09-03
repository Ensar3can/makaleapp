#!/bin/sh
set -eu

pnpm --filter @aip/database db:ensure
pnpm --filter @aip/database prisma:migrate

exec "$@"

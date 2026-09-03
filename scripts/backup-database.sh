#!/bin/sh
set -eu

DATABASE="${DATABASE:-aip}"
PASSWORD="${MSSQL_SA_PASSWORD:-AipDevPassw0rd}"
OUTPUT_DIR="${OUTPUT_DIR:-.data/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${DATABASE}-${STAMP}.bak"
CONTAINER="${MSSQL_CONTAINER:-$(docker compose ps -q mssql)}"

mkdir -p "$OUTPUT_DIR"

docker exec "$CONTAINER" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$PASSWORD" -C \
  -Q "BACKUP DATABASE [$DATABASE] TO DISK = N'/var/opt/mssql/backup/$FILE' WITH INIT, COPY_ONLY, STATS = 10;"

docker cp "$CONTAINER:/var/opt/mssql/backup/$FILE" "$OUTPUT_DIR/$FILE"
printf '%s\n' "$OUTPUT_DIR/$FILE"

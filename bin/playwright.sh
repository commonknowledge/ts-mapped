#!/bin/bash
set -euo pipefail

docker compose up -d

# Get Bitwarden env vars from .env file
while IFS= read -r line; do
  export "$line"
done < <(grep '^BW_' ".env")

bw logout
bw login --apikey
bw unlock --apikey
bw sync
bw get attachment credentials.json --itemid $BW_TEST_CREDENTIALS_ITEM_ID --output tests/
bw logout

while [ "$(docker inspect --format='{{.State.Health.Status}}' postgres)" != "healthy" ]; do
  echo "Container status: $(docker inspect --format='{{.State.Health.Status}}' postgres). Waiting..."
  sleep 2
done

docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS playwright;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE playwright;"

export DATABASE_URL=postgres://postgres:postgres@localhost:5444/playwright

npm run kysely migrate latest
npm run cmd -- upsertUser --email joaquim@commonknowledge.coop --password 1234 --org "Common Knowledge"

npx playwright test --ui

#!/bin/bash

SCRIPT_DIR=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)
PARENT_DIR=$(dirname $SCRIPT_DIR)

touch $PARENT_DIR/.env

if [ -f "$PARENT_DIR/test_credentials.json" ]; then
  echo "Found existing test_credentials.json, skipping download. Delete this file and re-run the tests if you need to update it."
else
  # export BWS_ variables
  while IFS= read -r line; do
    key="${line%%=*}"
    if [[ $key == BWS_* ]]; then
      value="${line#*=}"
      export "$key=$value"
    fi
  done < $PARENT_DIR/.env

  echo "Downloading test credentials from Bitwarden..."

  # `2>/dev/null` strips warnings from the JSON output.
  # There should be a better way, but after half an hour of trying, I couldn't find it.
  BWS_SECRET_RESPONSE=$(docker run --env-file .env -e BWS_ACCESS_TOKEN=$BWS_ACCESS_TOKEN --rm bitwarden/bws secret get $BWS_TEST_CREDENTIALS_SECRET 2>/tmp/bws-secret-response-error.txt)
  BWS_TEST_CREDENTIALS=$(echo "$BWS_SECRET_RESPONSE" | jq ".value" | jq -r '.' | jq '.')

  echo "Bitwarden response: $BWS_SECRET_RESPONSE"
  echo "Bitwarden error: $(cat /tmp/bws-secret-response-error.txt)"

  echo $BWS_TEST_CREDENTIALS > $PARENT_DIR/test_credentials.json
fi

docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS postgres_test"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE postgres_test"

node --env-file=.env.testing ./node_modules/.bin/kysely migrate:latest

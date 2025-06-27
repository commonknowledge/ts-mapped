#!/bin/bash

SCRIPT_DIR=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)
PARENT_DIR=$(dirname $SCRIPT_DIR)

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

  # `2>/dev/null` strips warnings from the JSON output.
  # There should be a better way, but after half an hour of trying, I couldn't find it.
  BWS_SECRET_RESPONSE=$(docker run --env-file .env --rm bitwarden/bws secret get $BWS_TEST_CREDENTIALS_SECRET 2>/dev/null)
  BWS_TEST_CREDENTIALS=$(echo "$BWS_SECRET_RESPONSE" | jq ".value" | jq -r '.' | jq '.')

  echo $BWS_TEST_CREDENTIALS > $PARENT_DIR/test_credentials.json
fi

docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS postgres_test"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE postgres_test"

node --env-file=.env.test ./node_modules/.bin/kysely migrate:latest

docker compose exec -T postgres psql -U postgres -d postgres_test < $PARENT_DIR/tests/resources/sample_postcodes.psql

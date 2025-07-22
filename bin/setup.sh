#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Pretty print function
pretty_print() {
  echo -e "${CYAN}\n============================================================"
  echo -e "$1"
  echo -e "============================================================${NC}\n"
}

# Loading indicator
loading() {
  local pid=$1
  local delay=0.2
  local spinstr='|/-\\'
  while [ -d "/proc/$pid" ]; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    spinstr=$temp${spinstr%$temp}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# 1. Prompt for BitWarden file
pretty_print "Step 1: Please download 'local.env' from BitWarden ('TypeScript Mapped' item) and place it in the root of the project as '.env'.\nPress Enter to continue once done."
read

# 2. Prompt for database dump
pretty_print "Step 2: Please obtain the database dump from the maintainer and place it in the root of the project as 'ts-mapped.psql'.\nPress Enter to continue once done."
read

# 3. Start the database
pretty_print "Step 3: Stopping and removing any existing Docker containers and volumes for a clean start..."
docker compose down -v
pretty_print "Starting the database with Docker Compose..."
docker compose up -d
pretty_print "Waiting for the database to be healthy..."
for i in {1..30}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' ts-mapped-postgres 2>/dev/null || echo "starting")
  if [ "$STATUS" == "healthy" ]; then
    echo -e "${GREEN}Postgres is healthy!${NC}"
    break
  fi
  echo -n "."
  sleep 2
done
if [ "$STATUS" != "healthy" ]; then
  echo -e "${YELLOW}\nWarning: Postgres did not become healthy after 60 seconds. Proceeding anyway.${NC}"
fi

# 4. Import the database dump
pretty_print "Step 4: Importing the database dump. This may take up to 10 minutes. Please make a cup of tea!\n"
(
  docker compose exec -u postgres -T postgres psql < ts-mapped.psql > /dev/null 2>&1 &
  pid=$!
  loading $pid
  wait $pid
)
pretty_print "Database import complete!"

# 5. Install dependencies
pretty_print "Step 5: Installing dependencies with npm..."
npm i

# 6. Run migrations
pretty_print "Step 6: Running migrations..."
npm run kysely migrate:latest

# 7. Start the server

# 8. Final message
pretty_print "Setup complete! View the site at http://localhost:3000\nLog in with username 'hello@commonknowledge.coop' and password '1234'."

#!/bin/bash

# Pretty print function
pretty_print() {
  echo -e "${CYAN}\n============================================================"
  echo -e "$1"
  echo -e "============================================================${NC}\n"
}

# Start the development server
pretty_print "Starting the development server..."
pretty_print "View the site at https://localhost:3000\nLog in with username 'hello@commonknowledge.coop' and password '1234'"

docker compose up -d
npm run migrate
npm i
npm run dev

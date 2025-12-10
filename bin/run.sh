#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Pretty print function
pretty_print() {
  echo -e "${CYAN}============================================================"
  echo -e "$1"
  echo -e "============================================================${NC}\n"
}

# Success message
success_msg() {
  echo -e "${GREEN}✓ $1${NC}\n"
}

# Info message
info_msg() {
  echo -e "${CYAN}ℹ $1${NC}\n"
}

# Warning message
warning_msg() {
  echo -e "${YELLOW}⚠ $1${NC}\n"
}

# Start the development server
pretty_print "🚀 Starting ts-mapped Development Server"
info_msg "This will set up Docker, install dependencies, and start the dev server"

echo -e "${CYAN}Step 1/4: Starting Docker containers...${NC}"
docker compose up -d
if [ $? -eq 0 ]; then
  success_msg "Docker containers started"
else
  echo -e "${RED}✗ Failed to start Docker containers${NC}"
  exit 1
fi

echo -e "${CYAN}Step 2/4: Installing dependencies...${NC}"
npm i
if [ $? -eq 0 ]; then
  success_msg "Dependencies installed"
else
  echo -e "${RED}✗ Failed to install dependencies${NC}"
  exit 1
fi

echo -e "${CYAN}Step 3/4: Running database migrations...${NC}"
warning_msg "This step may take a while depending on your database size"
npm run migrate
if [ $? -eq 0 ]; then
  success_msg "Database migrations completed"
else
  echo -e "${RED}✗ Failed to run migrations${NC}"
  exit 1
fi

echo -e "${CYAN}Step 4/4: Starting development server...${NC}"
npm run dev
if [ $? -eq 0 ]; then
  success_msg "Development server started"
else
  echo -e "${RED}✗ Failed to start development server${NC}"
  exit 1
fi

# Display connection info
pretty_print "✨ Setup Complete!"
success_msg "View the site at ${GREEN}https://localhost:3000${NC}"
info_msg "Log in with:"
echo -e "  ${YELLOW}Username:${NC} hello@commonknowledge.coop"
echo -e "  ${YELLOW}Password:${NC} 1234"

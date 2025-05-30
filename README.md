# Full-stack Typescript Mapped

## Local Setup

### Requirements

- Docker
- NodeJS v22+

### Instructions

1. Copy `.env.example` to `.env` and fill in any missing values (Bitwarden values are only required for running tests).
2. Get a database dump from the maintainer of this repo and place it in the root of the project as `ts-mapped.psql`.
3. Start the database with `docker compose up`
4. Import the database dump with `docker compose exec -u postgres -T postgres psql < ts-mapped.psql`
5. Install dependencies with `npm i`
6. Start the server with `npm run dev`
7. View the site at `http://localhost:3000`
8. Log in with username `joaquimds@gmail.com` and password `1234`.

### End-to-end Tests

1. Ensure you have the Bitwarden CLI installed: `npm install -g @bitwarden/cli`
2. Start the test runner with `./bin/playwright.sh`.
3. Run the tests through the test runner.


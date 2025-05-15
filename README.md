# Full-stack Typescript Mapped

## Local Setup

### Requirements

- Docker
- NodeJS v22+

### Instructions

1. Copy `.env.example` to `.env` and fill in any missing values.
2. Get a database dump from the maintainer of this repo and place it in the root of the project as `ts-mapped.psql`.
3. Start the database with `docker compose up`
4. Import the database dump with `docker compose exec -u postgres -T postgres psql < ts-mapped.psql`
5. Install dependencies with `npm i`
6. Start the server with `npm run dev`
7. View the site at `http://localhost:3000`
8. Log in with username `joaquimds@gmail.com` and password `1234`.

### End-to-end Tests

1. Start the database with `docker compose up`.
2. Build the project with `npm run build`.
3. Start the test runner with `npx playwright test --ui`.
4. Run the tests through the test runner.

# Full-stack Typescript Mapped

## Local Setup

### Requirements

- Docker
- NodeJS v22+

### Instructions

1. Copy `.env.example` to `.env` and fill in any missing values.
2. Get a database dump from the maintainer of this repo.
3. Start the database with `docker compose up`
4. Import the database dump with `psql -h 127.0.0.1 -p 5444 -U postgres < path/to/ts-mapped.psql`
5. Install dependencies with `npm i`
6. Start the server with `npm run dev`
7. View the site at `http://localhost:3000`

Currently the authentication is fake, you can log in with any email / password
combination.

# Full-stack Typescript Mapped

## Local Setup

### Requirements

- Docker
- NodeJS v22+

**For Tests**

- `jq` (Installed by default on MacOS)

### Instructions

1. Download `local.env` from BitWarden "TypeScript Mapped" item. Place it in the root of the project as `.env`.
2. Get a database dump from the maintainer of this repo and place it in the root of the project as `ts-mapped.psql`.
3. Start the database with `docker compose up`
4. Import the database dump with `docker compose exec -u postgres -T postgres psql < ts-mapped.psql`
5. Install dependencies with `npm i`
6. Run any migrations with `npm run kysely migrate:latest`
7. Start the server with `npm run dev`
8. View the site at `https://localhost:3000`
9. Log in with username `hello@commonknowledge.coop` and password `1234`.

### Seed Data

The SQL import includes the following:

- Data sources:
  - Seed Airtable: https://airtable.com/appMdYSgvrFYZcr4k/tblSy67uoOyoeUb50/viwXlZr9qcFowFCJR?blocks=hide
  - Hope Not Hate vote share CSV
- Area sets:
  - Constituencies (2024)
  - Census Output Areas and MSOAs (2021)

### Migrations

- Create with `npm run kysely migrate:make [name]`
- Run with `npm run kysely migrate:latest`

### Commands

- The [Commander](https://www.npmjs.com/package/commander) library has been used to create a CLI for this project.
- Add commands to `bin/cmd.ts`.
- Run commands with `npm run cmd -- [command] [...args]`

### Tests

- Run tests with `npm test`
- This will download `test_credentials.json` from BitWarden Secrets manager, which is required to test the data source adaptors.
- Filter tests with `npm test -t [filter]`

# Full-stack Typescript Mapped

## Local Setup

### Requirements

- Docker
- NodeJS v22+

**For Tests**

- `jq` (Installed by default on MacOS)

### Installation

1. Run `bin/setup.sh` and follow the instuctions.
2. Run `bin/run.sh` to start Mapped!
3. Open the dev server at https://localhost:3000

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

## Further Details

### Seed Data

The SQL import includes the following:

- Data sources:
  - Seed Airtable: https://airtable.com/appMdYSgvrFYZcr4k/tblSy67uoOyoeUb50/viwXlZr9qcFowFCJR?blocks=hide
  - Hope Not Hate vote share CSV
- Area sets:
  - Constituencies (2024)
  - Census Output Areas and MSOAs (2021)

import { AirtableWebhookTable } from "./AirtableWebhook";
import { AreaTable } from "./Area";
import { AreaSetTable } from "./AreaSet";
import { DataRecordTable } from "./DataRecord";
import { DataSourceTable } from "./DataSource";
import { JobTable } from "./Job";
import { OrganisationTable } from "./Organisation";
import { OrganisationUserTable } from "./OrganisationUser";
import { UserTable } from "./User";

export interface Database {
  airtableWebhook: AirtableWebhookTable;
  area: AreaTable;
  areaSet: AreaSetTable;
  dataSource: DataSourceTable;
  dataRecord: DataRecordTable;
  organisation: OrganisationTable;
  organisationUser: OrganisationUserTable;
  user: UserTable;
  "pgboss.job": JobTable;
}

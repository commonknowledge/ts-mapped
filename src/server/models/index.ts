import { AreaTable } from "./Area";
import { AreaSetTable } from "./AreaSet";
import { DataRecordTable } from "./DataRecord";
import { DataSourceTable } from "./DataSource";
import { JobTable } from "./Job";

export interface Database {
  area: AreaTable;
  areaSet: AreaSetTable;
  dataSource: DataSourceTable;
  dataRecord: DataRecordTable;
  "pgboss.job": JobTable;
}

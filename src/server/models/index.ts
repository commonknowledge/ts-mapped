import { AreaTable } from "./Area"
import { AreaSetTable } from "./AreaSet"
import { DataRecordTable } from "./DataRecord"
import { DataSourceTable } from "./DataSource"

export interface Database {
  dataSource: DataSourceTable,
  dataRecord: DataRecordTable,
  areaSet: AreaSetTable,
  area: AreaTable,
}

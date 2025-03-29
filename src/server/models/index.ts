import { AreaTable } from "./Area";
import { AreaSetTable } from "./AreaSet";
import { DataRecordTable } from "./DataRecord";
import { DataSourceTable } from "./DataSource";
import { PublishedLayerTable } from "./PublishedLayers";
export interface Database {
  dataSource: DataSourceTable;
  dataRecord: DataRecordTable;
  areaSet: AreaSetTable;
  area: AreaTable;
  publishedLayer: PublishedLayerTable;
}

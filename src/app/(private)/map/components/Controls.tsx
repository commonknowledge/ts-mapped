import { DataSourcesQuery } from "@/__generated__/types";
import {
  AREA_SET_GROUP_LABELS,
  AreaSetGroupCode,
} from "@/app/(private)/map/sources";
import styles from "./Controls.module.css";

export class MapConfig {
  public areaDataSourceId = "";
  public areaDataColumn = "";
  public areaSetGroupCode: AreaSetGroupCode = "WMC24";
  public markersDataSourceId = "";
}

export default function Controls({
  dataSources,
  mapConfig,
  onChange,
}: {
  dataSources: DataSourcesQuery["dataSources"];
  mapConfig: MapConfig;
  onChange: (mapConfig: Partial<MapConfig>) => void;
}) {
  const dataSource = dataSources.find(
    (ds: { id: string }) => ds.id === mapConfig.areaDataSourceId,
  );

  return (
    <div className={styles.controls}>
      <select
        value={mapConfig.markersDataSourceId}
        onChange={(e) => onChange({ markersDataSourceId: e.target.value })}
      >
        <option value="">Select a markers data source</option>
        {dataSources.map((ds: { id: string; name: string }) => (
          <option key={ds.id} value={ds.id}>
            {ds.name}
          </option>
        ))}
      </select>
      <select
        value={mapConfig.areaDataSourceId}
        onChange={(e) => onChange({ areaDataSourceId: e.target.value })}
      >
        <option value="">Select an area data source</option>
        {dataSources.map((ds: { id: string; name: string }) => (
          <option key={ds.id} value={ds.id}>
            {ds.name}
          </option>
        ))}
      </select>
      {dataSource ? (
        <select
          value={mapConfig.areaDataColumn}
          onChange={(e) => onChange({ areaDataColumn: e.target.value })}
        >
          <option value="">Select a data column</option>
          <option value="__maxColumn">Highest-value column</option>
          {dataSource.columnDefs.map((cd: { name: string }) => (
            <option key={cd.name} value={cd.name}>
              {cd.name}
            </option>
          ))}
        </select>
      ) : null}
      <select
        value={mapConfig.areaSetGroupCode}
        onChange={(e) =>
          onChange({ areaSetGroupCode: e.target.value as AreaSetGroupCode })
        }
      >
        {Object.keys(AREA_SET_GROUP_LABELS).map((code) => (
          <option key={code} value={code}>
            {AREA_SET_GROUP_LABELS[code as AreaSetGroupCode]}
          </option>
        ))}
      </select>
    </div>
  );
}

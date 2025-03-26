import { DataSource } from "@/server/models/DataSource";

export const serializeDataSource = (dataSource: DataSource) => ({
  ...dataSource,
  createdAt: dataSource.createdAt.toISOString(),
});

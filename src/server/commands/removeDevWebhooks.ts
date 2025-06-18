import { getDataSourceAdaptor } from "@/server/adaptors";
import { findDataSourceById } from "@/server/repositories/DataSource";

const removeDevWebhooks = async (id: string) => {
  const dataSource = await findDataSourceById(id);
  if (!dataSource) {
    throw new Error("Data source not found");
  }
  const adaptor = getDataSourceAdaptor(dataSource.config);
  if (!adaptor) {
    throw new Error(
      `No data source adaptor for config ${JSON.stringify(dataSource.config)}`,
    );
  }
  await adaptor.removeDevWebhooks(dataSource.id);
};

export default removeDevWebhooks;

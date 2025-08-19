import { gql, useMutation, useQuery } from "@apollo/client";
import { LoaderPinwheel, X } from "lucide-react";
import {
  FormEvent,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ColumnDef,
  PublicMap,
  PublicMapColumn,
  PublicMapColumnType,
  PublicMapDataSourceConfig,
  PublicMapModalQuery,
  PublicMapModalQueryVariables,
  UpsertPublicMapMutation,
  UpsertPublicMapMutationVariables,
} from "@/__generated__/types";
import ColumnsMultiSelect from "@/components/ColumnsMultiSelect";
import DataListRow from "@/components/DataListRow";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { MapContext } from "@/components/Map/context/MapContext";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";

type PublicMapConfig = Omit<PublicMap, "id" | "mapId">;
interface DataSource {
  id: string;
  name: string;
  columnDefs: ColumnDef[];
  columnRoles: { nameColumns?: string[] | null };
}

export default function PublishViewModal({
  viewId,
  onClose,
}: {
  viewId: string;
  onClose: () => void;
}) {
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { mapConfig } = useContext(MapContext);
  const [error, setError] = useState("");
  const [showConfigForm, setShowConfigForm] = useState(false);

  const mapDataSources = useMemo(() => {
    return mapConfig
      .getDataSourceIds()
      .map((id) => getDataSourceById(id))
      .filter((ds) => ds !== null);
  }, [getDataSourceById, mapConfig]);

  const [publicMap, setPublicMap] = useState<PublicMapConfig>({
    host: "",
    name: "",
    description: "",
    descriptionLink: "",
    published: false,
    viewId,
    dataSourceConfigs: mapDataSources.map((ds) => createDataSourceConfig(ds)),
  });

  // Stores the last published host (only changes when form is submitted)
  const [publishedHost, setPublishedHost] = useState("");

  const publicMapQuery = useQuery<
    PublicMapModalQuery,
    PublicMapModalQueryVariables
  >(
    gql`
      query PublicMapModal($viewId: String!) {
        publicMap(viewId: $viewId) {
          id
          host
          name
          description
          descriptionLink
          published
          dataSourceConfigs {
            dataSourceId
            nameLabel
            nameColumns
            descriptionLabel
            descriptionColumn
            additionalColumns {
              label
              sourceColumns
              type
            }
          }
        }
      }
    `,
    { variables: { viewId }, fetchPolicy: "network-only" },
  );

  useEffect(() => {
    if (publicMapQuery.data?.publicMap) {
      const publicMap = { ...publicMapQuery.data.publicMap, viewId };
      const dataSourceConfigs = [...publicMap.dataSourceConfigs];
      // Ensure a config item exists for all data sources
      for (const ds of mapDataSources) {
        if (!dataSourceConfigs.some((dsc) => dsc.dataSourceId === ds.id)) {
          dataSourceConfigs.push(createDataSourceConfig(ds));
        }
      }
      setPublicMap({ ...publicMap, dataSourceConfigs });
      setPublishedHost(publicMapQuery.data.publicMap.host);
    }
  }, [mapDataSources, publicMapQuery.data, viewId]);

  const [upsertPublicMap, { loading }] = useMutation<
    UpsertPublicMapMutation,
    UpsertPublicMapMutationVariables
  >(gql`
    mutation UpsertPublicMap(
      $viewId: String!
      $host: String!
      $name: String!
      $description: String!
      $descriptionLink: String!
      $published: Boolean!
      $dataSourceConfigs: [PublicMapDataSourceConfigInput!]!
    ) {
      upsertPublicMap(
        viewId: $viewId
        host: $host
        name: $name
        description: $description
        descriptionLink: $descriptionLink
        published: $published
        dataSourceConfigs: $dataSourceConfigs
      ) {
        code
        result {
          host
          published
        }
      }
    }
  `);

  const onSubmitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!viewId) {
      return;
    }
    setError("");
    try {
      const result = await upsertPublicMap({
        variables: publicMap,
      });
      if (result.data?.upsertPublicMap?.result) {
        setPublishedHost(
          result.data.upsertPublicMap.result.published
            ? result.data.upsertPublicMap.result.host
            : "",
        );
      }
      if (result.data?.upsertPublicMap?.code === 409) {
        setError("A public map already exists for this subdomain.");
      }
    } catch (e) {
      console.error("Failed to upsert public map", e);
      setError("Unknown error.");
    }
  };

  return (
    <Dialog
      open={Boolean(viewId)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish View</DialogTitle>
          <DialogDescription>
            <span>Make this view accessible to the public. </span>
            <span className="font-bold text-red-500">
              Ensure no private data is used in this map, as it will become
              public!{" "}
            </span>
            {publishedHost && (
              <span className="font-bold">
                This view is published at{" "}
                <a href={getPublicMapUrl(publishedHost)} target="_blank">
                  {getPublicMapUrl(publishedHost)}
                </a>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {publicMapQuery.loading ? (
          <LoaderPinwheel className="animate-spin" />
        ) : showConfigForm ? (
          <ConfigureDataForm
            onClickBack={() => setShowConfigForm(false)}
            onSubmitForm={onSubmitForm}
            updatePublicMap={(changes) =>
              setPublicMap({ ...publicMap, ...changes })
            }
            publicMap={publicMap}
            dataSources={mapDataSources}
            loading={loading}
          />
        ) : (
          <PublishViewForm
            onClickConfigure={() => setShowConfigForm(true)}
            onSubmitForm={onSubmitForm}
            updatePublicMap={(changes) =>
              setPublicMap({ ...publicMap, ...changes })
            }
            publicMap={publicMap}
            loading={loading}
          />
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </DialogContent>
    </Dialog>
  );
}

function PublishViewForm({
  onClickConfigure,
  onSubmitForm,
  updatePublicMap,
  publicMap,
  loading,
}: {
  onClickConfigure: () => void;
  onSubmitForm: (e: FormEvent<HTMLFormElement>) => void;
  updatePublicMap: (publicMap: Partial<PublicMapConfig>) => void;
  publicMap: PublicMapConfig;
  loading: boolean;
}) {
  return (
    <form className="flex flex-col gap-4 relative" onSubmit={onSubmitForm}>
      <DataListRow label="Subdomain">
        <Input
          type="text"
          placeholder="my-map"
          value={getSubdomain(publicMap.host)}
          onChange={(e) => updatePublicMap({ host: makeHost(e.target.value) })}
          required
          pattern="^[a-z]+(-[a-z]+)*$"
        />
      </DataListRow>
      <DataListRow label="Published">
        <Switch
          checked={publicMap.published}
          onCheckedChange={(published) => updatePublicMap({ published })}
        />
      </DataListRow>
      <DataListRow label="Name">
        <Input
          type="text"
          placeholder="My Map"
          value={publicMap.name}
          onChange={(e) => updatePublicMap({ name: e.target.value })}
          required
        />
      </DataListRow>
      <DataListRow label="Description">
        <Input
          type="text"
          placeholder="A public map made by me."
          value={publicMap.description}
          onChange={(e) => updatePublicMap({ description: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="Project Link">
        <Input
          type="text"
          placeholder="https://example.com"
          value={publicMap.descriptionLink}
          onChange={(e) => updatePublicMap({ descriptionLink: e.target.value })}
        />
      </DataListRow>
      <div className="flex gap-4">
        <Button
          className="basis-0 grow"
          disabled={loading}
          type="button"
          variant="outline"
          onClick={onClickConfigure}
        >
          Configure data
        </Button>
        <Button className="basis-0 grow" disabled={loading} type="submit">
          Update
        </Button>
      </div>
    </form>
  );
}

function ConfigureDataForm({
  onClickBack,
  onSubmitForm,
  updatePublicMap,
  publicMap,
  dataSources,
  loading,
}: {
  onClickBack: () => void;
  onSubmitForm: (e: FormEvent<HTMLFormElement>) => void;
  updatePublicMap: (publicMap: Partial<PublicMapConfig>) => void;
  publicMap: PublicMapConfig;
  dataSources: DataSource[];
  loading: boolean;
}) {
  return (
    <form onSubmit={onSubmitForm}>
      {dataSources.map((ds, i) => {
        return (
          <Fragment key={ds.id}>
            <DataSourceFields
              dataSource={ds}
              publicMap={publicMap}
              updatePublicMap={updatePublicMap}
            />
            {i < dataSources.length - 1 && <Separator className="mb-4" />}
          </Fragment>
        );
      })}
      <div className="flex gap-4">
        <Button
          className="basis-0 grow"
          disabled={loading}
          type="button"
          variant="outline"
          onClick={onClickBack}
        >
          Back
        </Button>
        <Button className="basis-0 grow" disabled={loading} type="submit">
          Update
        </Button>
      </div>
    </form>
  );
}

function DataSourceFields({
  dataSource,
  publicMap,
  updatePublicMap,
}: {
  dataSource: DataSource;
  publicMap: PublicMapConfig;
  updatePublicMap: (publicMap: Partial<PublicMapConfig>) => void;
}) {
  const dataSourceConfig = publicMap.dataSourceConfigs.find(
    (dsc) => dsc.dataSourceId === dataSource.id,
  );
  const nameLabel = dataSourceConfig?.nameLabel || "";
  const nameColumns = dataSourceConfig?.nameColumns || [];
  const descriptionLabel = dataSourceConfig?.descriptionLabel || "";
  const descriptionColumn = dataSourceConfig?.descriptionColumn || "";
  const additionalColumns = dataSourceConfig?.additionalColumns || [];

  const onChange = (config: Partial<PublicMapDataSourceConfig>) => {
    const dataSourceConfigs = [];
    let found = false;
    for (const dsc of publicMap.dataSourceConfigs) {
      if (dsc.dataSourceId === dataSource.id) {
        found = true;
        dataSourceConfigs.push({ ...dsc, ...config });
      } else {
        dataSourceConfigs.push(dsc);
      }
    }
    if (!found) {
      dataSourceConfigs.push({
        ...createDataSourceConfig(dataSource),
        ...config,
        dataSourceId: dataSource.id,
      });
    }
    updatePublicMap({ dataSourceConfigs });
  };

  const onChangeAdditionalColumn = (
    index: number,
    changes: Partial<PublicMapColumn>,
  ) => {
    onChange({
      additionalColumns: additionalColumns.map((ac, i) => {
        if (i === index) {
          return { ...ac, ...changes };
        }
        return ac;
      }),
    });
  };

  return (
    <div>
      <h2>{dataSource.name}</h2>
      <DataListRow label="Name columns">
        <ColumnsMultiSelect
          columns={nameColumns}
          columnDefs={dataSource.columnDefs}
          onChange={(columns) => onChange({ nameColumns: columns })}
        />
      </DataListRow>
      <DataListRow
        label="Name label"
        description="A label to describe to users what the name represents (e.g. Member Name, Company Name, etc.)"
      >
        <Input
          value={nameLabel}
          onChange={(e) => onChange({ nameLabel: e.target.value })}
        />
      </DataListRow>
      <DataListRow label="Description/subtitle column">
        <Select
          value={descriptionColumn}
          onValueChange={(descriptionColumn) => onChange({ descriptionColumn })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a column" />
          </SelectTrigger>
          <SelectContent>
            {dataSource.columnDefs.map((cd) => (
              <SelectItem key={cd.name} value={cd.name}>
                {cd.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataListRow>
      <DataListRow
        label="Description/subtitle label"
        description="A label to describe to users what the description represents (e.g. Address, Further Info, etc.)"
      >
        <Input
          value={descriptionLabel}
          onChange={(e) => onChange({ descriptionLabel: e.target.value })}
        />
      </DataListRow>
      <div className="flex flex-col gap-2 py-4">
        <span className="text-sm leading-none font-medium">
          Additional information
        </span>
        {additionalColumns.map((additionalColumn, i) => {
          return (
            <div key={i} className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <ColumnsMultiSelect
                  buttonClassName="w-full"
                  columns={additionalColumn.sourceColumns}
                  columnDefs={dataSource.columnDefs}
                  onChange={(columns) =>
                    onChangeAdditionalColumn(i, { sourceColumns: columns })
                  }
                />
              </div>
              <Input
                className="col-span-3"
                placeholder="Label"
                value={additionalColumn.label}
                onChange={(e) =>
                  onChangeAdditionalColumn(i, { label: e.target.value })
                }
              />
              <div className="col-span-3">
                <Select
                  value={additionalColumn.type}
                  onValueChange={(type) =>
                    onChangeAdditionalColumn(i, {
                      type: type as PublicMapColumnType,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PublicMapColumnType.String}>
                      Text
                    </SelectItem>
                    <SelectItem value={PublicMapColumnType.Boolean}>
                      True/false
                    </SelectItem>
                    <SelectItem value={PublicMapColumnType.CommaSeparatedList}>
                      Comma-separated list
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="!px-0"
                onClick={() =>
                  onChange({
                    additionalColumns: additionalColumns.filter(
                      (_, index) => index !== i,
                    ),
                  })
                }
              >
                <X />
              </Button>
            </div>
          );
        })}
        <Button
          className="mr-auto"
          type="button"
          variant="outline"
          onClick={() =>
            onChange({
              additionalColumns: additionalColumns.concat([
                {
                  label: "",
                  sourceColumns: [],
                  type: PublicMapColumnType.String,
                },
              ]),
            })
          }
        >
          Add
        </Button>
      </div>
    </div>
  );
}

const createDataSourceConfig = (
  dataSource: DataSource,
): PublicMapDataSourceConfig => {
  return {
    dataSourceId: dataSource.id,
    nameLabel: "Name",
    nameColumns: dataSource.columnRoles.nameColumns || [],
    descriptionLabel: "Description",
    descriptionColumn: "",
    additionalColumns: [],
  };
};

const getBaseUrl = () =>
  new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001");

const makeHost = (subdomain: string) => {
  const baseHost = getBaseUrl().host;
  return `${subdomain}.${baseHost}`;
};

const getPublicMapUrl = (host: string) => {
  const proto = getBaseUrl().protocol;
  return `${proto}//${host}`;
};

const getSubdomain = (host: string | undefined) => {
  if (!host) {
    return "";
  }
  return host.split(".")[0];
};

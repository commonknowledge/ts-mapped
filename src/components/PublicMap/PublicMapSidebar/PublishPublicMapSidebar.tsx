"use client";

import { gql, useMutation } from "@apollo/client";
import {
  AlertCircle,
  Database,
  ExternalLink,
  Globe,
  Info,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useContext, useState, useEffect } from "react";
import {
  UpsertPublicMapMutation,
  PublicMapColumnType,
  UpsertPublicMapMutationVariables,
} from "@/__generated__/types";
import DataListRow from "@/components/DataListRow";
import { DataRecordContext } from "@/components/Map/context/DataRecordContext";
import { DataSourcesContext } from "@/components/Map/context/DataSourcesContext";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Switch } from "@/shadcn/ui/switch";
import { cn } from "@/shadcn/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import EditablePublicMapProperty from "./EditablePublicMapProperty";
import DataSourcesSelect from "./DataSourcesSelect";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";
import { publicMapColourSchemes } from "@/components/Map/styles";

export default function PublishPublicMapSidebar() {
  const {
    publicMap,
    updatePublicMap,
    updateDataSourceConfig,
    updateAdditionalColumn,
    dataRecordsQueries,
    activeTabId,
    setActiveTabId,
    activePublishTab,
    setActivePublishTab,
    recordSidebarVisible,
    setRecordSidebarVisible,
    colourScheme,
    setColourScheme,
  } = useContext(PublicMapContext);
  const { getDataSourceById } = useContext(DataSourcesContext);
  const { setSelectedDataRecord } = useContext(DataRecordContext);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [error, setError] = useState("");
  const [publishedHost, setPublishedHost] = useState(
    publicMap?.published ? publicMap.host : ""
  );

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

  // Should never happen
  if (!publicMap) {
    return;
  }

  const onSubmitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const result = await upsertPublicMap({
        variables: publicMap,
      });
      if (result.data?.upsertPublicMap?.result) {
        setPublishedHost(
          result.data.upsertPublicMap.result.published
            ? result.data.upsertPublicMap.result.host
            : ""
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

  const [mapTitle, setMapTitle] = useState(publicMap.name);
  const [mapDescription, setMapDescription] = useState(publicMap.description);
  const [mapDescriptionLink, setMapDescriptionLink] = useState(
    publicMap.descriptionLink
  );
  const sectionStyles = "flex flex-col gap-2 ";

  // Auto-select first record when data source tab changes and data panel is open
  useEffect(() => {
    if (activePublishTab === "data" && recordSidebarVisible && activeTabId) {
      const dataRecordsQuery = dataRecordsQueries[activeTabId];
      if (dataRecordsQuery?.data?.dataSource?.records?.length > 0) {
        const firstRecord = dataRecordsQuery.data.dataSource.records[0];
        setSelectedDataRecord({
          id: firstRecord.id,
          dataSourceId: activeTabId,
        });
      }
    }
  }, [
    activeTabId,
    activePublishTab,
    recordSidebarVisible,
    dataRecordsQueries,
    setSelectedDataRecord,
  ]);

  return (
    <div
      className={cn(
        "absolute top-0 right-0 z-10 bg-white flex border-l border-neutral-200",
        hideSidebar ? "h-auto" : "h-full"
      )}
    >
      <div className="flex flex-col h-full w-[360px]">
        {/* Header */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Button
                disabled={loading}
                type="button"
                onClick={() =>
                  onSubmitForm({
                    preventDefault: () => {},
                  } as FormEvent<HTMLFormElement>)
                }
              >
                <Globe className="w-4 h-4" /> Publish Map
              </Button>
              {publishedHost && (
                <Link href={getPublicMapUrl(publishedHost)}>
                  <Button disabled={loading} type="submit" variant="outline">
                    <ExternalLink className="w-4 h-4" /> View
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link
                  href={`/map/${publicMap.mapId}?viewId=${publicMap.viewId}`}
                >
                  back
                </Link>
              </Button>
            </div>
          </div>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
        {!hideSidebar && (
          <div className="p-4 flex flex-col gap-4">
            <Tabs
              value={activePublishTab}
              onValueChange={(value) => {
                setActivePublishTab(value);
                if (value === "data") {
                  if (!recordSidebarVisible) {
                    setRecordSidebarVisible(true);
                  }

                  // Select the first record from the active data source
                  const currentDataSourceId =
                    activeTabId ||
                    publicMap?.dataSourceConfigs[0]?.dataSourceId;
                  if (
                    currentDataSourceId &&
                    dataRecordsQueries[currentDataSourceId]
                  ) {
                    const firstRecord =
                      dataRecordsQueries[currentDataSourceId]?.data?.dataSource
                        ?.records?.[0];
                    if (firstRecord) {
                      setSelectedDataRecord({
                        id: firstRecord.id,
                        dataSourceId: currentDataSourceId,
                      });
                    }
                  }
                }
              }}
            >
              <TabsList className="bg-transparent p-0 h-auto w-full border-b border-neutral-200 rounded-none">
                <TabsTrigger
                  value="publish settings"
                  className="bg-transparent border-0 border-b-2 border-transparent rounded-none pb-2 data-[state=active]:bg-transparent data-[state=active]:border-b-current data-[state=active]:shadow-none"
                >
                  Publish Settings
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="bg-transparent border-0 border-b-2 border-transparent rounded-none pb-2 data-[state=active]:bg-transparent data-[state=active]:border-b-current data-[state=active]:shadow-none"
                >
                  Data
                </TabsTrigger>
                <TabsTrigger
                  value="style"
                  className="bg-transparent border-0 border-b-2 border-transparent rounded-none pb-2 data-[state=active]:bg-transparent data-[state=active]:border-b-current data-[state=active]:shadow-none"
                >
                  Style
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="publish settings"
                className="flex flex-col gap-4"
              >
                <form className={sectionStyles} onSubmit={onSubmitForm}>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" /> URL
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">https://</span>
                    <Input
                      type="text"
                      placeholder="my-map"
                      value={getSubdomain(publicMap.host)}
                      onChange={(e) =>
                        updatePublicMap({ host: makeHost(e.target.value) })
                      }
                      required
                      pattern="^[a-z]+(-[a-z]+)*$"
                    />
                    <span className="text-sm text-neutral-500">
                      {getPublicMapUrlAfterSubDomain()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Published</span>
                    <Switch
                      checked={publicMap.published}
                      onCheckedChange={(published) =>
                        updatePublicMap({ published })
                      }
                    />
                  </div>
                </form>
                <Separator />
                <div className={sectionStyles}>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" /> Project Information
                  </div>
                  <DataListRow label="Map Title" orientation="vertical">
                    <EditablePublicMapProperty
                      property="name"
                      placeholder="Map Title"
                    >
                      {mapTitle}
                    </EditablePublicMapProperty>
                  </DataListRow>
                  <DataListRow label="Map Description" orientation="vertical">
                    <EditablePublicMapProperty
                      property="description"
                      placeholder="Map Description"
                    >
                      {mapDescription}
                    </EditablePublicMapProperty>
                  </DataListRow>
                  <DataListRow
                    label="Map Description Link"
                    orientation="vertical"
                  >
                    <EditablePublicMapProperty
                      property="descriptionLink"
                      placeholder="Map Description Link"
                    >
                      {mapDescriptionLink}
                    </EditablePublicMapProperty>
                  </DataListRow>
                </div>
                {publishedHost && (
                  <span className="font-bold">
                    This view is published at{" "}
                    <a href={getPublicMapUrl(publishedHost)} target="_blank">
                      {getPublicMapUrl(publishedHost)}
                    </a>
                  </span>
                )}
                <span>Make this view accessible to the public. </span>
              </TabsContent>

              <TabsContent value="data">
                {publicMap.dataSourceConfigs.length > 0 && (
                  <Tabs
                    value={
                      activeTabId ||
                      publicMap.dataSourceConfigs[0]?.dataSourceId
                    }
                    onValueChange={setActiveTabId}
                    className="py-2"
                  >
                    <div className="flex items-center gap-2">
                      <TabsList
                        className="grid w-full"
                        style={{
                          gridTemplateColumns: `repeat(${
                            publicMap.dataSourceConfigs.length
                          }, 1fr)`,
                        }}
                      >
                        {publicMap.dataSourceConfigs.map((dsc) => (
                          <TabsTrigger
                            value={dsc.dataSourceId}
                            key={dsc.dataSourceId}
                          >
                            {dsc.dataSourceLabel}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <DataSourcesSelect />
                    </div>

                    {publicMap.dataSourceConfigs.map((dataSourceConfig) => (
                      <TabsContent
                        value={dataSourceConfig.dataSourceId}
                        key={dataSourceConfig.dataSourceId}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <EditablePublicMapProperty
                              dataSourceProperty={{
                                dataSourceId: dataSourceConfig.dataSourceId,
                                property: "dataSourceLabel",
                              }}
                              placeholder="Data source label"
                            >
                              {dataSourceConfig.dataSourceLabel}
                            </EditablePublicMapProperty>
                          </div>
                          <DataListRow label="Listing Title Column">
                            <div className="flex flex-col gap-1 ">
                              <Select
                                value={
                                  dataSourceConfig.nameColumns?.[0] || "__none"
                                }
                                onValueChange={(selectedColumn) =>
                                  updateDataSourceConfig(
                                    dataSourceConfig.dataSourceId,
                                    {
                                      nameColumns:
                                        selectedColumn === "__none"
                                          ? []
                                          : [selectedColumn],
                                    }
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a title column" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none">None</SelectItem>
                                  {(() => {
                                    const dataSource = getDataSourceById(
                                      dataSourceConfig.dataSourceId
                                    );
                                    return dataSource?.columnDefs.map((cd) => (
                                      <SelectItem key={cd.name} value={cd.name}>
                                        {cd.name}
                                      </SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          </DataListRow>
                          <DataListRow label="Listing Description Column">
                            <div className="flex flex-col gap-1">
                              <Select
                                value={
                                  dataSourceConfig.descriptionColumn || "__none"
                                }
                                onValueChange={(selectedColumn) =>
                                  updateDataSourceConfig(
                                    dataSourceConfig.dataSourceId,
                                    {
                                      descriptionColumn:
                                        selectedColumn === "__none"
                                          ? ""
                                          : selectedColumn,
                                    }
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a description column" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none">None</SelectItem>
                                  {(() => {
                                    const dataSource = getDataSourceById(
                                      dataSourceConfig.dataSourceId
                                    );
                                    return dataSource?.columnDefs.map((cd) => (
                                      <SelectItem key={cd.name} value={cd.name}>
                                        {cd.name}
                                      </SelectItem>
                                    ));
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          </DataListRow>

                          {/* Additional Columns */}
                          {dataSourceConfig.additionalColumns.map(
                            (columnConfig, i) => (
                              <div
                                key={i}
                                className="flex flex-col gap-2 bg-neutral-100 p-2 rounded-md"
                              >
                                <div className="flex items-center justify-between">
                                  <EditablePublicMapProperty
                                    additionalColumnProperty={{
                                      columnIndex: i,
                                      dataSourceId:
                                        dataSourceConfig.dataSourceId,
                                      property: "label",
                                    }}
                                    placeholder="Column label"
                                  >
                                    <span className="font-medium text-sm">
                                      {columnConfig.label}
                                    </span>
                                  </EditablePublicMapProperty>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      updateDataSourceConfig(
                                        dataSourceConfig.dataSourceId,
                                        {
                                          additionalColumns:
                                            dataSourceConfig.additionalColumns.filter(
                                              (_, index) => index !== i
                                            ),
                                        }
                                      );
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>

                                <DataListRow label="Data Type">
                                  <Select
                                    value={columnConfig.type}
                                    onValueChange={(type) =>
                                      updateAdditionalColumn(
                                        dataSourceConfig.dataSourceId,
                                        i,
                                        {
                                          type: type as PublicMapColumnType,
                                        }
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select data type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem
                                        value={PublicMapColumnType.String}
                                      >
                                        Text
                                      </SelectItem>
                                      <SelectItem
                                        value={PublicMapColumnType.Boolean}
                                      >
                                        True/false
                                      </SelectItem>
                                      <SelectItem
                                        value={
                                          PublicMapColumnType.CommaSeparatedList
                                        }
                                      >
                                        Comma-separated list
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </DataListRow>

                                <DataListRow label="Source Columns">
                                  <Select
                                    value={
                                      columnConfig.sourceColumns[0] || "__none"
                                    }
                                    onValueChange={(selectedColumn) =>
                                      updateAdditionalColumn(
                                        dataSourceConfig.dataSourceId,
                                        i,
                                        {
                                          sourceColumns:
                                            selectedColumn === "__none"
                                              ? []
                                              : [selectedColumn],
                                        }
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select source column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none">
                                        None
                                      </SelectItem>
                                      {(() => {
                                        const dataSource = getDataSourceById(
                                          dataSourceConfig.dataSourceId
                                        );
                                        return dataSource?.columnDefs.map(
                                          (cd) => (
                                            <SelectItem
                                              key={cd.name}
                                              value={cd.name}
                                            >
                                              {cd.name}
                                            </SelectItem>
                                          )
                                        );
                                      })()}
                                    </SelectContent>
                                  </Select>
                                </DataListRow>
                              </div>
                            )
                          )}
                          {dataSourceConfig && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                updateDataSourceConfig(
                                  dataSourceConfig.dataSourceId,
                                  {
                                    additionalColumns: [
                                      ...dataSourceConfig.additionalColumns,
                                      {
                                        label: "New row",
                                        sourceColumns: [],
                                        type: PublicMapColumnType.String,
                                      },
                                    ],
                                  }
                                );
                              }}
                            >
                              <Plus className="w-4 h-4" /> Add additional
                              information
                            </Button>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
                <div className="flex items-center gap-3 bg-red-50 rounded-mdborder border-red-400 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm">
                    Ensure no private data is used in this map, as it will
                    become public!{" "}
                  </span>
                </div>
              </TabsContent>
              <TabsContent value="style">
                <div className="flex flex-col gap-2">
                  Colour Scheme
                  <Select
                    value={colourScheme}
                    onValueChange={(value) => setColourScheme(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select colour scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(publicMapColourSchemes).map(
                        ([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: value.primary }}
                              />
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

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

const getPublicMapUrlAfterSubDomain = () => {
  const baseHost = getBaseUrl().host;
  return `.${baseHost}`;
};

const getSubdomain = (host: string | undefined) => {
  if (!host) {
    return "";
  }
  return host.split(".")[0];
};

"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Fragment, SyntheticEvent, useState } from "react";
import {
  DataSourceEnrichmentQuery,
  UpdateDataSourceEnrichmentMutation,
  UpdateDataSourceEnrichmentMutationVariables,
} from "@/__generated__/types";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import {
  DataSourceEnrichmentColumns,
  DataSourceEnrichmentColumnsSchema,
  EnrichmentColumn,
} from "@/zod";
import EnrichmentColumnFields, {
  NewEnrichmentColumn,
} from "./EnrichmentColumnFields";

export default function DataSourceEnrichmentForm({
  dataSource,
  dataSources,
  initialEnrichmentColumns,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<
    DataSourceEnrichmentQuery["dataSource"],
    null | undefined
  >;
  dataSources: DataSourceEnrichmentQuery["dataSources"];
  initialEnrichmentColumns: DataSourceEnrichmentColumns;
}) {
  const [enrichmentColumns, setEnrichmentColumns] = useState<
    NewEnrichmentColumn[]
  >(
    // Add a blank column config if the initial columns are empty
    // to encourage users to get started
    initialEnrichmentColumns.length
      ? initialEnrichmentColumns
      : [{ sourceType: "" }],
  );

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [updateColumnsConfig] = useMutation<
    UpdateDataSourceEnrichmentMutation,
    UpdateDataSourceEnrichmentMutationVariables
  >(gql`
    mutation UpdateDataSourceEnrichment(
      $id: String!
      $rawEnrichmentColumns: [JSON!]
    ) {
      updateDataSourceConfig(
        id: $id
        rawEnrichmentColumns: $rawEnrichmentColumns
      ) {
        code
      }
    }
  `);

  const { data: validEnrichmentColumns } =
    DataSourceEnrichmentColumnsSchema.safeParse(enrichmentColumns);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await updateColumnsConfig({
        variables: {
          id: dataSource.id,
          rawEnrichmentColumns: validEnrichmentColumns,
        },
      });
      if (result.data?.updateDataSourceConfig.code !== 200) {
        throw new Error(String(result.errors || "Unknown error"));
      } else {
        router.push(`/data-sources/${dataSource.id}`);
        return;
      }
    } catch (e) {
      console.error(`Could not update data source: ${e}`);
      setError("Could not update data source.");
    }

    setLoading(false);
  };

  const setEnrichmentColumnConfig = (
    i: number,
    config: Partial<EnrichmentColumn>,
  ) => {
    const column = enrichmentColumns[i];
    if (column) {
      Object.assign(column, config);
    }
    setEnrichmentColumns([...enrichmentColumns]);
  };

  const addColumn = () => {
    setEnrichmentColumns([...enrichmentColumns, { sourceType: "" }]);
  };

  const removeColumn = (i: number) => {
    enrichmentColumns.splice(i, 1);
    setEnrichmentColumns([...enrichmentColumns]);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      {enrichmentColumns.map((column, i) => (
        <Fragment key={i}>
          <EnrichmentColumnFields
            column={column}
            dataSources={dataSources}
            onChange={(config) => setEnrichmentColumnConfig(i, config)}
          />
          <Button
            variant="destructive"
            type="button"
            onClick={() => removeColumn(i)}
          >
            Remove
          </Button>
          <Separator className="my-4" />
        </Fragment>
      ))}
      <div>
        <Button type="button" variant="secondary" onClick={() => addColumn()}>
          Add column
        </Button>
      </div>
      <Separator className="my-4" />
      <Button disabled={!validEnrichmentColumns || loading}>Submit</Button>
      {error && (
        <div>
          <small>{error}</small>
        </div>
      )}
    </form>
  );
}

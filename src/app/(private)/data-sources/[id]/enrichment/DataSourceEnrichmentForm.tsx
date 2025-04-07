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
import { Enrichment, EnrichmentSchema } from "@/zod";
import EnrichmentFields, { NewEnrichment } from "./EnrichmentFields";

export default function DataSourceEnrichmentForm({
  dataSource,
  dataSources,
}: {
  // Exclude<...> marks dataSource as not null or undefined (this is checked in the parent page)
  dataSource: Exclude<
    DataSourceEnrichmentQuery["dataSource"],
    null | undefined
  >;
  dataSources: DataSourceEnrichmentQuery["dataSources"];
}) {
  const [enrichments, setEnrichments] = useState<NewEnrichment[]>(
    // Add a blank enrichment config if the initial enrichments are empty
    // to encourage users to get started
    dataSource.enrichments.length
      ? dataSource.enrichments
      : [{ sourceType: "" }],
  );

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [updateEnrichments] = useMutation<
    UpdateDataSourceEnrichmentMutation,
    UpdateDataSourceEnrichmentMutationVariables
  >(gql`
    mutation UpdateDataSourceEnrichment(
      $id: String!
      $looseEnrichments: [LooseEnrichmentInput!]
    ) {
      updateDataSourceConfig(id: $id, looseEnrichments: $looseEnrichments) {
        code
      }
    }
  `);

  let formValid = true;
  const validEnrichments: Enrichment[] = [];
  for (const enrichment of enrichments) {
    const { data: validEnrichment } = EnrichmentSchema.safeParse(enrichment);
    if (validEnrichment) {
      validEnrichments.push(validEnrichment);
    } else {
      formValid = false;
    }
  }

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await updateEnrichments({
        variables: {
          id: dataSource.id,
          looseEnrichments: validEnrichments,
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

  const setEnrichmentConfig = (i: number, config: Partial<NewEnrichment>) => {
    const column = enrichments[i];
    if (column) {
      Object.assign(column, config);
    }
    setEnrichments([...enrichments]);
  };

  const addColumn = () => {
    setEnrichments([...enrichments, { sourceType: "" }]);
  };

  const removeColumn = (i: number) => {
    enrichments.splice(i, 1);
    setEnrichments([...enrichments]);
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      {enrichments.map((enrichment, i) => (
        <Fragment key={i}>
          <EnrichmentFields
            enrichment={enrichment}
            dataSources={dataSources}
            onChange={(config) => setEnrichmentConfig(i, config)}
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
      <Button disabled={!formValid || loading}>Submit</Button>
      {error && (
        <div>
          <small>{error}</small>
        </div>
      )}
    </form>
  );
}

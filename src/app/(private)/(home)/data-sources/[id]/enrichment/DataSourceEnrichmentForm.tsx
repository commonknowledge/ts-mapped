"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { enrichmentSchema } from "@/server/models/DataSource";
import { type RouterOutputs, useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import EnrichmentFields from "./EnrichmentFields";
import type { NewEnrichment } from "./EnrichmentFields";
import type { Enrichment } from "@/server/models/DataSource";
import type { SyntheticEvent } from "react";

export default function DataSourceEnrichmentForm({
  dataSource,
  dataSources,
}: {
  dataSource: NonNullable<RouterOutputs["dataSource"]["byId"]>;
  dataSources: NonNullable<RouterOutputs["dataSource"]["mine"]>;
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

  const trpc = useTRPC();
  const { mutate: updateEnrichments } = useMutation(
    trpc.dataSource.updateConfig.mutationOptions({
      onSuccess: () => {
        router.push(`/data-sources/${dataSource.id}`);
      },
      onError: (error) => {
        console.log(error);
        setLoading(false);
        setError("Could not update data source.");
      },
    }),
  );

  const validEnrichments = useMemo(() => {
    let formValid = true;
    const validEnrichments: Enrichment[] = [];
    for (const enrichment of enrichments) {
      const { data: validEnrichment } = enrichmentSchema.safeParse(enrichment);
      if (validEnrichment) {
        validEnrichments.push(validEnrichment);
      } else {
        formValid = false;
      }
    }
    return {
      enrichments: validEnrichments,
      formValid,
    };
  }, [enrichments]);

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validEnrichments.formValid) return;
    setLoading(true);
    setError("");

    updateEnrichments({
      dataSourceId: dataSource.id,
      enrichments: validEnrichments.enrichments,
    });
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
      <Button disabled={!validEnrichments.formValid || loading}>Submit</Button>
      {error && (
        <div>
          <span className="text-xs text-red-500">{error}</span>
        </div>
      )}
    </form>
  );
}

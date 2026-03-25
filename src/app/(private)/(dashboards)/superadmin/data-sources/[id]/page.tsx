"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { ADMIN_USER_EMAIL } from "@/constants";
import { useCurrentUser } from "@/hooks";
import { useTRPC } from "@/services/trpc/react";
import { DefaultInspectorConfigSection } from "./components/DefaultInspectorConfigSection";

export default function DataSourceConfigPage() {
  const { currentUser } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const trpc = useTRPC();

  const { data: dataSources, isPending } = useQuery(
    trpc.dataSource.listPublic.queryOptions(),
  );

  if (currentUser?.email !== ADMIN_USER_EMAIL) redirect("/");

  const dataSource = dataSources?.find((ds) => ds.id === id);

  if (isPending) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  if (!dataSource) {
    return (
      <div className="p-8 text-muted-foreground">Data source not found.</div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-7xl w-full">
      <div className="mb-6">
        <Link
          href="/superadmin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Superadmin
        </Link>
        <h1 className="text-3xl font-medium tracking-tight mt-3">
          {dataSource.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure default inspector settings for this public data source.
        </p>
      </div>
      <DefaultInspectorConfigSection dataSource={dataSource} />
    </div>
  );
}

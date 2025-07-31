import { gql } from "@apollo/client";
import {
  DataSourceConfigQuery,
  DataSourceConfigQueryVariables,
} from "@/__generated__/types";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { query } from "@/services/apollo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shadcn/ui/breadcrumb";
import { Separator } from "@/shadcn/ui/separator";
import DataSourceConfigForm from "./DataSourceConfigForm";

export default async function DataSourceConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await query<
    DataSourceConfigQuery,
    DataSourceConfigQueryVariables
  >({
    query: gql`
      query DataSourceConfig($id: String!) {
        dataSource(id: $id) {
          id
          name
          autoImport
          config
          columnDefs {
            name
            type
          }
          columnRoles {
            nameColumns
          }
          geocodingConfig {
            type
            column
            columns
            areaSetCode
          }
        }
      }
    `,
    variables: { id },
  });

  if (!result.data.dataSource) {
    return (
      <div className="container">
        <h1>Not found</h1>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-5xl w-full">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/data-sources">Data sources</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href={`/data-sources/${result.data.dataSource.id}`}>
              {result.data.dataSource.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Config</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title={`Configure ${result.data.dataSource.name}`}
        description="Tell us about your data to take full advantage of Mapped."
      />
      <Separator className="my-4" />
      <DataSourceConfigForm dataSource={result.data.dataSource} />
    </div>
  );
}

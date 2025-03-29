import React from "react";
import { UserDataSourceCard } from "./DataSourceCard";

import { getClient } from "@/services/ApolloClient";
import { gql } from "@apollo/client";

export default async function UserDataLibrary() {
  const apolloClient = await getClient();
  const { data } = await apolloClient.query({
    query: gql`
      query ListDataSources {
        dataSources {
          id
          name
          config
          createdAt
        }
      }
    `,
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 overflow-y-auto w-full">
      {data.dataSources.map((dataSource: any) => (
        <UserDataSourceCard key={dataSource.id} dataSource={dataSource} />
      ))}
    </div>
  );
}

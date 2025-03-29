import { gql } from "@apollo/client";
import { getClient } from "@/services/ApolloClient";
import { Separator } from "@/shadcn/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";

import PublicDataLibrary from "./components/PublicDataLibrary";
import UserDataLibrary from "./components/UserDataLibrary";

export default async function DataSourcesPage() {
  return (
    <div className="p-4 mx-auto max-w-7xl w-full">
      <h1 className="text-2xl">Library</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Here you can find all the data sources that are available in the
        database.
      </p>
      <Tabs defaultValue="user-data-sources">
        <TabsList className="gap-2" dir="horizontal">
          <TabsTrigger value="user-data-sources">Your Data Sources</TabsTrigger>
          <TabsTrigger value="public-data-sources">
            Public Data Sources
          </TabsTrigger>
        </TabsList>
        <Separator className="my-4" />
        <TabsContent value="user-data-sources">
          <UserDataLibrary />
        </TabsContent>

        <TabsContent value="public-data-sources">
          <PublicDataLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}

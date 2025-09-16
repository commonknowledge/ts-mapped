import { filter, pipe } from "graphql-yoga";
import pubSub from "@/server/services/pubsub";
import type { SubscriptionResolvers as SubscriptionResolversType } from "@/__generated__/types";

const Subscription: SubscriptionResolversType = {
  dataSourceEvent: {
    subscribe: (_: unknown, { dataSourceId }: { dataSourceId: string }) =>
      pipe(
        pubSub.subscribe("dataSourceEvent"),
        filter((event) => event.dataSourceEvent.dataSourceId === dataSourceId),
      ),
  },
};
export default Subscription;

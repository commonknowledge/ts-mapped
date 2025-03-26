import { CurrentUser } from "@/types";

export interface GraphQLContext {
  currentUser: CurrentUser | null;
}

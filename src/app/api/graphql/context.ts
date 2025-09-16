import type { CurrentUser } from "@/authTypes";

export interface GraphQLContext {
  currentUser: CurrentUser | null;
}

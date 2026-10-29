"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  TRPCClientError,
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import {
  ACCESS_GATE_RELOAD_INTERVAL_MS,
  ACCESS_GATE_RELOAD_KEY,
  DEFAULT_AUTH_REDIRECT,
} from "@/constants";
import { getAppHost } from "@/utils/appUrl";
import {
  clientDataSourceSerializer,
  hasPasswordHashSerializer,
} from "@/utils/superjson";
import { createQueryClient } from "./queryClient";
import type { AppRouter } from "@/server/trpc/router";
import type { QueryClient } from "@tanstack/react-query";
import type { TRPCLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;

export type RouterOutputs = inferRouterOutputs<AppRouter>;

let browserQueryClient: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = createQueryClient();
  return browserQueryClient;
}
function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    return process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

superjson.registerCustom(clientDataSourceSerializer, "DataSource");
superjson.registerCustom(hasPasswordHashSerializer, "HasPasswordHash");

// Reloads the page, unless it was already reloaded for this recently: if
// the server still renders the map, an error that persists must not cause
// a reload loop
function reloadForAccessGate() {
  try {
    const lastReload = Number(
      window.sessionStorage.getItem(ACCESS_GATE_RELOAD_KEY),
    );
    if (Date.now() - lastReload < ACCESS_GATE_RELOAD_INTERVAL_MS) {
      return false;
    }
    window.sessionStorage.setItem(ACCESS_GATE_RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked (e.g. third-party iframe): can't guard, so don't risk it
    return false;
  }
  window.location.reload();
  return true;
}

const errorLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          if (err instanceof TRPCClientError && typeof window !== "undefined") {
            const isAuthError =
              err.data?.code === "UNAUTHORIZED" ||
              err.data?.code === "FORBIDDEN";
            // On a public map's own host (possibly embedded on another
            // site), access was lost (e.g. a moderated map's grant expired
            // or was revoked). Reload so the server renders the access gate:
            // the login page can't be embedded, and visitors have no account
            if (isAuthError && window.location.host !== getAppHost()) {
              if (reloadForAccessGate()) {
                return;
              }
              observer.error(err);
              return;
            }
            if (err.data?.code === "UNAUTHORIZED") {
              const redirectTo = encodeURIComponent(
                window.location.pathname + window.location.search,
              );
              // Next lint complains about this, but it's actually better after logout to force a full page reload
              window.location.href = `/login?redirectTo=${redirectTo}`;
              return;
            }
            if (err.data?.code === "FORBIDDEN") {
              // Next lint complains about this, but it's actually better after logout to force a full page reload
              window.location.href = DEFAULT_AUTH_REDIRECT;
              return;
            }
          }
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
      return unsubscribe;
    });
  };
};

export function TRPCReactProvider(
  props: Readonly<{ children: React.ReactNode }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        errorLink,
        splitLink({
          condition: (op) => op.type === "subscription",
          true: httpSubscriptionLink({
            transformer: superjson,
            url: getUrl(),
          }),
          false: httpBatchLink({
            transformer: superjson,
            url: getUrl(),
            fetch(url, opts) {
              return fetch(url, { ...opts, credentials: "include" });
            },
          }),
        }),
      ],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

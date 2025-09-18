import { onError } from "@apollo/client/link/error";
import * as Sentry from "@sentry/nextjs";

export const createSentryErrorLink = () =>
  onError(({ graphQLErrors, networkError, operation }) => {
    // Log GraphQL errors
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        const errorMessage = `GraphQL error: ${message}`;

        Sentry.withScope((scope) => {
          scope.setTag("errorType", "graphql");
          scope.setTag("operationType", operation.operationName || "unknown");
          scope.setContext("graphql", {
            message,
            locations,
            path,
            extensions,
            operationName: operation.operationName,
            variables: operation.variables,
          });

          // Set different levels based on error type
          const level =
            extensions?.code === "UNAUTHENTICATED" ? "warning" : "error";
          scope.setLevel(level);

          Sentry.captureMessage(errorMessage);
        });

        // Log to console in development
        if (process.env.NODE_ENV === "development") {
          console.error(errorMessage, {
            locations,
            path,
            extensions,
            operation: operation.operationName,
          });
        }
      });
    }

    // Log network errors
    if (networkError) {
      Sentry.withScope((scope) => {
        scope.setTag("errorType", "network");
        scope.setTag("operationType", operation.operationName || "unknown");
        scope.setContext("network", {
          message: networkError.message,
          operationName: operation.operationName,
          variables: operation.variables,
          statusCode:
            "statusCode" in networkError ? networkError.statusCode : undefined,
        });

        // Set level based on status code
        const statusCode =
          "statusCode" in networkError ? networkError.statusCode : 500;
        const level = statusCode >= 500 ? "error" : "warning";
        scope.setLevel(level);

        Sentry.captureException(networkError);
      });

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("Network error:", networkError.message, {
          operation: operation.operationName,
          statusCode:
            "statusCode" in networkError ? networkError.statusCode : undefined,
        });
      }
    }
  });

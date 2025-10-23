import { PostHog } from "posthog-node";

// NOTE: This is a Node.js client, so you can use it for sending events from the server side to PostHog.
export default function PostHogClient() {
  const posthogKey =
    process.env.NODE_ENV !== "development"
      ? process.env.NEXT_PUBLIC_POSTHOG_KEY
      : "";
  const posthogClient = new PostHog(posthogKey || "", {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}

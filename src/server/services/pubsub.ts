import { Redis } from "ioredis";
import logger from "./logger";
import type { DataSourceEvent } from "@/server/events";

/**
 * This was written mostly by claude.ai, but has been tested
 * and seems solid. If you are a back-end developer, please
 * read this code and make sure it makes sense to you
 * as well :)
 */

// Map of channel name to event type
interface Channels {
  dataSourceEvent: DataSourceEvent;
}

// Configuration options for creating a RedisPubSub instance
interface PubSubOptions {
  publishClient: Redis; // Dedicated Redis connection for publishing messages
  subscribeClient: Redis; // Dedicated Redis connection for subscriptions (Redis requires separate connections)
}

/**
 * RedisPubSub class provides a pub/sub implementation using Redis.
 *
 * Key design decisions:
 * - Uses separate Redis clients for publish and subscribe operations (Redis requirement)
 * - Implements AsyncIterableIterator pattern for GraphQL/tRPC subscriptions
 * - Manages multiple listeners per channel efficiently
 * - Handles automatic cleanup when subscriptions are closed
 */
export class RedisPubSub {
  private publishClient: Redis; // Client used to publish messages to Redis channels
  private subscribeClient: Redis; // Client used to subscribe to Redis channels

  // Map structure: channel name -> Set of listener functions
  // Each channel can have multiple listeners
  private listeners = new Map<
    keyof Channels,
    Set<(data: Channels[keyof Channels]) => void>
  >();

  constructor(options: PubSubOptions) {
    this.publishClient = options.publishClient;
    this.subscribeClient = options.subscribeClient;

    // Set up the message handler for ALL incoming Redis messages
    // This is called whenever ANY subscribed channel receives a message
    this.subscribeClient.on(
      "message",
      <T extends keyof Channels>(channel: T, message: string) => {
        // Get all listener functions registered for this specific channel
        const channelListeners = this.listeners.get(channel);

        if (channelListeners) {
          try {
            // Parse the JSON message back into an Event object
            const data = JSON.parse(message) as Channels[T];

            // Notify all listeners for this channel by calling each listener function
            channelListeners.forEach((listener) => listener(data));
          } catch (error) {
            // Log parsing errors but don't crash - one bad message shouldn't break all subscriptions
            logger.error(
              `Failed to parse message from channel ${channel}:`,
              error,
            );
          }
        }
      },
    );
  }

  /**
   * Publishes an event to a specific Redis channel.
   * All clients subscribed to this channel will receive the event.
   *
   * @param channel - The Redis channel name to publish to
   * @param payload - The event data to publish
   */
  async publish<T extends keyof Channels>(
    channel: T,
    payload: Channels[T],
  ): Promise<void> {
    // Serialize the payload to JSON and publish to Redis
    // Redis will distribute this to all subscribers of this channel
    await this.publishClient.publish(
      channel as string,
      JSON.stringify(payload),
    );
  }

  /**
   * Creates an async iterator for subscribing to a Redis channel.
   * This implements the AsyncIterableIterator pattern required by GraphQL/tRPC subscriptions.
   *
   * How it works:
   * 1. Creates a queue to buffer incoming messages
   * 2. Creates a list of "resolvers" waiting for the next message
   * 3. When a message arrives: either resolves a waiting promise or adds to queue
   * 4. When next() is called: either returns queued message or creates a new promise
   *
   * @param channel - The Redis channel name to subscribe to
   * @returns AsyncIterableIterator that yields events as they arrive
   */
  subscribe<T extends keyof Channels>(
    channel: T,
  ): AsyncIterableIterator<Channels[T]> {
    // Queue of messages that have arrived but haven't been consumed yet
    const queue: Channels[T][] = [];

    // Array of Promise resolve functions waiting for the next message
    // When a message arrives and this has items, we resolve the oldest promise
    const resolvers: ((value: IteratorResult<Channels[T]>) => void)[] = [];

    // Flag to ensure we only subscribe to Redis once
    let subscribed = false;

    // Cleanup function to remove this subscription (set during ensureSubscribed)
    let cleanup: (() => void) | null = null;

    /**
     * Listener function that gets called when a message arrives on this channel.
     * This function is added to the listeners Map.
     */
    const listener = (data: Channels[T]) => {
      // Fast path: if someone is waiting for a message (called next()), give it to them directly
      if (resolvers.length > 0) {
        const resolve = resolvers.shift(); // Get the oldest waiting resolver
        if (resolve) {
          // Resolve the promise with the new data
          resolve({ value: data, done: false });
          return; // Exit early - we've delivered the message
        }
      }

      // Slow path: no one is waiting, so add the message to the queue for later
      queue.push(data);
    };

    /**
     * Lazily subscribes to the Redis channel.
     * Only subscribes when next() is first called, not when subscribe() is called.
     * This is an optimization - we don't connect to Redis until actually needed.
     */
    const ensureSubscribed = async () => {
      if (!subscribed) {
        subscribed = true;

        // If this is the first listener for this channel, subscribe to Redis
        if (!this.listeners.has(channel)) {
          this.listeners.set(channel, new Set()); // Create empty Set for this channel's listeners
          await this.subscribeClient.subscribe(channel); // Tell Redis we want messages from this channel
        }

        // Add our listener function to the Set for this channel
        this.listeners.get(channel)?.add(listener);

        /**
         * Create cleanup function that will be called when subscription ends.
         * This removes our listener and unsubscribes from Redis if we're the last listener.
         */
        cleanup = () => {
          const channelListeners = this.listeners.get(channel);
          if (channelListeners) {
            // Remove this specific listener
            channelListeners.delete(listener);

            // If no more listeners for this channel, clean up completely
            if (channelListeners.size === 0) {
              this.listeners.delete(channel); // Remove the channel from our Map

              // Tell Redis we're no longer interested in this channel
              // Use .catch to prevent unhandled promise rejection if unsubscribe fails
              this.subscribeClient.unsubscribe(channel).catch(logger.error);
            }
          }
        };
      }
    };

    /**
     * The async iterator object that the client will use.
     * Implements the AsyncIterableIterator interface.
     */
    const iterator = {
      /**
       * Called each time the client wants the next event.
       * Returns a Promise that resolves with the next event.
       */
      async next(): Promise<IteratorResult<Channels[T]>> {
        // Make sure we're subscribed to Redis (lazy subscription)
        await ensureSubscribed();

        // If we have queued messages, return the oldest one immediately
        if (queue.length > 0) {
          const value = queue.shift(); // Remove and return first item
          if (value) {
            return { value, done: false }; // Standard iterator result format
          }
        }

        // No queued messages - create a Promise that will resolve when the next message arrives
        // The listener function will call the resolve function we're adding to the resolvers array
        return new Promise((resolve) => {
          resolvers.push(resolve);
        });
      },

      /**
       * Called when the subscription is closed (e.g., client disconnects).
       * Performs cleanup and signals that iteration is complete.
       */
      async return(): Promise<IteratorResult<Channels[T]>> {
        if (cleanup) {
          cleanup(); // Remove listener and potentially unsubscribe from Redis
        }
        return { value: undefined, done: true }; // Signal that iteration is finished
      },

      /**
       * Called if an error occurs during iteration.
       * Performs cleanup and re-throws the error.
       */
      async throw(error: unknown): Promise<IteratorResult<Channels[T]>> {
        if (cleanup) {
          cleanup(); // Clean up even on errors
        }
        throw error; // Re-throw the error to caller
      },

      // Make this object an async iterable by returning itself as the iterator
      // This allows usage with for-await-of loops
      [Symbol.asyncIterator]: () => iterator,
    };

    return iterator;
  }

  /**
   * Gracefully shuts down both Redis connections.
   * Should be called when the application is shutting down.
   */
  async quit(): Promise<void> {
    await this.publishClient.quit();
    await this.subscribeClient.quit();
  }
}

// Create two separate Redis clients from the environment variable
// Redis requires separate connections for publish and subscribe operations
// because subscribing puts the connection in a special mode
const publishClient = new Redis(process.env.REDIS_URL || "");
const subscribeClient = new Redis(process.env.REDIS_URL || "");

// Export a singleton instance that can be used throughout the application
// This ensures all parts of the app use the same Redis connections
export const pubsub = new RedisPubSub({
  publishClient,
  subscribeClient,
});

import { afterEach, describe, expect, test, vi } from "vitest";
import { ActionNetworkAdaptor } from "@/server/adaptors/actionnetwork";

const event = ({
  id,
  title,
  lat,
  lng,
}: {
  id: string;
  title: string;
  lat?: number;
  lng?: number;
}) => ({
  identifiers: [`action_network:${id}`],
  title,
  start_date: "2050-05-28T14:23:00Z",
  status: "confirmed",
  location: {
    venue: "Somewhere",
    address_lines: ["1 Main St"],
    locality: "Carbondale",
    region: "PA",
    postal_code: "12345",
    country: "US",
    ...(lat !== undefined && lng !== undefined
      ? { location: { latitude: lat, longitude: lng } }
      : {}),
  },
  _links: { self: { href: `https://actionnetwork.org/api/v2/events/${id}` } },
});

const campaign = (id: string, title: string) => ({
  identifiers: [`action_network:${id}`],
  title,
  _links: {
    self: { href: `https://actionnetwork.org/api/v2/event_campaigns/${id}` },
  },
});

const collection = (embedKey: string, records: unknown[]) => ({
  ok: true,
  json: async () => ({ _embedded: { [embedKey]: records } }),
  text: async () => "",
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Action Network events", () => {
  test("fetchAll crawls campaigns and the flat collection, deduping shared events", async () => {
    // E2 lives in both the campaign and the flat collection; E1 is
    // campaign-only; E3 is flat-only. The union should be E1, E2, E3.
    const mockFetch = vi.fn(async (input: string | URL) => {
      const url = input.toString();
      if (url.includes("/event_campaigns/CAMP/events")) {
        return collection("osdi:events", [
          event({ id: "E1", title: "Campaign only", lat: 1, lng: 2 }),
          event({ id: "E2", title: "Shared", lat: 3, lng: 4 }),
        ]);
      }
      if (url.includes("/event_campaigns")) {
        return collection("action_network:event_campaigns", [
          campaign("CAMP", "My Campaign"),
        ]);
      }
      if (url.includes("/events")) {
        return collection("osdi:events", [
          event({ id: "E2", title: "Shared", lat: 3, lng: 4 }),
          event({ id: "E3", title: "Flat only", lat: 5, lng: 6 }),
        ]);
      }
      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal("fetch", mockFetch);

    const adaptor = new ActionNetworkAdaptor("key", "events");
    const results = [];
    for await (const record of adaptor.fetchAll()) {
      results.push(record);
    }

    expect(results.map((r) => r.externalId).sort()).toEqual(["E1", "E2", "E3"]);

    const shared = results.find((r) => r.externalId === "E2");
    // Campaigns are crawled first, so the shared event keeps its campaign name.
    expect(shared?.json.event_campaign).toBe("My Campaign");
    expect(shared?.json.latitude).toBe(3);
    expect(shared?.json.longitude).toBe(4);
    expect(shared?.json.title).toBe("Shared");
    expect(shared?.json.postcode).toBe("12345");
  });

  test("fetchFirst returns a campaign-only event when the flat collection is empty", async () => {
    const mockFetch = vi.fn(async (input: string | URL) => {
      const url = input.toString();
      if (url.includes("/event_campaigns/CAMP/events")) {
        return collection("osdi:events", [
          event({ id: "E1", title: "Only in a campaign", lat: 1, lng: 2 }),
        ]);
      }
      if (url.includes("/event_campaigns")) {
        return collection("action_network:event_campaigns", [
          campaign("CAMP", "My Campaign"),
        ]);
      }
      if (url.includes("/events")) {
        return collection("osdi:events", []);
      }
      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal("fetch", mockFetch);

    const adaptor = new ActionNetworkAdaptor("key", "events");
    const first = await adaptor.fetchFirst();
    expect(first?.externalId).toBe("E1");
  });

  test("event data sources are read-only", async () => {
    const adaptor = new ActionNetworkAdaptor("key", "events");
    await expect(adaptor.updateRecords([])).rejects.toThrow("read-only");
    await expect(adaptor.tagRecords([])).rejects.toThrow("read-only");
  });
});

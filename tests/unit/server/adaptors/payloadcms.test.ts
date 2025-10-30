import { describe, expect, test, vi, beforeEach } from "vitest";
import { PayloadCMSAdaptor } from "@/server/adaptors/payloadcms";

describe("PayloadCMS adaptor tests", () => {
  const mockConfig = {
    apiBaseUrl: "https://example.com",
    apiKey: "test-api-key",
    collectionName: "posts",
  };

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  test("Constructor trims trailing slash from apiBaseUrl", () => {
    const adaptor = new PayloadCMSAdaptor(
      "https://example.com/",
      mockConfig.apiKey,
      mockConfig.collectionName,
    );
    expect(adaptor["apiBaseUrl"]).toBe("https://example.com");
  });

  test("getRecordCount returns total document count", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        docs: [],
        totalDocs: 42,
        hasNextPage: false,
      }),
    }));

    const count = await adaptor.getRecordCount();
    expect(count).toBe(42);
  });

  test("getRecordCount returns null on error", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    }));

    const count = await adaptor.getRecordCount();
    expect(count).toBeNull();
  });

  test("fetchFirst returns first record", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    const mockDoc = {
      id: "123",
      title: "Test Post",
      content: "Test content",
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        docs: [mockDoc],
        totalDocs: 1,
        hasNextPage: false,
      }),
    }));

    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toEqual({
      externalId: "123",
      json: {
        title: "Test Post",
        content: "Test content",
      },
    });
  });

  test("fetchFirst returns null when no records", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        docs: [],
        totalDocs: 0,
        hasNextPage: false,
      }),
    }));

    const firstRow = await adaptor.fetchFirst();
    expect(firstRow).toBeNull();
  });

  test("fetchAll yields all records with pagination", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            docs: [
              { id: "1", title: "Post 1" },
              { id: "2", title: "Post 2" },
            ],
            hasNextPage: true,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            docs: [
              { id: "3", title: "Post 3" },
            ],
            hasNextPage: false,
          }),
        }),
    );

    const results = [];
    for await (const rec of adaptor.fetchAll()) {
      results.push(rec);
    }

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({
      externalId: "1",
      json: { title: "Post 1" },
    });
    expect(results[1]).toEqual({
      externalId: "2",
      json: { title: "Post 2" },
    });
    expect(results[2]).toEqual({
      externalId: "3",
      json: { title: "Post 3" },
    });
  });

  test("fetchByExternalId returns specific records", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            id: "123",
            title: "Specific Post",
            content: "Specific content",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            id: "456",
            title: "Another Post",
            content: "Another content",
          }),
        }),
    );

    const results = await adaptor.fetchByExternalId(["123", "456"]);
    expect(results).toHaveLength(2);
    expect(results[0].externalId).toBe("123");
    expect(results[1].externalId).toBe("456");
  });

  test("fetchByExternalId handles missing records", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            id: "123",
            title: "Found Post",
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => "Not found",
        }),
    );

    const results = await adaptor.fetchByExternalId(["123", "999"]);
    expect(results).toHaveLength(1);
    expect(results[0].externalId).toBe("123");
  });

  test("fetchByExternalId throws error for too many records", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    const tooManyIds = Array.from({ length: 101 }, (_, i) => String(i));
    await expect(adaptor.fetchByExternalId(tooManyIds)).rejects.toThrow(
      "Cannot fetch more than",
    );
  });

  test("updateRecords updates records via PATCH", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const enrichedRecords = [
      {
        externalRecord: {
          externalId: "123",
          json: { title: "Old Title" },
        },
        columns: [
          {
            def: { name: "enrichedField", type: "String" as const },
            value: "enriched value",
          },
        ],
      },
    ];

    await adaptor.updateRecords(enrichedRecords);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ enrichedField: "enriched value" }),
      }),
    );
  });

  test("tagRecords updates records with tag fields", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const taggedRecords = [
      {
        externalId: "123",
        json: { title: "Post" },
        tag: {
          name: "Featured",
          present: true,
        },
      },
    ];

    await adaptor.tagRecords(taggedRecords);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ Featured: true }),
      }),
    );
  });

  test("tagRecords handles empty array", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    await adaptor.tagRecords([]);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("removeDevWebhooks is a no-op", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    // Should not throw
    await expect(adaptor.removeDevWebhooks()).resolves.toBeUndefined();
  });

  test("toggleWebhook is a no-op but logs warning when enabled", async () => {
    const adaptor = new PayloadCMSAdaptor(
      mockConfig.apiBaseUrl,
      mockConfig.apiKey,
      mockConfig.collectionName,
    );

    // Should not throw
    await expect(adaptor.toggleWebhook(true)).resolves.toBeUndefined();
    await expect(adaptor.toggleWebhook(false)).resolves.toBeUndefined();
  });
});

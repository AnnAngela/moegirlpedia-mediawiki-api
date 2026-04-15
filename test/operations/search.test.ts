import { describe, expect, it } from "vitest";
import { searchOperation } from "../../src/operations/search.js";
import { createMockClient } from "../helpers/mockApi.js";

describe("searchOperation", () => {
    it("normalises search results and pagination", async () => {
        const client = createMockClient();
        client.post.mockResolvedValue({
            "continue": { "continue": "-||", sroffset: 5 },
            query: {
                search: [
                    {
                        pageid: 42,
                        sectiontitle: "概述",
                        size: 1024,
                        snippet: "<span class=\"searchmatch\">博丽</span> 灵梦",
                        timestamp: "2026-04-13T10:00:00Z",
                        title: "阿莉塞·莱韦耶勒尔",
                        wordcount: 256,
                    },
                ],
                searchinfo: {
                    totalhits: 123,
                },
            },
        });

        const result = await searchOperation.run({
            client,
            options: { limit: "5" },
            positionals: ["博丽"],
        });

        expect(client.post).toHaveBeenCalledWith(expect.objectContaining({
            action: "query",
            list: "search",
            srlimit: 5,
            srsearch: "博丽",
        }));
        expect(result).toMatchObject({
            operation: "search",
            totalHits: 123,
        });
        expect(result.items[0]).toMatchObject({
            snippetText: "博丽 灵梦",
            title: "阿莉塞·莱韦耶勒尔",
        });
        expect(result.pagination.hasMore).toBe(true);
    });
});

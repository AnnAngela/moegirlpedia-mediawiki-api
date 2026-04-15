import { describe, expect, it } from "vitest";
import { getCategoriesByPrefixOperation } from "../../src/operations/getCategoriesByPrefix.js";
import { createMockClient } from "../helpers/mockApi.js";

describe("getCategoriesByPrefixOperation", () => {
    it("returns matched category titles with pagination", async () => {
        const client = createMockClient();
        client.post.mockResolvedValue({
            "continue": { apcontinue: "幻想作品" },
            query: {
                allpages: [
                    { title: "Category:幻想作品" },
                    { title: "Category:幻想作品列表" },
                ],
            },
        });

        const result = await getCategoriesByPrefixOperation.run({
            client,
            options: { limit: "5" },
            positionals: ["幻想"],
        });

        expect(client.post).toHaveBeenCalledWith(expect.objectContaining({
            action: "query",
            apprefix: "幻想",
            aplimit: 5,
            apnamespace: 14,
            list: "allpages",
        }));
        expect(result).toMatchObject({
            categories: ["Category:幻想作品", "Category:幻想作品列表"],
            operation: "get-categories-by-prefix",
            prefix: "幻想",
        });
        expect(result.pagination.hasMore).toBe(true);
    });
});

import { describe, expect, it } from "vitest";
import { getCategoriesOperation } from "../../src/operations/getCategories.js";
import { createMockClient } from "../helpers/mockMwn.js";

describe("getCategoriesOperation", () => {
    it("returns the page categories and pagination info", async () => {
        const client = createMockClient();
        client.request.mockResolvedValue({
            "continue": { clcontinue: "42|Category:测试" },
            query: {
                pages: [
                    {
                        categories: [
                            { title: "Category:东方Project", timestamp: "2026-04-13T10:00:00Z" },
                            { hidden: true, title: "Category:需要维护条目" },
                        ],
                        title: "博丽灵梦",
                    },
                ],
            },
        });

        const result = await getCategoriesOperation.run({
            client,
            options: {},
            positionals: ["博丽灵梦"],
        });

        expect(result.pageTitle).toBe("博丽灵梦");
        expect(result.categories).toHaveLength(2);
        expect(result.categories[1]?.hidden).toBe(true);
        expect(result.pagination.hasMore).toBe(true);
    });
});

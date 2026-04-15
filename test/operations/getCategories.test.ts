import { describe, expect, it } from "vitest";
import { getCategoriesOperation } from "../../src/operations/getCategories.js";
import { createMockClient } from "../helpers/mockApi.js";

describe("getCategoriesOperation", () => {
    it("returns the page categories and pagination info", async () => {
        const client = createMockClient();
        client.post.mockResolvedValue({
            "continue": { clcontinue: "42|Category:测试" },
            query: {
                pages: [
                    {
                        categories: [
                            { title: "Category:最终幻想XIV", timestamp: "2026-04-13T10:00:00Z" },
                            { hidden: true, title: "Category:需要维护条目" },
                        ],
                        title: "阿莉塞·莱韦耶勒尔",
                    },
                ],
            },
        });

        const result = await getCategoriesOperation.run({
            client,
            options: {},
            positionals: ["阿莉塞·莱韦耶勒尔"],
        });

        expect(result.pageTitle).toBe("阿莉塞·莱韦耶勒尔");
        expect(result.categories).toHaveLength(2);
        expect(result.categories[1]?.hidden).toBe(true);
        expect(result.pagination.hasMore).toBe(true);
    });
});

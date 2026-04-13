import { describe, expect, it } from "vitest";
import { getPageInfoOperation } from "../../src/operations/getPageInfo.js";
import { createMockClient } from "../helpers/mockMwn.js";

describe("getPageInfoOperation", () => {
    it("returns extract, urls, and protection metadata", async () => {
        const client = createMockClient();
        client.request.mockResolvedValue({
            query: {
                pages: [
                    {
                        displaytitle: "博丽灵梦",
                        editurl: "https://example.invalid/edit",
                        extract: "博丽灵梦是东方Project角色。",
                        fullurl: "https://example.invalid/view",
                        pageid: 42,
                        protection: [
                            { expiry: "infinity", level: "sysop", type: "edit" },
                        ],
                        title: "博丽灵梦",
                    },
                ],
            },
        });

        const result = await getPageInfoOperation.run({
            client,
            options: {},
            positionals: ["博丽灵梦"],
        });

        expect(result).toMatchObject({
            displayTitle: "博丽灵梦",
            operation: "get-page-info",
            pageId: 42,
            title: "博丽灵梦",
        });
        expect(result.protection).toHaveLength(1);
    });
});

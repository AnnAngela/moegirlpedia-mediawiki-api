import { describe, expect, it } from "vitest";
import { getPageInfoOperation } from "../../src/operations/getPageInfo.js";
import { createMockClient } from "../helpers/mockApi.js";

describe("getPageInfoOperation", () => {
    it("returns extract, urls, and protection metadata", async () => {
        const client = createMockClient();
        client.post.mockResolvedValue({
            query: {
                pages: [
                    {
                        displaytitle: "阿莉塞·莱韦耶勒尔",
                        editurl: "https://example.invalid/edit",
                        extract: "阿莉塞·莱韦耶勒尔是最终幻想系列。",
                        fullurl: "https://example.invalid/view",
                        pageid: 42,
                        protection: [
                            { expiry: "infinity", level: "sysop", type: "edit" },
                        ],
                        title: "阿莉塞·莱韦耶勒尔",
                    },
                ],
            },
        });

        const result = await getPageInfoOperation.run({
            client,
            options: {},
            positionals: ["阿莉塞·莱韦耶勒尔"],
        });

        expect(result).toMatchObject({
            displayTitle: "阿莉塞·莱韦耶勒尔",
            operation: "get-page-info",
            pageId: 42,
            title: "阿莉塞·莱韦耶勒尔",
        });
        expect(result.protection).toHaveLength(1);
    });
});

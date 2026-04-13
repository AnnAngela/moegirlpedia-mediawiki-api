import { describe, expect, it } from "vitest";
import { getPageOperation } from "../../src/operations/getPage.js";
import { createMockClient } from "../helpers/mockMwn.js";

describe("getPageOperation", () => {
    it("returns parsed page content and sections", async () => {
        const client = createMockClient();
        client.request.mockResolvedValue({
            parse: {
                displaytitle: "博丽灵梦",
                revid: 100,
                sections: [
                    {
                        anchor: "intro",
                        index: "1",
                        line: "简介",
                        level: "2",
                        number: "1",
                    },
                ],
                wikitext: "== 简介 ==\n测试内容",
            },
        });

        const result = await getPageOperation.run({
            client,
            options: {},
            positionals: ["博丽灵梦"],
        });

        expect(result).toMatchObject({
            content: "== 简介 ==\n测试内容",
            displayTitle: "博丽灵梦",
            format: "wikitext",
            operation: "get-page",
            revid: 100,
        });
        expect(result.sections).toHaveLength(1);
    });
});

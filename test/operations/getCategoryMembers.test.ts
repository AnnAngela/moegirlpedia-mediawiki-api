import { describe, expect, it } from "vitest";
import { getCategoryMembersOperation } from "../../src/operations/getCategoryMembers.js";
import { createMockClient } from "../helpers/mockApi.js";

describe("getCategoryMembersOperation", () => {
    it("normalises category titles and returns members", async () => {
        const client = createMockClient();
        client.post.mockResolvedValue({
            query: {
                categorymembers: [
                    {
                        ns: 0,
                        pageid: 1,
                        sortkeyprefix: "博",
                        timestamp: "2026-04-13T10:00:00Z",
                        title: "阿莉塞·莱韦耶勒尔",
                        type: "page",
                    },
                ],
            },
        });

        const result = await getCategoryMembersOperation.run({
            client,
            options: { type: "page" },
            positionals: ["最终幻想系列"],
        });

        expect(client.post).toHaveBeenCalledWith(expect.objectContaining({
            cmtitle: "Category:最终幻想系列",
            cmtype: "page",
        }));
        expect(result.members[0]?.title).toBe("阿莉塞·莱韦耶勒尔");
    });
});

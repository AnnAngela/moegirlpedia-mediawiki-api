import { describe, expect, it } from "vitest";
import { getCategoryMembersOperation } from "../../src/operations/getCategoryMembers.js";
import { createMockClient } from "../helpers/mockMwn.js";

describe("getCategoryMembersOperation", () => {
    it("normalises category titles and returns members", async () => {
        const client = createMockClient();
        client.request.mockResolvedValue({
            query: {
                categorymembers: [
                    {
                        ns: 0,
                        pageid: 1,
                        sortkeyprefix: "博",
                        timestamp: "2026-04-13T10:00:00Z",
                        title: "博丽灵梦",
                        type: "page",
                    },
                ],
            },
        });

        const result = await getCategoryMembersOperation.run({
            client,
            options: { type: "page" },
            positionals: ["东方Project角色"],
        });

        expect(client.request).toHaveBeenCalledWith(expect.objectContaining({
            cmtitle: "Category:东方Project角色",
            cmtype: "page",
        }));
        expect(result.members[0]?.title).toBe("博丽灵梦");
    });
});

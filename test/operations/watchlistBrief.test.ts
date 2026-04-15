import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchlistBriefOperation } from "../../src/operations/watchlistBrief.js";
import { createMockClient } from "../helpers/mockApi.js";

const oldRevisionIdKey = "old_revid";

describe("watchlistBriefOperation", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-13T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("groups watchlist changes by page and applies the default 24 hour range", async () => {
        const client = createMockClient();
        client.post.mockResolvedValue({
            query: {
                watchlist: [
                    {
                        comment: "扩写",
                        newlen: 150,
                        [oldRevisionIdKey]: 10,
                        oldlen: 100,
                        pageid: 1,
                        revid: 11,
                        tags: ["visualeditor"],
                        timestamp: "2026-04-13T11:00:00Z",
                        title: "页面A",
                        unread: true,
                        user: "User1",
                        userid: 1,
                    },
                    {
                        bot: true,
                        comment: "修正",
                        newlen: 120,
                        [oldRevisionIdKey]: 11,
                        oldlen: 150,
                        pageid: 1,
                        revid: 12,
                        timestamp: "2026-04-13T10:30:00Z",
                        title: "页面A",
                        user: "User2",
                        userid: 2,
                    },
                    {
                        comment: "新条目",
                        "new": true,
                        newlen: 130,
                        oldlen: 80,
                        pageid: 2,
                        revid: 21,
                        timestamp: "2026-04-13T09:00:00Z",
                        title: "页面B",
                        user: "User1",
                        userid: 1,
                    },
                ],
            },
        });

        const result = await watchlistBriefOperation.run({
            client,
            options: {},
            positionals: [],
        });

        expect(client.post).toHaveBeenCalledWith(expect.objectContaining({
            wlend: "2026-04-13T12:00:00.000Z",
            wlstart: "2026-04-12T12:00:00.000Z",
        }));
        expect(result.summary).toMatchObject({
            totalChanges: 3,
            totalPages: 2,
        });
        expect(result.pages[0]).toMatchObject({
            changeCount: 2,
            title: "页面A",
        });
        expect(result.brief[0]).toContain("3 次改动");
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recentChangesBriefOperation } from "../../src/operations/recentChangesBrief.js";
import { createMockClient } from "../helpers/mockMwn.js";

const oldRevisionIdKey = "old_revid";

describe("recentChangesBriefOperation", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-13T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("keeps only alerted changes and groups them by page", async () => {
        const client = createMockClient();
        client.request.mockResolvedValue({
            query: {
                recentchanges: [
                    {
                        comment: "清空测试页面",
                        newlen: 1000,
                        [oldRevisionIdKey]: 10,
                        oldlen: 5000,
                        pageid: 1,
                        revid: 11,
                        tags: ["mobile edit"],
                        timestamp: "2026-04-13T11:00:00Z",
                        title: "页面A",
                        unpatrolled: true,
                        user: "203.0.113.1",
                        userid: 0,
                    },
                    {
                        comment: "新建页面",
                        "new": true,
                        newlen: 300,
                        oldlen: 0,
                        pageid: 2,
                        revid: 21,
                        timestamp: "2026-04-13T10:00:00Z",
                        title: "页面B",
                        user: "User2",
                        userid: 2,
                    },
                ],
            },
        });

        const result = await recentChangesBriefOperation.run({
            client,
            options: {
                hours: "48",
                "large-delete-threshold": "3000",
            },
            positionals: [],
        });

        expect(client.request).toHaveBeenCalledWith(expect.objectContaining({
            rcend: "2026-04-13T12:00:00.000Z",
            rcstart: "2026-04-11T12:00:00.000Z",
        }));
        expect(result.summary.totalAlertedChanges).toBe(2);
        expect(result.summary.reasonCounts).toMatchObject({
            "anonymous-editor": 1,
            "large-deletion": 1,
            "new-page": 1,
            "suspicious-keyword": 1,
            unpatrolled: 1,
        });
        expect(result.pages[0]?.reasons.length).toBeGreaterThan(0);
        expect(result.brief[0]).toContain("2 条需关注改动");
    });
});

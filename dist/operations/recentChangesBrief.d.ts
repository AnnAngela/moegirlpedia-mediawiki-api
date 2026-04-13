import { buildPagination, resolveTimeRange } from "../helpers.js";
import type { OperationDefinition } from "./types.js";
interface RecentChangeAlert {
    comment: string | null;
    flags: string[];
    logInfo: Record<string, unknown> | null;
    newSize: number | null;
    oldRevisionId: number | null;
    oldSize: number | null;
    pageId: number | null;
    reasons: string[];
    revisionId: number | null;
    sizeDelta: number | null;
    tags: string[];
    timestamp: string | null;
    title: string;
    type: string | null;
    user: string | null;
    userId: number | null;
}
interface RecentChangePageSummary {
    alertCount: number;
    alerts: RecentChangeAlert[];
    latestTimestamp: string | null;
    pageId: number | null;
    reasons: string[];
    title: string;
    users: string[];
}
export interface RecentChangesBriefOperationResult {
    brief: string[];
    filters: {
        excludeUser: string | null;
        limit: number;
        namespace: string | undefined;
        show: string | undefined;
        tag: string | null;
        type: string | undefined;
        user: string | null;
    };
    operation: "recent-changes-brief";
    pages: RecentChangePageSummary[];
    pagination: ReturnType<typeof buildPagination>;
    ruleSet: {
        largeDeleteThreshold: number;
        largeEditThreshold: number;
        suspiciousKeywords: string[];
    };
    summary: {
        reasonCounts: Record<string, number>;
        totalAlertedChanges: number;
        totalPages: number;
        uniqueUsers: string[];
    };
    timeRange: ReturnType<typeof resolveTimeRange>;
}
export declare const recentChangesBriefOperation: OperationDefinition<RecentChangesBriefOperationResult>;
export {};
//# sourceMappingURL=recentChangesBrief.d.ts.map
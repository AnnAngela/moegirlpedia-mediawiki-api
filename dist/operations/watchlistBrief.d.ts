import { buildPagination, resolveTimeRange } from "../helpers.js";
import type { OperationDefinition } from "./types.js";
interface WatchlistChange {
    comment: string | null;
    expiry: string | null;
    flags: string[];
    logInfo: Record<string, unknown> | null;
    newSize: number | null;
    notificationTimestamp: string | null;
    oldRevisionId: number | null;
    oldSize: number | null;
    pageId: number | null;
    revisionId: number | null;
    sizeDelta: number | null;
    tags: string[];
    timestamp: string | null;
    title: string;
    type: "edit" | "log" | "new";
    user: string | null;
    userId: number | null;
}
interface WatchlistPageSummary {
    changeCount: number;
    changes: WatchlistChange[];
    latestTimestamp: string | null;
    netSizeDelta: number | null;
    pageId: number | null;
    title: string;
    users: string[];
}
export interface WatchlistBriefOperationResult {
    brief: string[];
    filters: {
        excludeUser: string | null;
        limit: number;
        namespace: string | undefined;
        show: string | undefined;
        type: string | undefined;
        user: string | null;
    };
    operation: "watchlist-brief";
    pages: WatchlistPageSummary[];
    pagination: ReturnType<typeof buildPagination>;
    summary: {
        totalChanges: number;
        totalPages: number;
        uniqueUsers: string[];
    };
    timeRange: ReturnType<typeof resolveTimeRange>;
}
export declare const watchlistBriefOperation: OperationDefinition<WatchlistBriefOperationResult>;
export {};
//# sourceMappingURL=watchlistBrief.d.ts.map
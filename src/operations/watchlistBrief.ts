import type { UnknownApiParams } from "types-mediawiki-api";
import {
    asArray,
    asBoolean,
    asNumber,
    asRecord,
    asString,
    asStringArray,
    buildPagination,
    decodeContinueToken,
    parseDelimitedOption,
    parseIntegerOption,
    resolveTimeRange,
    uniqueStrings,
} from "../helpers.js";
import type { OperationDefinition } from "./types.js";

interface WatchlistResponse {
    "continue"?: Record<string, unknown>;
    query?: {
        watchlist?: unknown[];
    };
}

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

const WATCHLIST_FLAG_KEYS = ["anon", "autopatrolled", "bot", "minor", "new", "patrolled", "redirect", "unread"];

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

const normaliseWatchlistChange = (item: Record<string, unknown>): WatchlistChange => {
    const oldSize = asNumber(item.oldlen);
    const newSize = asNumber(item.newlen);
    const logInfo = asRecord(item.loginfo);
    const title = asString(item.title) ?? "<unknown title>";

    return {
        comment: asString(item.comment),
        expiry: asString(item.expiry),
        flags: WATCHLIST_FLAG_KEYS.filter((key) => asBoolean(item[key])),
        logInfo,
        newSize,
        notificationTimestamp: asString(item.notificationtimestamp),
        oldRevisionId: asNumber(item.old_revid),
        oldSize,
        pageId: asNumber(item.pageid),
        revisionId: asNumber(item.revid),
        sizeDelta: oldSize !== null && newSize !== null ? newSize - oldSize : null,
        tags: asStringArray(item.tags),
        timestamp: asString(item.timestamp),
        title,
        type: logInfo ? "log" : asBoolean(item.new) ? "new" : "edit",
        user: asString(item.user),
        userId: asNumber(item.userid),
    };
};

const createPageSummary = (changes: WatchlistChange[]): WatchlistPageSummary => {
    const sortedChanges = [...changes].sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? ""));
    const firstChange = sortedChanges.at(0);
    const sizeDeltas = sortedChanges.map((change) => change.sizeDelta).filter((value): value is number => value !== null);

    return {
        changeCount: sortedChanges.length,
        changes: sortedChanges,
        latestTimestamp: firstChange?.timestamp ?? null,
        netSizeDelta: sizeDeltas.length > 0 ? sizeDeltas.reduce((total, value) => total + value, 0) : null,
        pageId: firstChange?.pageId ?? null,
        title: firstChange?.title ?? "<unknown title>",
        users: uniqueStrings(sortedChanges.map((change) => change.user ?? "")),
    };
};

export const watchlistBriefOperation: OperationDefinition<WatchlistBriefOperationResult> = {
    description: "Summarise recent changes on the authenticated user's watchlist, grouped by page.",
    name: "watchlist-brief",
    usage: "watchlist-brief [--hours 24] [--from ISO] [--to ISO] [--limit 50] [--namespace 0,14] [--continue-token TOKEN]",
    run: async ({ client, options }) => {
        const limit = parseIntegerOption(options, "limit", 50, { max: 500, min: 1 });
        const timeRange = resolveTimeRange(options, 24);
        const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? undefined);
        const continueParams = (continueToken ?? {}) as UnknownApiParams;
        const namespace = parseDelimitedOption(options, "namespace");
        const changeType = parseDelimitedOption(options, "type");
        const showFilter = parseDelimitedOption(options, "show");
        const user = asString(options.user);
        const excludeUser = asString(options["exclude-user"]);
        const requestParams: UnknownApiParams = {
            action: "query",
            list: "watchlist",
            wlallrev: true,
            wldir: "newer",
            wlend: timeRange.to,
            wllimit: limit,
            wlprop: "ids|title|user|userid|comment|timestamp|sizes|flags|tags|loginfo|notificationtimestamp|patrol|expiry",
            wlstart: timeRange.from,
        };

        if (changeType) {
            requestParams.wltype = changeType;
        }

        if (excludeUser) {
            requestParams.wlexcludeuser = excludeUser;
        }

        if (namespace) {
            requestParams.wlnamespace = namespace;
        }

        if (showFilter) {
            requestParams.wlshow = showFilter;
        }

        if (user) {
            requestParams.wluser = user;
        }

        const response = await client.post({
            ...requestParams,
            ...continueParams,
        }) as WatchlistResponse;

        const changes = asArray(response.query?.watchlist)
            .map((item) => asRecord(item))
            .filter((item): item is Record<string, unknown> => item !== null)
            .map((item) => normaliseWatchlistChange(item));
        const groupedPages = new Map<string, WatchlistChange[]>();

        for (const change of changes) {
            const pageKey = `${change.pageId ?? "missing"}:${change.title}`;
            const currentChanges = groupedPages.get(pageKey) ?? [];
            currentChanges.push(change);
            groupedPages.set(pageKey, currentChanges);
        }

        const pages = [...groupedPages.values()]
            .map((pageChanges) => createPageSummary(pageChanges))
            .sort((left, right) => (right.latestTimestamp ?? "").localeCompare(left.latestTimestamp ?? ""));
        const uniqueUsers = uniqueStrings(changes.map((change) => change.user ?? ""));
        const summaryLine = pages.length > 0
            ? `监视列表在 ${timeRange.from} 到 ${timeRange.to} 之间共有 ${changes.length} 次改动，涉及 ${pages.length} 个页面，来自 ${uniqueUsers.length} 位编辑者。`
            : `监视列表在 ${timeRange.from} 到 ${timeRange.to} 之间没有匹配的改动。`;
        const pageLines = pages.map((page) => {
            const deltaText = page.netSizeDelta === null ? "大小变化未知" : `净变化 ${page.netSizeDelta >= 0 ? "+" : ""}${page.netSizeDelta} 字节`;
            return `${page.title}: ${page.changeCount} 次改动，最近时间 ${page.latestTimestamp ?? "未知"}，${deltaText}，编辑者 ${page.users.join(", ") || "未知"}。`;
        });

        return {
            brief: [summaryLine, ...pageLines],
            filters: {
                excludeUser,
                limit,
                namespace,
                show: showFilter,
                type: changeType,
                user,
            },
            operation: "watchlist-brief",
            pages,
            pagination: buildPagination(response.continue),
            summary: {
                totalChanges: changes.length,
                totalPages: pages.length,
                uniqueUsers,
            },
            timeRange,
        };
    },
};

import { asArray, asBoolean, asNumber, asRecord, asString, asStringArray, buildPagination, decodeContinueToken, isIpAddress, parseDelimitedOption, parseIntegerOption, resolveTimeRange, uniqueStrings, } from "../helpers.js";
const DEFAULT_SUSPICIOUS_KEYWORDS = ["spam", "test", "广告", "侵权", "外链", "清空", "删除", "copyvio"];
const RECENT_CHANGES_FLAG_KEYS = ["anon", "autopatrolled", "bot", "minor", "new", "patrolled", "redirect", "unpatrolled"];
const WATCHED_LOG_TYPES = new Set(["abusefilter", "block", "delete", "import", "move", "protect", "rights", "upload"]);
const parseKeywordList = (rawValue) => rawValue
    ? uniqueStrings(rawValue.split(/[|,]/u).map((item) => item.trim()).filter((item) => item.length > 0))
    : DEFAULT_SUSPICIOUS_KEYWORDS;
const collectReasons = (item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords) => {
    const reasons = [];
    const oldSize = asNumber(item.oldlen);
    const newSize = asNumber(item.newlen);
    const sizeDelta = oldSize !== null && newSize !== null ? newSize - oldSize : null;
    const user = asString(item.user);
    const comment = asString(item.comment)?.toLowerCase() ?? "";
    const tags = asStringArray(item.tags).map((tag) => tag.toLowerCase());
    const logInfo = asRecord(item.loginfo);
    const logType = asString(logInfo?.type);
    if (sizeDelta !== null && sizeDelta >= largeEditThreshold) {
        reasons.push("large-addition");
    }
    if (sizeDelta !== null && -sizeDelta >= largeDeleteThreshold) {
        reasons.push("large-deletion");
    }
    if (asBoolean(item.new)) {
        reasons.push("new-page");
    }
    if (isIpAddress(user)) {
        reasons.push("anonymous-editor");
    }
    if (asBoolean(item.unpatrolled)) {
        reasons.push("unpatrolled");
    }
    if (logType && WATCHED_LOG_TYPES.has(logType)) {
        reasons.push(`log:${logType}`);
    }
    const hasSuspiciousKeyword = suspiciousKeywords.some((keyword) => {
        const normalizedKeyword = keyword.toLowerCase();
        return comment.includes(normalizedKeyword) || tags.some((tag) => tag.includes(normalizedKeyword));
    });
    if (hasSuspiciousKeyword) {
        reasons.push("suspicious-keyword");
    }
    return uniqueStrings(reasons);
};
const normaliseAlert = (item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords) => {
    const reasons = collectReasons(item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords);
    if (reasons.length === 0) {
        return null;
    }
    const oldSize = asNumber(item.oldlen);
    const newSize = asNumber(item.newlen);
    return {
        comment: asString(item.comment),
        flags: RECENT_CHANGES_FLAG_KEYS.filter((key) => asBoolean(item[key])),
        logInfo: asRecord(item.loginfo),
        newSize,
        oldRevisionId: asNumber(item.old_revid),
        oldSize,
        pageId: asNumber(item.pageid),
        reasons,
        revisionId: asNumber(item.revid),
        sizeDelta: oldSize !== null && newSize !== null ? newSize - oldSize : null,
        tags: asStringArray(item.tags),
        timestamp: asString(item.timestamp),
        title: asString(item.title) ?? "<unknown title>",
        type: asString(item.type),
        user: asString(item.user),
        userId: asNumber(item.userid),
    };
};
const createPageSummary = (alerts) => {
    const sortedAlerts = [...alerts].sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? ""));
    const firstAlert = sortedAlerts.at(0);
    return {
        alertCount: sortedAlerts.length,
        alerts: sortedAlerts,
        latestTimestamp: firstAlert?.timestamp ?? null,
        pageId: firstAlert?.pageId ?? null,
        reasons: uniqueStrings(sortedAlerts.flatMap((alert) => alert.reasons)),
        title: firstAlert?.title ?? "<unknown title>",
        users: uniqueStrings(sortedAlerts.map((alert) => alert.user ?? "")),
    };
};
export const recentChangesBriefOperation = {
    description: "Summarise recent changes that match attention-worthy heuristics.",
    name: "recent-changes-brief",
    usage: "recent-changes-brief [--hours 24] [--from ISO] [--to ISO] [--large-edit-threshold 5000] [--large-delete-threshold 2000] [--continue-token TOKEN]",
    run: async ({ client, options }) => {
        const limit = parseIntegerOption(options, "limit", 100, { max: 500, min: 1 });
        const timeRange = resolveTimeRange(options, 24);
        const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? undefined);
        const namespace = parseDelimitedOption(options, "namespace");
        const changeType = parseDelimitedOption(options, "type");
        const showFilter = parseDelimitedOption(options, "show");
        const user = asString(options.user);
        const excludeUser = asString(options["exclude-user"]);
        const tag = asString(options.tag);
        const largeEditThreshold = parseIntegerOption(options, "large-edit-threshold", 5_000, { max: 1_000_000, min: 1 });
        const largeDeleteThreshold = parseIntegerOption(options, "large-delete-threshold", 2_000, { max: 1_000_000, min: 1 });
        const suspiciousKeywords = parseKeywordList(asString(options["suspicious-keywords"]));
        const requestParams = {
            action: "query",
            list: "recentchanges",
            rcdir: "newer",
            rcend: timeRange.to,
            rclimit: limit,
            rcprop: "user|userid|comment|flags|timestamp|title|ids|sizes|redirect|patrolled|loginfo|tags",
            rcstart: timeRange.from,
        };
        if (changeType) {
            requestParams.rctype = changeType;
        }
        if (excludeUser) {
            requestParams.rcexcludeuser = excludeUser;
        }
        if (namespace) {
            requestParams.rcnamespace = namespace;
        }
        if (showFilter) {
            requestParams.rcshow = showFilter;
        }
        if (tag) {
            requestParams.rctag = tag;
        }
        if (user) {
            requestParams.rcuser = user;
        }
        const response = await client.request({
            ...requestParams,
            ...continueToken,
        });
        const alerts = asArray(response.query?.recentchanges)
            .map((item) => asRecord(item))
            .filter((item) => item !== null)
            .map((item) => normaliseAlert(item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords))
            .filter((item) => item !== null);
        const groupedPages = new Map();
        for (const alert of alerts) {
            const pageKey = `${alert.pageId ?? "missing"}:${alert.title}`;
            const currentAlerts = groupedPages.get(pageKey) ?? [];
            currentAlerts.push(alert);
            groupedPages.set(pageKey, currentAlerts);
        }
        const pages = [...groupedPages.values()]
            .map((pageAlerts) => createPageSummary(pageAlerts))
            .sort((left, right) => (right.latestTimestamp ?? "").localeCompare(left.latestTimestamp ?? ""));
        const reasonCounts = new Map();
        for (const alert of alerts) {
            for (const reason of alert.reasons) {
                const currentCount = reasonCounts.get(reason) ?? 0;
                reasonCounts.set(reason, currentCount + 1);
            }
        }
        const summaryLine = pages.length > 0
            ? `最近更改在 ${timeRange.from} 到 ${timeRange.to} 之间共有 ${alerts.length} 条需关注改动，涉及 ${pages.length} 个页面。`
            : `最近更改在 ${timeRange.from} 到 ${timeRange.to} 之间没有命中当前规则的改动。`;
        const pageLines = pages.map((page) => `${page.title}: ${page.alertCount} 条需关注改动，原因 ${page.reasons.join(", ")}，最近时间 ${page.latestTimestamp ?? "未知"}。`);
        return {
            brief: [summaryLine, ...pageLines],
            filters: {
                excludeUser,
                limit,
                namespace,
                show: showFilter,
                tag,
                type: changeType,
                user,
            },
            operation: "recent-changes-brief",
            pages,
            pagination: buildPagination(response.continue),
            ruleSet: {
                largeDeleteThreshold,
                largeEditThreshold,
                suspiciousKeywords,
            },
            summary: {
                reasonCounts: Object.fromEntries(reasonCounts.entries()),
                totalAlertedChanges: alerts.length,
                totalPages: pages.length,
                uniqueUsers: uniqueStrings(alerts.map((alert) => alert.user ?? "")),
            },
            timeRange,
        };
    },
};

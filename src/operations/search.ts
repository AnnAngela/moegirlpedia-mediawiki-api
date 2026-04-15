import {
    asArray,
    asNumber,
    asRecord,
    asString,
    buildPagination,
    decodeContinueToken,
    parseIntegerOption,
    requirePositional,
    stripHtmlTags,
} from "../helpers.js";
import type { OperationDefinition } from "./types.js";

interface SearchResponse {
    "continue"?: Record<string, unknown>;
    query?: {
        search?: unknown[];
        searchinfo?: Record<string, unknown>;
    };
}

export interface SearchResultItem {
    pageId: number | null;
    sectionTitle: string | null;
    size: number | null;
    snippetHtml: string | null;
    snippetText: string | null;
    timestamp: string | null;
    title: string | null;
    wordCount: number | null;
}

export interface SearchOperationResult {
    items: SearchResultItem[];
    operation: "search";
    pagination: ReturnType<typeof buildPagination>;
    query: string;
    totalHits: number | null;
}

export const searchOperation: OperationDefinition<SearchOperationResult> = {
    description: "Search Moegirlpedia pages.",
    name: "search",
    usage: "search <query> [--limit 10] [--continue-token TOKEN]",
    run: async ({ client, options, positionals }) => {
        const query = requirePositional(positionals, 0, "query");
        const limit = parseIntegerOption(options, "limit", 10, { max: 50, min: 1 });
        const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? undefined);
        const response = await client.post({
            action: "query",
            list: "search",
            srsearch: query,
            srlimit: limit,
            srprop: "snippet|size|timestamp|sectiontitle|wordcount",
            ...continueToken,
        }) as SearchResponse;

        const searchInfo = asRecord(response.query?.searchinfo);
        const items = asArray(response.query?.search)
            .map((item) => asRecord(item))
            .filter((item): item is Record<string, unknown> => item !== null)
            .map((item) => ({
                pageId: asNumber(item.pageid),
                sectionTitle: asString(item.sectiontitle),
                size: asNumber(item.size),
                snippetHtml: asString(item.snippet),
                snippetText: stripHtmlTags(asString(item.snippet)),
                timestamp: asString(item.timestamp),
                title: asString(item.title),
                wordCount: asNumber(item.wordcount),
            }));

        return {
            items,
            operation: "search",
            pagination: buildPagination(response.continue),
            query,
            totalHits: asNumber(searchInfo?.totalhits),
        };
    },
};

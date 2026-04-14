import { asArray, asNumber, asRecord, asString, buildPagination, decodeContinueToken, parseIntegerOption, requirePositional, stripHtmlTags, } from "../helpers.js";
export const searchOperation = {
    description: "Search Moegirlpedia pages.",
    name: "search",
    usage: "search <query> [--limit 10] [--continue-token TOKEN]",
    run: async ({ client, options, positionals }) => {
        const query = requirePositional(positionals, 0, "query");
        const limit = parseIntegerOption(options, "limit", 10, { max: 50, min: 1 });
        const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? undefined);
        const response = await client.request({
            action: "query",
            list: "search",
            srsearch: query,
            srlimit: limit,
            srprop: "snippet|size|timestamp|sectiontitle|wordcount",
            ...continueToken,
        });
        const searchInfo = asRecord(response.query?.searchinfo);
        const items = asArray(response.query?.search)
            .map((item) => asRecord(item))
            .filter((item) => item !== null)
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

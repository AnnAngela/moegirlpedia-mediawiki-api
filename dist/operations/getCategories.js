import { asArray, asBoolean, asRecord, asString, buildPagination, decodeContinueToken, parseIntegerOption, requirePositional, } from "../helpers.js";
export const getCategoriesOperation = {
    description: "List categories attached to a page.",
    name: "get-categories",
    usage: "get-categories <title> [--limit 50] [--continue-token TOKEN]",
    run: async ({ client, options, positionals }) => {
        const title = requirePositional(positionals, 0, "title");
        const limit = parseIntegerOption(options, "limit", 50, { max: 500, min: 1 });
        const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? undefined);
        const response = await client.request({
            action: "query",
            cllimit: limit,
            clprop: "hidden|timestamp",
            prop: "categories",
            titles: title,
            ...continueToken,
        });
        const page = asRecord(asArray(response.query?.pages)[0]);
        const categories = asArray(page?.categories)
            .map((item) => asRecord(item))
            .filter((item) => item !== null)
            .map((item) => ({
            hidden: asBoolean(item.hidden),
            timestamp: asString(item.timestamp),
            title: asString(item.title),
        }));
        return {
            categories,
            operation: "get-categories",
            pageTitle: asString(page?.title) ?? title,
            pagination: buildPagination(response.continue),
            requestedTitle: title,
        };
    },
};

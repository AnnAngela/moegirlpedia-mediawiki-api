import { asArray, asNumber, asRecord, asString, requirePositional } from "../helpers.js";
export const getPageInfoOperation = {
    description: "Get a page summary and basic metadata.",
    name: "get-page-info",
    usage: "get-page-info <title>",
    run: async ({ client, positionals }) => {
        const title = requirePositional(positionals, 0, "title");
        const response = await client.request({
            action: "query",
            explaintext: true,
            exintro: true,
            inprop: "displaytitle|url|protection",
            prop: "info|extracts",
            titles: title,
        });
        const page = asRecord(asArray(response.query?.pages)[0]);
        const protection = asArray(page?.protection)
            .map((item) => asRecord(item))
            .filter((item) => item !== null)
            .map((item) => ({
            expiry: asString(item.expiry),
            level: asString(item.level),
            type: asString(item.type),
        }));
        return {
            displayTitle: asString(page?.displaytitle),
            editUrl: asString(page?.editurl),
            extract: asString(page?.extract),
            fullUrl: asString(page?.fullurl),
            operation: "get-page-info",
            pageId: asNumber(page?.pageid),
            protection,
            requestedTitle: title,
            title: asString(page?.title) ?? title,
        };
    },
};

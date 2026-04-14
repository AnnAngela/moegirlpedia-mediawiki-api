import { asArray, asNumber, asRecord, asString, buildPagination, decodeContinueToken, ensureCategoryTitle, parseDelimitedOption, parseIntegerOption, requirePositional, } from "../helpers.js";
export const getCategoryMembersOperation = {
    description: "List pages in a category.",
    name: "get-category-members",
    usage: "get-category-members <category> [--type page|subcat|file] [--limit 50] [--continue-token TOKEN]",
    run: async ({ client, options, positionals }) => {
        const category = ensureCategoryTitle(requirePositional(positionals, 0, "category"));
        const limit = parseIntegerOption(options, "limit", 50, { max: 500, min: 1 });
        const memberType = parseDelimitedOption(options, "type");
        const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? undefined);
        const response = await client.request({
            action: "query",
            cmlimit: limit,
            cmprop: "ids|title|type|timestamp|sortkeyprefix",
            cmtitle: category,
            ...memberType ? { cmtype: memberType } : {},
            list: "categorymembers",
            ...continueToken,
        });
        const members = asArray(response.query?.categorymembers)
            .map((item) => asRecord(item))
            .filter((item) => item !== null)
            .map((item) => ({
            namespace: asNumber(item.ns),
            pageId: asNumber(item.pageid),
            sortKeyPrefix: asString(item.sortkeyprefix),
            timestamp: asString(item.timestamp),
            title: asString(item.title),
            type: asString(item.type),
        }));
        return {
            category,
            members,
            operation: "get-category-members",
            pagination: buildPagination(response.continue),
        };
    },
};

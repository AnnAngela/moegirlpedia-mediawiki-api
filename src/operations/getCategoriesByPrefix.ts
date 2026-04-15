import {
    asArray,
    asRecord,
    asString,
    buildPagination,
    decodeContinueToken,
    parseIntegerOption,
    requirePositional,
} from "../helpers.js";
import type { OperationDefinition } from "./types.js";

interface CategoriesByPrefixResponse {
    "continue"?: Record<string, unknown>;
    query?: {
        allpages?: unknown[];
    };
}

export interface GetCategoriesByPrefixOperationResult {
    categories: string[];
    operation: "get-categories-by-prefix";
    pagination: ReturnType<typeof buildPagination>;
    prefix: string;
}

export const getCategoriesByPrefixOperation: OperationDefinition<GetCategoriesByPrefixOperationResult> = {
    description: "List category titles that match a prefix.",
    name: "get-categories-by-prefix",
    usage: "get-categories-by-prefix <prefix> [--limit 50] [--continue-token TOKEN]",
    run: async ({ client, options, positionals }) => {
        const prefix = requirePositional(positionals, 0, "prefix");
        const limit = parseIntegerOption(options, "limit", 50, { max: 500, min: 1 });
        const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? undefined);
        const response = await client.post({
            action: "query",
            apprefix: prefix,
            aplimit: limit,
            apnamespace: 14,
            list: "allpages",
            ...continueToken,
        }) as CategoriesByPrefixResponse;

        const categories = asArray(response.query?.allpages)
            .map((item) => asRecord(item))
            .filter((item): item is Record<string, unknown> => item !== null)
            .map((item) => asString(item.title))
            .filter((item): item is string => item !== null);

        return {
            categories,
            operation: "get-categories-by-prefix",
            pagination: buildPagination(response.continue),
            prefix,
        };
    },
};

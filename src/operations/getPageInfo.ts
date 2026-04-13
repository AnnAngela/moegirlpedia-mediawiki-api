import { asArray, asNumber, asRecord, asString, requirePositional } from "../helpers.js";
import type { OperationDefinition } from "./types.js";

interface PageInfoResponse {
    query?: {
        pages?: unknown[];
    };
}

export interface ProtectionEntry {
    expiry: string | null;
    level: string | null;
    type: string | null;
}

export interface GetPageInfoOperationResult {
    displayTitle: string | null;
    editUrl: string | null;
    extract: string | null;
    fullUrl: string | null;
    operation: "get-page-info";
    pageId: number | null;
    protection: ProtectionEntry[];
    requestedTitle: string;
    title: string;
}

export const getPageInfoOperation: OperationDefinition<GetPageInfoOperationResult> = {
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
        }) as PageInfoResponse;

        const page = asRecord(asArray(response.query?.pages)[0]);
        const protection = asArray(page?.protection)
            .map((item) => asRecord(item))
            .filter((item): item is Record<string, unknown> => item !== null)
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

import { asArray, asNumber, asRecord, asString, requirePositional, UsageError } from "../helpers.js";
import type { OperationDefinition } from "./types.js";

interface ParseResponse {
    parse?: Record<string, unknown>;
}

const SUPPORTED_FORMATS = new Set(["html", "wikitext"]);

export interface PageSection {
    anchor: string | null;
    byteOffset: number | null;
    index: string | null;
    line: string | null;
    level: string | null;
    number: string | null;
    tocLevel: number | null;
}

export interface GetPageOperationResult {
    content: string | null;
    displayTitle: string | null;
    format: "html" | "wikitext";
    operation: "get-page";
    revid: number | null;
    sections: PageSection[];
    title: string;
}

export const getPageOperation: OperationDefinition<GetPageOperationResult> = {
    description: "Read a page as HTML or raw wikitext.",
    name: "get-page",
    usage: "get-page <title> [--format wikitext|html]",
    run: async ({ client, options, positionals }) => {
        const title = requirePositional(positionals, 0, "title");
        const formatOption = asString(options.format);

        if (formatOption && !SUPPORTED_FORMATS.has(formatOption)) {
            throw new UsageError("Option --format must be either 'wikitext' or 'html'.");
        }

        const format: GetPageOperationResult["format"] = formatOption === "html" ? "html" : "wikitext";

        const response = await client.request({
            action: "parse",
            page: title,
            prop: format === "html" ? "text|displaytitle|revid|sections" : "wikitext|displaytitle|revid|sections",
            redirects: true,
        }) as ParseResponse;
        const parseData = asRecord(response.parse);

        if (!parseData) {
            throw new Error("Unexpected response from action=parse.");
        }

        const sections = asArray(parseData.sections)
            .map((section) => asRecord(section))
            .filter((section): section is Record<string, unknown> => section !== null)
            .map((section) => ({
                anchor: asString(section.anchor),
                byteOffset: asNumber(section.byteoffset),
                index: asString(section.index),
                line: asString(section.line),
                level: asString(section.level),
                number: asString(section.number),
                tocLevel: asNumber(section.toclevel),
            }));

        return {
            content: asString(parseData[format === "html" ? "text" : "wikitext"]),
            displayTitle: asString(parseData.displaytitle),
            format,
            operation: "get-page",
            revid: asNumber(parseData.revid),
            sections,
            title,
        };
    },
};

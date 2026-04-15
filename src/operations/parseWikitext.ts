import { getStringOption, requirePositional } from "../helpers.js";
import type { OperationDefinition } from "./types.js";

export interface ParseWikitextOperationResult {
    html: string;
    inputWikitext: string;
    operation: "parse-wikitext";
    title: string | null;
}

export const parseWikitextOperation: OperationDefinition<ParseWikitextOperationResult> = {
    description: "Parse raw wikitext into HTML.",
    name: "parse-wikitext",
    usage: "parse-wikitext <wikitext> [--title TITLE]",
    run: async ({ client, options, positionals }) => {
        const firstSegment = requirePositional(positionals, 0, "wikitext");
        const inputWikitext = positionals.length > 1 ? [firstSegment, ...positionals.slice(1)].join(" ") : firstSegment;
        const title = getStringOption(options, "title") ?? null;
        const html = await client.parse(inputWikitext, title ? { title } : undefined);

        return {
            html,
            inputWikitext,
            operation: "parse-wikitext",
            title,
        };
    },
};

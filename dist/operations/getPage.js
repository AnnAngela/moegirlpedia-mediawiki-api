import { asArray, asNumber, asRecord, asString, requirePositional, UsageError } from "../helpers.js";
const SUPPORTED_FORMATS = new Set(["html", "wikitext"]);
export const getPageOperation = {
    description: "Read a page as HTML or raw wikitext.",
    name: "get-page",
    usage: "get-page <title> [--format wikitext|html]",
    run: async ({ client, options, positionals }) => {
        const title = requirePositional(positionals, 0, "title");
        const formatOption = asString(options.format);
        if (formatOption && !SUPPORTED_FORMATS.has(formatOption)) {
            throw new UsageError("Option --format must be either 'wikitext' or 'html'.");
        }
        const format = formatOption === "html" ? "html" : "wikitext";
        const response = await client.request({
            action: "parse",
            page: title,
            prop: format === "html" ? "text|displaytitle|revid|sections" : "wikitext|displaytitle|revid|sections",
            redirects: true,
        });
        const parseData = asRecord(response.parse);
        if (!parseData) {
            throw new Error("Unexpected response from action=parse.");
        }
        const sections = asArray(parseData.sections)
            .map((section) => asRecord(section))
            .filter((section) => section !== null)
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

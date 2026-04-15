import { describe, expect, it } from "vitest";
import { parseWikitextOperation } from "../../src/operations/parseWikitext.js";
import { createMockClient } from "../helpers/mockApi.js";

describe("parseWikitextOperation", () => {
    it("parses raw wikitext with an optional title context", async () => {
        const client = createMockClient();
        client.parse.mockResolvedValue("<p><b>测试</b></p>");

        const result = await parseWikitextOperation.run({
            client,
            options: { title: "Help:沙盒" },
            positionals: ["'''测试'''"],
        });

        expect(client.parse).toHaveBeenCalledWith("'''测试'''", { title: "Help:沙盒" });
        expect(result).toMatchObject({
            html: "<p><b>测试</b></p>",
            inputWikitext: "'''测试'''",
            operation: "parse-wikitext",
            title: "Help:沙盒",
        });
    });
});

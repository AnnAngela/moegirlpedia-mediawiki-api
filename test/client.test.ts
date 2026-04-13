import { describe, expect, it, vi } from "vitest";
import { createClientFromEnv, getClientConfigFromEnv, MOEGIRLPEDIA_API_URL } from "../src/client.js";
import { UsageError } from "../src/helpers.js";

describe("getClientConfigFromEnv", () => {
    it("throws when the username is missing", () => {
        expect(() => getClientConfigFromEnv({ MOEGIRLPEDIA_BOT_PASSWORD: "secret" })).toThrow(UsageError);
    });

    it("builds the expected mwn configuration", () => {
        const config = getClientConfigFromEnv({
            MOEGIRLPEDIA_BOT_PASSWORD: "secret",
            MOEGIRLPEDIA_USERNAME: "ExampleBot@OpenClaw",
        });

        expect(config).toMatchObject({
            apiUrl: MOEGIRLPEDIA_API_URL,
            defaultParams: {
                assert: "user",
                formatversion: 2,
            },
            password: "secret",
            username: "ExampleBot@OpenClaw",
        });
        expect(config.userAgent).toContain("openclaw-skill-moegirlpedia-mediawiki-api");
    });
});

describe("createClientFromEnv", () => {
    it("passes the resolved config into the injected initializer", async () => {
        const client = { request: vi.fn() };
        const initializer = vi.fn(() => Promise.resolve(client));
        const result = await createClientFromEnv({
            MOEGIRLPEDIA_BOT_PASSWORD: "secret",
            MOEGIRLPEDIA_USERNAME: "ExampleBot@OpenClaw",
        }, initializer);

        expect(result).toBe(client);
        expect(initializer).toHaveBeenCalledWith(expect.objectContaining({
            apiUrl: MOEGIRLPEDIA_API_URL,
            password: "secret",
            username: "ExampleBot@OpenClaw",
        }));
    });
});

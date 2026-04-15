import { describe, expect, it, vi } from "vitest";
import { createClientFromEnv, getClientConfigFromEnv } from "../src/client.js";
import { UsageError } from "../src/helpers.js";
import type Api from "../src/module/Api.js";
import type { ApiOptions } from "../src/module/Api.js";

describe("getClientConfigFromEnv", () => {
    it("throws when the username is missing", () => {
        expect(() => getClientConfigFromEnv({ MOEGIRLPEDIA_BOT_PASSWORD: "secret" })).toThrow(UsageError);
    });

    it("builds the expected Api configuration", () => {
        const config = getClientConfigFromEnv({
            MOEGIRLPEDIA_BOT_PASSWORD: "secret",
            MOEGIRLPEDIA_USERNAME: "ExampleBot@OpenClaw",
        });

        expect(config).toMatchObject({
            parameters: {
                formatversion: 2,
            },
            password: "secret",
            timeout: 60_000,
            username: "ExampleBot@OpenClaw",
        });
        expect(config.userAgent).toContain("openclaw-skill-moegirlpedia-mediawiki-api");
    });
});

describe("createClientFromEnv", () => {
    it("creates an Api instance and logs in with the resolved credentials", async () => {
        const login = vi.fn(() => Promise.resolve("Success"));
        const client = {
            login,
        } as unknown as Api;
        let receivedOptions: ApiOptions | undefined;
        const createApi = (options?: ApiOptions): Api => {
            receivedOptions = options;
            return client;
        };
        const result = await createClientFromEnv({
            MOEGIRLPEDIA_BOT_PASSWORD: "secret",
            MOEGIRLPEDIA_USERNAME: "ExampleBot@OpenClaw",
        }, createApi);

        expect(result).toBe(client);
        expect(receivedOptions?.parameters).toEqual({ formatversion: 2 });
        expect(receivedOptions?.timeout).toBe(60_000);
        expect(typeof receivedOptions?.userAgent).toBe("string");
        expect(login).toHaveBeenCalledWith("ExampleBot@OpenClaw", "secret");
    });
});

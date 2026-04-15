import { describe, expect, it } from "vitest";
import { getUserInfoOperation } from "../../src/operations/getUserInfo.js";
import { createMockClient } from "../helpers/mockApi.js";

describe("getUserInfoOperation", () => {
    it("returns the authenticated user's identity and permissions", async () => {
        const client = createMockClient();
        client.getUserInfo.mockResolvedValue({
            groups: ["user", "bot"],
            id: 42,
            name: "ExampleBot@OpenClaw",
            rights: ["read", "writeapi"],
        });

        const result = await getUserInfoOperation.run({
            client,
            options: {},
            positionals: [],
        });

        expect(client.getUserInfo).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({
            groups: ["user", "bot"],
            operation: "get-user-info",
            rights: ["read", "writeapi"],
            userId: 42,
            username: "ExampleBot@OpenClaw",
        });
    });
});

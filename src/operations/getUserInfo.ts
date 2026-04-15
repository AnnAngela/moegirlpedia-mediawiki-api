import type { OperationDefinition } from "./types.js";

export interface GetUserInfoOperationResult {
    groups: string[];
    operation: "get-user-info";
    rights: string[];
    userId: number | null;
    username: string | null;
}

export const getUserInfoOperation: OperationDefinition<GetUserInfoOperationResult> = {
    description: "Get the authenticated user's groups and rights.",
    name: "get-user-info",
    usage: "get-user-info",
    run: async ({ client }) => {
        const userInfo = await client.getUserInfo();

        return {
            groups: userInfo?.groups ?? [],
            operation: "get-user-info",
            rights: userInfo?.rights ?? [],
            userId: userInfo?.id ?? null,
            username: userInfo?.name ?? null,
        };
    },
};

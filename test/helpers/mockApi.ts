import { vi, type Mock } from "vitest";
import type Api from "../../src/module/Api.js";

export interface MockApi extends Api {
    getUserInfo: Mock<Api["getUserInfo"]>;
    parse: Mock<Api["parse"]>;
    post: Mock<Api["post"]>;
}

export const createMockClient = (): MockApi => ({
    getUserInfo: vi.fn(),
    parse: vi.fn(),
    post: vi.fn(),
}) as unknown as MockApi;

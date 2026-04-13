import { vi, type Mock } from "vitest";
import type { MediaWikiClient } from "../../src/client.js";

export interface MockMediaWikiClient extends MediaWikiClient {
    request: Mock<MediaWikiClient["request"]>;
}

export const createMockClient = (): MockMediaWikiClient => ({
    request: vi.fn(),
}) as MockMediaWikiClient;

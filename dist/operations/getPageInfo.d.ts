import type { OperationDefinition } from "./types.js";
export interface ProtectionEntry {
    expiry: string | null;
    level: string | null;
    type: string | null;
}
export interface GetPageInfoOperationResult {
    displayTitle: string | null;
    editUrl: string | null;
    extract: string | null;
    fullUrl: string | null;
    operation: "get-page-info";
    pageId: number | null;
    protection: ProtectionEntry[];
    requestedTitle: string;
    title: string;
}
export declare const getPageInfoOperation: OperationDefinition<GetPageInfoOperationResult>;
//# sourceMappingURL=getPageInfo.d.ts.map
import type { OperationDefinition } from "./types.js";
export interface PageSection {
    anchor: string | null;
    byteOffset: number | null;
    index: string | null;
    line: string | null;
    level: string | null;
    number: string | null;
    tocLevel: number | null;
}
export interface GetPageOperationResult {
    content: string | null;
    displayTitle: string | null;
    format: "html" | "wikitext";
    operation: "get-page";
    revid: number | null;
    sections: PageSection[];
    title: string;
}
export declare const getPageOperation: OperationDefinition<GetPageOperationResult>;
//# sourceMappingURL=getPage.d.ts.map
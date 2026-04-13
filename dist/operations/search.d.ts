import { buildPagination } from "../helpers.js";
import type { OperationDefinition } from "./types.js";
export interface SearchResultItem {
    pageId: number | null;
    sectionTitle: string | null;
    size: number | null;
    snippetHtml: string | null;
    snippetText: string | null;
    timestamp: string | null;
    title: string | null;
    wordCount: number | null;
}
export interface SearchOperationResult {
    items: SearchResultItem[];
    operation: "search";
    pagination: ReturnType<typeof buildPagination>;
    query: string;
    totalHits: number | null;
}
export declare const searchOperation: OperationDefinition<SearchOperationResult>;
//# sourceMappingURL=search.d.ts.map
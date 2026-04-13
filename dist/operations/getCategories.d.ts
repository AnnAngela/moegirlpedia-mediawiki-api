import { buildPagination } from "../helpers.js";
import type { OperationDefinition } from "./types.js";
export interface CategoryEntry {
    hidden: boolean;
    timestamp: string | null;
    title: string | null;
}
export interface GetCategoriesOperationResult {
    categories: CategoryEntry[];
    operation: "get-categories";
    pageTitle: string;
    pagination: ReturnType<typeof buildPagination>;
    requestedTitle: string;
}
export declare const getCategoriesOperation: OperationDefinition<GetCategoriesOperationResult>;
//# sourceMappingURL=getCategories.d.ts.map
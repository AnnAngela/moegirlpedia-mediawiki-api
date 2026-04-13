import { buildPagination } from "../helpers.js";
import type { OperationDefinition } from "./types.js";
export interface CategoryMemberEntry {
    namespace: number | null;
    pageId: number | null;
    sortKeyPrefix: string | null;
    timestamp: string | null;
    title: string | null;
    type: string | null;
}
export interface GetCategoryMembersOperationResult {
    category: string;
    members: CategoryMemberEntry[];
    operation: "get-category-members";
    pagination: ReturnType<typeof buildPagination>;
}
export declare const getCategoryMembersOperation: OperationDefinition<GetCategoryMembersOperationResult>;
//# sourceMappingURL=getCategoryMembers.d.ts.map
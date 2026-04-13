import { getCategoriesOperation } from "./getCategories.js";
import { getCategoryMembersOperation } from "./getCategoryMembers.js";
import { getPageOperation } from "./getPage.js";
import { getPageInfoOperation } from "./getPageInfo.js";
import { recentChangesBriefOperation } from "./recentChangesBrief.js";
import { searchOperation } from "./search.js";
import type { OperationDefinition } from "./types.js";
import { watchlistBriefOperation } from "./watchlistBrief.js";

/**
 * Maintainer note:
 * 1. Add a new operation file under src/operations/.
 * 2. Export an OperationDefinition from that file.
 * 3. Register the operation in this array.
 * 4. Update SKILL.md and add tests under test/operations/.
 */
export const operations = [
    searchOperation,
    getPageOperation,
    getCategoriesOperation,
    getCategoryMembersOperation,
    getPageInfoOperation,
    watchlistBriefOperation,
    recentChangesBriefOperation,
] as const satisfies readonly OperationDefinition[];

export const getOperationByName = (name: string): OperationDefinition | undefined => operations.find((operation) => operation.name === name);

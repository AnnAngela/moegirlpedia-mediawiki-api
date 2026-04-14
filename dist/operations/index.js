import { getCategoriesOperation } from "./getCategories.js";
import { getCategoryMembersOperation } from "./getCategoryMembers.js";
import { getPageOperation } from "./getPage.js";
import { getPageInfoOperation } from "./getPageInfo.js";
import { recentChangesBriefOperation } from "./recentChangesBrief.js";
import { searchOperation } from "./search.js";
import { watchlistBriefOperation } from "./watchlistBrief.js";
export const operations = [
    searchOperation,
    getPageOperation,
    getCategoriesOperation,
    getCategoryMembersOperation,
    getPageInfoOperation,
    watchlistBriefOperation,
    recentChangesBriefOperation,
];
export const getOperationByName = (name) => operations.find((operation) => operation.name === name);

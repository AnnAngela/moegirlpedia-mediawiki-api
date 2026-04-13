export type CliOptionValue = boolean | string | string[];
export type CliOptions = Partial<Record<string, CliOptionValue>>;
export interface ParsedCliArguments {
    command: string | null;
    options: CliOptions;
    positionals: string[];
}
export interface PaginationInfo {
    "continue": Record<string, unknown> | null;
    continueToken: string | null;
    hasMore: boolean;
}
export interface TimeRange {
    from: string;
    mode: "default" | "explicit" | "hours";
    to: string;
}
export declare class UsageError extends Error {
    constructor(message: string);
}
export declare const parseCliArguments: (argv: readonly string[]) => ParsedCliArguments;
export declare const asArray: (value: unknown) => unknown[];
export declare const asBoolean: (value: unknown) => boolean;
export declare const asNumber: (value: unknown) => number | null;
export declare const asRecord: (value: unknown) => Record<string, unknown> | null;
export declare const asString: (value: unknown) => string | null;
export declare const asStringArray: (value: unknown) => string[];
export declare const getStringOption: (options: CliOptions, key: string) => string | undefined;
export declare const getStringValues: (options: CliOptions, key: string) => string[];
export declare const parseDelimitedOption: (options: CliOptions, key: string) => string | undefined;
export declare const parseIntegerOption: (options: CliOptions, key: string, defaultValue: number, constraints?: {
    max?: number;
    min?: number;
}) => number;
export declare const requirePositional: (positionals: readonly string[], index: number, name: string) => string;
export declare const resolveTimeRange: (options: CliOptions, defaultHours: number) => TimeRange;
export declare const encodeContinueToken: (continueValue: unknown) => string | null;
export declare const decodeContinueToken: (token: string | undefined) => Record<string, unknown> | undefined;
export declare const buildPagination: (continueValue: unknown) => PaginationInfo;
export declare const ensureCategoryTitle: (value: string) => string;
export declare const isIpAddress: (value: string | null) => boolean;
export declare const stripHtmlTags: (value: string | null) => string | null;
export declare const uniqueStrings: (values: readonly string[]) => string[];
//# sourceMappingURL=helpers.d.ts.map
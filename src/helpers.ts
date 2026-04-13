import { Buffer } from "node:buffer";
import { isIP } from "node:net";

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

export class UsageError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "UsageError";
    }
}

const addOptionValue = (options: CliOptions, key: string, value: string | boolean): void => {
    const currentValue = options[key];

    if (currentValue === undefined) {
        options[key] = value;
        return;
    }

    if (Array.isArray(currentValue)) {
        currentValue.push(String(value));
        return;
    }

    options[key] = [String(currentValue), String(value)];
};

export const parseCliArguments = (argv: readonly string[]): ParsedCliArguments => {
    if (argv.length === 0) {
        return { command: null, options: {}, positionals: [] };
    }

    const [firstArgument, ...restArguments] = argv;
    const command = firstArgument.startsWith("--") ? null : firstArgument;
    const argumentList = command ? restArguments : [...argv];
    const options: CliOptions = {};
    const positionals: string[] = [];

    for (let index = 0; index < argumentList.length; index += 1) {
        const argument = argumentList[index];

        if (argument === "--") {
            positionals.push(...argumentList.slice(index + 1));
            break;
        }

        if (!argument.startsWith("--")) {
            positionals.push(argument);
            continue;
        }

        const optionText = argument.slice(2);
        const equalsIndex = optionText.indexOf("=");

        if (equalsIndex >= 0) {
            const key = optionText.slice(0, equalsIndex);
            const value = optionText.slice(equalsIndex + 1);
            addOptionValue(options, key, value);
            continue;
        }

        const nextArgument = argumentList.at(index + 1);
        if (nextArgument !== undefined && !nextArgument.startsWith("--")) {
            addOptionValue(options, optionText, nextArgument);
            index += 1;
            continue;
        }

        options[optionText] = true;
    }

    return { command, options, positionals };
};

export const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export const asBoolean = (value: unknown): boolean => value === true;

export const asNumber = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;

export const asRecord = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

export const asString = (value: unknown): string | null => typeof value === "string" ? value : null;

export const asStringArray = (value: unknown): string[] => asArray(value)
    .map((item) => asString(item))
    .filter((item): item is string => item !== null);

const getSingleOptionValue = (options: CliOptions, key: string): CliOptionValue | undefined => {
    const optionValue = options[key];

    if (Array.isArray(optionValue)) {
        if (optionValue.length > 1) {
            throw new UsageError(`Option --${key} may only be provided once.`);
        }

        return optionValue[0];
    }

    return optionValue;
};

export const getStringOption = (options: CliOptions, key: string): string | undefined => {
    const optionValue = getSingleOptionValue(options, key);

    if (optionValue === undefined) {
        return undefined;
    }

    if (typeof optionValue !== "string") {
        throw new UsageError(`Option --${key} requires a value.`);
    }

    return optionValue;
};

export const getStringValues = (options: CliOptions, key: string): string[] => {
    const optionValue = options[key];

    if (optionValue === undefined) {
        return [];
    }

    if (typeof optionValue === "boolean") {
        throw new UsageError(`Option --${key} requires a value.`);
    }

    return Array.isArray(optionValue) ? optionValue : [optionValue];
};

export const parseDelimitedOption = (options: CliOptions, key: string): string | undefined => {
    const values = getStringValues(options, key)
        .flatMap((item) => item.split(/[|,]/u))
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    return values.length > 0 ? values.join("|") : undefined;
};

export const parseIntegerOption = (
    options: CliOptions,
    key: string,
    defaultValue: number,
    constraints: { max?: number; min?: number } = {},
): number => {
    const optionValue = getStringOption(options, key);

    if (optionValue === undefined) {
        return defaultValue;
    }

    const parsedValue = Number.parseInt(optionValue, 10);
    if (!Number.isInteger(parsedValue)) {
        throw new UsageError(`Option --${key} must be an integer.`);
    }

    if (constraints.min !== undefined && parsedValue < constraints.min) {
        throw new UsageError(`Option --${key} must be at least ${constraints.min}.`);
    }

    if (constraints.max !== undefined && parsedValue > constraints.max) {
        throw new UsageError(`Option --${key} must be at most ${constraints.max}.`);
    }

    return parsedValue;
};

export const requirePositional = (positionals: readonly string[], index: number, name: string): string => {
    const value = positionals.at(index);

    if (value === undefined) {
        throw new UsageError(`Missing required positional argument <${name}>.`);
    }

    return value;
};

const parseDateOption = (value: string, key: string): Date => {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        throw new UsageError(`Option --${key} must be a valid ISO-8601 date/time.`);
    }

    return parsedDate;
};

export const resolveTimeRange = (options: CliOptions, defaultHours: number): TimeRange => {
    const fromOption = getStringOption(options, "from");
    const toOption = getStringOption(options, "to");
    const hours = parseIntegerOption(options, "hours", defaultHours, { min: 1, max: 24 * 30 });
    const endDate = toOption ? parseDateOption(toOption, "to") : new Date();
    let startDate = fromOption ? parseDateOption(fromOption, "from") : new Date(endDate.getTime() - hours * 60 * 60 * 1_000);
    let mode: TimeRange["mode"] = fromOption || toOption ? "explicit" : "default";

    if (!fromOption && getStringOption(options, "hours") !== undefined) {
        startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1_000);
        mode = "hours";
    }

    if (startDate.getTime() > endDate.getTime()) {
        throw new UsageError("The --from value must be earlier than --to.");
    }

    return {
        from: startDate.toISOString(),
        mode,
        to: endDate.toISOString(),
    };
};

export const encodeContinueToken = (continueValue: unknown): string | null => {
    const continueRecord = asRecord(continueValue);
    if (!continueRecord) {
        return null;
    }

    return Buffer.from(JSON.stringify(continueRecord), "utf8").toString("base64url");
};

export const decodeContinueToken = (token: string | undefined): Record<string, unknown> | undefined => {
    if (!token) {
        return undefined;
    }

    try {
        const decoded: unknown = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
        const record = asRecord(decoded);

        if (!record) {
            throw new Error("Decoded continue token is not an object.");
        }

        return record;
    } catch {
        throw new UsageError("Invalid --continue-token value.");
    }
};

export const buildPagination = (continueValue: unknown): PaginationInfo => {
    const continueRecord = asRecord(continueValue);

    return {
        "continue": continueRecord,
        continueToken: encodeContinueToken(continueRecord),
        hasMore: continueRecord !== null,
    };
};

export const ensureCategoryTitle = (value: string): string => value.startsWith("Category:") ? value : `Category:${value}`;

export const isIpAddress = (value: string | null): boolean => value !== null && isIP(value) !== 0;

export const stripHtmlTags = (value: string | null): string | null => {
    if (!value) {
        return value;
    }

    return value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
};

export const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values.filter((value) => value.length > 0))];

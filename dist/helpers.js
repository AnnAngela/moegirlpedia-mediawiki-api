import { Buffer } from "node:buffer";
import { isIP } from "node:net";
export class UsageError extends Error {
    constructor(message) {
        super(message);
        this.name = "UsageError";
    }
}
const addOptionValue = (options, key, value) => {
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
export const parseCliArguments = (argv) => {
    if (argv.length === 0) {
        return { command: null, options: {}, positionals: [] };
    }
    const [firstArgument, ...restArguments] = argv;
    const command = firstArgument.startsWith("--") ? null : firstArgument;
    const argumentList = command ? restArguments : [...argv];
    const options = {};
    const positionals = [];
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
export const asArray = (value) => Array.isArray(value) ? value : [];
export const asBoolean = (value) => value === true;
export const asNumber = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
export const asRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
export const asString = (value) => typeof value === "string" ? value : null;
export const asStringArray = (value) => asArray(value)
    .map((item) => asString(item))
    .filter((item) => item !== null);
const getSingleOptionValue = (options, key) => {
    const optionValue = options[key];
    if (Array.isArray(optionValue)) {
        if (optionValue.length > 1) {
            throw new UsageError(`Option --${key} may only be provided once.`);
        }
        return optionValue[0];
    }
    return optionValue;
};
export const getStringOption = (options, key) => {
    const optionValue = getSingleOptionValue(options, key);
    if (optionValue === undefined) {
        return undefined;
    }
    if (typeof optionValue !== "string") {
        throw new UsageError(`Option --${key} requires a value.`);
    }
    return optionValue;
};
export const getStringValues = (options, key) => {
    const optionValue = options[key];
    if (optionValue === undefined) {
        return [];
    }
    if (typeof optionValue === "boolean") {
        throw new UsageError(`Option --${key} requires a value.`);
    }
    return Array.isArray(optionValue) ? optionValue : [optionValue];
};
export const parseDelimitedOption = (options, key) => {
    const values = getStringValues(options, key)
        .flatMap((item) => item.split(/[|,]/u))
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    return values.length > 0 ? values.join("|") : undefined;
};
export const parseIntegerOption = (options, key, defaultValue, constraints = {}) => {
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
export const requirePositional = (positionals, index, name) => {
    const value = positionals.at(index);
    if (value === undefined) {
        throw new UsageError(`Missing required positional argument <${name}>.`);
    }
    return value;
};
const parseDateOption = (value, key) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new UsageError(`Option --${key} must be a valid ISO-8601 date/time.`);
    }
    return parsedDate;
};
export const resolveTimeRange = (options, defaultHours) => {
    const fromOption = getStringOption(options, "from");
    const toOption = getStringOption(options, "to");
    const hours = parseIntegerOption(options, "hours", defaultHours, { min: 1, max: 24 * 30 });
    const endDate = toOption ? parseDateOption(toOption, "to") : new Date();
    let startDate = fromOption ? parseDateOption(fromOption, "from") : new Date(endDate.getTime() - hours * 60 * 60 * 1_000);
    let mode = fromOption || toOption ? "explicit" : "default";
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
export const encodeContinueToken = (continueValue) => {
    const continueRecord = asRecord(continueValue);
    if (!continueRecord) {
        return null;
    }
    return Buffer.from(JSON.stringify(continueRecord), "utf8").toString("base64url");
};
export const decodeContinueToken = (token) => {
    if (!token) {
        return undefined;
    }
    try {
        const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
        const record = asRecord(decoded);
        if (!record) {
            throw new Error("Decoded continue token is not an object.");
        }
        return record;
    }
    catch {
        throw new UsageError("Invalid --continue-token value.");
    }
};
export const buildPagination = (continueValue) => {
    const continueRecord = asRecord(continueValue);
    return {
        "continue": continueRecord,
        continueToken: encodeContinueToken(continueRecord),
        hasMore: continueRecord !== null,
    };
};
export const ensureCategoryTitle = (value) => value.startsWith("Category:") ? value : `Category:${value}`;
export const isIpAddress = (value) => value !== null && isIP(value) !== 0;
export const stripHtmlTags = (value) => {
    if (!value) {
        return value;
    }
    return value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
};
export const uniqueStrings = (values) => [...new Set(values.filter((value) => value.length > 0))];

import process from "node:process";
import { pathToFileURL } from "node:url";
import { createClientFromEnv, type Environment, type MediaWikiClient } from "./client.js";
import { parseCliArguments, UsageError } from "./helpers.js";
import { operations } from "./operations/index.js";
import type { OperationDefinition } from "./operations/types.js";

interface WritableLike {
    write(chunk: string): boolean;
}

interface RunCliDependencies {
    createClient?: (env: Environment) => Promise<MediaWikiClient>;
    env?: Environment;
    operationList?: readonly OperationDefinition[];
    stderr?: WritableLike;
    stdout?: WritableLike;
}

const renderHelp = (operationList: readonly OperationDefinition[]): string => {
    const lines = [
        "Usage: moegirlpedia-mediawiki-api <operation> [arguments] [--options]",
        "",
        "Available operations:",
        ...operationList.map((operation) => `  ${operation.usage}\n    ${operation.description}`),
    ];

    return `${lines.join("\n")}\n`;
};

const renderUsageError = (error: UsageError, operation: OperationDefinition | undefined): string => {
    if (!operation) {
        return `${error.message}\n`;
    }

    return `${error.message}\nUsage: ${operation.usage}\n`;
};

const writeJson = (stdout: WritableLike, value: unknown): void => {
    stdout.write(`${JSON.stringify(value, null, 2)}\n`);
};

export const runCli = async (argv: readonly string[] = process.argv.slice(2), dependencies: RunCliDependencies = {}): Promise<number> => {
    const parsedArguments = parseCliArguments(argv);
    const stdout = dependencies.stdout ?? process.stdout;
    const stderr = dependencies.stderr ?? process.stderr;
    const env = dependencies.env ?? process.env;
    const operationList = dependencies.operationList ?? operations;

    if (!parsedArguments.command || parsedArguments.command === "help" || parsedArguments.command === "--help") {
        stdout.write(renderHelp(operationList));
        return 0;
    }

    const operation = operationList.find((item) => item.name === parsedArguments.command);
    if (!operation) {
        stderr.write(`Unknown operation: ${parsedArguments.command}\n\n`);
        stderr.write(renderHelp(operationList));
        return 1;
    }

    try {
        const createClient = dependencies.createClient ?? createClientFromEnv;
        const client = await createClient(env);
        const result = await operation.run({
            client,
            options: parsedArguments.options,
            positionals: parsedArguments.positionals,
        });

        writeJson(stdout, result);
        return 0;
    } catch (error) {
        if (error instanceof UsageError) {
            stderr.write(renderUsageError(error, operation));
            return 2;
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        stderr.write(`${message}\n`);
        return 1;
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exitCode = await runCli();
}

import type { MediaWikiClient } from "../client.js";
import type { CliOptions } from "../helpers.js";

export interface OperationContext {
    client: MediaWikiClient;
    options: CliOptions;
    positionals: string[];
}

export interface OperationDefinition<TResult = unknown> {
    description: string;
    name: string;
    run(context: OperationContext): Promise<TResult>;
    usage: string;
}

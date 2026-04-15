import type { CliOptions } from "../helpers.js";
import type Api from "../module/Api.js";

export interface OperationContext {
    client: Api;
    options: CliOptions;
    positionals: string[];
}

export interface OperationDefinition<TResult = unknown> {
    description: string;
    name: string;
    run(context: OperationContext): Promise<TResult>;
    usage: string;
}

import { type Environment, type MediaWikiClient } from "./client.js";
import { type ParsedCliArguments } from "./helpers.js";
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
export declare const runCli: (argv?: readonly string[], dependencies?: RunCliDependencies) => Promise<number>;
export declare const parseArguments: (argv: readonly string[]) => ParsedCliArguments;
export {};
//# sourceMappingURL=index.d.ts.map
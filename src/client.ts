import process from "node:process";
import { UsageError } from "./helpers.js";
import Api, { defaultUserAgent, type ApiOptions } from "./module/Api.js";

export { MOEGIRLPEDIA_API_URL } from "./module/Api.js";

export interface ClientConfig {
    parameters: NonNullable<ApiOptions["parameters"]>;
    password: string;
    userAgent: string;
    username: string;
    timeout: number;
}

export type Environment = Readonly<Record<string, string | undefined>>;

type ApiFactory = (options?: ApiOptions) => Api;

export const getDefaultUserAgent = (): string => defaultUserAgent;

export const getClientConfigFromEnv = (env: Environment = process.env): ClientConfig => {
    const username = env.MOEGIRLPEDIA_USERNAME?.trim();
    const password = env.MOEGIRLPEDIA_BOT_PASSWORD?.trim();

    if (!username) {
        throw new UsageError("Missing environment variable MOEGIRLPEDIA_USERNAME.");
    }

    if (!password) {
        throw new UsageError("Missing environment variable MOEGIRLPEDIA_BOT_PASSWORD.");
    }

    return {
        parameters: {
            formatversion: 2,
        },
        password,
        userAgent: getDefaultUserAgent(),
        username,
        timeout: 60_000,
    };
};

export const createClientFromEnv = async (
    env: Environment = process.env,
    createApi: ApiFactory = (options) => new Api(options),
): Promise<Api> => {
    const { password, username, ...apiOptions } = getClientConfigFromEnv(env);
    const client = createApi(apiOptions);

    await client.login(username, password);
    return client;
};

import { Mwn } from "mwn";
import process from "node:process";
import packageJson from "../package.json" with { type: "json" };
import { asRecord, asString, UsageError } from "./helpers.js";

export interface MediaWikiClient {
    request(params: Record<string, unknown>, customRequestOptions?: Record<string, unknown>): Promise<unknown>;
}

export const MOEGIRLPEDIA_API_URL = "https://mzh.moegirl.org.cn/api.php";

export interface ClientConfig {
    apiUrl: string;
    username: string;
    password: string;
    userAgent: string;
    defaultParams: Record<string, string | number>;
    maxRetries: number;
    retryPause: number;
    silent: boolean;
    suppressAPIWarnings: boolean;
}

export type Environment = Readonly<Record<string, string | undefined>>;

type ClientInitializer = (config: ClientConfig) => Promise<MediaWikiClient>;
type MwnInit = (config: ClientConfig) => Promise<MediaWikiClient>;

const initializeWithMwn: ClientInitializer = async (config) => await (Mwn.init as MwnInit)(config);

const packageMetadata: unknown = packageJson;
const packageName = asString(asRecord(packageMetadata)?.name) ?? "openclaw-skill-moegirlpedia-mediawiki-api";
const packageVersion = asString(asRecord(packageMetadata)?.version) ?? "0.0.0";

export const getDefaultUserAgent = (): string => `${packageName}/${packageVersion} (https://github.com/AnnAngela/openclaw-skill-moegirlpedia-mediawiki-api)`;

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
        apiUrl: MOEGIRLPEDIA_API_URL,
        username,
        password,
        userAgent: getDefaultUserAgent(),
        defaultParams: {
            assert: "user",
            formatversion: 2,
        },
        maxRetries: 3,
        retryPause: 5_000,
        silent: true,
        suppressAPIWarnings: true,
    };
};

export const createClientFromEnv = async (
    env: Environment = process.env,
    initializer: ClientInitializer = initializeWithMwn,
): Promise<MediaWikiClient> => await initializer(getClientConfigFromEnv(env));

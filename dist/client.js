import { Mwn } from "mwn";
import process from "node:process";
import packageJson from "../package.json" with { type: "json" };
import { asRecord, asString, UsageError } from "./helpers.js";
export const MOEGIRLPEDIA_API_URL = "https://mzh.moegirl.org.cn/api.php";
const initializeWithMwn = async (config) => await Mwn.init(config);
const packageMetadata = packageJson;
const packageName = asString(asRecord(packageMetadata)?.name) ?? "openclaw-skill-moegirlpedia-mediawiki-api";
const packageVersion = asString(asRecord(packageMetadata)?.version) ?? "0.0.0";
export const getDefaultUserAgent = () => `${packageName}/${packageVersion} (https://github.com/AnnAngela/openclaw-skill-moegirlpedia-mediawiki-api)`;
export const getClientConfigFromEnv = (env = process.env) => {
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
export const createClientFromEnv = async (env = process.env, initializer = initializeWithMwn) => await initializer(getClientConfigFromEnv(env));

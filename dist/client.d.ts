export interface MediaWikiClient {
    request(params: Record<string, unknown>, customRequestOptions?: Record<string, unknown>): Promise<unknown>;
}
export declare const MOEGIRLPEDIA_API_URL = "https://mzh.moegirl.org.cn/api.php";
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
export declare const getDefaultUserAgent: () => string;
export declare const getClientConfigFromEnv: (env?: Environment) => ClientConfig;
export declare const createClientFromEnv: (env?: Environment, initializer?: ClientInitializer) => Promise<MediaWikiClient>;
export {};
//# sourceMappingURL=client.d.ts.map
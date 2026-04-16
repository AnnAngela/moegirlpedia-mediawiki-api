/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import { CookieJar } from "tough-cookie";
import type {
    ApiEditPageParams,
    ApiLegacyTokenType,
    ApiParseParams,
    ApiQueryAllMessagesParams,
    ApiQueryTokensParams,
    ApiRollbackParams,
    ApiTokenType,
    UnknownApiParams,
} from "types-mediawiki-api";
import packageJson from "../../package.json" with { type: "json" };

export const MOEGIRLPEDIA_API_URL = "https://mzh.moegirl.org.cn/api.php";

export const defaultUserAgent = `Node/${process.version} ${packageJson.name}/${packageJson.version} (https://github.com/AnnAngela/moegirlpedia-mediawiki-api)`;

type TypeOrArray<T> = T extends any ? T | T[] : never; // T[] would be a mixed array
type ReplaceValue<T extends U | U[], U, V> = T extends U[] ? V[] : V;
/**
 * 到期时间。可以是相对时间（例如：5 months 或 2 weeks）或是绝对时间（例如：2014-09-18T12:34:56Z）。
 *
 * 如果要无期限，请使用 `infinite`、`indefinite`、`infinity`、或 `never`。
 */
type Expiry = string;

export interface ApiOptions {
    parameters?: UnknownApiParams;
    userAgent?: string;
    timeout?: number;
    apiURL?: string;
}
export interface UserInfo {
    /**
     * User ID.
     */
    id?: number;
    /**
     * User name.
     */
    name?: string;
    /**
     * User groups that the user belongs to.
     */
    groups: string[];
    /**
     * User's rights.
     */
    rights: string[];
}
export interface WatchedPage {
    ns: number;
    /**
     * Full page name.
     */
    title: string;
    /**
     * Whether the page is now watched (true) or unwatched (false).
     */
    watched: boolean;
}
export interface ApiErrorCause {
    code: string;
    response: Response;
    result?: any;
}
class ApiError extends Error {
    constructor(message: string, public override readonly cause: ApiErrorCause) {
        super(message);
    }
}

export default class Api {
    static readonly isApiLegacyTokenType = (tokenType: ApiTokenType | ApiLegacyTokenType): tokenType is ApiLegacyTokenType =>
        tokenType === "edit"
        || tokenType === "delete"
        || tokenType === "protect"
        || tokenType === "move"
        || tokenType === "block"
        || tokenType === "unblock"
        || tokenType === "email"
        || tokenType === "import"
        || tokenType === "options";
    static readonly normalizeTokenType = (tokenType: ApiTokenType | ApiLegacyTokenType): ApiTokenType => {
        if (Api.isApiLegacyTokenType(tokenType)) {
            return "csrf";
        }
        return tokenType;
    };
    static readonly parseParameters = (parameters: UnknownApiParams) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(parameters)) {
            if (value === undefined) {
                continue;
            }
            if (Array.isArray(value)) {
                params.append(key, value.join("|"));
            } else if (value instanceof File) {
                continue; // Skip file parameters as they cannot be sent as URLSearchParams
            } else {
                params.append(key, String(value));
            }
        }
        return params.toString();
    };

    private parameters: UnknownApiParams = {
        formatversion: 2,
    };
    private headers = new Headers({
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Connection: "keep-alive",
        "User-Agent": defaultUserAgent,
        "Api-User-Agent": defaultUserAgent,
    });
    private abortControllers = new Set<AbortController>();
    private currentUser: string | null = null;
    private queues = new Map<string, Promise<any>>();
    #tokens = new Map<ApiTokenType, string>();
    #cookieJar = new CookieJar();
    timeout = 60000;
    apiURL = MOEGIRLPEDIA_API_URL;

    constructor(options?: ApiOptions) {
        const {
            userAgent,
            parameters,
            timeout,
            apiURL,
        } = options ?? {};
        if (userAgent) {
            this.headers.set("User-Agent", userAgent);
        }
        if (parameters) {
            Object.assign(this.parameters, parameters);
        }
        if (timeout) {
            this.timeout = timeout;
        }
        if (apiURL) {
            this.apiURL = apiURL;
        }
    }

    /**
     * Abort all unfinished requests issued by this Api object.
     */
    abort() {
        for (const controller of this.abortControllers) {
            controller.abort();
            this.abortControllers.delete(controller);
        }
    }
    /**
     * Indicate that the cached token for a certain action of the API is bad.
     *
     * Call this if you get a `badtoken` error when using the token returned by {@link getToken()}.
     * You may also want to use {@link postWithToken()} instead, which invalidates bad cached tokens
     * automatically.
     */
    badToken(tokenType: ApiTokenType) {
        this.#tokens.delete(tokenType);
        this.#tokens.delete(Api.normalizeTokenType(tokenType));
    }
    /**
     * Perform API get request in POST method. See {@link post()} for details.
     */
    get(...args: Parameters<Api["post"]>) {
        return this.post(...args);
    }
    /**
     * Get the categories that a particular page on the wiki belongs to.
     *
     * @returns Promise that resolves with an array of category titles, or with false if the title was not found.
     */
    async getCategories(title: string) {
        const data = await this.post({
            action: "query",
            prop: "categories",
            titles: [title],
        });
        const categories = data?.query?.pages?.[0]?.categories as ({ title: string }[] | undefined);
        if (!Array.isArray(categories)) {
            return false;
        }
        return categories.map((cat: { title: string }) => cat.title);
    }
    /**
     * Get a list of categories that match a certain prefix.
     *
     * E.g. given "Foo", return "Food", "Foolish people", "Foosball tables"...
     *
     * @param prefix Prefix to match.
     * @returns Promise that resolves with an array of matched categories
     */
    async getCategoriesByPrefix(prefix: string) {
        const data = await this.post({
            action: "query",
            list: "allpages",
            apprefix: prefix,
            apnamespace: 14,
        });
        return data?.query?.allpages?.map((page: { title: string }) => page.title) ?? [];
    }
    /**
     * API helper to grab a csrf token.
     *
     * @returns Received token.
     */
    getEditToken() {
        return this.getToken("csrf");
    }
    /**
     * Get a set of messages.
     *
     * @param messages Messages to retrieve
     * @param options Additional parameters for the API call
     */
    async getMessages(
        messages: string | string[],
        options?: ApiQueryAllMessagesParams,
    ) {
        const messagesArray = Array.isArray(messages) ? messages : [messages];
        const result: Record<string, string> = {};
        for (let i = 0; i * 50 < messagesArray.length; i++) {
            const data = await this.post({
                action: "query",
                meta: "allmessages",
                ammessages: messagesArray.slice(i * 50, (i + 1) * 50),
                ...options,
            });

            const allMessages = data?.query?.allmessages as (({ missing: true } | { missing?: false; name: string; content: string })[] | undefined);
            if (!Array.isArray(allMessages)) {
                continue;
            }
            for (const msg of allMessages) {
                if (msg.missing) {
                    continue;
                }
                result[msg.name] = msg.content;
            }
        }
        return result;
    }
    /**
     * Get a token for a certain action from the API.
     *
     * @param type Token type
     * @param additionalParams Additional parameters for the API.
     * @returns Received token.
     */
    async getToken(
        type: ApiTokenType | ApiLegacyTokenType,
        additionalParams?: ApiQueryTokensParams,
    ) {
        const normalizedType = Api.normalizeTokenType(type);
        const cachedToken = this.#tokens.get(normalizedType);
        if (cachedToken) {
            return cachedToken;
        }

        const data = await this.post({
            action: "query",
            meta: "tokens",
            type: type,
            ...additionalParams,
        });

        const token = data?.query?.tokens?.[`${normalizedType}token`] as string | undefined;
        if (!token) {
            throw new Error(`Failed to fetch token of type ${type}.`);
        }
        this.#tokens.set(normalizedType, token);
        return token;
    }
    /**
     * Get the current user's groups and rights.
     */
    async getUserInfo() {
        const data = await this.post({
            action: "query",
            meta: "userinfo",
            uiprop: ["groups", "rights"],
        });

        return data?.query?.userinfo as UserInfo | undefined;
    }
    /**
     * Determine if a category exists.
     *
     * @param title
     * @returns Promise that resolves with a boolean indicating whether the category exists.
     */
    async isCategory(title: string) {
        const data = await this.post({
            prop: "categoryinfo",
            titles: [title],
        });

        return !!data?.query?.pages[0]?.categoryinfo;
    }
    /**
     * @param username
     * @param password
     */
    async login(username: string, password: string) {
        const lgtoken = await this.getToken("login");

        const data = await this.post({
            action: "login",
            lgname: username,
            lgpassword: password,
            lgtoken,
        });

        const result = data?.login?.result as string | undefined;
        if (result === "Success") {
            this.currentUser = username.split("@")[0];
            return result;
        }
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Login failed: ${result ?? "unknown error"} (reason: ${data?.login?.reason ?? "unknown"})`);
    }
    /**
     * Post a new section to the page.
     *
     * @param title Target page
     * @param header
     * @param message Wikitext message
     * @param additionalParams Additional API parameters
     */
    newSection(
        title: string,
        header: string,
        message: string,
        additionalParams?: ApiEditPageParams,
    ) {
        return this.postWithEditToken({
            action: "edit",
            section: "new",
            title: title,
            summary: header,
            text: message,
            ...additionalParams,
        });
    }
    /**
     * Convenience method for `action=parse` for parsing wikitext.
     *
     * @param content Content to parse
     * @param additionalParams Parameters object to set custom settings, e.g.
     *  `redirects`, `sectionpreview`. `prop` should not be overridden.
     */
    async parse(
        content: string,
        additionalParams?: ApiParseParams,
    ) {
        const data = await this.post({
            action: "parse",
            // Minimize the JSON we get back, there is no way to access anything else anyway
            prop: "text",
            contentmodel: "wikitext",
            text: content,
            ...additionalParams,
        });

        return data.parse.text as string;
    }
    /**
     * Convenience method for `action=parse` for parsing pages.
     *
     * @param content Content to parse
     * @param additionalParams Parameters object to set custom settings, e.g.
     *  `redirects`, `sectionpreview`. `prop` should not be overridden.
     */
    async parsePage(
        page: string,
        additionalParams?: ApiParseParams,
    ) {
        const data = await this.post({
            action: "parse",
            // Minimize the JSON we get back, there is no way to access anything else anyway
            prop: "text",
            contentmodel: "wikitext",
            page,
            ...additionalParams,
        });

        return data.parse.text as string;
    }
    /**
     * Perform API post request.
     */
    async post(parameters: UnknownApiParams): Promise<any> {
        const controller = new AbortController();
        this.abortControllers.add(controller);

        // Ensure that token parameter is last (per [[mw:API:Edit#Token]]).
        let token: string | undefined = undefined;
        if (Reflect.has(parameters, "token")) {
            token = parameters.token as string;
            Reflect.deleteProperty(parameters, "token");
        }

        const body = Api.parseParameters({
            ...this.parameters,
            ...parameters,
            token,
            ...this.currentUser ? { assertuser: this.currentUser } : {},
            format: "json",
        });
        setTimeout(() => {
            if (this.abortControllers.has(controller)) {
                controller.abort();
                this.abortControllers.delete(controller);
            }
        }, this.timeout);
        try {
            const cookieString = await this.#cookieJar.getCookieString(this.apiURL);
            const headers = new Headers(this.headers);
            headers.set("Cookie", cookieString);
            headers.set("Origin", new URL(this.apiURL).origin);
            const response = await fetch(this.apiURL, {
                method: "POST",
                headers,
                body,
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new ApiError(`HTTP error! status: ${response.status}`, {
                    code: "http",
                    response,
                });
            }
            const setCookies = response.headers.getSetCookie();
            if (setCookies.length > 0) {
                for (const cookieStr of setCookies) {
                    await this.#cookieJar.setCookie(cookieStr, this.apiURL);
                }
            }
            const result = await response.json() as undefined | null | Record<string, any>;
            if (result === undefined || result === null) {
                throw new ApiError("OK response but empty result (check HTTP headers?)", {
                    code: "ok-but-empty",
                    response,
                    result,
                });
            }
            if (result.error) {
                const code = result.error.code ?? "unknown";
                throw new ApiError("API error", {
                    code,
                    response,
                    result,
                });
            }
            if (result.errors) {
                const code = result.errors[0].code ?? "unknown";
                throw new ApiError("API error", {
                    code,
                    response,
                    result,
                });
            }
            return result;
        } finally {
            this.abortControllers.delete(controller);
        }
    }
    /**
     * Post to API with csrf token. If we have no token, get one and try to post. If we have a cached token try using that, and if it fails, blank out the cached token and start over.
     *
     * @param params API parameters
     */
    postWithEditToken(parameters: ApiEditPageParams) {
        return this.postWithToken("csrf", parameters);
    }
    /**
     * Post to API with the specified type of token. If we have no token, get one and try to post.
     * If we already have a cached token, try using that, and if the request fails using the cached token,
     * blank it out and start over.
     *
     * @example <caption>For example, to change a user option, you could do:</caption>
     * ```js
     * new mw.Api().postWithToken( 'csrf', {
     *     action: 'options',
     *     optionname: 'gender',
     *     optionvalue: 'female'
     * } );
     * ```
     * @param tokenType The name of the token, like `options` or `edit`.
     * @param params API parameters
     */
    async postWithToken(tokenType: ApiTokenType, parameters: UnknownApiParams): Promise<any> {
        const token = await this.getToken(tokenType);
        try {
            return await this.post({ ...parameters, token });
        } catch (e) {
            if (e instanceof ApiError && e.cause.code === "badtoken") {
                this.badToken(tokenType);
                return this.postWithToken(tokenType, parameters);
            }
            throw e;
        }
    }
    /**
     * Convenience method for `action=rollback`.
     *
     * @param page
     * @param user
     * @param params Additional parameters
     */
    async rollback(
        page: string,
        user: string,
        params?: ApiRollbackParams,
    ) {
        const data = await this.postWithToken("rollback", {
            action: "rollback",
            title: page,
            user,
            ...params,
        });
        return data.rollback;
    }
    /**
     * Asynchronously save the value of a single user option using the API.
     * See {@link saveOptions()}.
     *
     * @param name
     * @param value
     * @param params additional parameters for API.
     */
    saveOption(name: string, value: string | null, params?: UnknownApiParams) {
        return this.saveOptions({ [name]: value }, params);
    }
    /**
     * Asynchronously save the values of user options using the {@link https://www.mediawiki.org/wiki/Special:MyLanguage/API:Options Options API}.
     *
     * If a value of `null` is provided, the given option will be reset to the default value.
     *
     * Any warnings returned by the API, including warnings about invalid option names or values,
     * are ignored. However, do not rely on this behavior.
     *
     * If necessary, the options will be saved using several sequential API requests. Only one promise
     * is always returned that will be resolved when all requests complete.
     *
     * If a request from a previous {@link saveOptions()} call is still pending, this will wait for it to be
     * completed, otherwise MediaWiki gets sad. No requests are sent for anonymous users, as they
     * would fail anyway. See T214963.
     *
     * @param options Options as a `{ name: value, … }` object
     * @param params additional parameters for API.
     */
    async saveOptions(
        options: Record<string, string | null>,
        params?: UnknownApiParams,
    ) {
        const queue = this.queues.get("saveOptions") ?? Promise.resolve();
        await queue;
        const grouped = [];
        for (const [name, value] of Object.entries(options)) {
            const bundleable = !value?.includes("|") && (!name.includes("|") && !name.includes("="));
            if (bundleable) {
                if (value !== null) {
                    grouped.push(`${name}=${value}`);
                } else {
                    // Omitting value will reset the option
                    grouped.push(name);
                }
            } else {
                await this.postWithToken("csrf", {
                    action: "options",
                    optionname: name,
                    optionvalue: value ?? undefined,
                    ...params,
                });
            }
        }
    }
    /**
     * Convenience method for `action=watch&unwatch=1`.
     *
     * @param pages Full page name or instance of {@link mw.Title}, or an
     *  array thereof. If an array is passed, the return value passed to the promise will also be an
     *  array of appropriate objects.
     * @returns A promise that resolves
     *  with an object (or array of objects) describing each page that was passed in and its
     *  current watched/unwatched status.
     */
    async unwatch<P extends TypeOrArray<string>>(pages: P): Promise<ReplaceValue<P, string, WatchedPage>> {
        const data = await this.postWithToken("watch", {
            action: "watch",
            unwatch: 1,
            titles: pages,
        });
        return Array.isArray(pages) ? data.watch : data.watch[0];
    }
    /**
     * Convenience method for `action=watch`.
     *
     * @param pages Full page name or instance of {@link mw.Title}, or an
     *  array thereof. If an array is passed, the return value passed to the promise will also be an
     *  array of appropriate objects.
     * @param expiry When the page should expire from the watchlist. If omitted, the
     *  page will not expire.
     * @returns A promise that resolves with an object (or array of objects) describing each page that was passed in and its
     *  current watched/unwatched status.
     */
    async watch<P extends TypeOrArray<string>>(
        pages: P,
        expiry?: Expiry,
    ): Promise<ReplaceValue<P, string, WatchedPage>> {
        const data = await this.postWithToken("watch", {
            action: "watch",
            expiry,
            titles: pages,
        });
        return Array.isArray(pages) ? data.watch : data.watch[0];
    }
}

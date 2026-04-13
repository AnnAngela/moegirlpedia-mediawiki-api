import { configs } from "@annangela/eslint-config";
import packageJSON from "./package.json" with { type: "json" };

configs.base.languageOptions.ecmaVersion = 2025;
configs.base.languageOptions.parserOptions.ecmaVersion = 2025;

/**
 * @type { import("eslint").Linter.Config["ignores"] }
 */
const ignores = [
    "**/dist/**",
    "**/.*/**",
    "node_modules",
];
/**
 * @type { import("eslint").Linter.Config[] }
 */
const config = [
    // base
    {
        ...configs.base,
        files: [
            "**/*.js",
            "**/*.ts",
        ],
        ignores,
    },
    {
        ...configs.node,
        files: [
            "**/*.js",
            "**/*.ts",
        ],
        ignores,
    },
    // For TypeScript files
    {
        ...configs.typescript,
        files: [
            "**/*.ts",
        ],
        ignores,
    },
    {
        files: [
            "**/*.js",
            "**/*.ts",
        ],
        rules: {
            // Too hard to avoid in scripts, and not a security risk since these are not exposed to user input
            "security/detect-object-injection": "off",

            "n/no-unsupported-features/node-builtins": ["error", { version: packageJSON.engines.node }],
            "n/no-unsupported-features/es-builtins": ["error", { version: packageJSON.engines.node }],
            "n/no-unsupported-features/es-syntax": ["error", { version: packageJSON.engines.node }],
        },
    },
];
export default config;

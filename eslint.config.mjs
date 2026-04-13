import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            import: importPlugin,
        },
        rules: {
            ...importPlugin.configs.recommended.rules,
            ...importPlugin.configs.typescript.rules,
        },
    },

    {
        settings: {
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.json",
                },
            },
        },
    },

    {
        files: ["**/*.{ts,js}"],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
            },
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // =========================
            // STYLE (REMOVED: indent, quotes, semi, no-multiple-empty-lines)
            // Prettier handles these now.
            // =========================

            // =========================
            // CODE STRUCTURE
            // =========================
            "curly": "warn",
            "prefer-template": "warn",

            // =========================
            // CLEAN CODE
            // =========================
            "no-unused-vars": "off", // Changed from "on" (invalid) to "off"
            "@typescript-eslint/no-unused-vars": "warn",

            "no-console": "warn",
            "no-debugger": "error",
            "no-return-assign": "off",

            // =========================
            // NAMING
            // =========================
            "camelcase": "off",

            // =========================
            // SAFETY
            // =========================
            "eqeqeq": ["error", "always"],
            "no-var": "error",
            "prefer-const": "error",
        },
    },
    // MUST BE LAST: Prettier config should always be the final item
    // to ensure it overrides everything else.
    prettier,
]);

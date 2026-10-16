import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**", "coverage/**"]),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // The domain stays pure and deterministic: no I/O, no frameworks, no hidden clocks or randomness.
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "node:*",
                "next",
                "next/*",
                "react",
                "react-dom",
                "hono",
                "hono/*",
                "@supabase/*",
                "drizzle-orm",
                "drizzle-orm/*",
                "ai",
                "@ai-sdk/*",
              ],
              message: "packages/domain must stay pure: no I/O, framework or provider imports.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        "fetch",
        "process",
        "window",
        "document",
        "localStorage",
        "sessionStorage",
        "crypto",
      ],
      "no-restricted-properties": [
        "error",
        { object: "Date", property: "now", message: "Pass the time in as an argument." },
        { object: "Math", property: "random", message: "Pass ids or random values in." },
      ],
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node },
    extends: [tseslint.configs.disableTypeChecked],
  },
]);

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Mobile project has its own ESLint config (Expo preset); don't lint it
    // with the Next ruleset or we'll get RN-vs-DOM false positives.
    "mobile/**",
    "shared/**",
  ]),
  {
    rules: {
      // Treat any identifier starting with `_` as intentionally unused.
      // This is the standard escape hatch for "I know this param is here to
      // satisfy an interface but I don't use it" — e.g. `(_request, ctx)`.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

const webFiles = ["apps/web/**/*.{js,jsx,ts,tsx,mjs,cjs}"];

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "convex/_generated/**",
    "apps/web/.next/**",
    "apps/mobile/.expo/**",
    "apps/mobile/node_modules/**",
  ]),
  ...nextCoreWebVitals.map((config) => ({ ...config, files: webFiles })),
  ...nextTypescript.map((config) => ({ ...config, files: webFiles })),
  ...convexPlugin.configs.recommended,
  {
    files: webFiles,
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-children-prop": "off",
      "no-console": ["warn", { allow: ["error", "warn", "info"] }],
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lucide-react/dist/*"],
              message:
                "Use named imports from 'lucide-react' instead of deep imports. Tree-shaking is handled automatically.",
            },
          ],
        },
      ],
    },
  },
]);

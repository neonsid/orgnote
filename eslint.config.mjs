import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...convexPlugin.configs.recommended,
  {
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
  {
    ignores: [".next/**", "node_modules/**", "convex/_generated/**"],
  },
]);

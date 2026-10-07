import { defineConfig } from "eslint/config"
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"


export default defineConfig([
  {
    ignores: [
      "**/.yarn/",
      "**/coverage/",
      "**/cypress/",
      "application/*/dist/",
      "application/*/jest.config.js",
      "application/backend/prisma/"
    ]
  },
  
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended
    ],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "*.js", "*.cjs", "*.ts", "*.tsx"]
        },
        tsconfigRootDir: import.meta.dirname,
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn"
    }
  },
  {
    files: [
      "application/backend/**/*.{ts,js}",
      "application/integrations/**/*.{ts.js}"
    ],
    rules: {
      "@typescript-eslint/no-namespace": "warn"
    }
  },
  {
    files: [
      "application/user-client/**/*.{ts,tsx}",
      "application/admin-client/**/*.{ts,txs}"
    ],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
    }
  },
  {
    files: ["application/admin-client/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error", {
          paths: [
            {
              name: "@refinedev/core",
              importNames: ["useLogin"],
              message: "Please use the type-safe \"useLogin\" from \"src/hooks/useLogin\" instead."
            }
          ]
        }
      ]
    }
  }
]);

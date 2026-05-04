import react from "@eslint-react/eslint-plugin";
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import typescript from "typescript-eslint";

const banPixiPattern = {
  group: ["**pixi**"],
  message:
    "pixi (except type imports) is not allowed for this file (probably not a browser-only environment)",
  allowTypeImports: true,
};

const banPrismaClientPath = {
  name: "generated/client",
  message: "Use 'generated/browser' instead of 'generated/client' for this file",
};

const banNonSharedPattern = {
  group: ["**/{server,frontend}/**", "server/**", "frontend/**"],
  message: "Don't import non-type server or frontend code for this file",
  allowTypeImports: true,
};

export default defineConfig([
  globalIgnores([
    ".next/**",
    "dist/**",
    "src/generated/**",
    "src/pixi/**/*.*", // TODO temporarily
    "src/frontend/**", // TODO temporarily
  ]),
  eslint.configs.recommended,
  typescript.configs.strictTypeChecked,
  typescript.configs.stylisticTypeChecked,
  react.configs["strict-type-checked"],
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-restricted-imports": "off",
    },
  },
  {
    ignores: ["src/components/client-only/**/*.*", "src/pixi/**/*.*"],
    // TODO i think what's missing is that currently client-only and pixi are allowed to use prisma stuff, gotta untangle this at some point.
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [banPrismaClientPath],
          patterns: [banPixiPattern],
        },
      ],
    },
  },
  {
    files: ["src/server/**/*"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [banPixiPattern],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [banPrismaClientPath],
          patterns: [banPixiPattern, banNonSharedPattern],
        },
      ],
    },
  },
]);

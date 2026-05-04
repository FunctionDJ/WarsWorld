import react from "@eslint-react/eslint-plugin";
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
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

const alwaysIgnored = [
  "node_modules/**",
  ".next/**",
  "dist/**",
  // "src/generated/**",
  // "src/pixi/**/*.*", // TODO temporarily
  // "src/frontend/**", // TODO temporarily
];

/** @type {import("@eslint/core").SettingsConfig} */
const settings = {
  react: {
    version: "detect",
  },
};

const languageOptions = {
  parserOptions: {
    projectService: true,
  },
};

export default defineConfig([
  eslint.configs.recommended,
  typescript.configs.strictTypeChecked,
  typescript.configs.stylisticTypeChecked,
  react.configs["strict-type-checked"],
  {
    settings,
    languageOptions,
    ignores: alwaysIgnored,
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-restricted-imports": "off",
    },
  },
  {
    settings,
    languageOptions,
    ignores: [...alwaysIgnored, "src/components/client-only/**/*.*", "src/pixi/**/*.*"],
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
    settings,
    languageOptions,
    ignores: alwaysIgnored,
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
    settings,
    languageOptions,
    ignores: alwaysIgnored,
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

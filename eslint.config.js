import react from "@eslint-react/eslint-plugin";
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import typescript from "typescript-eslint";

export default defineConfig([
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
    ignores: ["node_modules/**", ".next/**", "dist/**"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
]);

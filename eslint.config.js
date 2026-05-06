import react from "@eslint-react/eslint-plugin";
import eslint from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
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
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    /**
     * TODO old comment:
     *
     * even though "dist" is already excluded through tsconfig.json, eslint will
     * lint the "dist" folder without this `ignorePatterns`.
     * i suspect that's because there's another eslint config generated at `./dist/.eslintrc.cjs`.
     * maybe there's a cleaner way by telling typescript to typecheck `./.eslintrc.js` but not transpile it to `./dist`.
     *
     * ^ this comment is old but might still be valid.
     */
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
        // [upstream] https://github.com/vercel/next.js/issues/89764
        version: "19",
        // version: "detect",
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      curly: "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "max-len": [
        "error",
        {
          code: 150,
          tabWidth: 2,
          ignoreComments: false,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      "no-restricted-imports": "off",
      /**
       * TODO
       * we haven't decided yet if we want to use next.js' <Image> or just
       * go with <img> yet. when a conclusion is made, one or the other
       * should be banned through linting.
       */
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["src/pages/**/*.tsx", "src/components/**/*.tsx", "src/frontend/**/*.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
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

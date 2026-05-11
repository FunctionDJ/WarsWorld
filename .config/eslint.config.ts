import react from "@eslint-react/eslint-plugin";
import eslint from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig, globalIgnores } from "eslint/config";
import typescript from "typescript-eslint";
import local from "../src/eslint/local-rules";

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

// TODO
/**
 * idea: rule that highlights functions/methods that return an array that's not marked as readonly
 */

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
  unicorn.configs.recommended,
  react.configs["strict-type-checked"],
  {
    plugins: {
      local,
    },
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
      "unicorn/no-null": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/prefer-readonly": "warn",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
      ],
      // "@typescript-eslint/prefer-readonly-parameter-types": [
      //   "error",
      //   {
      //     treatMethodsAsReadonly: true,
      //   },
      // ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            ":matches(Identifier.params, TSPropertySignature, PropertyDefinition)[optional=false] > TSTypeAnnotation > TSUnionType:has(TSUndefinedKeyword)",
          message:
            "Use TypeScript optional syntax (`foo?: T`) instead of `T | undefined` when optional syntax is possible.",
        },
        {
          selector:
            "AssignmentExpression[left.type='MemberExpression'][right.type='FunctionExpression'], AssignmentExpression[left.type='MemberExpression'][right.type='ArrowFunctionExpression']",
          message: "Do not reassign methods/functions on object properties.",
        },
      ],
      "max-lines": "warn",
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
      // we need to disable eslint built-in `no-restricted-imports` in order to use the typescript version of it
      "no-restricted-imports": "off",
      "local/no-redundant-type-wrapper": [
        "off", // TODO doesnt work like i want to yet
        {
          requireWrappedTypeEffectivelyReadonlyFor: ["WWReadOnly", "Readonly"],
        },
      ],
      /**
       * TODO
       * we haven't decided yet if we want to use next.js' <Image> or just
       * go with <img> yet. when a conclusion is made, one or the other
       * should be banned through linting.
       */
      "@next/next/no-img-element": "off",
      "arrow-body-style": ["error", "as-needed"],
    },
  },
  {
    // react components and custom hooks
    files: ["src/**/*.tsx", "src/**/use-*.ts"],
    rules: {
      "unicorn/prevent-abbreviations": [
        "warn",
        {
          allowList: {
            Props: true,
            Ref: true,
          },
        },
      ],
    },
  },
  {
    // react components
    files: ["src/**/*.tsx"],
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          case: "pascalCase",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  {
    // next.js dynamic paths
    files: ["src/**/\\[*\\].tsx"],
    rules: {
      "unicorn/filename-case": "off",
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

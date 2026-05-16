import type { Plugin } from "@eslint/core";
import { noRedundantTypeWrapperRule } from "./no-redundant-type-wrapper-rule.ts";

const localPlugin: Plugin = {
  rules: {
    // [upstream] https://github.com/typescript-eslint/typescript-eslint/issues/11543
    // @ts-expect-error see previous line
    "no-redundant-type-wrapper": noRedundantTypeWrapperRule,
  },
};

export default localPlugin;

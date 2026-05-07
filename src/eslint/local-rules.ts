import type { Plugin } from "@eslint/core";
import { ESLintUtils } from "@typescript-eslint/utils";
import type { RuleFix } from "@typescript-eslint/utils/ts-eslint";
import ts from "typescript";

type Options = [
  {
    wrappers?: string[];
    requireWrappedTypeEffectivelyReadonlyFor?: string[];
  },
];

const noRedundantTypeWrapperRule = ESLintUtils.RuleCreator.withoutDocs<
  Options,
  "redundant" | "unwrap"
>({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow redundant generic wrappers like Foo<T> when T is already equivalent",
    },
    hasSuggestions: true,
    messages: {
      redundant:
        "{{wrapperText}}<{{typeText}}> is redundant because {{typeText}} is already compatible.",
      unwrap: "Remove redundant wrapper",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          wrappers: {
            type: "array",
            items: { type: "string" },
          },
          requireWrappedTypeEffectivelyReadonlyFor: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
  },
  create(context) {
    const { parserServices } = context.sourceCode;

    if (!parserServices?.program || !parserServices.esTreeNodeToTSNodeMap) {
      return {};
    }

    const { program, esTreeNodeToTSNodeMap } = parserServices;
    const checker = program.getTypeChecker();
    const configuredWrappers = new Set(context.options[0].wrappers);

    return {
      TSTypeReference(node): void {
        const typeReferenceNode = node;
        const typeArguments = typeReferenceNode.typeArguments?.params;

        if (!typeArguments || typeArguments.length === 0) {
          return;
        }

        const wrapperText = context.sourceCode.getText(typeReferenceNode.typeName);

        if (configuredWrappers.size > 0 && !configuredWrappers.has(wrapperText)) {
          return;
        }

        const tsTypeReferenceNode = esTreeNodeToTSNodeMap.get(typeReferenceNode);

        if (!ts.isTypeNode(tsTypeReferenceNode)) {
          return;
        }

        const wrapperType = checker.getTypeFromTypeNode(tsTypeReferenceNode);

        const redundantTypeArgument = typeArguments.find((typeArgument) => {
          const tsCandidateTypeNode = esTreeNodeToTSNodeMap.get(typeArgument);

          if (!ts.isTypeNode(tsCandidateTypeNode)) {
            return false;
          }

          const candidateType = checker.getTypeFromTypeNode(tsCandidateTypeNode);

          const [{ requireWrappedTypeEffectivelyReadonlyFor }] = context.options;

          if (
            requireWrappedTypeEffectivelyReadonlyFor !== undefined &&
            requireWrappedTypeEffectivelyReadonlyFor.includes(wrapperText) &&
            !isEffectivelyReadonly(candidateType, undefined, checker)
          ) {
            return false;
          }

          return checker.isTypeAssignableTo(wrapperType, candidateType);
        });

        if (redundantTypeArgument === undefined) {
          return;
        }

        const wrappedTypeText = context.sourceCode.getText(redundantTypeArgument);

        context.report({
          node: typeReferenceNode,
          messageId: "redundant",
          data: {
            wrapperText,
            typeText: wrappedTypeText,
          },
          suggest: [
            {
              messageId: "unwrap",
              fix(fixer): RuleFix[] {
                return [fixer.replaceText(typeReferenceNode, wrappedTypeText)];
              },
            },
          ],
        });
      },
    };
  },
});

const isReadonlyDeclaration = (declaration: ts.Declaration): boolean => {
  if (!ts.canHaveModifiers(declaration)) {
    return false;
  }

  const modifiers = ts.getModifiers(declaration);

  if (modifiers === undefined) {
    return false;
  }

  return modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword);
};

const isEffectivelyReadonly = (
  type: ts.Type,
  seen = new Set<ts.Type>(),
  checker: ts.TypeChecker,
): boolean => {
  if (seen.has(type)) {
    return true;
  }

  seen.add(type);

  if (type.isUnionOrIntersection()) {
    return type.types.every((member: ts.Type) => isEffectivelyReadonly(member, seen, checker));
  }

  for (const property of type.getProperties()) {
    if ((property.flags & ts.SymbolFlags.Method) !== 0) {
      continue;
    }

    const declarations = property.getDeclarations() ?? [];

    if (declarations.length === 0) {
      return false;
    }

    if (!declarations.every((declaration: ts.Declaration) => isReadonlyDeclaration(declaration))) {
      return false;
    }

    const firstDeclaration = declarations[0];

    if (!firstDeclaration) {
      return false;
    }

    const propertyType = checker.getTypeOfSymbolAtLocation(property, firstDeclaration);

    if (!isEffectivelyReadonly(propertyType, seen, checker)) {
      return false;
    }
  }

  return true;
};

const localPlugin: Plugin = {
  rules: {
    // @ts-expect-error [upstream] https://github.com/typescript-eslint/typescript-eslint/issues/11543

    "no-redundant-type-wrapper": noRedundantTypeWrapperRule,
  },
};

export default localPlugin;

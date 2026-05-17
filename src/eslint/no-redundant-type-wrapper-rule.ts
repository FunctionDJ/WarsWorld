import { ESLintUtils } from "@typescript-eslint/utils";
import { getCheckFlags, readonlyFlag } from "./ts-internal-black-magic";

export const noRedundantTypeWrapperRule = ESLintUtils.RuleCreator.withoutDocs({
	meta: {
		type: "suggestion",
		messages: {
			redundant: "Redundant generic type (outer type)",
		},
		schema: [],
	},
	create(context) {
		const service = ESLintUtils.getParserServices(context);
		const { program } = service;
		const checker = program.getTypeChecker();

		return {
			TSTypeReference(node): void {
				const outerType = service.getTypeAtLocation(node);

				const typeArguments = node.typeArguments?.params ?? [];
				if (typeArguments.length === 0) {
					return;
				}

				// The wrapper is redundant if EVERY type argument is assignable to the outer type
				// AND the outer type does not add readonly constraints that are absent in that argument.
				// Using `every` (not `some`) prevents false positives for e.g. Extract<T, U> where U
				// coincidentally resolves to the same type as the whole expression even though T does not.
				const isRedundant = typeArguments.every((typeArgument) => {
					const typeArgumentType = service.getTypeAtLocation(typeArgument);

					if (
						!checker.isTypeAssignableTo(typeArgumentType, outerType) ||
						!checker.isTypeAssignableTo(outerType, typeArgumentType)
					) {
						return false;
					}

					// outerType makes typeArgumentType more readonly if outerType shares any property
					// with typeArgumentType that is readonly in outerType but not in typeArgumentType.
					// Only going "1 layer deep" is an acceptable trade-off in favour of performance.
					const doesMakeOuterMoreReadonly = outerType.getProperties().some((outerProperty) => {
						const argumentProperty = typeArgumentType.getProperty(outerProperty.name);

						if (!argumentProperty) {
							return false;
						}

						const isReadonlyInOuter = !!(getCheckFlags(outerProperty) & readonlyFlag);
						const isReadonlyInArgument = !!(getCheckFlags(argumentProperty) & readonlyFlag);

						return isReadonlyInOuter && !isReadonlyInArgument;
					});

					return !doesMakeOuterMoreReadonly;
				});

				if (isRedundant) {
					context.report({ node, messageId: "redundant" });
				}
			},
		};
	},
});

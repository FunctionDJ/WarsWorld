/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
/* eslint-disable @typescript-eslint/consistent-type-assertions */

import * as ts from "typescript";

// ts.CheckFlags.Readonly (= 8) covers mapped-type transient symbols;
// ts.SymbolFlags.Readonly is undefined at runtime for mapped-type properties.

export const { getCheckFlags } = ts as unknown as { getCheckFlags: (s: ts.Symbol) => number };

export const readonlyFlag = (ts as unknown as { CheckFlags: { Readonly: number } }).CheckFlags
	.Readonly;

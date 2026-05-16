/* eslint-disable @typescript-eslint/no-unused-vars */
import type { RO } from "./ww-readonly";

// check linting using the command `npx eslint src/shared/tooling.ts`

interface Foo {
  bar: string;
}

type Test1 = RO<Foo>; // should have no lint warning (RO<Foo> is not assignable to Foo, meaningful generic type)

// eslint-disable-next-line local/no-redundant-type-wrapper
type Test2 = RO<RO<Foo>>; // should have lint warning (RO<RO<Foo>> is assignable to RO<Foo>, redundant generic type)

type MyUnion = { type: "a" } | { type: "b" };

type Test3 = Extract<MyUnion, { type: "a" }>; // should have no lint warning (MyUnion is not assignable to Extract<MyUnion, { type: "a" }>, meaningful generic type)

// eslint-disable-next-line local/no-redundant-type-wrapper
type Test4 = Extract<MyUnion, MyUnion>; // should have lint warning (MyUnion is assignable to Extract<MyUnion, MyUnion>, redundant generic type)

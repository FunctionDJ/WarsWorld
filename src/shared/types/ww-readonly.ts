/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { IsTuple } from "type-fest";

/**
 * type helper that makes all properties of T recursively readonly, but leaves functions and methods as-is (not made readonly)
 * so they can still be called.
 * https://function.dj/blog/prevent-infinite-recursion-in-typescript-eslint/
 */
export type RO<T> = T extends Function
  ? T
  : T extends readonly unknown[]
    ? IsTuple<T> extends true
      ? { readonly [Key in keyof T]: RO<T[Key]> }
      : readonly RO<T[number]>[]
    : T extends object
      ? {
          readonly [Key in keyof T]: T[Key] extends Function ? T[Key] : RO<T[Key]>;
        }
      : T;

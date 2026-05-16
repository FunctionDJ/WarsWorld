import type { RO } from "./ww-readonly";

const dontThrowString = "dont-throw" as const;

export type DontThrow = typeof dontThrowString;

export const throwIfUndefinedUnlessAccepted = <T>(
  value?: T,
  dontThrow?: DontThrow,
): T | undefined => {
  if (dontThrow !== dontThrowString) {
    return throwIfUndefined(value);
  }

  return value;
};

export const throwIfUndefined = <T>(value?: T, message?: string): T => {
  if (value === undefined) {
    throw new TypeError(
      message ??
        `Variable is undefined where it wasn't accepted to be (type: ${typeof value}) (no custom message provided)`,
    );
  }

  return value;
};

export const findOrThrow = <T>(array: readonly T[], predicate: (item: RO<T>) => boolean): T => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-type-assertion
  const item = array.find((element) => predicate(element as RO<T>));
  return throwIfUndefined(item);
};

/** throws if internal .findIndex returns -1 */
const findIndexOrThrow = <T>(array: readonly T[], predicate: (item: T) => boolean): number => {
  const index = array.findIndex((element) => predicate(element));

  if (index === -1) {
    throw new TypeError("findIndexOrThrow: No item found");
  }

  return index;
};

/** throws if item not found and uses `.splice` */
export const safeRemoveFromArray = <T>(list: T[], predicate: (item: T) => boolean): void => {
  const index = findIndexOrThrow(list, predicate);
  list.splice(index, 1);
};

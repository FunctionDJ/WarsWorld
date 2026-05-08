export type DontThrow = "dont-throw";

export const throwIfUndefinedUnlessAccepted = <T, DontThrow extends "dont-throw" | undefined>(
  value: T | undefined,
  dontThrow?: DontThrow,
): T | undefined => {
  if (dontThrow !== "dont-throw") {
    return throwIfUndefined(value);
  }

  return value;
};

export const throwIfUndefined = <T>(value: T | undefined, message?: string): T => {
  if (value === undefined) {
    throw new TypeError(
      message ??
        `Variable is undefined where it wasn't accepted to be (type: ${typeof value}) (no custom message provided)`,
    );
  }

  return value;
};

export const findOrThrow = <T>(array: readonly T[], predicate: (item: T) => boolean): T => {
  const item = array.find(predicate);
  return throwIfUndefined(item);
};

/** throws if internal .findIndex returns -1 */
const findIndexOrThrow = <T>(array: readonly T[], predicate: (item: T) => boolean): number => {
  const index = array.findIndex(predicate);

  if (index === -1) {
    throw new TypeError("findIndexOrThrow: No item found");
  }

  return index;
};

/** throws if item not found and uses `.splice` */
export const safeRemoveFromArray = <T>(list: T[], predicate: (item: T) => boolean) => {
  const index = findIndexOrThrow(list, predicate);
  list.splice(index, 1);
};

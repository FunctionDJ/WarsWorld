import type { WWReadOnly } from "./types/ww-readonly";

/**
 * small utility to get an element from an array
 * that helps with typescript's noUncheckedIndexedAccess
 * @throws {TypeError} if the result is undefined
 */
export const arrayAtOrThrow = <T>(array: readonly T[], key: number | "last"): T => {
  const index = key === "last" ? array.length - 1 : key;
  const item = array[index];

  if (item === undefined) {
    throw new TypeError(`Tried indexing an array with ${String(key)} but result was undefined`);
  }

  return item;
};

// TODO can this be merged with arrayAtOrThrow() ?
export const getFromObjectOrThrow = <T extends object, K extends keyof T>(
  object: T,
  key: K,
): T[K] => {
  const value = object[key];

  if (value === undefined) {
    throw new TypeError(`Tried indexing an object with ${String(key)} but result was undefined`);
  }

  return value;
};

/** maps an array while preserving/adding readonly */
export const mapReadOnly = <T, U>(
  array: readonly T[],
  callback: (value: WWReadOnly<T>, index: number, array: readonly T[]) => U,
): readonly WWReadOnly<U>[] => array.map((value, index, array) => callback(value, index, array));

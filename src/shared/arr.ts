/**
 * small utility to get an element from an array
 * that helps with typescript's noUncheckedIndexedAccess
 * @throws {TypeError} if the result is undefined
 */
export const arr = <T>(array: T[], key: number | "last"): T => {
  const index = key === "last" ? array.length - 1 : key;
  const item = array[index];

  if (item === undefined) {
    throw new TypeError(`Tried indexing an array with ${String(key)} but result was undefined`);
  }

  return item;
};

// TODO can this be merged with arr() ?
export const obj = <T extends object, K extends keyof T>(object: T, key: K): T[K] => {
  const value = object[key];

  if (value === undefined) {
    throw new TypeError(`Tried indexing an object with ${String(key)} but result was undefined`);
  }

  return value;
};

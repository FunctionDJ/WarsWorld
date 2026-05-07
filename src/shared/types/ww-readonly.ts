/**
 * type helper that makes all properties of T recursively readonly, but leaves methods as-is (not made readonly)
 * so they can still be called.
 */
export type WWReadOnly<T> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  readonly [P in keyof T]: T[P] extends Function ? T[P] : WWReadOnly<T[P]>;
};

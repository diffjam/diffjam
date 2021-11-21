/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-prototype-builtins */

// export const hasProp = (obj: unknown, key: string) => Object.prototype.hasOwnProperty.call(obj, key)

// eslint-disable-next-line arrow-body-style
export const hasProp = <X extends unknown, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> => {
  return (obj as any).hasOwnProperty(prop);
}
import { Mapfn, Stackfn } from "./types";

export const identity = <T>(x: T) => x;
export const firstArgument = <T>(x: T, y: any) => x;
export const secondArgument = <T>(x: any, y: T) => y;
export const POJO = () => ({});

export const diff = (x: number, y: number) => x - y;

export const ith = <T>(x: T[], i: number) => x[i];
export const last = <T>(x: T[]) => x[x.length - 1];

export const sequence = (from: number, to: number) => {
  return Array.from(Array(to - from + 1), (_, i) => i + from);
};

export const stackAndCopy = <
  T extends Record<string, any>,
  U extends Record<string, any>
>(
  stackfn: Stackfn<T, U>
) => {
  const newStackfn = (parent: any, part: any) => {
    const stackedPart = stackfn(parent, part);
    for (const [key, value] of Object.entries(stackedPart)) part[key] = value;
    return part;
  };
  return newStackfn;
};

const copyProps = ["parent"];
export const mapAndCopy = <
  T extends Record<string, any>,
  U extends Record<string, any>
>(
  mapfn: Mapfn<T, U>
) => {
  const newMapfn = (part: T) => {
    const newPart: Record<string, any> = mapfn(part);
    for (const key of copyProps) newPart[key] = part[key];
    return newPart;
  };
  return newMapfn;
};

export const disjointUnion = (...objects: Record<string, any>[]) => {
  const seen = new Set<string>();
  const seenMap: Record<string, any> = {};
  const result: Record<string, any> = {};

  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (seen.has(key)) {
        const oldValue = result[key];
        const index = seenMap[key];

        result[key + index] = oldValue;
        result[key + (index + 1)] = value;
      }

      result[key] = value;
      seen.add(key);
      seenMap[key] = (seenMap[key] ?? -1) + 1;
    }
  }

  // Clean up duplicated keys
  for (const key of seen.values()) delete result[key];

  return result;
};

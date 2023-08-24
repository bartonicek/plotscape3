import { Mapfn, Stackfn } from "./types";

// Basic meta-programming functions
export const call = (fn: Function) => fn();
export const just = <T>(x: T) => {
  return () => x;
};
export const justClone = <T>(x: T) => {
  return () => structuredClone(x);
};
export const identity = <T>(x: T) => x;
export const firstArgument = <T>(x: T, y: any) => x;
export const secondArgument = <T>(x: any, y: T) => y;
export const POJO = () => ({});

// Unary functions
export const toInt = (x: string) => parseInt(x, 10);
export const round = (decimal: number) => (x: number) =>
  Math.floor(x * 10 ** decimal) / 10 ** decimal;

// Binary functions
export const sum = (x: number, y: number) => x + y;
export const diff = (x: number, y: number) => x - y;
export const sequence = (from: number, to: number) => {
  return Array.from(Array(to - from + 1), (_, i) => i + from);
};
export const sequenceInner = (from: number, to: number, n: number) => {
  const range = to - from;
  return Array.from(Array(n), (_, i) => from + ((i + 1) * range) / (n + 1));
};

// Array functions
export const ith = <T>(x: T[], i: number) => x[i];
export const last = <T>(x: T[]) => x[x.length - 1];
export const arrayMin = (x: number[]) => Math.min.apply(null, x);
export const arrayMax = (x: number[]) => Math.max.apply(null, x);

// Set functions
export const setUnion = <T>(x: Set<T>, y: Set<T>) => new Set([...x, ...y]);
export const setIntersection = <T>(x: Set<T>, y: Set<T>) => {
  return new Set([...x].filter((e) => y.has(e)));
};

export const loadJSON = async (path: string) => {
  const response = await fetch(path);
  return await response.json();
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

export const disjointUnion = (
  object1: Record<string, any>,
  object2: Record<string, any>,
  options?: {
    skipProps?: Set<String>;
    keepFirstProps?: Set<string>;
    keepSecondProps?: Set<string>;
  }
) => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(object1)) {
    if (options?.skipProps?.has(key)) continue;
    result[key] = value;
  }

  for (const [key, value] of Object.entries(object2)) {
    if (options?.keepFirstProps?.has(key)) continue;

    if (!options?.keepSecondProps?.has(key) && key in result) {
      const name = key.match(/[a-zA-Z]+/g)?.[0] ?? "default";
      const number = parseInt(key.match(/\d+$/)?.[0] ?? "0", 10);

      const oldKey = name + number;
      const newKey = name + (number + 1);

      result[oldKey] = result[key];
      result[newKey] = value;
      delete result[key];

      continue;
    }

    result[key] = value;
  }

  return result;
};

export const rectOverlap = (
  rect1x: [number, number],
  rect1y: [number, number],
  rect2x: [number, number],
  rect2y: [number, number]
) => {
  return !(
    arrayMax(rect1x) < arrayMin(rect2x) || // If any holds, rectangles don't overlap
    arrayMin(rect1x) > arrayMax(rect2x) ||
    arrayMax(rect1y) < arrayMin(rect2y) ||
    arrayMin(rect1y) > arrayMax(rect2y)
  );
};

export const throttle = (fun: Function, delay: number) => {
  let lastTime = 0;
  return (...args: any[]) => {
    const now = new Date().getTime();
    if (now - lastTime < delay) return;
    lastTime = now;
    fun(...args);
  };
};

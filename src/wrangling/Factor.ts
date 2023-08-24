import {
  arrayMax,
  arrayMin,
  diff,
  disjointUnion,
  last,
  sequence,
  setIntersection,
  toInt,
} from "../utils/funs";
import { Dict } from "../utils/types";

export type Labels<T> = Record<number, T>;
type Opts = { name?: string; singleton?: boolean; bijection?: boolean };
type BijectionOpts = Opts & { min?: boolean; max?: boolean };
type FromOpts<T> = Opts & {
  labs?: T[];
  keepLabs?: boolean;
  sort?: boolean;
  min?: boolean;
  max?: boolean;
};
type BinOpts = Opts & { width?: number; anchor?: number };

const continuousOpts: FromOpts<number> = {
  keepLabs: false,
  min: true,
  max: true,
};

export default class Factor {
  n: number;

  bijection: boolean;
  singleton: boolean;

  indices: number[];
  labels: Labels<Dict>;
  indexSet: Set<number>;
  meta: Dict;

  constructor(
    indices: number[],
    indexSet: Set<number>,
    labels: Labels<Dict>,
    meta?: Dict,
    options?: Opts
  ) {
    this.n = indices.length;

    this.singleton = options?.singleton ?? false;
    this.bijection = options?.bijection ?? false;

    this.indices = indices;
    this.labels = labels;
    this.indexSet = indexSet;
    this.meta = meta ?? {};
  }

  indexAt = (i: number) => this.indices[i];

  static singleton = (n: number, options?: Opts) => {
    const indices = Array(n).fill(0);
    const label = { 0: {} };
    return new Factor(indices, new Set([0]), label, {}, { singleton: true });
  };

  static biject = <T extends number>(values: T[], options?: BijectionOpts) => {
    const n = values.length;
    const indices = sequence(0, n - 1);
    const indexSet = new Set(indices);
    const labels: Labels<Dict> = {};

    const meta: Dict = {};
    if (options?.min) meta[(options?.name ?? "") + "Min"] = arrayMin(values);
    if (options?.max) meta[(options?.name ?? "") + "Max"] = arrayMax(values);
    for (const index of indices) {
      labels[index] = { label: values[index], cases: new Set([index]) };
    }

    return new Factor(indices, indexSet, labels, meta, { bijection: true });
  };

  static from = <T extends number | string>(
    values: T[],
    options?: FromOpts<T>
  ) => {
    const indices: number[] = [];
    const labs = options?.labs ?? Array.from(new Set(values));

    const defaultOpts = { keepLabs: true, sort: true };
    const { keepLabs, sort, min, max } = Object.assign(defaultOpts, options);

    if (!options?.labs || sort || min || max) {
      if (typeof labs[0] === "number") labs.sort(diff as unknown as any);
      else labs.sort();
    }

    const labels: Labels<Dict> = {};
    const meta: Dict = {};
    if (keepLabs) meta.labels = labs;
    if (min) meta[(options?.name ?? "") + "Min"] = labs[0];
    if (max) meta[(options?.name ?? "") + "Max"] = last(labs);

    const labelMap: Dict = {};
    for (let i = 0; i < labs.length; i++) labelMap[labs[i]] = i;
    const indexSet = new Set(Object.values(labelMap));

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const index = labelMap[value];
      if (!(index in labels)) {
        labels[index] = { [options?.name ?? "label"]: value, cases: new Set() };
      }
      indices.push(index);
      labels[index].cases.add(i);
    }

    return new Factor(indices, indexSet, labels, meta, options);
  };

  static fromContinuous = (values: number[], options?: { name?: string }) => {
    return Factor.from(values, Object.assign(continuousOpts, options));
  };

  static bin = (values: number[], options?: BinOpts) => {
    const [min, max] = [Math.min(...values), Math.max(...values)];
    const nbins = options?.width
      ? Math.ceil((max - min) / options.width) + 1
      : 10;
    let width = options?.width ?? (max - min) / (nbins - 1);
    let anchor = options?.anchor ?? min;

    const breakMin = min - width + ((anchor - min) % width);
    const breakMax = max + width - ((max - anchor) % width);

    const breaks = Array(nbins + 2);
    breaks[0] = breakMin;
    breaks[breaks.length - 1] = breakMax;
    for (let i = 1; i < breaks.length - 1; i++) {
      breaks[i] = breakMin + i * width;
    }

    const indices = Array(values.length);
    const labels: Labels<Dict> = {};
    const meta: Dict = {
      [(options?.name ?? "bin") + "Min"]: breakMin,
      [(options?.name ?? "bin") + "Max"]: breakMax,
    };

    for (let j = 0; j < values.length; j++) {
      const index = breaks.findIndex((br) => br >= values[j]) - 1;
      indices[j] = index;
      if (!labels[index]) labels[index] = { cases: new Set() };
      labels[index].cases.add(j);
    }

    const indexSet = new Set(Object.keys(labels).map(toInt));
    const usedIndices = Array.from(indexSet);
    meta.breaks = [];

    for (let k = 0; k < usedIndices.length; k++) {
      const [lwr, upr] = [usedIndices[k], usedIndices[k] + 1];
      meta.breaks.push(breaks[upr]);
      Object.assign(labels[usedIndices[k]], {
        binMin: breaks[lwr],
        binMax: breaks[upr],
      });
    }

    return new Factor(indices, indexSet, labels, meta);
  };

  static product = (factor1: Factor, factor2: Factor) => {
    if (factor1.singleton) return factor2;

    if (factor1.bijection && factor2.bijection) {
      const { indices, indexSet } = factor1;
      const meta = disjointUnion(factor1.meta, factor2.meta);
      const labels: Record<number, Record<string, any>> = {};
      for (const index of indices) {
        labels[index] = disjointUnion(
          factor1.labels[index],
          factor2.labels[index]
        );
      }
      return new Factor(indices, indexSet, labels, meta);
    }

    const n = factor1.n;

    const indices = Array<number>(n);
    const labels: Labels<Dict> = {};
    const meta = disjointUnion(factor1.meta, factor2.meta);

    for (let i = 0; i < n; i++) {
      const f1Index = factor1.indices[i];
      const f2Index = factor2.indices[i];
      const combinedIndex = parseInt([f1Index, f2Index].join("0"), 10);

      if (!(combinedIndex in labels)) {
        const combinedLabel = disjointUnion(
          factor1.labels[f1Index],
          factor2.labels[f2Index],
          { skipProps: new Set(["cases"]) }
        );
        labels[combinedIndex] = combinedLabel;
      }

      indices[i] = combinedIndex;
    }

    const indexSet = new Set(Object.keys(labels).map(toInt));
    return new Factor(indices, indexSet, labels, meta);
  };
}

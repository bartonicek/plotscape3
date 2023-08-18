import {
  diff,
  disjointUnion,
  last,
  sequence,
  setIntersection,
} from "../utils/funs";
import { Dict } from "../utils/types";

export type Labels<T> = Record<number, T>;
type Opts = { name?: string; singleton?: boolean; bijection?: boolean };
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

  static bijection = (n: number, options?: Opts) => {
    const indices = sequence(0, n - 1);
    const labels: Labels<Dict> = {};
    for (const index of indices) labels[index] = {};
    return new Factor(
      indices,
      new Set(indices),
      labels,
      {},
      { bijection: true }
    );
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
    const indexSet = new Set<number>();

    const labels: Labels<Dict> = {};
    const meta: Dict = {
      breaks,
      [(options?.name ?? "bin") + "Min"]: breakMin,
      [(options?.name ?? "bin") + "Max"]: breakMax,
    };

    for (let j = 0; j < values.length; j++) {
      const index = breaks.findIndex((br) => br >= values[j]) - 1;
      indices[j] = index;
      indexSet.add(index);
      if (!labels[index]) labels[index] = { cases: new Set() };
      labels[index].cases.add(j);
    }

    const usedIndices = Array.from(indexSet).sort(diff);
    for (let k = 0; k < usedIndices.length; k++) {
      const [lwr, upr] = [usedIndices[k], usedIndices[k] + 1];
      Object.assign(labels[usedIndices[k]], {
        binMin: breaks[lwr],
        binMax: breaks[upr],
      });
    }

    return new Factor(indices, indexSet, labels, meta);
  };

  static product = (...factors: Factor[]) => {
    factors = factors.filter((x) => !x.singleton);
    if (factors.length == 1 || factors[0].bijection) return factors[0];

    const indicesArray = [];
    const labelArray = [];

    for (const factor of factors) {
      indicesArray.push(factor.indices);
      labelArray.push(factor.labels);
    }

    const n = factors[0].n;

    const indices: number[] = Array(n);
    const labels: Labels<Dict> = {};
    let meta: Dict = {};

    for (const factor of factors) meta = disjointUnion(meta, factor.meta);
    let indexSet: Set<number> = new Set();

    for (let i = 0; i < n; i++) {
      const factorIndices = indicesArray.map((x) => x[i]);
      const combinedIndex = parseInt(factorIndices.join("0"), 10);

      if (!(combinedIndex in labels)) {
        const factorLabels = labelArray.map((x, j) => x[factorIndices[j]]);
        const combinedLabel = factorLabels.reduce((a, b) => {
          const label = disjointUnion(a, b, { skipProps: new Set(["cases"]) });
          label.cases = setIntersection(a.cases, b.cases);
          return label;
        });
        labels[combinedIndex] = combinedLabel;
      }

      indices[i] = combinedIndex;
      indexSet.add(combinedIndex);
    }

    indexSet = new Set(Array.from(indexSet).sort(diff));
    return new Factor(indices, indexSet, labels, meta);
  };
}

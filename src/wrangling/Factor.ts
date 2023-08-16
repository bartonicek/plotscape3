import { diff, disjointUnion, sequence } from "../utils/funs";
import { Dict } from "../utils/types";

export default class Factor {
  n: number;
  j: number;

  bijection: boolean;
  singleton: boolean;

  indices: number[];
  labels: Record<number, Dict>;
  indexSet: Set<number>;

  constructor(
    indices: number[],
    indexSet: Set<number>,
    labels: Record<number, Dict>,
    options?: { singleton?: boolean; bijection?: boolean }
  ) {
    this.n = indices.length;
    this.j = indexSet.size;

    this.singleton = options?.singleton ?? false;
    this.bijection = options?.bijection ?? false;

    this.indices = indices;
    this.labels = labels;
    this.indexSet = indexSet;
  }

  valueAt = (i: number) => this.labels[this.indices[i]].label;
  indexAt = (i: number) => this.indices[i];

  static singleton = (n: number) => {
    const indices = Array(n).fill(0);
    return new Factor(indices, new Set([0]), { 0: {} }, { singleton: true });
  };

  static bijection = (n: number) => {
    const indices = sequence(0, n - 1);
    const labels: Record<string, any> = {};
    for (const index of indices) labels[index] = {};
    return new Factor(indices, new Set(indices), labels, { bijection: true });
  };

  static from = (
    values: string[],
    options?: { labs?: string[]; sort?: boolean }
  ) => {
    const indices: number[] = [];
    const labs = options?.labs ?? Array.from(new Set(values));
    if (!options?.labs || (options?.sort ?? true)) labs.sort();
    const labels: Record<string, Dict> = { labels: labs };

    const labelMap: Record<string, number> = {};
    for (let i = 0; i < labs.length; i++) labelMap[labs[i]] = i;
    const indexSet = new Set(Object.values(labelMap));

    for (const value of values) {
      const index = labelMap[value];
      if (!(index in labels)) labels[index] = { label: value };
      indices.push(index);
    }

    return new Factor(indices, indexSet, labels);
  };

  static bin = (
    values: number[],
    options?: { width?: number; anchor?: number }
  ) => {
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
    for (let i = 1; i < breaks.length; i++) breaks[i] = breakMin + i * width;

    const indices = Array(values.length);
    const indexSet = new Set<number>();

    const labels = {} as Record<number, any>;

    for (let j = 0; j < values.length; j++) {
      const index = breaks.findIndex((br) => br >= values[j]) - 1;
      indices[j] = index;
      indexSet.add(index);
      if (!labels[index]) labels[index] = { cases: [] };
      labels[index].cases.push(j);
    }

    const usedIndices = Array.from(indexSet).sort(diff);
    for (let k = 0; k < usedIndices.length; k++) {
      const [lwr, upr] = [usedIndices[k], usedIndices[k] + 1];
      Object.assign(labels[usedIndices[k]], {
        binMin: breaks[lwr],
        binMax: breaks[upr],
      });
    }

    return new Factor(indices, indexSet, labels);
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
    const labels: Record<string, any> = {};
    let indexSet: Set<number> = new Set();

    for (let i = 0; i < n; i++) {
      const factorIndices = indicesArray.map((x) => x[i]);
      const combinedIndex = parseInt(factorIndices.join("0"), 10);

      if (!(combinedIndex in labels)) {
        const factorLabels = labelArray.map((x, j) => x[factorIndices[j]]);
        const combinedLabel = disjointUnion(...factorLabels);
        labels[combinedIndex] = combinedLabel;
      }

      indices[i] = combinedIndex;
      indexSet.add(combinedIndex);
    }

    indexSet = new Set(Array.from(indexSet).sort());
    return new Factor(indices, indexSet, labels);
  };
}

import {
  Accessor,
  Setter,
  createEffect,
  createMemo,
  createSignal,
  untrack,
} from "solid-js";
import Factor, { Labels } from "./Factor";

type MarkerLabel = {
  group: number;
  layer: number;
  transient: boolean;
  cases: Set<number>;
};

const NGROUPS = 4;
export const GROUPSARR = [1, 2, 3, 4, 129, 130, 131, 132] as const;
export const GROUPSDICT: Record<number, number> = {};
export const LABELSDICT: Labels<MarkerLabel> = {};

for (let i = 0; i < NGROUPS; i++) {
  // GROUPSARR.push(i + 1);
  GROUPSDICT[i + 1] = NGROUPS - i;
  LABELSDICT[i + 1] = {
    layer: i + 1,
    group: NGROUPS - i,
    transient: true,
    cases: new Set(),
  };
}

for (let i = 0; i < NGROUPS; i++) {
  // GROUPSARR.push(i + 129);
  GROUPSDICT[i + 129] = NGROUPS - i;
  LABELSDICT[i + 129] = {
    layer: i + 129,
    group: NGROUPS - i,
    transient: false,
    cases: new Set(),
  };
}

export const TRANSIENT = 128;
export const [G4T, G3T, G2T, G1T, G4, G3, G2, G1] = GROUPSARR;

const addTransient = (x: number) => x & ~128;
const removeTransient = (x: number) => x | 128;

export class Marker {
  n: Accessor<number>;

  cases: Accessor<number[]>;
  group: Accessor<number>;

  indices: Accessor<number[]>;
  setIndices: Setter<number[]>;

  indexSet: Set<number>;
  labels: Record<number, Record<string, any>>;

  factor: Accessor<Factor>;

  constructor(
    n: Accessor<number>,
    cases: Accessor<number[]>,
    group: Accessor<number>
  ) {
    this.n = n;

    const [indices, setIndices] = createSignal(Array(this.n()).fill(G1));
    this.indices = indices;
    this.setIndices = setIndices;

    this.cases = cases;
    this.group = group;
    this.factor = () => new Factor(indices(), indexSet, labels, {});

    const [indexSet, labels] = [new Set(GROUPSARR), LABELSDICT];
    this.indexSet = indexSet;
    this.labels = labels;

    createEffect(() => {
      const [cases, indices, group] = [
        this.cases(),
        [...untrack(this.indices)],
        untrack(this.group),
      ];

      if (!cases.length) return;
      if (group === TRANSIENT) {
        for (const cs of cases) indices[cs] = addTransient(indices[cs]);
      } else for (const cs of cases) indices[cs] = group;

      this.setIndices(indices);
    });
  }

  clearAll = () => this.setIndices(Array(this.n()).fill(G1));
  clearTransient = () => {
    const indices = [...untrack(this.indices)];
    for (let i = 0; i < indices.length; i++) {
      indices[i] = removeTransient(indices[i]);
    }

    this.setIndices(indices);
  };
}

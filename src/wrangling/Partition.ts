import Dataframe from "./Dataframe";
import Factor from "./Factor";
import FactorIndexMap from "./FactorIndexMap";
import { Dict, Just, Mapfn, Reducefn, Stackfn } from "../utils/types";
import { Accessor, Setter, createMemo, createSignal } from "solid-js";
import {
  diff,
  firstArgument,
  identity,
  POJO,
  secondArgument,
} from "../utils/funs";

export default class Partition {
  n: number;
  depth: number;
  parent?: Partition;
  parentParts: Accessor<Record<number, Dict>>;

  data: Accessor<Dataframe<Dict>>;
  factor: Accessor<Factor>;
  indexMap: FactorIndexMap;

  reduced: boolean;

  reducefn: Reducefn<any, any>;
  mapfn: Mapfn<any, any>;
  stackfn: Stackfn<any, any>;
  trackfn: Reducefn<any, any>;

  reduceInitial: Just<Dict>;
  stackInitial: Just<Dict>;
  trackInitial: Just<Dict>;

  partMeta: Accessor<Dict>;
  setPartMeta: Setter<Dict>;

  constructor(
    data: Accessor<Dataframe<Dict>>,
    factor: Accessor<Factor>,
    parent?: Partition
  ) {
    this.n = data().n;
    this.depth = (parent?.depth ?? -1) + 1;
    this.data = createMemo(data);
    this.factor = createMemo(factor);

    this.parent = parent;
    this.parentParts = parent
      ? createMemo(parent?.partsDict)
      : () => ({ 0: {} });
    this.indexMap = new FactorIndexMap(this.factor, this.parent?.factor);

    this.reduced = false;

    this.reducefn = secondArgument;
    this.mapfn = identity;
    this.stackfn = secondArgument;
    this.trackfn = firstArgument;

    this.reduceInitial = POJO;
    this.stackInitial = POJO;
    this.trackInitial = POJO;

    const [partMeta, setPartMeta] = createSignal({});
    this.partMeta = partMeta;
    this.setPartMeta = setPartMeta;
  }

  meta = () => ({ ...this.factor().meta, ...this.partMeta() });

  nest = (childFactor: Accessor<Factor>) => {
    const { data, factor } = this;

    const productFactor = () => Factor.product(factor(), childFactor());
    const childPartition = new Partition(data, productFactor, this);
    return childPartition;
  };

  reduceData = <T extends Dict, U extends Dict>(
    reducefn: Reducefn<T, U>,
    initialfn: () => U
  ) => {
    this.reducefn = reducefn;
    this.reduceInitial = initialfn;
    this.reduced = true;
    return this;
  };

  mapParts = <T extends Dict, U extends Dict>(mapfn: Mapfn<T, U>) => {
    this.mapfn = mapfn;
    return this;
  };

  stackParts = <T extends Dict, U extends Dict>(
    stackfn: Stackfn<T, U>,
    initialfn: Just<U>
  ) => {
    this.stackfn = stackfn;
    this.stackInitial = initialfn;
    return this;
  };

  trackParts = <T extends Dict, U extends Dict>(
    trackfn: Reducefn<T, U>,
    initialfn: Just<U>
  ) => {
    this.trackfn = trackfn;
    this.trackInitial = initialfn;
    return this;
  };

  parts = () => Object.values(this.partsDict());

  partsDict = () => {
    const { parent } = this;
    const [computed, factor] = [this.computed(), this.factor()];
    const { indexSet: partIndices, labels } = factor;
    const parentParts = parent ? parent.partsDict() : { 0: {} };

    const { mapfn, stackfn, trackfn, stackInitial, trackInitial } = this;
    const result: Record<number, Dict> = {};
    const stackSymbol = Symbol();

    if (!parent) {
      const part = mapfn({ ...computed[0], ...factor.labels[0] });
      this.setPartMeta(() => trackfn(trackInitial(), part));
      return { 0: part } as Record<number, Dict>;
    }

    let meta = trackInitial();

    for (const index of partIndices) {
      const parentPart = parentParts[this.parentIndex(index)];

      let part = mapfn(Object.assign({}, computed[index], labels[index]));
      Object.assign(part, factor.labels[index], { parent: parentPart });

      if (!(stackSymbol in parentPart)) {
        parentPart[stackSymbol] = stackInitial();
      }

      parentPart[stackSymbol] = stackfn(parentPart[stackSymbol], part);
      Object.assign(part, parentPart[stackSymbol]);
      meta = trackfn(meta, part);

      result[index] = part;
    }

    // Clean up stacking prop from parent parts
    for (const parentPart of Object.values(parentParts)) {
      delete parentPart[stackSymbol];
    }

    this.setPartMeta(meta);
    return result;
  };

  computed = () => {
    if (!this.reduced) return this.data().rows;

    const [data, factor] = [this.data(), this.factor()];
    const { reducefn, reduceInitial } = this;
    const result: Record<number, any> = {};

    for (let i = 0; i < factor.n; i++) {
      const index = factor.indexAt(i);
      if (!result[index]) result[index] = reduceInitial();
      result[index] = reducefn(result[index], data.row(i));
    }

    return result;
  };

  parentIndex = (partIndex: number) => this.indexMap.parentIndex(partIndex);
}

import Dataframe from "./Dataframe";
import FactorIndexMap from "./FactorIndexMap";
import { Dict, Mapfn, Reducefn, Stackfn } from "../utils/types";
import { Factor } from "./Factor";
import { Accessor, createMemo } from "solid-js";
import { firstArgument, identity, POJO, secondArgument } from "../utils/funs";

type Part = Record<string | symbol, any>;

export default class Partition<T extends Dict> {
  n: number;
  depth: number;
  parent?: Partition<any>;

  data: Accessor<Dataframe<T>>;
  factor: Accessor<Factor>;
  indexMap: FactorIndexMap;

  reduced: boolean;

  reducefn: Reducefn<Dict, Dict>;
  mapfn: Mapfn<Dict, Dict>;
  stackfn: Stackfn<Dict, Dict>;
  trackfn: Reducefn<Dict, Dict>;

  reduceInitial: () => Part;
  stackInitial: () => Part;
  trackInitial: () => Part;

  tracked: Part;

  constructor(
    data: Accessor<Dataframe<T>>,
    factor: Accessor<Factor>,
    parent?: Partition<any>
  ) {
    this.n = data().n;
    this.depth = (parent?.depth ?? -1) + 1;
    this.data = createMemo(data);
    this.factor = createMemo(factor);

    this.parent = parent;
    this.indexMap = new FactorIndexMap(factor, parent?.factor);

    this.reduced = false;

    this.reducefn = secondArgument;
    this.mapfn = identity;
    this.stackfn = secondArgument;
    this.trackfn = firstArgument;

    this.reduceInitial = POJO;
    this.stackInitial = POJO;
    this.trackInitial = POJO;

    this.tracked = {};
  }

  nest = (childFactor: Accessor<Factor>) => {
    const { data, factor } = this;

    const productFactor = () => Factor.product(factor(), childFactor());
    const childPartition = new Partition(data, productFactor, this);
    return childPartition;
  };

  reduceData = <T extends Part>(
    reducefn: Reducefn<Dict, Dict>,
    initialfn: () => T
  ) => {
    this.reducefn = reducefn;
    this.reduceInitial = initialfn;
    this.reduced = true;
    return this;
  };

  mapParts = (mapfn: Mapfn<Dict, Dict>) => {
    this.mapfn = (part: Record<string, any>) => {
      return { ...mapfn(part), parent: part.parent };
    };

    return this;
  };

  stackParts = (stackfn: Stackfn<Dict, Dict>, initialfn: () => Dict) => {
    this.stackfn = stackfn;
    this.stackInitial = initialfn;
    return this;
  };

  trackParts = (trackfn: Reducefn<Part, Part>, initialfn: () => Part) => {
    this.trackfn = trackfn;
    this.trackInitial = initialfn;
    return this;
  };

  parts = () => Object.values(this.partsDict());

  partsDict = () => {
    const [computed, factor] = [this.computed(), this.factor()];
    const { parent } = this;
    const partIndices = factor.indexSet;
    const parentParts = parent ? parent.partsDict() : { 0: {} };

    const { mapfn, stackfn, trackfn, stackInitial, trackInitial } = this;
    const result: Record<number, Part> = {};
    const stackKey = Symbol();

    if (!parent) {
      const part = mapfn({ ...computed[0], ...factor.labels[0] });
      const result: Record<number, Part> = { 0: part };
      this.tracked = trackfn(trackInitial(), result);
      return result;
    }

    this.tracked = trackInitial();

    for (const index of partIndices) {
      const parentPart = parentParts[this.parentIndex(index)];
      let part = mapfn({
        ...computed[index],
        ...factor.labels[index],
        parent: parentPart,
      });

      if (!(stackKey in parentPart)) parentPart[stackKey] = stackInitial();
      parentPart[stackKey] = stackfn(parentPart[stackKey], part);
      part = parentPart[stackKey];
      this.tracked = trackfn(this.tracked, part);

      result[index] = part;
    }

    // Clean up stacking prop from parent parts
    for (const parentPart of Object.values(parentParts)) {
      delete parentPart[stackKey];
    }

    return result;
  };

  computed = () => {
    const [data, factor] = [this.data(), this.factor()];
    const { reducefn, reduceInitial } = this;
    const result: Record<number, any> = {};

    if (!this.reduced) return data.rows;

    for (let i = 0; i < factor.n; i++) {
      const index = factor.indexAt(i);
      if (!result[index]) result[index] = reduceInitial();
      result[index] = reducefn(result[index], data.row(i));
    }

    return result;
  };

  parentIndex = (partIndex: number) => this.indexMap.parentIndex(partIndex);
}

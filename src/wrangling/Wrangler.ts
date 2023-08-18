import { Accessor, Setter, createMemo, createSignal } from "solid-js";
import { Dict, Just, Mapfn, Reducefn, Stackfn } from "../utils/types";
import Dataframe from "./Dataframe";
import Partition from "./Partition";
import Factor from "./Factor";
import { last } from "../utils/funs";
import { Marker } from "./Marker";

export type Getters<T extends Record<string, any>> = {
  [key in keyof T]: Accessor<T[key]>;
};

export default class Wrangler<
  T extends Record<string, Accessor<any>>,
  U extends Record<string, Setter<any>>
> {
  getters: T;
  setters: U;
  partitions: Partition[];

  constructor(getters: T, setters: U, partitions: Partition[]) {
    this.getters = getters;
    this.setters = setters;
    this.partitions = partitions;
  }

  static from = <T extends Dict, U extends Record<string, keyof T>>(
    data: Accessor<Dataframe<T>>,
    mapping: U,
    marker: Marker
  ) => {
    const singletonFactor = createMemo(() => Factor.singleton(data().n));
    const renamedData = createMemo(() => data().rename(mapping));

    const getters = {} as { [key in keyof U]: Accessor<T[U[key]][]> };
    const setters = {} as Dict;
    const partitions = [new Partition(renamedData, singletonFactor)];

    Object.assign(getters, { marker: marker.factor });

    for (const [varKey, dataKey] of Object.entries(mapping)) {
      const accessor = () => data().col(dataKey);
      Object.assign(getters, { [varKey]: accessor });
    }

    return new Wrangler(getters, setters, partitions);
  };

  partsAt = (depth: number) => this.partitions[depth].parts();

  update = () => {
    // Triggers the update of all reactive elements upstream
    last(this.partitions).parts();
    return this;
  };

  get = (key: keyof T) => this.getters[key]();

  set(key: keyof U, setfn: any): this;
  set(key: keyof U, setfn: (prev: any) => any): this;
  set(key: keyof U, setfn: any | ((prev: any) => any)) {
    this.setters[key](setfn);
    return this;
  }

  bind = <K extends string, V extends any>(
    key: K,
    bindfn: Mapfn<T, V>
  ): Wrangler<
    T & { [key in K]: Accessor<V> },
    U & { [key in K]: Setter<V> }
  > => {
    const { getters, setters, partitions } = this;

    // No args = initialize a signal
    if (!bindfn.length) {
      const [getter, setter] = createSignal(bindfn(getters));
      Object.assign(getters, { [key]: getter });
      Object.assign(setters, { [key]: setter });
      return new Wrangler(getters, setters, partitions);
    }

    // Else computed value
    Object.assign(getters, { [key]: () => bindfn(getters) });
    const newWrangler = new Wrangler(getters, setters, this.partitions);
    return newWrangler;
  };

  partitionBy = (...factorKeys: string[]) => {
    let parentPartition = last(this.partitions);

    for (const key of factorKeys) {
      const factor = this.getters[key];
      const childPartition = parentPartition.nest(factor);
      this.partitions.push(childPartition);
      parentPartition = childPartition;
    }

    return this;
  };

  reduceData = <T extends Dict, U extends Dict>(
    reducefn: Reducefn<T, U>,
    initialfn: () => U
  ) => {
    for (const partition of this.partitions) {
      partition.reduceData(reducefn, initialfn);
    }
    return this;
  };

  mapParts = <T extends Dict, U extends Dict>(mapfn: Mapfn<T, U>) => {
    for (const partition of this.partitions) partition.mapParts(mapfn);
    return this;
  };

  mapPartsAt = <T extends Dict, U extends Dict>(
    depth: number,
    mapfn: Mapfn<T, U>
  ) => {
    this.partitions[depth].mapParts(mapfn);
    return this;
  };

  stackParts = <T extends Dict, U extends Dict>(
    stackfn: Stackfn<T, U>,
    initialfn: Just<U>
  ) => {
    for (const partition of this.partitions) {
      partition.stackParts(stackfn, initialfn);
    }
    return this;
  };

  stackPartsAt = <T extends Dict, U extends Dict>(
    depth: number,
    stackfn: Stackfn<T, U>,
    initialfn: Just<U>
  ) => {
    this.partitions[depth].stackParts(stackfn, initialfn);
    return this;
  };

  trackParts = <T extends Dict, U extends Dict>(
    trackfn: Reducefn<T, U>,
    trackInitial: Just<U>
  ) => {
    for (const partition of this.partitions) {
      partition.trackParts(trackfn, trackInitial);
    }
    return this;
  };

  trackPartsAt = (
    depth: number,
    trackfn: Reducefn<any, any>,
    trackInitial: () => Record<string, any>
  ) => {
    this.partitions[depth].trackParts(trackfn, trackInitial);
    return this;
  };
}

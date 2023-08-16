import { Accessor, createMemo } from "solid-js";
import { Factor } from "./Factor";

const buildIndexMap = (child: Accessor<Factor>, parent: Accessor<Factor>) => {
  const { n, indices } = child();
  const parentIndices = parent().indices;
  const result: Record<number, number> = {};

  console.log("building indexmap");

  for (let i = 0; i < n; i++) {
    if (!(indices[i] in result)) result[indices[i]] = parentIndices[i];
  }

  return result;
};

export default class FactorIndexMap {
  child: Accessor<Factor>;
  parent?: Accessor<Factor>;
  indexMap?: Accessor<Record<number, number>>;

  constructor(child: Accessor<Factor>, parent?: Accessor<Factor>) {
    this.child = createMemo(child);
    this.parent = parent ? createMemo(parent) : undefined;
    if (!parent) return this;

    this.indexMap = createMemo(() => buildIndexMap(child, parent!));
  }

  parentIndex = (childIndex: number) => {
    const { parent, child } = this;

    if (!parent || parent().singleton) return 0;
    if (child().bijection) return parent().indices[childIndex];

    return this.indexMap!()[childIndex];
  };
}

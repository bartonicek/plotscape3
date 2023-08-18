import Plot from "../dom/Plot";
import Scene from "../dom/Scene";
import Points from "../representations.ts/Points";
import { Dict } from "../utils/types";
import Wrangler, { Getters } from "../wrangling/Wrangler";
import { partition2D } from "./wranglerWrappers";

export class ScatterPlot<T extends Dict> extends Plot<T> {
  constructor(scene: Scene<T>, mapping: Record<string, keyof T>) {
    super(scene, mapping);

    const wrangler = this.wrangler as Wrangler<
      Getters<{ v1: number[]; v2: number[] }>,
      {}
    >;

    partition2D(wrangler);

    console.log(this.wrangler.partitions[1].meta());

    const limits = this.wrangler.partitions[1].meta;
    const xMin = () => limits().xMin;
    const xMax = () => limits().xMax;
    const yMin = () => limits().yMin;
    const yMax = () => limits().yMax;

    for (const scale of Object.values(this.scales)) {
      scale.data.x.setDomainSignals!(xMin, xMax);
      scale.data.y.setDomainSignals!(yMin, yMax);
    }

    const points = new Points(this);
    this.addRepresentation(points);
  }
}
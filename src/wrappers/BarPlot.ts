import Plot, { PlotOptions } from "../dom/Plot";
import Scene from "../dom/Scene";
import Bars from "../representations/Bars";
import { Dict } from "../utils/types";
import Wrangler, { Getters } from "../wrangling/Wrangler";
import { countCat1d } from "./wranglingWrappers";
import { encodeBar } from "./encodingWrappers";

export class BarPlot<T extends Dict> extends Plot<T> {
  constructor(
    scene: Scene<T>,
    mapping: Record<string, keyof T>,
    options?: PlotOptions
  ) {
    super(scene, mapping, options);

    const wrangler = this.wrangler as Wrangler<Getters<{ v1: string[] }>, {}>;

    countCat1d(wrangler);
    encodeBar(wrangler);

    const limits = this.wrangler.partitions[1].meta;
    const xValues = () => limits().labels;
    const yMin = () => limits().yMin;
    const yMax = () => limits().yMax;

    for (const scale of Object.values(this.scales)) {
      scale.data.x.setValuesSignal(xValues);
      scale.data.y.setDomainSignals!(yMin, yMax);
    }

    const bars = new Bars(this);
    this.addRepresentation(bars);
  }
}

import { Accessor } from "solid-js";
import Plot, { PlotOptions } from "../dom/Plot";
import Scene from "../dom/Scene";
import Rectangles from "../representations.ts/Rectangles";
import { Dict } from "../utils/types";
import Wrangler, { Getters } from "../wrangling/Wrangler";
import { countBins1d, encodeHisto, encodeSpine } from "./wranglerWrappers";

export class HistoPlot<T extends Dict> extends Plot<T> {
  constructor(
    scene: Scene<T>,
    mapping: Record<string, keyof T>,
    options?: PlotOptions
  ) {
    super(scene, mapping, options);

    const wrangler = this.wrangler as Wrangler<Getters<{ v1: number[] }>, {}>;
    const defaults = this.defaults;

    countBins1d(wrangler, defaults);
    encodeHisto(wrangler);

    const limits = this.wrangler.partitions[1].meta;
    const xMin = () => limits().xMin;
    const xMax = () => limits().xMax;
    const yMin = () => limits().yMin;
    const yMax = () => limits().yMax;

    for (const scale of Object.values(this.scales)) {
      scale.data.x.setDomainSignals!(xMin, xMax);
      scale.data.y.setDomainSignals!(yMin, yMax);
    }

    let repSwitch = true;

    Object.assign(this.keyActions, {
      Equal: () => this.wrangler.set("width", (w: number) => (w * 11) / 10),
      Minus: () => this.wrangler.set("width", (w: number) => (w * 9) / 10),
      BracketRight: () => this.wrangler.set("anchor", (a: number) => a + 1),
      BracketLeft: () => this.wrangler.set("anchor", (a: number) => a - 1),
      KeyS: () => {
        repSwitch
          ? (encodeSpine(wrangler, defaults), (repSwitch = false))
          : (encodeHisto(wrangler), (repSwitch = true));
      },
    });

    const rects = new Rectangles(this);
    this.addRepresentation(rects);
  }
}

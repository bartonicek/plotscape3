import { Accessor, createEffect } from "solid-js";
import Plot, { PlotOptions } from "../dom/Plot";
import Scene from "../dom/Scene";
import Rectangles from "../representations.ts/Rectangles";
import { Dict } from "../utils/types";
import Wrangler, { Getters } from "../wrangling/Wrangler";
import { countBins1d } from "./wranglingWrappers";
import { encodeHisto, encodeSpine } from "./encodingWrappers";

const histo = (
  wrangler: Wrangler<any, any>,
  defaults: any,
  decorations: any
) => {
  encodeHisto(wrangler);
};

const spine = (
  wrangler: Wrangler<any, any>,
  defaults: any,
  decorations: any
) => {
  encodeSpine(wrangler, defaults);
  const meta = wrangler.partitions[1].meta;
  decorations[0].setValues(
    () => meta().count,
    () => meta().breaks
  );
};

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
    const breaks = () => limits().breaks;
    const counts = () => limits().count;

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
        if (repSwitch) {
          this.decorations[0].setValues(counts, breaks);
          encodeSpine(wrangler, defaults);
          console.log(counts(), breaks());
          repSwitch = false;
        } else {
          this.decorations[0].setValues(undefined, undefined);
          encodeHisto(wrangler);
          repSwitch = true;
        }
      },
    });

    const rects = new Rectangles(this);
    this.addRepresentation(rects);
  }
}

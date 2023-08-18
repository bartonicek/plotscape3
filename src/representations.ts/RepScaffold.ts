import Plot, { Contexts } from "../dom/Plot";
import { PlotStore } from "../dom/makePlotStore";
import { SceneStore } from "../dom/makeSceneStore";
import { Dict } from "../utils/types";
import Wrangler from "../wrangling/Wrangler";

export default class RepScaffold {
  wrangler: Wrangler<Dict>;
  scales: Dict;
  plotStore: PlotStore;
  sceneStore: SceneStore;
  contexts: Contexts;

  constructor(plot: Plot) {
    this.wrangler = plot.wrangler;
    this.scales = plot.scales.inner.data;
    this.plotStore = plot.store;
    this.sceneStore = plot.scene.store;
    this.contexts = plot.contexts;
  }

  partsAt = (depth: number) => this.wrangler.partsAt(depth);
  scaleX = <T>(x: T) => this.scales.x.pushforward(x);
  scaleY = <T>(y: T) => this.scales.y.pushforward(y);
}

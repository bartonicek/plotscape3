import { Accessor, createEffect, createMemo, on } from "solid-js";
import { Dict } from "../utils/types";
import Dataframe from "../wrangling/Dataframe";
import Wrangler from "../wrangling/Wrangler";
import Scene from "./Scene";
import html from "solid-js/html";
import { GROUPSARR, Marker } from "../wrangling/Marker";
import { makePlotStore } from "./makePlotStore";
import { makeCanvasContext } from "./makeCanvasContext";
import { Representation } from "../representations/Representation";
import {
  onContextmenu,
  onKeyDown,
  onMouseDown,
  onMouseMove,
  onMouseup,
  onResize,
} from "./plotEventHandlers";
import { throttle } from "../utils/funs";
import { PlotScales, makePlotScales } from "./makePlotScales";
import { AxisLabels } from "../decorations/AxisLabels";
import { PlotDefaults, makePlotDefaults } from "./makePlotDefaults";
import { AxisTitle } from "../decorations/AxisTitle";
import { clear } from "../utils/drawfuns";

export type Context =
  | "base"
  | "user"
  | "over"
  | 1
  | 2
  | 3
  | 4
  | 129
  | 130
  | 131
  | 132;
export type Contexts = Record<Context, CanvasRenderingContext2D>;
export type PlotOptions = { xTitle?: string; yTitle?: string };

export default class Plot<T extends Dict> {
  data: Accessor<Dataframe<Dict>>;
  scene: Scene<T>;

  container: HTMLDivElement;
  mapping: Record<string, keyof T>;
  defaults: PlotDefaults<string>;
  scales: PlotScales;

  store: ReturnType<typeof makePlotStore>;

  marker: Marker;
  wrangler: Wrangler<Dict, Dict>;

  contexts: Contexts;
  representations: Representation[];
  decorations: any[];

  keyActions: Record<string, () => void>;

  constructor(
    scene: Scene<T>,
    mapping: Record<string, keyof T>,
    options?: PlotOptions
  ) {
    const { data, marker } = scene;

    this.data = data;
    this.scene = scene;
    this.mapping = mapping;

    this.container = html`<div
      class="plotscape-container"
    />` as HTMLDivElement;
    scene.app.appendChild(this.container);

    this.store = makePlotStore();
    this.scales = makePlotScales(this.store);
    this.defaults = makePlotDefaults(this);

    this.wrangler = Wrangler.from(data, mapping, marker);
    this.marker = marker;
    this.representations = [];
    this.decorations = [];

    this.contexts = {} as Record<Context, CanvasRenderingContext2D>;

    for (const group of GROUPSARR) {
      const opts = { inner: true, classes: [group] };
      this.contexts[group as Context] = makeCanvasContext(this, opts);
    }

    const baseOpts = { inner: true, classes: ["base"] };
    const userOpts = { inner: true, classes: ["user"] };
    const overOpts = { inner: false, classes: ["over"] };

    this.contexts.base = makeCanvasContext(this, baseOpts);
    this.contexts.user = makeCanvasContext(this, userOpts);
    this.contexts.over = makeCanvasContext(this, overOpts);

    this.addDecoration(new AxisLabels(this, "x"));
    this.addDecoration(new AxisLabels(this, "y"));
    this.addDecoration(new AxisTitle(this, "x", options?.xTitle ?? "x"));
    this.addDecoration(new AxisTitle(this, "y", options?.yTitle ?? "y"));

    const { container } = this;

    createEffect(() => {
      container.addEventListener("mousedown", onMouseDown(this));
      container.addEventListener("mousemove", throttle(onMouseMove(this), 0));
      container.addEventListener("mouseup", onMouseup(this));
      container.addEventListener("contextmenu", onContextmenu(this));
      window.addEventListener("resize", throttle(onResize(this), 50));
      window.addEventListener("keydown", throttle(onKeyDown(this), 50));
    });

    this.keyActions = {
      KeyR: () => {
        this.store.setLabelInterval(1);
        this.store.setLabelCycle(0);
        for (const scale of Object.values(this.scales)) {
          scale.data.x.setExpand(-0.1, 1.1);
          scale.data.y.setExpand(-0.1, 1.1);
        }
      },
      KeyK: () => this.store.setLabelInterval((interval) => interval + 1),
      KeyL: () => this.store.setLabelCycle((cycle) => cycle + 1),
      KeyZ: () => {
        const { clickX, clickY, mouseX, mouseY } = this.store;

        const pctScales = this.scales.inner.pct;
        let [x0pct, x1pct] = [clickX(), mouseX()].map(pctScales.x.pullback);
        let [y0pct, y1pct] = [clickY(), mouseY()].map(pctScales.y.pullback);

        [x0pct, x1pct] = [Math.min(x0pct, x1pct), Math.max(x0pct, x1pct)];
        [y0pct, y1pct] = [Math.min(y0pct, y1pct), Math.max(y0pct, y1pct)];

        for (const scales of Object.values(this.scales)) {
          for (const scale of Object.values(scales)) {
            scale.x.setExpand(x0pct, x1pct);
            scale.y.setExpand(y0pct, y1pct);
          }
        }
      },
    };

    scene.addPlot(this);
  }

  resize = () => onResize(this)();

  activate = () => {
    this.store.setActive(true);
    this.container.classList.add("active");
  };

  deactivate = () => {
    this.store.setActive(false);
    this.container.classList.remove("active");
    clear(this.contexts.user);
  };

  addDecoration = (decoration: any) => {
    this.decorations.push(decoration);
    createEffect(decoration.draw);
  };

  addRepresentation = (representation: Representation) => {
    this.representations.push(representation);
    createEffect(representation.draw);
  };
}

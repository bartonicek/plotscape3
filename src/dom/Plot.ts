import { Accessor, createEffect, on } from "solid-js";
import { Dict } from "../utils/types";
import Dataframe from "../wrangling/Dataframe";
import Wrangler from "../wrangling/Wrangler";
import Scene from "./Scene";
import html from "solid-js/html";
import { GROUPSARR, Marker } from "../wrangling/Marker";
import { makePlotStore } from "./makePlotStore";
import { makeCanvasContext } from "./makeCanvasContext";
import { Representation } from "../representations.ts/Representation";
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

  constructor(scene: Scene<T>, mapping: Record<string, keyof T>) {
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

    const { container } = this;

    createEffect(() => {
      container.addEventListener("mousedown", onMouseDown(this));
      container.addEventListener("mousemove", throttle(onMouseMove(this), 30));
      container.addEventListener("mouseup", onMouseup(this));
      container.addEventListener("contextmenu", onContextmenu(this));
      window.addEventListener("resize", throttle(onResize(this), 50));
      window.addEventListener("keydown", throttle(onKeyDown(this), 50));
    });

    this.keyActions = {
      KeyR: () => {
        for (const scale of Object.values(this.scales)) {
          scale.data.x.setExpand(-0.1, 1.1);
          scale.data.y.setExpand(-0.1, 1.1);
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
  };

  addDecoration = (decoration: any) => {
    this.decorations.push(decoration);
    createEffect(decoration.draw);
  };

  addRepresentation = (representation: Representation) => {
    this.representations.push(representation);

    representation.draw();

    createEffect(representation.draw);

    const { clickX, clickY, mouseX, mouseY } = this.store;
    const { setSelectedCases } = this.scene.store;
    const selection = [clickX, clickY, mouseX, mouseY] as [
      Accessor<number>,
      Accessor<number>,
      Accessor<number>,
      Accessor<number>
    ];

    createEffect(
      on(selection, (selection) => {
        if (!this.store.holding() || this.store.rightButtonClicked()) return;
        setSelectedCases(representation.checkSelection(selection));
      })
    );
  };
}

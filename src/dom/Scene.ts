import { Accessor, createEffect } from "solid-js";
import Dataframe from "../wrangling/Dataframe";
import Plot from "./Plot";
import {
  onDoubleClick,
  onKeyDown,
  onKeyUp,
  onMousedown,
} from "./sceneEventHandlers";
import { makeSceneStore } from "./makeSceneStore";
import { Dict } from "../utils/types";
import { G3, G4, Marker } from "../wrangling/Marker";

export default class Scene<T extends Dict> {
  app: HTMLDivElement;
  data: Accessor<Dataframe<T>>;
  plots: Plot<T>[];

  store: ReturnType<typeof makeSceneStore>;
  marker: Marker;

  keyActions: Record<string, () => void>;

  constructor(app: HTMLDivElement, data: Accessor<Dataframe<T>>) {
    this.app = app;
    this.data = data;
    this.plots = [];

    this.store = makeSceneStore();
    this.marker = new Marker(
      () => data().n,
      this.store.selectedCases,
      this.store.group
    );

    this.app.classList.add("plotscape-scene");

    const n = () => data().n;
    const { selectedCases, group } = this.store;
    this.marker = new Marker(n, selectedCases, group);

    this.keyActions = {
      Digit1: () => this.store.setGroup(G3),
      Digit2: () => this.store.setGroup(G4),
    };

    createEffect(() => {
      this.app.addEventListener("mousedown", onMousedown(this));
      window.addEventListener("keydown", onKeyDown(this));
      window.addEventListener("keyup", onKeyUp(this));
      window.addEventListener("dblclick", onDoubleClick(this));
    });
  }

  setRowsCols = (rows: number, cols: number) => {
    document.documentElement.style.setProperty("--ncols", cols.toString());
    document.documentElement.style.setProperty("--nrows", rows.toString());
    this.plots.forEach((plot) => plot.resize());
  };

  addPlot = (plot: Plot<T>) => {
    this.plots.push(plot);

    const n = this.plots.length;
    const ncols = Math.ceil(Math.sqrt(n));
    const nrows = Math.ceil(n / ncols);

    this.setRowsCols(nrows, ncols);
  };
}

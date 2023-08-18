import { Accessor, Setter, createSignal } from "solid-js";
import Plot, { Context } from "../dom/Plot";
import graphicParameters from "../dom/graphicParameters";
import * as draw from "../utils/drawfuns";
import { rectOverlap } from "../utils/funs";
import { GROUPSARR } from "../wrangling/Marker";
import RepScaffold from "./RepScaffold";
import { Representation } from "./Representation";
import { Dict } from "../utils/types";

export default class Bars implements Representation {
  scaffold: RepScaffold;
  widthPct: Accessor<number>;
  setWidthPct: Setter<number>;

  constructor(plot: Plot<Dict>) {
    this.scaffold = new RepScaffold(plot);
    const [widthPct, setWidthPct] = createSignal(graphicParameters.width);
    this.widthPct = widthPct;
    this.setWidthPct = setWidthPct;
  }

  draw = () => {
    const { contexts, partsAt, scaleX, scaleY } = this.scaffold;
    const widthPct = this.widthPct();
    const parts = partsAt(2);

    const parentParts = partsAt(1);
    const width =
      (scaleX(parentParts[1].x) - scaleX(parentParts[0].x)) * widthPct;

    // Clear previous paints
    for (const layer of GROUPSARR) draw.clear(contexts[layer]);

    const transientOpts = {
      alpha: 0.75,
      color: graphicParameters.transientColour,
    };

    for (const part of parts) {
      const { x } = part.parent;
      const { y0, y1, layer, group, transient } = part;
      const context = contexts[layer as Context];

      const [x0s, x1s] = [-1, 1].map((e) => scaleX(x) + (e * width) / 2);
      const [y0s, y1s] = [y0, y1].map(scaleY);

      const color = graphicParameters.groupColours[group - 1];
      draw.rect(context, x0s, x1s, y0s, y1s, { alpha: 1, color });
      if (transient) draw.rect(context, x0s, x1s, y0s, y1s, transientOpts);
    }
  };

  checkSelection = (coords: [number, number, number, number]) => {
    const { partsAt, scaleX, scaleY } = this.scaffold;
    const parts = partsAt(1);
    const width = (scaleX(parts[1].x) - scaleX(parts[0].x)) * 0.8;

    const selX = [coords[0], coords[2]] as [number, number];
    const selY = [coords[1], coords[3]] as [number, number];
    const selectedCases: number[] = [];

    for (const part of parts) {
      const { x, y0, y1, cases } = part;

      const objX = [-1, 1].map((e) => scaleX(x) + (e * width) / 2) as [
        number,
        number
      ];
      const objY = [y0, y1].map(scaleY) as [number, number];
      if (rectOverlap(objX, objY, selX, selY)) selectedCases.push(...cases);
    }

    return selectedCases;
  };
}

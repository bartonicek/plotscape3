import Plot, { Context } from "../dom/Plot";
import graphicParameters from "../dom/graphicParameters";
import * as draw from "../utils/drawfuns";
import { rectOverlap } from "../utils/funs";
import { Dict } from "../utils/types";
import { GROUPSARR } from "../wrangling/Marker";
import RepScaffold from "./RepScaffold";
import { Representation } from "./Representation";

export default class Rectangles implements Representation {
  scaffold: RepScaffold;

  constructor(plot: Plot<Dict>) {
    this.scaffold = new RepScaffold(plot);
  }

  draw = () => {
    const { contexts, scaleX, scaleY, partsAt } = this.scaffold;
    const parts = partsAt(2);

    // Clear previous paints
    for (const layer of GROUPSARR) draw.clear(contexts[layer]);

    const transientOpts = {
      alpha: 0.75,
      color: graphicParameters.transientColour,
    };

    for (const part of parts) {
      const { x0, x1 } = part.parent;
      const { y0, y1, layer, group, transient } = part;

      const context = contexts[layer as Context];

      const [x0s, x1s] = [x0, x1].map(scaleX);
      const [y0s, y1s] = [y0, y1].map(scaleY);

      const color = graphicParameters.groupColours[group - 1];
      draw.rect(context, x0s, x1s, y0s, y1s, { alpha: 1, color });
      if (transient) draw.rect(context, x0s, x1s, y0s, y1s, transientOpts);
    }
  };

  checkSelection = (coords: [number, number, number, number]) => {
    const { partsAt, scaleX, scaleY } = this.scaffold;
    const parts = partsAt(1);

    const selX = [coords[0], coords[2]] as [number, number];
    const selY = [coords[1], coords[3]] as [number, number];
    const selectedCases: number[] = [];

    for (const part of parts) {
      const { x0, x1, y0, y1, cases } = part;
      const objX = [x0, x1].map(scaleX) as [number, number];
      const objY = [y0, y1].map(scaleY) as [number, number];
      if (rectOverlap(objX, objY, selX, selY)) selectedCases.push(...cases);
    }

    return selectedCases;
  };
}

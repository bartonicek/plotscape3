import { Accessor, Setter, createSignal } from "solid-js";
import Plot, { Context } from "../dom/Plot";
import graphicParameters from "../dom/graphicParameters";
import * as draw from "../utils/drawfuns";
import { rectOverlap } from "../utils/funs";
import { GROUPSARR } from "../wrangling/Marker";
import RepScaffold from "./RepScaffold";
import { Representation } from "./Representation";
import { Dict } from "../utils/types";

export default class Points implements Representation {
  scaffold: RepScaffold;
  radius: Accessor<number>;
  setRadius: Setter<number>;

  constructor(plot: Plot<Dict>) {
    this.scaffold = new RepScaffold(plot);
    const [radius, setRadius] = createSignal(graphicParameters.radius);
    this.radius = radius;
    this.setRadius = setRadius;
  }

  draw = () => {
    const { contexts, partsAt, scaleX, scaleY } = this.scaffold;
    const radius = this.radius();
    const parts = partsAt(2);

    // Clear previous paints
    for (const layer of GROUPSARR) draw.clear(contexts[layer]);

    const transientOpts = {
      alpha: 0.75,
      color: graphicParameters.transientColour,
      radius,
    };

    for (const part of parts) {
      const { x, y, layer, group, transient } = part;
      const context = contexts[layer as Context];

      const xs = scaleX(x);
      const ys = scaleY(y);

      const color = graphicParameters.groupColours[group - 1];
      draw.point(context, xs, ys, { alpha: 1, color, radius });
      if (transient) draw.point(context, xs, ys, transientOpts);
    }
  };

  checkSelection = (coords: [number, number, number, number]) => {
    const { partsAt, scaleX, scaleY } = this.scaffold;
    const parts = partsAt(1);
    const { radius } = graphicParameters;

    const selX = [coords[0], coords[2]] as [number, number];
    const selY = [coords[1], coords[3]] as [number, number];
    const selectedCases: number[] = [];

    for (let i = 0; i < parts.length; i++) {
      const { x, y } = parts[i];
      const objX = [-1, 1].map(
        (e) => scaleX(x) + (e * radius) / Math.sqrt(2)
      ) as [number, number];
      const objY = [-1, 1].map(
        (e) => scaleY(y) + (e * radius) / Math.sqrt(2)
      ) as [number, number];

      if (rectOverlap(objX, objY, selX, selY)) selectedCases.push(i);
    }

    return selectedCases;
  };
}

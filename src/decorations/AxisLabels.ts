import graphicParameters from "../dom/graphicParameters";
import Plot from "../dom/Plot";
import { ScaleData } from "../scales/ScaleData";
import { PlotStore } from "../dom/makePlotStore";
import { clear, text } from "../utils/drawfuns";
import { makeCanvasContext } from "../dom/makeCanvasContext";
import { Dict } from "../utils/types";
import { Accessor } from "solid-js";
import { round } from "../utils/funs";

const axisAlign = {
  x: {
    textBaseline: "top",
    textAlign: "center",
  },
  y: {
    textBaseline: "middle",
    textAlign: "right",
  },
} as const;

export class AxisLabels<T extends string | number> {
  at?: Accessor<T[]>;
  labels?: Accessor<T[]>;
  along: "x" | "y";
  tol: number;
  context: CanvasRenderingContext2D;
  scales: { x: ScaleData; y: ScaleData };
  store: PlotStore;

  constructor(plot: Plot<Dict>, along: "x" | "y") {
    this.along = along;
    this.tol = 0;
    this.context = makeCanvasContext(plot, {
      inner: false,
      classes: ["over"],
    });
    this.scales = plot.scales.outer.data;
    this.store = plot.store;
  }

  setValues = (at: Accessor<T[]>, labels: Accessor<T[]>) => {
    this.at = at;
    this.labels = labels;
  };

  // setTol = (tolerance: number) => {
  //   this.tol = tolerance;
  // };

  draw = () => {
    const { context, scales, along, tol, store } = this;

    const scale = scales[along];
    const at = this.at?.() ?? scale.breaks();
    let labels = this.labels?.() ?? scale.breaks();

    if (typeof labels[0] === "number") labels = labels.map(round(2));

    const { height, innerBottom, innerTop, innerLeft, innerRight } = store;
    const { fontsize } = graphicParameters;

    const yBase = height() - innerBottom() + graphicParameters.axisOffset;
    const xBase = innerLeft() - graphicParameters.axisOffset;

    clear(context);

    context.textBaseline = axisAlign[along].textBaseline;
    context.textAlign = axisAlign[along].textAlign;

    if (along === "x") {
      let [lastX, lastW] = [0, 0];

      for (let i = 0; i < at.length; i++) {
        if ((i + store.labelCycle()) % store.labelInterval() != 0) continue;

        const label = labels[i];
        const x = scale.pushforward(at[i]);
        const { width: w } = context.measureText(label);
        const wh = w / 2;

        if (x - wh < innerLeft() || x + wh > innerRight()) continue;
        if (lastX + lastW > x - w) continue;
        text(context, label, x, yBase, { fontsize });
        (lastX = x), (lastW = w);
      }
    } else if (along === "y") {
      for (let i = 0; i < at.length; i++) {
        const label = at[i].toString();
        const y = scale.pushforward(at[i]);
        const { actualBoundingBoxAscent: h } = context.measureText(label);
        const hh = h / 2;

        if (y - hh < innerBottom() || y + hh > innerTop()) continue;
        text(context, label, xBase, height() - y, { fontsize });
      }
    }
  };
}

import graphicParameters from "../dom/graphicParameters";
import Plot from "../dom/Plot";
import { ScaleData } from "../scales/ScaleData";
import { PlotStore } from "../dom/makePlotStore";
import { clear, text } from "../utils/drawfuns";
import { makeCanvasContext } from "../dom/makeCanvasContext";
import { Dict } from "../utils/types";

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

export class AxisLabels {
  along: "x" | "y";
  context: CanvasRenderingContext2D;
  scales: { x: ScaleData; y: ScaleData };
  store: PlotStore;

  constructor(plot: Plot<Dict>, along: "x" | "y") {
    this.along = along;
    this.context = makeCanvasContext(plot, {
      inner: false,
      classes: ["over"],
    });
    this.scales = plot.scales.outer.data;
    this.store = plot.store;
  }

  draw = () => {
    const { context, scales, along, store } = this;

    const scale = scales[along];
    const breaks = scale.breaks();

    const { height, innerBottom, innerTop, innerLeft, innerRight } = store;
    const { fontsize } = graphicParameters;

    const yBase = height() - innerBottom() + graphicParameters.axisOffset;
    const xBase = innerLeft() - graphicParameters.axisOffset;

    clear(context);

    context.textBaseline = axisAlign[along].textBaseline;
    context.textAlign = axisAlign[along].textAlign;

    if (along === "x") {
      let [lastX, lastW] = [0, 0];

      for (let i = 0; i < breaks.length; i++) {
        if ((i + store.labelCycle()) % store.labelInterval() != 0) continue;

        const label = breaks[i].toString();
        const x = scale.pushforward(breaks[i]);
        const { width: w } = context.measureText(label);

        if (x - w / 2 < innerLeft() || x + w / 2 > innerRight()) continue;
        if (lastX + lastW > x - w) continue;
        text(context, label, x, yBase, { fontsize });

        (lastX = x), (lastW = w);
      }
    } else if (along === "y") {
      for (let i = 0; i < breaks.length; i++) {
        const label = breaks[i].toString();
        const y = scale.pushforward(breaks[i]);
        const { actualBoundingBoxAscent: h } = context.measureText(label);

        if (y - h / 2 < innerBottom() || y + h / 2 > innerTop()) continue;
        text(context, label, xBase, height() - y, { fontsize });
      }
    }
  };
}

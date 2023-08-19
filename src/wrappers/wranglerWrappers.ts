import { Accessor } from "solid-js";
import { PlotDefaults } from "../dom/makePlotDefaults";
import { just } from "../utils/funs";
import { Dict } from "../utils/types";
import Factor from "../wrangling/Factor";
import Wrangler from "../wrangling/Wrangler";

const [min, max] = [true, true];

export const partition2D = (
  wrangler: Wrangler<{ v1: Accessor<number[]>; v2: Accessor<number[]> }, {}>
) => {
  wrangler
    .bind("factor1", ({ v1 }) => Factor.biject(v1(), { name: "x", min, max }))
    .bind("factor2", ({ v2 }) => Factor.biject(v2(), { name: "y", min, max }))
    .bind("factor3", ({ factor1, factor2 }) =>
      Factor.product(factor1(), factor2())
    )
    .partitionBy("factor3", "marker")
    .mapPartsAt(1, ({ v1, v2 }) => ({ x: v1, y: v2 }))
    .mapPartsAt(2, ({ parent }) => ({ x: parent.x, y: parent.y }))
    .update();
};

export const countBins1d = (
  wrangler: Wrangler<{ v1: Accessor<number[]> }, {}>,
  defaults: PlotDefaults<"v1">
) => {
  wrangler
    .bind("anchor", () => defaults.v1.min)
    .bind("width", () => defaults.v1.range / 20)
    .bind("bins", ({ v1, anchor, width }) =>
      Factor.bin(v1(), { name: "x", width: width(), anchor: anchor() })
    )
    .partitionBy("bins", "marker")
    .reduceData(
      ({ s1 }, {}) => ({ s1: s1 + 1 }),
      () => ({ s1: 0 })
    )
    .update();
};

export const countCat1d = (
  wrangler: Wrangler<{ v1: Accessor<(number | string)[]> }, {}>
) => {
  wrangler
    .bind("factor", ({ v1 }) => Factor.from(v1()))
    .partitionBy("factor", "marker")
    .reduceData(
      ({ s1 }, {}) => ({ s1: s1 + 1 }),
      () => ({ s1: 0 })
    )
    .update();
};

export const encodeHisto = (
  wrangler: Wrangler<{ v1: Accessor<number[]> }, {}>
) => {
  wrangler
    .mapParts(({ s1, binMin, binMax }) => ({
      x0: binMin,
      x1: binMax,
      y0: 0,
      y1: s1,
    }))
    .stackPartsAt(
      2,
      (parent, part) => ({ y0: parent.y1, y1: parent.y1 + part.y1 }),
      just({ y1: 0 })
    )
    .trackParts(
      ({ yMin, yMax }, { y0, y1 }) => ({
        yMin: Math.min(yMin, y0),
        yMax: Math.max(yMax, y1),
      }),
      just({ yMin: 0, yMax: -Infinity })
    )
    .update();
};

export const encodeSpine = (
  wrangler: Wrangler<{ v1: Accessor<number[]> }, {}>,
  defaults: PlotDefaults<"v1">
) => {
  //   wrangler
  //     .mapParts(({ s1 }) => ({
  //       x0: 0,
  //       x1: s1,
  //       y0: 0,
  //       y1: s1,
  //     }))
  //     .stackPartsAt(
  //       2,
  //       (parent, part) => ({ y0: parent.y0, y1: parent.y1 + part.y1 }),
  //       just({ y0: 0, y1: 0 })
  //     )
  //     .trackParts(
  //       ({ yMin, yMax }, { y0, y1 }) => ({
  //         yMin: Math.min(yMin, y0),
  //         yMax: Math.max(yMax, y1),
  //       }),
  //       just({ yMin: 0, yMax: -Infinity })
  //     )
  //     .update();
};

export const encodeBar = (
  wrangler: Wrangler<{ v1: Accessor<string[]> }, {}>
) => {
  wrangler
    .mapParts(({ label, s1 }) => ({ x: label, y0: 0, y1: s1 }))
    .stackPartsAt(
      2,
      (parent, part) => ({ y0: parent.y1, y1: parent.y1 + part.y1 }),
      just({ y1: 0 })
    )
    .trackParts(
      ({ yMin, yMax }, { y0, y1 }) => ({
        yMin: Math.min(yMin, y0),
        yMax: Math.max(yMax, y1),
      }),
      just({ yMin: 0, yMax: -Infinity })
    )
    .update();
};

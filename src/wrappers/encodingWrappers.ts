import { Accessor, createEffect } from "solid-js";
import Wrangler from "../wrangling/Wrangler";
import { just, justClone, secondArgument } from "../utils/funs";
import { PlotDefaults } from "../dom/makePlotDefaults";

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
    .stackPartsAt(1, secondArgument, () => ({}))
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
  wrangler
    .mapPartsAt(1, ({ s1 }) => ({
      x0: 0,
      x1: s1,
      y0: 0,
      y1: 1,
      s1,
    }))
    .mapPartsAt(2, ({ s1, parent }) => ({
      x0: parent.x0,
      x1: parent.x1,
      y0: 0,
      y1: s1 / parent.s1,
    }))
    .stackPartsAt(
      1,
      (parent, part) => ({ x0: parent.x1, x1: parent.x1 + part.x1 }),
      () => ({ x1: 0 })
    )
    .trackParts(({ xMin, xMax, yMin, yMax, count }, { x0, x1, y0, y1 }) => {
      const result = {
        xMin: Math.min(xMin, x0),
        xMax: Math.max(xMax, x1),
        yMin: Math.min(yMin, y0),
        yMax: Math.max(yMax, y1),
        count: count,
      };
      result.count.push(xMax);
      return result;
    }, justClone({ xMin: 0, xMax: 0, yMin: 0, yMax: -Infinity, count: [] }))
    .update();

  createEffect(() => {
    console.log(wrangler.partitions[1].meta());
  });
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

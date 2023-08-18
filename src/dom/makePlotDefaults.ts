import { sum } from "../utils/funs";
import { Dict } from "../utils/types";
import Plot from "./Plot";

type Summaries = {
  min: number;
  max: number;
  range: number;
  sum: number;
  mean: number;
};

export const makePlotDefaults = (plot: Plot<Dict>) => {
  const result = {} as Record<string, Summaries>;

  const data = plot.data();
  const mapping = plot.mapping;

  for (const [key1, key2] of Object.entries(mapping)) {
    const arr = data.col(key2 as string);
    const summaries = {} as Summaries;
    summaries.sum = arr.reduce(sum);
    summaries.mean = summaries.sum / arr.length;
    summaries.min = arr.reduce((a, b) => Math.min(a, b), Infinity);
    summaries.max = arr.reduce((a, b) => Math.max(a, b), -Infinity);
    summaries.range = summaries.max - summaries.min;
    result[key1] = summaries;
  }

  return result;
};

export type PlotDefaults<K extends string> = {
  [key in K]: Summaries;
};

import { ScaleContinuous } from "../scales/ScaleContinuous";
import { ScaleData } from "../scales/ScaleData";
import { ScaleIdentity } from "../scales/ScaleIdentity";
import { just } from "../utils/funs";
import { makePlotStore } from "./makePlotStore";

export const makePlotScales = (store: ReturnType<typeof makePlotStore>) => {
  const inner = {
    abs: {
      x: new ScaleIdentity(),
      y: new ScaleIdentity(),
    },
    pct: {
      x: new ScaleContinuous().setCodomainSignals(just(0), store.innerWidth),
      y: new ScaleContinuous().setCodomainSignals(just(0), store.innerHeight),
    },
    data: {
      x: new ScaleData().setCodomainSignals(just(0), store.innerWidth),
      y: new ScaleData().setCodomainSignals(just(0), store.innerHeight),
    },
  };

  const outer = {
    abs: {
      x: new ScaleIdentity(),
      y: new ScaleIdentity(),
    },
    pct: {
      x: new ScaleContinuous().setCodomainSignals(just(0), store.width),
      y: new ScaleContinuous().setCodomainSignals(just(0), store.height),
    },
    data: {
      x: new ScaleData().setCodomainSignals(store.innerLeft, store.innerRight),
      y: new ScaleData().setCodomainSignals(store.innerBottom, store.innerTop),
    },
  };

  return { inner, outer };
};

export type PlotScales = ReturnType<typeof makePlotScales>;

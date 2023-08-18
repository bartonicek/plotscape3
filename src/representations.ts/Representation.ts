import { Tuple4 } from "../types";

export type Representation = {
  draw: () => void;
  checkSelection: (selectionRect: Tuple4<number>) => number[];
};

import { Accessor } from "solid-js";
import { Expanse } from "./Expanse";

export type Scale = {
  domain: Expanse;
  codomain: Expanse;
  expand: Expanse;
  values: Accessor<string[]>;

  setExpand: (lower: number, upper: number) => void;
  updateExpand: (lower: number, upper: number) => void;

  pushforward: (value: any) => number;
  pullback: (value: number) => any;
  breaks: (n?: number) => any[];
};

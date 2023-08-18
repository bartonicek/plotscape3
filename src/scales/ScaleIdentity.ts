import { Accessor } from "solid-js";
import { Expanse } from "./Expanse";
import { Scale } from "./Scale";

export class ScaleIdentity implements Scale {
  hasBeenAssigned: boolean;

  domain: Expanse;
  codomain: Expanse;
  expand: Expanse;
  values: Accessor<string[]>;

  constructor() {
    this.hasBeenAssigned = true;
    this.domain = new Expanse(0, 1);
    this.codomain = new Expanse(0, 1);
    this.expand = new Expanse(0, 1);
    this.values = () => [];
  }

  setExpand = (lower: number, upper: number) => {
    this.expand.setLower(lower);
    this.expand.setUpper(upper);
    return this;
  };

  updateExpand = (lower: number, upper: number) => {
    this.expand.setLower((value) => value + lower);
    this.expand.setUpper((value) => value + upper);
    return this;
  };

  pushforward = (value: number) => value;
  pullback = (value: number) => value;
  breaks = () => [0, 1];
}

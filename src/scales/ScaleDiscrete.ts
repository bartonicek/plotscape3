import { Accessor, createMemo } from "solid-js";
import { sequenceInner } from "../utils/funs";
import { Expanse } from "./Expanse";
import { Scale } from "./Scale";

export class ScaleDiscrete implements Scale {
  domain: Expanse;
  codomain: Expanse;
  expand: Expanse;

  n: Accessor<number>;
  values: Accessor<string[]>;
  positions: Accessor<number[]>;

  constructor() {
    this.domain = new Expanse(0, 1);
    this.codomain = new Expanse(0, 1);
    this.expand = new Expanse(0, 1);

    this.values = () => [];
    this.n = () => this.values().length;
    this.positions = () => [];
  }

  pushforward = (value: string) => {
    const { normalizeInDomain, codomain } = this;
    return codomain.lower() + normalizeInDomain(value) * codomain.range();
  };

  pullback = (value: number) => {};

  breaks = () => {
    return this.values();
  };

  private normalizeInDomain = (value: string) => {
    const { values, positions, expand } = this;
    const position = positions()[values().indexOf(value)];
    return -expand.lower() + position / expand.range();
  };

  setValuesSignal = (values: Accessor<string[]>) => {
    const { domain, n } = this;
    this.values = createMemo(() => Array.from(new Set(values())).sort());
    this.positions = createMemo(() =>
      sequenceInner(domain.lower(), domain.upper(), n())
    );

    return this;
  };

  setCodomainSignals = (lower: Accessor<number>, upper: Accessor<number>) => {
    this.codomain.lower = createMemo(lower);
    this.codomain.upper = createMemo(upper);
    return this;
  };

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
}

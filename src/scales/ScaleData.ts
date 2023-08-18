import { Accessor } from "solid-js";
import { Expanse } from "./Expanse";
import { Scale } from "./Scale";
import { ScaleContinuous } from "./ScaleContinuous";
import { ScaleDiscrete } from "./ScaleDiscrete";
import { ScaleIdentity } from "./ScaleIdentity";

export class ScaleData implements Scale {
  hasBeenAssigned: boolean;

  scale: Scale;
  domain: Expanse;
  codomain: Expanse;
  expand: Expanse;
  values: Accessor<string[]>;

  constructor() {
    this.hasBeenAssigned = false;
    this.scale = new ScaleIdentity();
    this.domain = this.scale.domain;
    this.codomain = this.scale.codomain;
    this.expand = this.scale.expand;
    this.values = this.scale.values;
  }

  updateScale = () => {
    this.domain = this.scale.domain;
    this.codomain = this.scale.codomain;
    this.expand = this.scale.expand;
    this.values = this.scale.values;
  };

  pushforward = (value: any) => this.scale.pushforward(value);
  pullback = (value: number) => this.scale.pullback(value);
  breaks = (n = 4) => this.scale.breaks(n);

  setCodomainSignals = (lower: Accessor<number>, upper: Accessor<number>) => {
    this.codomain.lower = lower;
    this.codomain.upper = upper;
    return this;
  };

  // Setting domain changes scale to Continuous
  setDomainSignals = (lower: Accessor<number>, upper: Accessor<number>) => {
    if (this.hasBeenAssigned) {
      this.scale.domain.lower = lower;
      this.scale.domain.upper = upper;
      return this;
    }

    this.hasBeenAssigned = true;
    this.scale = new ScaleContinuous()
      .setExpand(-0.1, 1.1)
      .setDomainSignals(lower, upper)
      .setCodomainSignals(this.codomain.lower, this.codomain.upper);
    this.updateScale();
    return this;
  };

  // Setting values changes scale to Discrete
  setValuesSignal = (values: Accessor<string[]>) => {
    if (this.hasBeenAssigned) {
      this.scale.values = values;
      return this;
    }

    this.hasBeenAssigned = true;
    this.scale = new ScaleDiscrete()
      .setExpand(-0.1, 1.1)
      .setValuesSignal(values)
      .setCodomainSignals(this.codomain.lower, this.codomain.upper);
    this.updateScale();
    return this;
  };

  setExpand = (lower: number, upper: number) => {
    this.scale.setExpand(lower, upper);
    return this;
  };

  updateExpand = (lower: number, upper: number) => {
    this.scale.updateExpand(lower, upper);
    return this;
  };
}

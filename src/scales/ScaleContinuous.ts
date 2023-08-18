import { Accessor, createMemo } from "solid-js";
import { Expanse } from "./Expanse";
import { Scale } from "./Scale";

export class ScaleContinuous implements Scale {
  identity: boolean;
  domain: Expanse;
  codomain: Expanse;
  expand: Expanse;
  values: Accessor<string[]>;

  constructor() {
    this.identity = false;
    this.domain = new Expanse(0, 1);
    this.codomain = new Expanse(0, 1);
    this.expand = new Expanse(0, 1);
    this.values = () => [];
  }

  pushforward = (value: number) => {
    const { codomain, normalizeInDomain } = this;
    return Math.floor(
      codomain.lower() + normalizeInDomain(value) * codomain.range()
    );
  };

  pullback = (value: number) => {
    const { domain, codomain } = this;
    const codomainPct = (value - codomain.lower()) / codomain.range();
    return domain.lower() + codomainPct * domain.range();
  };

  breaks = (n = 4) => {
    const unitGross = this.domain.range() / n;
    const base = Math.floor(Math.log10(unitGross));

    const candidates = [1, 2, 4, 5, 10];
    let [minDist, neatValue] = [Infinity, 0];

    for (let i = 0; i < candidates.length; i++) {
      const dist = (candidates[i] * 10 ** base - unitGross) ** 2;
      if (dist < minDist) {
        [minDist, neatValue] = [dist, candidates[i]];
      }
    }

    const unitNeat = 10 ** base * neatValue;
    const { domain, expand } = this;

    const lower = domain.lower() + expand.lower() * domain.range();
    const upper = domain.upper() * expand.upper();

    const minNeat = Math.ceil(lower / unitNeat) * unitNeat;
    const maxNeat = Math.floor(upper / unitNeat) * unitNeat;

    const n2 = Math.round((maxNeat - minNeat) / unitNeat);
    const breaks = [parseFloat(minNeat.toFixed(4))];

    for (let i = 1; i < n2; i++) {
      const value = minNeat + i * unitNeat;
      breaks.push(parseFloat(value.toFixed(4)));
    }
    breaks.push(parseFloat(maxNeat.toFixed(4)));

    return breaks;
  };

  setDomainSignals = (lower: Accessor<number>, upper: Accessor<number>) => {
    this.domain.lower = createMemo(lower);
    this.domain.upper = createMemo(upper);
    return this;
  };

  setCodomainSignals = (lower: Accessor<number>, upper: Accessor<number>) => {
    this.codomain.lower = lower;
    this.codomain.upper = upper;
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

  private normalizeInDomain = (value: number) => {
    const { domain, expand } = this;
    const lower = domain.lower() + expand.lower() * domain.range();
    const range = domain.range() * expand.range();
    return (value - lower) / range;
  };
}

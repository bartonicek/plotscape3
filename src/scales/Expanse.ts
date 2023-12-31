import { Accessor, Setter, createMemo, createSignal } from "solid-js";

export class Expanse {
  lower: Accessor<number>;
  upper: Accessor<number>;
  setLower: Setter<number>;
  setUpper: Setter<number>;

  constructor(lower: number, upper: number) {
    const [lowerSignal, setLower] = createSignal(lower);
    const [upperSignal, setUpper] = createSignal(upper);
    this.lower = createMemo(lowerSignal);
    this.upper = createMemo(upperSignal);
    this.setLower = setLower;
    this.setUpper = setUpper;
  }

  setLowerSignal = (lower: Accessor<number>) => {
    this.lower = createMemo(lower);
  };

  setUpperSignal = (upper: Accessor<number>) => {
    this.upper = createMemo(upper);
  };

  range = () => {
    return this.upper() - this.lower();
  };
}

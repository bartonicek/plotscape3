import { Accessor, Setter, createMemo, createSignal } from "solid-js";
import { Dict } from "../utils/types";
import Dataframe from "./Dataframe";

export default class Wrangler<T extends Dict> {
  getters: Record<string, Accessor<any>>;
  setters: Record<string, Setter<any>>;

  constructor(data: Accessor<Dataframe<T>>, mapping: Record<string, keyof T>) {
    this.getters = {};
    this.setters = {};

    for (const [varKey, dataKey] of Object.entries(mapping)) {
      const accessor = () => data().col(dataKey);
      this.getters[varKey] = accessor;
    }
  }

  get = (key: string) => this.getters[key]();

  set(key: string, setfn: any): this;
  set(key: string, setfn: (prev: any) => any): this;
  set(key: string, setfn: any | ((prev: any) => any)) {
    this.setters[key](setfn);
    return this;
  }

  bind = <T>(
    key: string,
    bindfn: (getters: Record<string, Accessor<any>>) => T
  ) => {
    // No args = initialize a signal
    if (!bindfn.length) {
      const [getter, setter] = createSignal(bindfn(this.getters));
      this.getters[key] = getter;
      this.setters[key] = setter;
      return this;
    }

    // Else computed value
    this.getters[key] = () => bindfn(this.getters);
    return this;
  };
}

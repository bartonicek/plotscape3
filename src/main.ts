import { Accessor, createEffect, createSignal } from "solid-js";
import Dataframe from "./wrangling/Dataframe";
import Factor from "./wrangling/Factor";
import Wrangler from "./wrangling/Wrangler";
import FactorIndexMap from "./wrangling/FactorIndexMap";
import { Dict } from "./utils/types";

const x = Factor.from(["b", "a", "a", "c", "a"]);
const y = Factor.from(["M", "M", "F", "F", "M"]);
const w = Factor.singleton(5);
const z = Factor.product(x, w);

const data1 = Dataframe.fromCols({
  income: [1, 2, 3, 4],
  group: ["a", "b", "c", "d"],
});
const data2 = Dataframe.fromRows([
  { x: 1, y: "a" },
  { x: 2, y: "b" },
]);

const data3 = data2.rename({ lol: "x", lmao: "y" });

const dataAccessor = () => data1;
const mapping = {
  v1: "group",
  v2: "income",
} as const;

const wrangler1 = new Wrangler(dataAccessor, mapping)
  .bind("anchor", () => 0)
  .bind("width", () => 0.5)
  .bind("bins", ({ width, anchor, v2 }) =>
    Factor.bin(v2(), { anchor: anchor(), width: width() })
  );

createEffect(() => {
  console.log(wrangler1.get("bins").labels);
});

wrangler1.set("width", 1);

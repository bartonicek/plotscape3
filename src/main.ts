import "./styles.css";
import Scene from "./dom/Scene";
import { loadJSON } from "./utils/funs";
import Dataframe from "./wrangling/Dataframe";
import { HistoPlot } from "./wrappers/HistoPlot";
import { Accessor, createRoot, createSignal } from "solid-js";
import Wrangler from "./wrangling/Wrangler";
import { Just } from "./utils/types";
import { LABELSDICT } from "./wrangling/Marker";
import { BarPlot } from "./wrappers/BarPlot";
import { ScatterPlot } from "./wrappers/Scatterplot";
import { convertCompilerOptionsFromJson } from "typescript";

type DataMpg = {
  manufacturer: string[];
  model: string[];
  displ: number[];
  year: number[];
  cyl: number[];
  class: string[];
  trans: string[];
  drv: string[];
  hwy: number[];
  cty: number[];
};

const mpg: DataMpg = await loadJSON("./testData/mpg.json");
const diamonds = await loadJSON("./testData/diamonds.json");

// const n = diamonds[Object.keys(diamonds)[0]].length;
// const prop = 0.1;

// const indices = Array.from(Array(n), (_, i) =>
//   Math.random() < prop ? i : undefined
// ).filter((e) => e);

// const diamonds2 = {} as Record<string, any[]>;
// for (let [key, col] of Object.entries(diamonds)) {
//   diamonds2[key] = col.filter((_, i) => indices.indexOf(i) > 0);
// }

const dataMpg = () => Dataframe.fromCols(mpg);
// const dataDiamonds = () => Dataframe.fromCols(diamonds2);
const app = document.querySelector("#app") as HTMLDivElement;

console.log(mpg);

createRoot(() => {
  const scene1 = new Scene(app, dataMpg);
  const plot1 = new HistoPlot(
    scene1,
    { v1: "hwy" },
    { xTitle: "Mileage", yTitle: "Count" }
  );

  const plot2 = new HistoPlot(
    scene1,
    { v1: "displ" },
    { xTitle: "Engine size", yTitle: "Count" }
  );
  const plot3 = new BarPlot(
    scene1,
    { v1: "drv" },
    { xTitle: "Drive", yTitle: "Count" }
  );
  const plot4 = new ScatterPlot(
    scene1,
    { v1: "displ", v2: "hwy" },
    { xTitle: "Engine size", yTitle: "Mileage" }
  );
  scene1.setRowsCols(2, 2);

  // const scene2 = new Scene(app, dataDiamonds);
  // const plot21 = new ScatterPlot(scene2, { v1: "carat", v2: "price" });
  // const plot23 = new BarPlot(scene2, { v1: "color" });
});

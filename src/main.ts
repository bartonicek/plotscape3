import { createRoot } from "solid-js";
import Scene from "./dom/Scene";
import "./styles.css";
import { loadJSON } from "./utils/funs";
import Dataframe from "./wrangling/Dataframe";
import { GROUPSARR, GROUPSDICT } from "./wrangling/Marker";
import { BarPlot } from "./wrappers/BarPlot";
import { HistoPlot } from "./wrappers/HistoPlot";
import { ScatterPlot } from "./wrappers/Scatterplot";

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
// const diamonds = await loadJSON("./testData/diamonds.json");

// const n = diamonds[Object.keys(diamonds)[0]].length;
// const prop = 0.2;

// const indices = Array.from(Array(n), (_, i) =>
//   Math.random() < prop ? i : undefined
// ).filter((e) => e);

// const diamonds2 = {} as Record<string, any[]>;
// for (let [key, col] of Object.entries(diamonds)) {
//   diamonds2[key] = col.filter((_, i) => indices.indexOf(i) > 0);
// }
// const dataDiamonds = () => Dataframe.fromCols(diamonds2);

const dataMpg = () => Dataframe.fromCols(mpg);
const app = document.querySelector("#app") as HTMLDivElement;

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
    { v1: "manufacturer" },
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
  // const plot33 = new HistoPlot(scene2, { v1: "price" });
});

console.log(GROUPSARR);
console.log(GROUPSDICT);

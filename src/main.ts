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

const dataMpg = () => Dataframe.fromCols(mpg);
const dataDiamonds = () => Dataframe.fromCols(diamonds);

const app = document.querySelector("#app") as HTMLDivElement;

createRoot(() => {
  const scene1 = new Scene(app, dataMpg);
  const plot1 = new HistoPlot(scene1, { v1: "hwy" });
  const plot2 = new HistoPlot(scene1, { v1: "displ" });
  const plot3 = new BarPlot(scene1, { v1: "manufacturer" });
  const plot4 = new ScatterPlot(scene1, { v1: "displ", v2: "hwy" });
  scene1.setRowsCols(2, 2);

  // const scene2 = new Scene(app, dataDiamonds);
  // const plot21 = new ScatterPlot(scene2, { v1: "carat", v2: "price" });
  // const plot23 = new BarPlot(scene2, { v1: "color" });
});

console.log(LABELSDICT);

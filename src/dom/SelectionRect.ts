import { Accessor } from "solid-js";
import { PlotStore } from "./makePlotStore";
import { Representation } from "../representations/Representation";

// TODO

export default class SelectionRect {
  clickX: Accessor<number>;
  clickY: Accessor<number>;
  mouseX: Accessor<number>;
  mouseY: Accessor<number>;

  constructor(
    store: PlotStore,
    context: CanvasRenderingContext2D,
    representations: Representation[]
  ) {
    this.clickX = store.clickX;
    this.clickY = store.clickY;
    this.mouseX = store.mouseX;
    this.mouseY = store.mouseY;
  }

  drawAndCheck = () => {
    const [x0, y0, x1, y1] = [
      this.clickX(),
      this.clickY(),
      this.mouseX(),
      this.mouseY(),
    ];
  };
}

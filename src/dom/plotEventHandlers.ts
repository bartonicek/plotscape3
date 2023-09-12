import { batch } from "solid-js";
import { clear, rect } from "../utils/drawfuns";
import { call, toInt } from "../utils/funs";
import { Dict } from "../utils/types";
import Plot from "./Plot";

export const onResize = (plot: Plot<Dict>) => () => {
  const { setWidth, setHeight } = plot.store;
  setWidth(toInt(getComputedStyle(plot.container)["width"]));
  setHeight(toInt(getComputedStyle(plot.container)["height"]));
  plot.representations.forEach((representation) => representation.draw());
  plot.decorations.forEach((decoration) => decoration.draw());
};

export const onMouseDown = (plot: Plot<Dict>) => (event: MouseEvent) => {
  const {
    height,
    marginBottom,
    marginLeft,
    setHolding,
    setClickX,
    setClickY,
    setMouseX,
    setMouseY,
  } = plot.store;

  plot.scene.plots.forEach((plot) => plot.deactivate());
  plot.scene.marker.clearTransient();
  plot.activate();

  const x = event.offsetX - marginLeft();
  const y = height() - event.offsetY - marginBottom();

  setHolding(true);
  batch(() => {
    setClickX(x), setClickY(y), setMouseX(x), setMouseY(y);
  });

  const { setSelectedCases } = plot.scene.store;

  plot.representations.forEach((rep) =>
    setSelectedCases(rep.checkSelection([x, y, x, y]))
  );
};

// Right click
export const onContextmenu = (plot: Plot<Dict>) => (event: MouseEvent) => {
  plot.store.setRightButtonClicked(true);
  event.preventDefault();
};

export const onMouseup = (plot: Plot<Dict>) => () => {
  plot.store.setRightButtonClicked(false);
  plot.store.setHolding(false);
};

export const onMouseMove = (plot: Plot<Dict>) => (event: MouseEvent) => {
  if (!plot.store.holding()) return;

  const { height, marginLeft, marginBottom, setMouseX, setMouseY } = plot.store;
  const x = event.offsetX - marginLeft();
  const y = height() - event.offsetY - marginBottom();

  if (plot.store.rightButtonClicked()) {
    const { mouseX, mouseY, width, height } = plot.store;

    const xMove = (mouseX() - x) / width();
    const yMove = (mouseY() - y) / height();

    for (const scale of Object.values(plot.scales)) {
      scale.data.x.updateExpand(xMove, xMove);
      scale.data.y.updateExpand(yMove, yMove);
    }

    batch(() => {
      setMouseX(x), setMouseY(y);
    });

    return;
  }

  // Draw the selection rectangle
  const { clickX, clickY, mouseX, mouseY } = plot.store;
  const [x0, x1, y0, y1] = [clickX, mouseX, clickY, mouseY].map(call);

  clear(plot.contexts.user);
  rect(plot.contexts.user, x0, x1, y0, y1, { alpha: 0.25 });

  plot.scene.marker.clearTransient();

  batch(() => {
    setMouseX(x);
    setMouseY(y);
  });

  const { setSelectedCases } = plot.scene.store;

  plot.representations.forEach((rep) =>
    setSelectedCases(rep.checkSelection([x0, y0, x1, y1]))
  );
};

export const onKeyDown = (plot: Plot<Dict>) => (event: KeyboardEvent) => {
  if (!plot.store.active()) return;

  const key = event.code;
  plot.keyActions[key]?.();
};

import { clear } from "../utils/drawfuns";
import { Dict } from "../utils/types";
import { TRANSIENT } from "../wrangling/Marker";
import Scene from "./Scene";

export const onDoubleClick = (scene: Scene<Dict>) => () => {
  scene.plots.forEach((plot) => plot.deactivate());
  scene.marker.clearAll();
  scene.store.setGroup(TRANSIENT);
  scene.store.setSelectedCases([]);
};

const isScene = (target: Element) => {
  return target.classList.contains("plotscape-scene");
};

export const onMousedown = (scene: Scene<Dict>) => (event: MouseEvent) => {
  const target = event.target;
  scene.plots.forEach((plot) => clear(plot.contexts.user)); // Clear drag rectangles

  // Only deactivate if clicked outside of any plot area
  if (target instanceof Element && isScene(target)) {
    scene.plots.forEach((plot) => plot.deactivate());
  }
};

export const onKeyDown = (scene: Scene<Dict>) => (event: KeyboardEvent) => {
  const key = event.code;
  scene.keyActions[key]?.();
};

export const onKeyUp = (scene: Scene<Dict>) => () => {
  scene.store.setGroup(128);
};

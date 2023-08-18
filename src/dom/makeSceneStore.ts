import { createSignal } from "solid-js";

export const makeSceneStore = () => {
  const [group, setGroup] = createSignal(128);
  const [selectedCases, setSelectedCases] = createSignal<number[]>([]);

  return { group, selectedCases, setGroup, setSelectedCases };
};

export type SceneStore = ReturnType<typeof makeSceneStore>;

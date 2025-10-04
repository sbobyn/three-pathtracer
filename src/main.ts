import PtRenderer from "./pathtracer/PtRenderer";
import PtGui from "./pathtracer/PtGui";
import PresetPtScenes from "./pathtracer/PresetPtScenes";

const canvas = document.createElement("canvas");
canvas.classList.add("webgl");
document.querySelector("#app")?.appendChild(canvas);

// Set up scene objects

// const ptScene = PresetPtScenes.createRTIOWSimpleScene();
const ptScene = PresetPtScenes.createRTIOWPart1FinalScene();
const ptRenderer = new PtRenderer(canvas, ptScene);
const ptGui = new PtGui(ptRenderer, ptScene);

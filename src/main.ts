import Router from "./router";
import GUI from "lil-gui";
import * as THREE from "three";
import { initRootGUI, clearSketchFolder } from "./core/guiManager";

const container = document.querySelector("#app") as HTMLElement;
let currentRenderer: THREE.WebGLRenderer | null = null;

const gui = new GUI({ title: "Sketchbook" });
initRootGUI(gui);

const sketches = import.meta.glob("./sketches/**/*.ts", {
  eager: true,
}) as Record<
  string,
  { default: (container: HTMLElement) => THREE.WebGLRenderer }
>;

// Extract sketch names from paths (./sketches/foo.ts -> foo)
const sketchNames = Object.keys(sketches).map((path) =>
  path.replace("./sketches/", "").replace(".ts", "")
);

const params = { sketch: sketchNames[0] };

const controller = gui.add(params, "sketch", sketchNames).name("Select Sketch");

const router = new Router((path: string) => {
  let sketchName = path.replace(/^\/?sketches\//, "");

  //  If we end up with "/" or empty string, load last sketch or first sketch
  if (sketchName === "/" || sketchName === "") {
    sketchName = localStorage.getItem("lastSketch") || sketchNames[0];
  }

  switchSketch(sketchName);
});

controller.onChange((name: string) => router.navigate(`/sketches/${name}`));

function switchSketch(sketchName: string) {
  if (currentRenderer) {
    currentRenderer.setAnimationLoop(null);
    currentRenderer.dispose();
    currentRenderer.domElement.remove();
    currentRenderer = null;
  }

  clearSketchFolder(); // 🆕 remove old sketch controls

  container.innerHTML = "";

  const mod = sketches[`./sketches/${sketchName}.ts`];
  if (!mod) {
    console.warn(`Sketch not found: ${sketchName}`);
    return;
  }

  currentRenderer = mod.default(container);
  localStorage.setItem("lastSketch", sketchName);

  controller.setValue(sketchName);
}

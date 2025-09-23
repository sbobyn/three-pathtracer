import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function setupScene({
  camera,
  enableOrbitControls = true,
  clearColor = 0x202020,
}: {
  camera: THREE.Camera;
  enableOrbitControls?: boolean;
  clearColor?: number;
}): {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  controls?: OrbitControls;
} {
  const canvas = document.createElement("canvas");
  canvas.classList.add("webgl");
  document.querySelector("#app")?.appendChild(canvas);

  const scene = new THREE.Scene();

  let controls: OrbitControls | undefined = undefined;
  if (enableOrbitControls) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(clearColor);

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  return { scene, renderer, camera, controls };
}

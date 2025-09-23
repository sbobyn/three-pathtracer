import * as THREE from "three";

import vertShaderSource from "./shaders/vertex.glsl";
import fragShaderSource from "./shaders/fragment.glsl";

import { setupScene } from "../core/setupScene";
import { createFullScreenPerspectiveCamera } from "../core/createFullscreenCamera";
// import { createFullScreenOrthographicCamera } from "./core/createFullscreenCamera";
import { setupStats } from "../core/setupStats";

import { createSketchFolder } from "../core/guiManager";

export default function (): THREE.WebGLRenderer {
  const camera = createFullScreenPerspectiveCamera();
  // const camera = createFullScreenOrthographicCamera();

  const { scene, renderer, controls } = setupScene({ camera });
  // const { scene, renderer } = setupScene({camera}); // without orbit controls

  const axesHelper = new THREE.AxesHelper(1);
  scene.add(axesHelper);

  const gridHelper = new THREE.GridHelper(2, 4);
  gridHelper.position.y = 0.01;
  scene.add(gridHelper);

  let geometry = new THREE.PlaneGeometry(1, 1, 32, 32);

  const debugObject = {
    depthColor: "#186691",
    surfaceColor: "#9bd8ff",
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertShaderSource,
    fragmentShader: fragShaderSource,
    uniforms: {
      uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
      uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
      uTime: { value: 0 },
    },
    wireframe: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(2, 2, 1);
  mesh.rotation.x = -Math.PI / 2;

  scene.add(mesh);

  const folder = createSketchFolder();
  folder.addColor(debugObject, "depthColor").onChange(() => {
    material.uniforms.uDepthColor.value.set(debugObject.depthColor);
  });
  folder.addColor(debugObject, "surfaceColor").onChange(() => {
    material.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor);
  });

  const clock = new THREE.Clock();
  const stats = setupStats();

  renderer.setAnimationLoop(() => {
    stats.begin();
    material.uniforms.uTime.value = clock.getElapsedTime();
    controls?.update();
    renderer.render(scene, camera);
    stats.end();
  });

  // simplify without stats and orbit controls if wanted
  // renderer.setAnimationLoop(() => {
  //   material.uniforms.uTime.value = clock.getElapsedTime();
  //   renderer.render(scene, camera);
  // });

  return renderer;
}

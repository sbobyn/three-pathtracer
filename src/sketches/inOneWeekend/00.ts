import * as THREE from "three";
import { ShaderCanvas } from "../../core/ShaderCanvas";
import { setupScene } from "../../core/setupScene";
import fragShader from "./shaders/main.fs";
import { createFullScreenPerspectiveCamera } from "../../core/createFullscreenCamera";

export default function (): THREE.WebGLRenderer {
  // Three.js Scene
  const camera = createFullScreenPerspectiveCamera({
    position: new THREE.Vector3(0, 0.5, 2),
    lookAt: new THREE.Vector3(0, 0.5, 0),
  });

  const canvas = document.createElement("canvas");
  canvas.classList.add("webgl");
  document.querySelector("#app")?.appendChild(canvas);

  const { scene, renderer, controls } = setupScene({
    canvas: canvas,
    camera: camera,
    enableOrbitControls: true,
  });

  // Raytracing Canvas
  const invViewProj = new THREE.Matrix4();
  const uniforms = {
    uCameraPosition: { value: camera.position },
    uInvViewProjMatrix: { value: invViewProj },
  };
  const shaderDemo = new ShaderCanvas({
    canvas: canvas,
    fragmentShader: fragShader,
    uniforms: uniforms,
  });

  renderer.setAnimationLoop(() => {
    // update controls
    controls?.update();
    // need to update camera matrices since Three.js only does it during renderer.render()
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // update camera-related uniforms
    uniforms.uCameraPosition.value.copy(camera.position);

    invViewProj
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .invert();

    uniforms.uInvViewProjMatrix.value.copy(invViewProj);

    shaderDemo.render();
  });

  return shaderDemo.getRenderer();
}

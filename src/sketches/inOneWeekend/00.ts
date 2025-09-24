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

  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward).normalize();
  const cameraUp = camera.up.clone();
  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraForward, cameraUp).normalize();

  const worldUp = new THREE.Vector3(0, 1, 0);

  const uniforms = {
    uCameraPosition: { value: camera.position },
    uCameraUp: { value: cameraUp },
    uCameraForward: {
      value: cameraForward,
    },
    uCameraRight: { value: cameraRight },
  };
  const shaderDemo = new ShaderCanvas({
    canvas: canvas,
    fragmentShader: fragShader,
    uniforms: uniforms,
  });

  renderer.setAnimationLoop(() => {
    controls?.update();
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    uniforms.uCameraPosition.value.copy(camera.position);

    camera.getWorldDirection(cameraForward).normalize();
    cameraRight.crossVectors(cameraForward, worldUp).normalize();
    cameraUp.crossVectors(cameraRight, cameraForward).normalize();

    shaderDemo.render();
  });

  return shaderDemo.getRenderer();
}

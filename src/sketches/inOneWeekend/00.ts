import * as THREE from "three";
import { ShaderCanvas } from "../../core/ShaderCanvas";
import { setupScene } from "../../core/setupScene";
import fragShader from "./shaders/main.fs";
import { createFullScreenPerspectiveCamera } from "../../core/createFullscreenCamera";
import { createSketchFolder } from "../../core/guiManager";

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

  // Sphere sphere1 = Sphere(vec3(0, 0, 0), 0.5);
  // Sphere sphere2 = Sphere(vec3(0.0, -100.5, 0), 100.);

  const maxNumSpheres = 100;

  const sphere1 = {
    position: new THREE.Vector3(0, 0, 0),
    radius: 0.5,
  };
  const sphere2 = {
    position: new THREE.Vector3(0, -100.5, 0),
    radius: 100.0,
  };

  const spheres = [sphere1, sphere2];
  const numSpheres = 2;

  const folder = createSketchFolder("Spheres");
  const sphereFolder = folder.addFolder("Sphere  1");
  sphereFolder.add(sphere1.position, "x", -5, 5, 0.1);
  sphereFolder.add(sphere1.position, "y", -5, 5, 0.1);
  sphereFolder.add(sphere1.position, "z", -5, 5, 0.1);
  sphereFolder.add(sphere1, "radius", 0.1, 5, 0.1);
  sphereFolder.open();

  for (let i = spheres.length; i < maxNumSpheres; i++) {
    spheres.push({
      position: new THREE.Vector3(),
      radius: 0,
    });
  }

  const uniforms = {
    uCamera: {
      value: {
        position: camera.position,
        up: cameraUp,
        forward: cameraForward,
        right: cameraRight,
      },
    },
    uWorld: {
      value: {
        spheres: spheres,
        numSpheres: numSpheres,
      },
    },
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

    camera.getWorldDirection(cameraForward).normalize();
    cameraRight.crossVectors(cameraForward, worldUp).normalize();
    cameraUp.crossVectors(cameraRight, cameraForward).normalize();

    shaderDemo.render();
  });

  return shaderDemo.getRenderer();
}

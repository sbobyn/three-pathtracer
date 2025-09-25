import * as THREE from "three";
import { ShaderCanvas } from "../../core/ShaderCanvas";
import { setupScene } from "../../core/setupScene";
import fragShader from "./shaders/main.fs";
import { createFullScreenPerspectiveCamera } from "../../core/createFullscreenCamera";
import { createSketchFolder } from "../../core/guiManager";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { OutlinePass } from "three/examples/jsm/Addons.js";
import { TransformControls } from "three/examples/jsm/Addons.js";

const objectSpaceNormalMaterial = new THREE.ShaderMaterial({
  vertexShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      void main() {
        gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
      }
    `,
});

export default function (): THREE.WebGLRenderer {
  // Three.js Scene
  const camera = createFullScreenPerspectiveCamera({
    position: new THREE.Vector3(0, 0.5, 2),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    far: 10000,
  });

  const canvas = document.createElement("canvas");
  canvas.classList.add("webgl");
  document.querySelector("#app")?.appendChild(canvas);

  const { scene, renderer, controls } = setupScene({
    canvas: canvas,
    camera: camera,
    enableOrbitControls: true,
  });

  renderer.shadowMap.enabled = true;

  const skyColor = new THREE.Color(0xbcd7ff); // Sky blue background
  scene.background = skyColor;

  // Raytracing Canvas

  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward).normalize();
  const cameraUp = camera.up.clone();
  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraForward, cameraUp).normalize();

  const worldUp = new THREE.Vector3(0, 1, 0);

  const maxNumSpheres = 100;

  scene.add(new THREE.AmbientLight(skyColor, 0.5));
  const dirLight = new THREE.DirectionalLight(skyColor, 2);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const sphere1Geometry = new THREE.SphereGeometry(0.5);
  const sphere1Material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.5, 0.5, 0.5),
  });
  const sphere1 = new THREE.Mesh(sphere1Geometry, sphere1Material);
  sphere1.castShadow = true;
  sphere1.position.set(0, 0, 0);

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });
  transformControls.mode = "translate";

  transformControls.addEventListener("change", () => {
    if (transformControls.mode === "scale") {
      const scale = selectedObject.scale.x;
      selectedObject.scale.set(scale, scale, scale);
      spheres[selectedObject.index].radius =
        scale * selectedObject.geometry.parameters.radius;
      settings.selectedRadius = spheres[selectedObject.index].radius;
      selectedRadiusGUI.updateDisplay();
    } else {
      settings.selectedPosition.copy(selectedObject.position);
      selectedPositionXGUI.updateDisplay();
      selectedPositionYGUI.updateDisplay();
      selectedPositionZGUI.updateDisplay();
    }
  });

  const sphere2Geometry = new THREE.SphereGeometry(100.0, 32, 32);
  const sphere2Material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.5, 0.5, 0.5),
  });
  const sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);
  sphere2.receiveShadow = true;
  sphere2.position.set(0, -100.5, 0);

  const spheres = [
    {
      position: sphere1.position,
      radius: sphere1.geometry.parameters.radius,
      color: sphere1Material.color,
    },
    {
      position: sphere2.position,
      radius: sphere2.geometry.parameters.radius,
      color: sphere2Material.color,
    },
  ];
  const numSpheres = 2;

  for (let i = spheres.length; i < maxNumSpheres; i++) {
    spheres.push({
      position: new THREE.Vector3(),
      radius: 0,
      color: new THREE.Color(0x000000),
    });
  }

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const halfHeight = Math.tan(verticalFov / 2);
  const halfWidth = halfHeight * camera.aspect;

  const uniforms = {
    uCamera: {
      value: {
        position: camera.position,
        up: cameraUp,
        forward: cameraForward,
        right: cameraRight,
        halfWidth: halfWidth,
        halfHeight: halfHeight,
      },
    },
    uWorld: {
      value: {
        spheres: spheres,
        numSpheres: numSpheres,
      },
    },
    uNumSamples: { value: 10 },
  };
  // setup
  const shaderDemo = new ShaderCanvas({
    width: window.innerWidth,
    height: window.innerHeight,
    fragmentShader: fragShader,
    uniforms: uniforms,
    resolutionScale: 1.0,
  });

  // handle resize
  window.addEventListener("resize", () => {
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const halfHeight = Math.tan(verticalFov / 2);
    const halfWidth = halfHeight * camera.aspect;
    uniforms.uCamera.value.halfHeight = halfHeight;
    uniforms.uCamera.value.halfWidth = halfWidth;

    shaderDemo.setDimensions(window.innerWidth, window.innerHeight);
  });

  // Post-processing
  const settings = {
    raytracingEnabled: true,
    selectedPosition: new THREE.Vector3(),
    selectedRadius: 0,
    selectedColor: "#000000",
  };

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  renderPass.enabled = !settings.raytracingEnabled;
  composer.addPass(renderPass);
  const rtPass = new RenderPass(
    shaderDemo.screenScene,
    shaderDemo.screenCamera
  );
  composer.addPass(rtPass);
  rtPass.enabled = settings.raytracingEnabled;

  const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2),
    scene,
    camera
  );
  composer.addPass(outlinePass);

  const gizmo = transformControls.getHelper();
  const gizmoScene = new THREE.Scene();
  gizmoScene.add(gizmo);

  // Debug GUI
  const folder = createSketchFolder("Scene");
  // menu to selct between raytracer and renderer

  folder.add(camera, "fov", 10, 120, 1).onChange(() => {
    camera.updateProjectionMatrix();
    uniforms.uCamera.value.halfHeight = Math.tan(
      THREE.MathUtils.degToRad(camera.fov) / 2
    );
    uniforms.uCamera.value.halfWidth =
      uniforms.uCamera.value.halfHeight * camera.aspect;
  });

  const raytracingToggleGUI = folder.add(settings, "raytracingEnabled");

  const raytracingSettingsFolder = folder.addFolder("Raytracing Settings");
  if (!settings.raytracingEnabled) {
    raytracingSettingsFolder.hide();
  }

  raytracingSettingsFolder
    .add(uniforms.uNumSamples, "value", 1, 20, 1)
    .name("Samples");

  raytracingSettingsFolder
    .add(shaderDemo, "resolutionScale", [2.0, 1.0, 0.5, 0.25, 0.125, 0.0625])
    .onChange((value: number) => {
      shaderDemo.updateRenderTarget();
    });

  raytracingToggleGUI.onChange((value: boolean) => {
    rtPass.enabled = value;
    renderPass.enabled = !value;
    if (value) {
      raytracingSettingsFolder.show();
    } else {
      raytracingSettingsFolder.hide();
    }
  });

  const selctedObjectFolder = folder.addFolder("Selected Object");

  const transformFolder = selctedObjectFolder
    .add(transformControls, "mode", ["translate", "scale"])
    .name("transform mode")
    .onChange((value: string) => {
      if (value === "scale") {
        transformControls.showY = false;
        transformControls.showZ = false;
      } else {
        transformControls.showY = true;
        transformControls.showZ = true;
      }
    });

  const selectedPositionXGUI = selctedObjectFolder
    .add(settings.selectedPosition, "x", -1)
    .onChange((value: number) => {
      if (selectedObject) selectedObject.position.x = value;
    });
  const selectedPositionYGUI = selctedObjectFolder
    .add(settings.selectedPosition, "y", -1)
    .onChange((value: number) => {
      if (selectedObject) selectedObject.position.y = value;
    });
  const selectedPositionZGUI = selctedObjectFolder
    .add(settings.selectedPosition, "z", -1)
    .onChange((value: number) => {
      if (selectedObject) selectedObject.position.z = value;
    });
  const selectedRadiusGUI = selctedObjectFolder
    .add(settings, "selectedRadius", 0)
    .onChange((value: number) => {
      if (selectedObject) {
        spheres[selectedObject.index].radius = value;
        const scale = value / selectedObject.geometry.parameters.radius;
        selectedObject.scale.set(scale, scale, scale);
      }
    })
    .name("radius");
  const selectedObjectColorGUI = selctedObjectFolder
    .addColor(settings, "selectedColor")
    .onChange((value: string) => {
      if (selectedObject) {
        const color = new THREE.Color(value);
        spheres[selectedObject.index].color = color;
        selectedObject.material.color = color;
      }
    })
    .name("color");

  selctedObjectFolder.hide();

  // picking objects
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedObject: THREE.Object3D;

  const group = new THREE.Group();
  scene.add(group);
  group.add(sphere1, sphere2);
  group.updateMatrixWorld();
  sphere1.index = 0;
  sphere2.index = 1;

  function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(group, true);

    if (intersects.length > 0) {
      selectedObject = intersects[0].object;
      outlinePass.selectedObjects = [selectedObject];
      transformControls.attach(selectedObject);
      selctedObjectFolder.show();
      // radius display must be manually updated
      settings.selectedRadius = spheres[selectedObject.index].radius;
      selectedRadiusGUI.updateDisplay();
      settings.selectedColor =
        spheres[selectedObject.index].color.getHexString();
      selectedObjectColorGUI.updateDisplay();
    } else {
      outlinePass.selectedObjects = [];
      transformControls.detach();
      selctedObjectFolder.hide();
    }
  }

  // on mouse down check for intersection
  window.addEventListener("mousedown", (e) => {
    if (folder.domElement.contains(e.target as Node)) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    checkIntersection();
  });

  // render loop

  renderer.autoClear = false;
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    renderer.clear();

    controls?.update();

    if (settings.raytracingEnabled) {
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();

      camera.getWorldDirection(cameraForward).normalize();
      cameraRight.crossVectors(cameraForward, worldUp).normalize();
      cameraUp.crossVectors(cameraRight, cameraForward).normalize();
      shaderDemo.render(renderer);
    }

    // transform controls
    transformControls.update(clock.getDelta());

    composer.render();
    renderer.render(gizmoScene, camera);
  });

  return renderer;
}

import * as THREE from "three";
import { ShaderCanvas } from "../core/ShaderCanvas";
import { setupScene } from "../core/setupScene";
import fragShader from "./shaders/main.fs";
import { createFullScreenPerspectiveCamera } from "../core/createFullscreenCamera";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { OutlinePass } from "three/examples/jsm/Addons.js";
import { TransformControls } from "three/examples/jsm/Addons.js";
import { ShaderPass } from "three/examples/jsm/Addons.js";
import { GammaCorrectionShader } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";

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

const backgroundColorTop = new THREE.Color(0.5, 0.7, 1); // Sky blue background
scene.background = backgroundColorTop;
const backgroundColorBottom = new THREE.Color(1, 1, 1); // White ground

const settings = {
  raytracingEnabled: true,
  selectedPosition: new THREE.Vector3(),
  selectedRadius: 0,
  selectedColor: "#000000",
  selectedFuzz: 0,
  backgroundColorTop: backgroundColorTop,
  backgroundColorBottom: backgroundColorBottom,
  enableDepthOfField: false,
  aperture: 0.0,
  focusDistance: 1.0,
};

// Raytracing Canvas

const cameraForward = new THREE.Vector3();
camera.getWorldDirection(cameraForward).normalize();
const cameraUp = camera.up.clone();
const cameraRight = new THREE.Vector3();
cameraRight.crossVectors(cameraForward, cameraUp).normalize();

const worldUp = new THREE.Vector3(0, 1, 0);

scene.add(new THREE.AmbientLight(backgroundColorTop, 0.5));
const dirLight = new THREE.DirectionalLight(backgroundColorTop, 4);
dirLight.castShadow = true;
scene.add(dirLight);

const materialGround = new THREE.MeshLambertMaterial({
  color: new THREE.Color(0.8, 0.8, 0),
});
const materialCenter = new THREE.MeshLambertMaterial({
  color: new THREE.Color(0.1, 0.2, 0.5),
});
// const materialLeft = new THREE.MeshStandardMaterial({
//   color: new THREE.Color(0.8, 0.8, 0.8),
//   roughness: 0.3,
// });
const materialLeft = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(1, 1, 1),
  ior: 1 / 1.33,
});
const materialRight = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0.8, 0.6, 0.2),
  roughness: 1.0,
});
const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
const sphereGround = new THREE.Mesh(sphereGeometry, materialGround);
sphereGround.position.set(0, -100.5, 0);
sphereGround.scale.set(100, 100, 100);
sphereGround.receiveShadow = true;
scene.add(sphereGround);
const sphereCenter = new THREE.Mesh(sphereGeometry, materialCenter);
sphereCenter.position.set(0, 0, 0);
sphereCenter.scale.set(0.5, 0.5, 0.5);
sphereCenter.castShadow = true;
scene.add(sphereCenter);
const sphereLeft = new THREE.Mesh(sphereGeometry, materialLeft);
sphereLeft.position.set(-1.2, 0, 0);
sphereLeft.scale.set(0.5, 0.5, 0.5);
sphereLeft.castShadow = true;
scene.add(sphereLeft);
const sphereRight = new THREE.Mesh(sphereGeometry, materialRight);
sphereRight.position.set(1.2, 0, 0);
sphereRight.scale.set(0.5, 0.5, 0.5);
sphereRight.castShadow = true;

const spheres = [
  {
    position: sphereGround.position,
    radius: 100,
    materialId: 0,
  },
  {
    position: sphereCenter.position,
    radius: 0.5,
    materialId: 1,
  },
  {
    position: sphereLeft.position,
    radius: 0.5,
    materialId: 2,
  },
  {
    position: sphereRight.position,
    radius: 0.5,
    materialId: 3,
  },
];

const materials = [
  {
    type: 0,
    albedo: materialGround.color,
    fuzz: 0.0,
    ior: 0.0,
  },
  {
    type: 0,
    albedo: materialCenter.color,
    fuzz: 0.0,
    ior: 0.0,
  },
  {
    type: 2,
    albedo: materialLeft.color,
    fuzz: materialLeft.roughness,
    ior: materialLeft.ior,
  },
  {
    type: 1,
    albedo: materialRight.color,
    fuzz: materialRight.roughness,
    ior: 0,
  },
];

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
      focusDistance: settings.focusDistance,
      aperture: settings.aperture,
    },
  },
  uWorld: {
    value: {
      spheres: spheres,
      numSpheres: spheres.length,
    },
  },
  uNumSamples: { value: 10 },
  uMaxRayDepth: { value: 10 },
  uMaterials: { value: materials },
  uBackgroundColorTop: { value: backgroundColorTop },
  uBackgroundColorBottom: { value: backgroundColorBottom },
  uEnableDoF: { value: settings.enableDepthOfField },
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

const renderTarget = new THREE.WebGLRenderTarget(
  0,
  0, // will be set by composer.setSize later
  {
    samples: window.devicePixelRatio === 1 ? 2 : 0,
  }
);
const composer = new EffectComposer(renderer, renderTarget);
composer.setSize(window.innerWidth, window.innerHeight);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener("resize", () => {
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const renderPass = new RenderPass(scene, camera);
renderPass.enabled = !settings.raytracingEnabled;
composer.addPass(renderPass);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const rtPass = new RenderPass(shaderDemo.screenScene, shaderDemo.screenCamera);
composer.addPass(rtPass);
rtPass.enabled = settings.raytracingEnabled;

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2),
  scene,
  camera
);
composer.addPass(outlinePass);

const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
composer.addPass(gammaCorrectionPass);

const gizmo = transformControls.getHelper();
const gizmoScene = new THREE.Scene();
gizmoScene.add(gizmo);

// Debug GUI
const gui = new GUI({ title: "Settings" });
// menu to selct between raytracer and renderer

const raytracingToggleGUI = gui
  .add(settings, "raytracingEnabled")
  .onChange(() => {
    shaderDemo.resetAccumulation();
  });
gui
  .addColor(settings, "backgroundColorTop")
  .onChange((value: string | number | THREE.Color) => {
    const color = new THREE.Color(value);
    scene.background = color;
    dirLight.color = color;
    shaderDemo.resetAccumulation();
  });

gui
  .addColor(settings, "backgroundColorBottom")
  .onChange((value: string | number | THREE.Color) => {
    const color = new THREE.Color(value);
    uniforms.uBackgroundColorBottom.value = color;
    shaderDemo.resetAccumulation();
  });

gui.add(camera, "fov", 10, 120, 1).onChange(() => {
  camera.updateProjectionMatrix();
  uniforms.uCamera.value.halfHeight = Math.tan(
    THREE.MathUtils.degToRad(camera.fov) / 2
  );
  uniforms.uCamera.value.halfWidth =
    uniforms.uCamera.value.halfHeight * camera.aspect;
  shaderDemo.resetAccumulation();
});

const raytracingSettingsFolder = gui.addFolder("Raytracing Settings");
if (!settings.raytracingEnabled) {
  raytracingSettingsFolder.hide();
}

raytracingSettingsFolder
  .add(uniforms.uNumSamples, "value", 1, 20, 1)
  .onChange(() => {
    shaderDemo.resetAccumulation();
  })
  .name("Samples");

raytracingSettingsFolder
  .add(uniforms.uMaxRayDepth, "value", 1, 20, 1)
  .onChange(() => {
    shaderDemo.resetAccumulation();
  })
  .name("Max Ray Depth");

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

const toggleDoFGUI = raytracingSettingsFolder.add(
  settings,
  "enableDepthOfField"
);
const apertureGUI = raytracingSettingsFolder
  .add(settings, "aperture", 0, 0.1, 0.001)
  .onChange((value: number) => {
    uniforms.uCamera.value.aperture = value;
    shaderDemo.resetAccumulation();
  });
if (!settings.enableDepthOfField) apertureGUI.disable();
const focusDistGUI = raytracingSettingsFolder
  .add(settings, "focusDistance", 0.1, 10, 0.1)
  .onChange((value: number) => {
    uniforms.uCamera.value.focusDistance = value;
    shaderDemo.resetAccumulation();
  });
if (!settings.enableDepthOfField) focusDistGUI.disable();
toggleDoFGUI.onChange((value: boolean) => {
  uniforms.uEnableDoF.value = value;
  if (value) {
    apertureGUI.enable();
    focusDistGUI.enable();
  } else {
    apertureGUI.disable();
    focusDistGUI.disable();
  }
  shaderDemo.resetAccumulation();
});

const selctedObjectFolder = gui.addFolder("Selected Object");

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

let materialFolder = selctedObjectFolder.addFolder("Material");

const materialLabelDict = {
  0: "Lambert",
  1: "Metal",
  2: "Dielectric",
};
function populateMaterialGUI(
  material: THREE.MeshStandardMaterial,
  materialId: number
) {
  materialFolder.destroy();
  const materialType = materialLabelDict[materials[materialId].type];

  materialFolder = selctedObjectFolder.addFolder(
    `Material - ${materialId} - ${materialType}`
  );

  materialFolder.addColor(material, "color").onChange(() => {
    material.needsUpdate = true;
    materials[materialId].albedo = material.color;
    shaderDemo.resetAccumulation();
  });

  if (materialType === "Metal") {
    if ("roughness" in material) {
      materialFolder.add(material, "roughness", 0, 1).onChange(() => {
        material.needsUpdate = true;
        materials[materialId].fuzz = material.roughness;
        shaderDemo.resetAccumulation();
      });
    }
  }

  if (materialType === "Dielectric") {
    if ("ior" in material) {
      materialFolder.add(material, "ior", 0, 2.5).onChange(() => {
        material.needsUpdate = true;
        materials[materialId].ior = material.ior;
        shaderDemo.resetAccumulation();
      });
    }
  }

  materialFolder.show();
}

selctedObjectFolder.hide();

// picking objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject: THREE.Object3D;

const group = new THREE.Group();
scene.add(group);
const sphereMeshes = [sphereGround, sphereCenter, sphereLeft, sphereRight];
for (let i = 0; i < spheres.length; i++) {
  group.add(sphereMeshes[i]);
  sphereMeshes[i].index = i;
}
group.updateMatrixWorld();

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
      materials[spheres[selectedObject.index].materialId].albedo.getHexString();
    populateMaterialGUI(
      selectedObject.material,
      spheres[selectedObject.index].materialId
    );
  } else {
    outlinePass.selectedObjects = [];
    transformControls.detach();
    selctedObjectFolder.hide();
  }
}

// on mouse down check for intersection
window.addEventListener("mousedown", (e) => {
  if (gui.domElement.contains(e.target as Node)) return;
  if (transformControls.dragging) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  checkIntersection();
});

controls?.addEventListener("change", () => {
  shaderDemo.resetAccumulation();
});

transformControls.addEventListener("change", () => {
  shaderDemo.resetAccumulation();
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

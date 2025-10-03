import * as THREE from "three";
import PtRenderer from "./pathtracer/PtRenderer";

const canvas = document.createElement("canvas");
canvas.classList.add("webgl");
document.querySelector("#app")?.appendChild(canvas);

// Set up scene objects

const materialGround = new THREE.MeshLambertMaterial({
  color: new THREE.Color(0.8, 0.8, 0),
});
const materialCenter = new THREE.MeshLambertMaterial({
  color: new THREE.Color(0.1, 0.2, 0.5),
});
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
const sphereCenter = new THREE.Mesh(sphereGeometry, materialCenter);
sphereCenter.position.set(0, 0, 0);
sphereCenter.scale.set(0.5, 0.5, 0.5);
sphereCenter.castShadow = true;
const sphereLeft = new THREE.Mesh(sphereGeometry, materialLeft);
sphereLeft.position.set(-1.2, 0, 0);
sphereLeft.scale.set(0.5, 0.5, 0.5);
sphereLeft.castShadow = true;
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

const ptRenderer = new PtRenderer(canvas, spheres, materials);

ptRenderer.scene.add(sphereGround, sphereCenter, sphereLeft, sphereRight);

// const transformControls = new TransformControls(camera, renderer.domElement);
// transformControls.addEventListener("dragging-changed", function (event) {
//   controls.enabled = !event.value;
// });
// transformControls.mode = "translate";

// transformControls.addEventListener("change", () => {
//   if (transformControls.mode === "scale") {
//     const scale = selectedObject.scale.x;
//     selectedObject.scale.set(scale, scale, scale);
//     spheres[selectedObject.index].radius =
//       scale * selectedObject.geometry.parameters.radius;
//     settings.selectedRadius = spheres[selectedObject.index].radius;
//     selectedRadiusGUI.updateDisplay();
//   } else {
//     settings.selectedPosition.copy(selectedObject.position);
//     selectedPositionXGUI.updateDisplay();
//     selectedPositionYGUI.updateDisplay();
//     selectedPositionZGUI.updateDisplay();
//   }
// });

// // Debug GUI
// const gui = new GUI({ title: "Settings" });
// // menu to selct between raytracer and renderer

// const raytracingToggleGUI = gui
//   .add(settings, "raytracingEnabled")
//   .onChange(() => {
//     shaderDemo.resetAccumulation();
//   });
// gui
//   .addColor(settings, "backgroundColorTop")
//   .onChange((value: string | number | THREE.Color) => {
//     const color = new THREE.Color(value);
//     scene.background = color;
//     dirLight.color = color;
//     shaderDemo.resetAccumulation();
//   });

// gui
//   .addColor(settings, "backgroundColorBottom")
//   .onChange((value: string | number | THREE.Color) => {
//     const color = new THREE.Color(value);
//     uniforms.uBackgroundColorBottom.value = color;
//     shaderDemo.resetAccumulation();
//   });

// gui.add(camera, "fov", 10, 120, 1).onChange(() => {
//   camera.updateProjectionMatrix();
//   uniforms.uCamera.value.halfHeight = Math.tan(
//     THREE.MathUtils.degToRad(camera.fov) / 2
//   );
//   uniforms.uCamera.value.halfWidth =
//     uniforms.uCamera.value.halfHeight * camera.aspect;
//   shaderDemo.resetAccumulation();
// });

// const raytracingSettingsFolder = gui.addFolder("Raytracing Settings");
// if (!settings.raytracingEnabled) {
//   raytracingSettingsFolder.hide();
// }

// raytracingSettingsFolder
//   .add(uniforms.uNumSamples, "value", 1, 20, 1)
//   .onChange(() => {
//     shaderDemo.resetAccumulation();
//   })
//   .name("Samples");

// raytracingSettingsFolder
//   .add(uniforms.uMaxRayDepth, "value", 1, 20, 1)
//   .onChange(() => {
//     shaderDemo.resetAccumulation();
//   })
//   .name("Max Ray Depth");

// raytracingSettingsFolder
//   .add(shaderDemo, "resolutionScale", [2.0, 1.0, 0.5, 0.25, 0.125, 0.0625])
//   .onChange((value: number) => {
//     shaderDemo.updateRenderTarget();
//   });

// raytracingToggleGUI.onChange((value: boolean) => {
//   rtPass.enabled = value;
//   renderPass.enabled = !value;
//   if (value) {
//     raytracingSettingsFolder.show();
//   } else {
//     raytracingSettingsFolder.hide();
//   }
// });

// const toggleDoFGUI = raytracingSettingsFolder.add(
//   settings,
//   "enableDepthOfField"
// );
// const apertureGUI = raytracingSettingsFolder
//   .add(settings, "aperture", 0, 0.1, 0.001)
//   .onChange((value: number) => {
//     uniforms.uCamera.value.aperture = value;
//     shaderDemo.resetAccumulation();
//   });
// if (!settings.enableDepthOfField) apertureGUI.disable();
// const focusDistGUI = raytracingSettingsFolder
//   .add(settings, "focusDistance", 0.1, 10, 0.1)
//   .onChange((value: number) => {
//     uniforms.uCamera.value.focusDistance = value;
//     shaderDemo.resetAccumulation();
//   });
// if (!settings.enableDepthOfField) focusDistGUI.disable();
// toggleDoFGUI.onChange((value: boolean) => {
//   uniforms.uEnableDoF.value = value;
//   if (value) {
//     apertureGUI.enable();
//     focusDistGUI.enable();
//   } else {
//     apertureGUI.disable();
//     focusDistGUI.disable();
//   }
//   shaderDemo.resetAccumulation();
// });

// const selctedObjectFolder = gui.addFolder("Selected Object");

// const transformFolder = selctedObjectFolder
//   .add(transformControls, "mode", ["translate", "scale"])
//   .name("transform mode")
//   .onChange((value: string) => {
//     if (value === "scale") {
//       transformControls.showY = false;
//       transformControls.showZ = false;
//     } else {
//       transformControls.showY = true;
//       transformControls.showZ = true;
//     }
//   });

// const selectedPositionXGUI = selctedObjectFolder
//   .add(settings.selectedPosition, "x", -1)
//   .onChange((value: number) => {
//     if (selectedObject) selectedObject.position.x = value;
//   });
// const selectedPositionYGUI = selctedObjectFolder
//   .add(settings.selectedPosition, "y", -1)
//   .onChange((value: number) => {
//     if (selectedObject) selectedObject.position.y = value;
//   });
// const selectedPositionZGUI = selctedObjectFolder
//   .add(settings.selectedPosition, "z", -1)
//   .onChange((value: number) => {
//     if (selectedObject) selectedObject.position.z = value;
//   });
// const selectedRadiusGUI = selctedObjectFolder
//   .add(settings, "selectedRadius", 0)
//   .onChange((value: number) => {
//     if (selectedObject) {
//       spheres[selectedObject.index].radius = value;
//       const scale = value / selectedObject.geometry.parameters.radius;
//       selectedObject.scale.set(scale, scale, scale);
//     }
//   })
//   .name("radius");

// let materialFolder = selctedObjectFolder.addFolder("Material");

// const materialLabelDict = {
//   0: "Lambert",
//   1: "Metal",
//   2: "Dielectric",
// };
// function populateMaterialGUI(
//   material: THREE.MeshStandardMaterial,
//   materialId: number
// ) {
//   materialFolder.destroy();
//   const materialType = materialLabelDict[materials[materialId].type];

//   materialFolder = selctedObjectFolder.addFolder(
//     `Material - ${materialId} - ${materialType}`
//   );

//   materialFolder.addColor(material, "color").onChange(() => {
//     material.needsUpdate = true;
//     materials[materialId].albedo = material.color;
//     shaderDemo.resetAccumulation();
//   });

//   if (materialType === "Metal") {
//     if ("roughness" in material) {
//       materialFolder.add(material, "roughness", 0, 1).onChange(() => {
//         material.needsUpdate = true;
//         materials[materialId].fuzz = material.roughness;
//         shaderDemo.resetAccumulation();
//       });
//     }
//   }

//   if (materialType === "Dielectric") {
//     if ("ior" in material) {
//       materialFolder.add(material, "ior", 0, 2.5).onChange(() => {
//         material.needsUpdate = true;
//         materials[materialId].ior = material.ior;
//         shaderDemo.resetAccumulation();
//       });
//     }
//   }

//   materialFolder.show();
// }

// selctedObjectFolder.hide();

// // picking objects
// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();
// let selectedObject: THREE.Object3D;

// const group = new THREE.Group();
// scene.add(group);
// const sphereMeshes = [sphereGround, sphereCenter, sphereLeft, sphereRight];
// for (let i = 0; i < spheres.length; i++) {
//   group.add(sphereMeshes[i]);
//   sphereMeshes[i].index = i;
// }
// group.updateMatrixWorld();

// function checkIntersection() {
//   raycaster.setFromCamera(mouse, camera);

//   const intersects = raycaster.intersectObject(group, true);

//   if (intersects.length > 0) {
//     selectedObject = intersects[0].object;
//     outlinePass.selectedObjects = [selectedObject];
//     transformControls.attach(selectedObject);
//     selctedObjectFolder.show();
//     // radius display must be manually updated
//     settings.selectedRadius = spheres[selectedObject.index].radius;
//     selectedRadiusGUI.updateDisplay();
//     settings.selectedColor =
//       materials[spheres[selectedObject.index].materialId].albedo.getHexString();
//     populateMaterialGUI(
//       selectedObject.material,
//       spheres[selectedObject.index].materialId
//     );
//   } else {
//     outlinePass.selectedObjects = [];
//     transformControls.detach();
//     selctedObjectFolder.hide();
//   }
// }

// // on mouse down check for intersection
// window.addEventListener("mousedown", (e) => {
//   if (gui.domElement.contains(e.target as Node)) return;
//   if (transformControls.dragging) return;
//   mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
//   checkIntersection();
// });

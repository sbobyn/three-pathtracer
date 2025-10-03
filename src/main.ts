import * as THREE from "three";
import PtRenderer from "./pathtracer/PtRenderer";
import PtGui from "./pathtracer/PtGui";

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

const intersectGroup = new THREE.Group();
sphereGround.index = 0;
sphereCenter.index = 1;
sphereLeft.index = 2;
sphereRight.index = 3;
intersectGroup.add(sphereGround, sphereCenter, sphereLeft, sphereRight);
intersectGroup.updateMatrixWorld();

ptRenderer.scene.add(intersectGroup);

const ptGui = new PtGui(ptRenderer, intersectGroup);

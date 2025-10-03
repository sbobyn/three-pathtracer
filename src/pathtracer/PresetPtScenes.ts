import * as THREE from "three";
import PtScene from "./PtScene";
import PtSphere from "./PtSphere";
import PtMaterial from "./PtMaterial";

export default class PresetPtScenes {
  static createRTIOWSimpleScene(): PtScene {
    const spheres: PtSphere[] = [
      new PtSphere(new THREE.Vector3(0, -100.5, 0), 100, 0), // Ground
      new PtSphere(new THREE.Vector3(0, 0, 0), 0.5, 1), // Center
      new PtSphere(new THREE.Vector3(-1.2, 0, 0), 0.5, 2), // Left
      new PtSphere(new THREE.Vector3(1.2, 0, 0), 0.5, 3), // Right
    ];
    const materials: PtMaterial[] = [
      new PtMaterial(0, new THREE.Color(0.8, 0.8, 0)), // Ground - Lambert
      new PtMaterial(0, new THREE.Color(0.1, 0.2, 0.5)), // Center - Lambert
      new PtMaterial(2, new THREE.Color(1, 1, 1), 0, 1 / 1.33), // Left - Dielectric
      new PtMaterial(1, new THREE.Color(0.8, 0.6, 0.2), 1.0), // Right - Metal
    ];

    return new PtScene(spheres, materials);
  }
}

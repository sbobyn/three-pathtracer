import * as THREE from "three";

export default class PtSphere {
  position: THREE.Vector3;
  radius: number;
  materialId: number;

  constructor(position: THREE.Vector3, radius: number, materialId: number) {
    this.position = position;
    this.radius = radius;
    this.materialId = materialId;
  }
}

import * as THREE from "three";

export default class PtMaterial {
  type: number; // 0 = lambert, 1 = metal, 2 = dielectric
  albedo: THREE.Color;
  fuzz: number; // For metal
  ior: number; // For dielectric

  constructor(
    type: number,
    albedo: THREE.Color,
    fuzz: number = 0,
    ior: number = 0
  ) {
    this.type = type;
    this.albedo = albedo;
    this.fuzz = fuzz;
    this.ior = ior;
  }
}

import * as THREE from "three";

export enum PtMaterialType {
  Lambert = 0,
  Metal = 1,
  Dielectric = 2,
}

export default class PtMaterial {
  constructor(
    public type: PtMaterialType,
    public albedo: THREE.Color,
    public fuzz: number = 0,
    public ior: number = 0
  ) {}
}

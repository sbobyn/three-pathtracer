import * as THREE from "three";
import PtSphere from "./PtSphere";
import PtMaterial from "./PtMaterial";

export default class PtScene {
  scene: THREE.Scene;
  intersectGroup: THREE.Group;
  spheres: PtSphere[];
  materials: PtMaterial[];

  public dirLight: THREE.DirectionalLight;
  backgroundColorTop: THREE.Color;
  backgroundColorBottom: THREE.Color;

  constructor(spheres: PtSphere[], materials: PtMaterial[]) {
    this.scene = new THREE.Scene();

    this.backgroundColorTop = new THREE.Color(0.5, 0.7, 1); // Sky blue background
    this.backgroundColorBottom = new THREE.Color(1, 1, 1); // White ground
    this.scene.background = this.backgroundColorTop;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(this.backgroundColorTop, 1.0);
    this.dirLight.position.set(0, 5, 0);
    this.scene.add(this.dirLight);

    this.intersectGroup = new THREE.Group();

    this.spheres = spheres;
    this.materials = materials;

    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);

    for (let i = 0; i < spheres.length; i++) {
      const sphere = spheres[i];
      const materialDef = materials[sphere.materialId];

      let material: THREE.Material;
      if (materialDef.type === 0) {
        material = new THREE.MeshLambertMaterial({
          color: materialDef.albedo,
        });
      } else if (materialDef.type === 1) {
        material = new THREE.MeshStandardMaterial({
          color: materialDef.albedo,
          roughness: materialDef.fuzz,
        });
      } else if (materialDef.type === 2) {
        material = new THREE.MeshPhysicalMaterial({
          color: materialDef.albedo,
          metalness: 0,
          roughness: 0,
          ior: materialDef.ior,
          transmission: 1,
          opacity: 1,
          transparent: true,
        });
      } else {
        console.warn(
          `Unknown material type ${materialDef.type} for sphere ${i}`
        );
        material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
      }

      const sphereMesh = new THREE.Mesh(sphereGeometry, material);
      sphereMesh.position.copy(sphere.position);
      sphere.position = sphereMesh.position; // Ensure reference is the same. TODO : cleaner solution
      sphereMesh.scale.set(sphere.radius, sphere.radius, sphere.radius);

      sphereMesh.index = i; // For identification in ray intersection. TODO : cleaner solution

      this.intersectGroup.add(sphereMesh);
    }

    this.intersectGroup.updateMatrixWorld();
    this.scene.add(this.intersectGroup);
  }
}

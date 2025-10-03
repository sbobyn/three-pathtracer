import * as THREE from "three";

interface PtMaterial {
  type: number; // 0 = lambert, 1 = metal, 2 = dielectric
  color: THREE.Color;
  fuzz?: number; // For metal
  ior?: number; // For dielectric
}

interface PtSphere {
  position: THREE.Vector3;
  radius: number;
  materialId: number;
}

export class PtScene {
  scene: THREE.Scene;
  intersectGroup: THREE.Group;
  spheres: PtSphere[];
  materials: PtMaterial[];

  public dirLight: THREE.DirectionalLight;
  private backgroundColorTop: THREE.Color;
  private backgroundColorBottom: THREE.Color;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.backgroundColorTop = new THREE.Color(0.5, 0.7, 1); // Sky blue background
    this.backgroundColorBottom = new THREE.Color(1, 1, 1); // White ground
    this.scene.background = this.backgroundColorTop;
    this.dirLight = new THREE.DirectionalLight(this.backgroundColorTop, 1.0);
    this.scene.add(this.dirLight);

    this.intersectGroup = new THREE.Group();
    this.spheres = [];
    this.materials = [];

    for (const obj of scene.children) {
      if (
        obj instanceof THREE.Mesh &&
        obj.geometry instanceof THREE.SphereGeometry
      ) {
        const sphere = obj as THREE.Mesh;
        const geometry = sphere.geometry as THREE.SphereGeometry;
        const position = new THREE.Vector3();
        sphere.getWorldPosition(position);
        const radius = geometry.parameters.radius;

        this.intersectGroup.add(sphere);

        obj.index = this.spheres.length; // Custom property to track index: TODO cleaner way

        this.spheres.push({
          position: position,
          radius: radius,
          materialId: this.materials.length,
        });

        const material = sphere.material;
        if (material instanceof THREE.MeshLambertMaterial) {
          this.materials.push({
            type: 0,
            color: material.color,
          });
        } else if (material instanceof THREE.MeshStandardMaterial) {
          this.materials.push({
            type: 1,
            color: material.color,
            fuzz: material.roughness,
          });
        } else if (material instanceof THREE.MeshPhysicalMaterial) {
          this.materials.push({
            type: 2,
            color: material.color,
            ior: material.ior,
          });
        } else {
          console.warn(
            "Unsupported material type in PtScene conversion:",
            material
          );
          this.materials.push({
            type: 0,
            color: new THREE.Color(1, 0, 1), // Magenta for unsupported
          });
        }
      }
    }

    this.intersectGroup.updateMatrixWorld();
    this.scene.add(this.intersectGroup);
  }
}

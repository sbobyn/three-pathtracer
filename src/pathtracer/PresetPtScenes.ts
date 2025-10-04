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
      new PtMaterial(1, new THREE.Color(0.8, 0.6, 0.2), 0.1), // Right - Metal
    ];

    return new PtScene(spheres, materials);
  }

  static createRTIOWPart1FinalScene(): PtScene {
    const spheres: PtSphere[] = [
      new PtSphere(new THREE.Vector3(0, -1000, 0), 1000, 0), // Ground
    ];
    const materials: PtMaterial[] = [
      new PtMaterial(0, new THREE.Color(0.5, 0.5, 0.5)), // Ground - Lambert
    ];

    for (let a = -2; a <= 2; a++) {
      for (let b = -2; b <= 2; b++) {
        const chooseMat = Math.random();
        const center = new THREE.Vector3(
          3 * a + 1.3 * (Math.random() - 0.5),
          0.2,
          3 * b + 1.3 * (Math.random() - 0.5)
        );

        if (
          center.distanceTo(new THREE.Vector3(0, 0.2, 0)) > 0.9 &&
          center.distanceTo(new THREE.Vector3(-4, 0.2, 0)) > 0.9 &&
          center.distanceTo(new THREE.Vector3(4, 0.2, 0)) > 0.9
        ) {
          if (chooseMat < 0.8) {
            // Diffuse
            const albedo = new THREE.Color(
              Math.random() * Math.random(),
              Math.random() * Math.random(),
              Math.random() * Math.random()
            );
            materials.push(new PtMaterial(0, albedo));
            spheres.push(new PtSphere(center, 0.2, materials.length - 1));
          } else if (chooseMat < 0.95) {
            // Metal
            const albedo = new THREE.Color(
              0.5 * (1 + Math.random()),
              0.5 * (1 + Math.random()),
              0.5 * (1 + Math.random())
            );
            const fuzz = 0.5 * Math.random();
            materials.push(new PtMaterial(1, albedo, fuzz));
            spheres.push(new PtSphere(center, 0.2, materials.length - 1));
          } else {
            // Glass
            materials.push(new PtMaterial(2, new THREE.Color(1, 1, 1), 0, 1.5));
            spheres.push(new PtSphere(center, 0.2, materials.length - 1));
          }
        }
      }
    }

    materials.push(new PtMaterial(0, new THREE.Color(0.4, 0.2, 0.1))); // Center - Lambert
    spheres.push(
      new PtSphere(new THREE.Vector3(-4, 1, 0), 1.0, materials.length - 1)
    );

    materials.push(new PtMaterial(2, new THREE.Color(1, 1, 1), 0, 1.5)); // Left - Dielectric
    spheres.push(
      new PtSphere(new THREE.Vector3(0, 1, 0), 1.0, materials.length - 1)
    );

    materials.push(new PtMaterial(1, new THREE.Color(0.7, 0.6, 0.5), 0.0)); // Right - Metal
    spheres.push(
      new PtSphere(new THREE.Vector3(4, 1, 0), 1.0, materials.length - 1)
    );

    return new PtScene(spheres, materials);
  }
}

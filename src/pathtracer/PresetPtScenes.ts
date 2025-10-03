import * as THREE from "three";
import { PtScene } from "./PtScene";

export default class PresetPtScenes {
  createRTIOWSimpleScene(): PtScene {
    const scene = new THREE.Scene();

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

    return new PtScene(scene);
  }

  createRTIOWPart1FinalScene(): PtScene {
    const scene = new THREE.Scene();

    // TODO

    return new PtScene(scene);
  }
}

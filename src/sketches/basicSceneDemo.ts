import * as THREE from "three";
import { setupScene } from "../core/setupScene";
import { createFullScreenPerspectiveCamera } from "../core/createFullscreenCamera";
import { setupStats } from "../core/setupStats";

export default function (): THREE.WebGLRenderer {
  const camera = createFullScreenPerspectiveCamera({
    position: new THREE.Vector3(3, 3, 5),
    lookAt: new THREE.Vector3(0, 0, 0),
  });

  const { scene, renderer, controls } = setupScene({
    camera,
    enableOrbitControls: true,
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  directionalLight.target.position.set(0, 0, 0);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  scene.add(directionalLight);

  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x008080 });
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.castShadow = true;
  box.position.set(0, 1.5, 0);
  box.scale.set(1.5, 1.5, 1.5);
  scene.add(box);

  const stats = setupStats();
  const clock = new THREE.Clock();

  renderer.setAnimationLoop(() => {
    stats.begin();

    const elapsed = clock.getElapsedTime();
    box.rotation.y = elapsed * 0.5;
    box.rotation.x = elapsed * 0.2;

    controls?.update();
    renderer.render(scene, camera);

    stats.end();
  });

  return renderer;
}

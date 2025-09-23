import * as THREE from "three";
import Stats from "stats.js";

import { setupStats } from "./setupStats";

export class ShaderCanvas {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private material: THREE.ShaderMaterial;
  private clock = new THREE.Clock();
  private stats?: Stats;

  constructor({
    fragmentShader,
    vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    uniforms = {},
    enableStats = false,
  }: {
    fragmentShader: string;
    vertexShader?: string;
    uniforms?: Record<string, THREE.IUniform<any>>;
    enableStats?: boolean;
  }) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("shader-canvas");
    document.querySelector("#app")?.appendChild(canvas);

    this.scene = new THREE.Scene();

    // Fullscreen camera (-1 to 1 space)
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Fullscreen quad geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    // Merge user uniforms with built-in time + resolution
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uMouse: { value: new THREE.Vector4(0, 0, 0, 0) }, // x,y = current, z,w = click-down
        ...uniforms,
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Handle resize
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.material.uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    });

    // Handle mouse
    window.addEventListener("mousemove", (event) => {
      const x = event.clientX;
      const y = window.innerHeight - event.clientY; // bottom-left origin
      this.material.uniforms.uMouse.value.set(
        x,
        y,
        this.material.uniforms.uMouse.value.z,
        this.material.uniforms.uMouse.value.w
      );
    });

    window.addEventListener("mousedown", (event) => {
      const x = event.clientX;
      const y = window.innerHeight - event.clientY;
      this.material.uniforms.uMouse.value.set(x, y, x, y); // click-down pos stored in zw
    });

    window.addEventListener("mouseup", () => {
      // currently not used, not tracking mouse click release
    });

    if (enableStats) {
      this.stats = setupStats();
    }
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      this.stats?.begin();

      this.material.uniforms.uTime.value = this.clock.getElapsedTime();
      this.renderer.render(this.scene, this.camera);

      this.stats?.end();
    });
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}

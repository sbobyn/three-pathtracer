import * as THREE from "three";

export class ShaderCanvas {
  private scene: THREE.Scene;
  private canvasCamera: THREE.OrthographicCamera;
  private sceneCamera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private drawingBufferSize: THREE.Vector2;
  private material: THREE.ShaderMaterial;
  private clock = new THREE.Clock();

  constructor({
    canvas,
    sceneCamera,
    fragmentShader,
    vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = vec4(position, 1.0);
      }
    `,
    uniforms = {},
  }: {
    canvas: HTMLCanvasElement;
    sceneCamera: THREE.PerspectiveCamera;
    fragmentShader: string;
    vertexShader?: string;
    uniforms?: Record<string, THREE.IUniform<any>>;
  }) {
    this.sceneCamera = sceneCamera;

    this.scene = new THREE.Scene();

    // Fullscreen camera (-1 to 1 space)
    this.canvasCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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
    this.drawingBufferSize = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(this.drawingBufferSize);
    this.material.uniforms.uResolution.value.copy(this.drawingBufferSize);

    // Handle resize
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.getDrawingBufferSize(this.drawingBufferSize);
      this.material.uniforms.uResolution.value.copy(this.drawingBufferSize);
      const verticalFov = THREE.MathUtils.degToRad(this.sceneCamera.fov);
      const halfHeight = Math.tan(verticalFov / 2);
      const halfWidth = halfHeight * this.sceneCamera.aspect;
      this.material.uniforms.uCamera.value.halfHeight = halfHeight;
      this.material.uniforms.uCamera.value.halfWidth = halfWidth;
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
  }

  public render() {
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    this.renderer.render(this.scene, this.canvasCamera);
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.OrthographicCamera {
    return this.canvasCamera;
  }
}

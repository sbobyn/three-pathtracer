import * as THREE from "three";

export class ShaderCanvas {
  private scene: THREE.Scene;
  private canvasCamera: THREE.OrthographicCamera;
  material: THREE.ShaderMaterial;
  private clock = new THREE.Clock();
  private width: number;
  private height: number;
  private screenMaterial: THREE.MeshBasicMaterial;

  public screenScene: THREE.Scene;
  public screenCamera: THREE.OrthographicCamera;

  public resolutionScale: number;
  private pingRenderTarget: THREE.WebGLRenderTarget;
  private pongRenderTarget: THREE.WebGLRenderTarget;

  constructor({
    width,
    height,
    fragmentShader,
    vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = vec4(position, 1.0);
      }
    `,
    uniforms = {},
    resolutionScale = 1.0,
  }: {
    width: number;
    height: number;
    fragmentShader: string;
    vertexShader?: string;
    uniforms?: Record<string, THREE.IUniform<any>>;
    resolutionScale?: number;
  }) {
    this.width = width;
    this.height = height;
    this.resolutionScale = resolutionScale;
    this.scene = new THREE.Scene();
    this.canvasCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(width, height).multiplyScalar(
            resolutionScale
          ),
        },
        uAccumTexture: { value: null },
        uFrameCount: { value: 0 },
        ...uniforms,
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    this.pingRenderTarget = new THREE.WebGLRenderTarget(
      width * resolutionScale,
      height * resolutionScale,
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        depthBuffer: false,
      }
    );
    this.pongRenderTarget = this.pingRenderTarget.clone();

    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: this.pongRenderTarget.texture,
    });
    const screenQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.screenMaterial
    );
    this.screenScene = new THREE.Scene();
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.screenScene.add(screenQuad);

    // handle resize event
    window.addEventListener("resize", () => {
      this.setDimensions(window.innerWidth, window.innerHeight);
      this.updateRenderTarget();
    });
  }

  public render(renderer: THREE.WebGLRenderer) {
    renderer.setRenderTarget(this.pongRenderTarget);

    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    this.material.uniforms.uFrameCount.value++;
    this.material.uniforms.uAccumTexture.value = this.pingRenderTarget.texture;
    this.material.needsUpdate = true;

    renderer.render(this.scene, this.canvasCamera);
    renderer.setRenderTarget(null);
    this.screenMaterial.map = this.pongRenderTarget.texture;

    [this.pingRenderTarget, this.pongRenderTarget] = [
      this.pongRenderTarget,
      this.pingRenderTarget,
    ];
  }

  public setDimensions(width: number, height: number) {
    this.pingRenderTarget.setSize(width, height);
    this.pongRenderTarget.setSize(width, height);
    this.material.uniforms.uResolution.value.set(width, height);
    this.resetAccumulation();
  }

  public updateRenderTarget() {
    this.material.uniforms.uResolution.value.set(
      this.width * this.resolutionScale,
      this.height * this.resolutionScale
    );
    this.pingRenderTarget.setSize(
      this.width * this.resolutionScale,
      this.height * this.resolutionScale
    );
    this.pongRenderTarget.setSize(
      this.width * this.resolutionScale,
      this.height * this.resolutionScale
    );
    this.resetAccumulation();
  }

  public resetAccumulation() {
    this.material.uniforms.uFrameCount.value = 0;
  }
}

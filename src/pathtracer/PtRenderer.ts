import * as THREE from "three";
import { createFullScreenPerspectiveCamera } from "../core/createFullscreenCamera";
import { ShaderCanvas } from "../core/ShaderCanvas";
import fragShader from "./shaders/main.fs";
import {
  EffectComposer,
  GammaCorrectionShader,
  OutlinePass,
  RenderPass,
  ShaderPass,
  TransformControls,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import PtScene from "./PtScene";

export default class PtRenderer {
  public ptScene: PtScene;
  public camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  public shaderDemo: ShaderCanvas;

  private renderTarget: THREE.WebGLRenderTarget;
  private composer: EffectComposer;
  public rtPass: RenderPass;
  public renderPass: RenderPass;
  public outlinePass: OutlinePass;

  public controls: OrbitControls;
  public transformControls: TransformControls;

  private gizmo: THREE.Object3D;
  private gizmoScene: THREE.Scene;

  public settings: any;
  public uniforms: any;

  private cameraForward: THREE.Vector3;
  private cameraUp: THREE.Vector3;
  private cameraRight: THREE.Vector3;
  private worldUp: THREE.Vector3;

  constructor(canvas: HTMLCanvasElement, ptScene: PtScene) {
    this.ptScene = ptScene;

    this.settings = {
      raytracingEnabled: true,
      selectedPosition: new THREE.Vector3(),
      selectedRadius: 0,
      selectedColor: "#000000",
      selectedFuzz: 0,
      backgroundColorTop: this.ptScene.backgroundColorTop,
      backgroundColorBottom: this.ptScene.backgroundColorBottom,
      enableDepthOfField: false,
      aperture: 0.0,
      focusDistance: 1.0,
    };

    // this.camera = createFullScreenPerspectiveCamera({
    //   position: new THREE.Vector3(0, 0.5, 2),
    //   lookAt: new THREE.Vector3(0, 0.5, 0),
    //   far: 10000,
    // });

    this.camera = createFullScreenPerspectiveCamera({
      position: new THREE.Vector3(13, 2, 3),
      lookAt: new THREE.Vector3(0, 0, 0),
      far: 10000,
    });
    this.camera.fov = 20;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.autoClear = false;

    this.cameraForward = new THREE.Vector3();
    this.camera.getWorldDirection(this.cameraForward).normalize();
    this.cameraUp = this.camera.up.clone();
    this.cameraRight = new THREE.Vector3();
    this.cameraRight
      .crossVectors(this.cameraForward, this.cameraUp)
      .normalize();
    this.worldUp = new THREE.Vector3(0, 1, 0);

    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const halfHeight = Math.tan(verticalFov / 2);
    const halfWidth = halfHeight * this.camera.aspect;

    this.uniforms = {
      uCamera: {
        value: {
          position: this.camera.position,
          up: this.cameraUp,
          forward: this.cameraForward,
          right: this.cameraRight,
          halfWidth: halfWidth,
          halfHeight: halfHeight,
          focusDistance: this.settings.focusDistance,
          aperture: this.settings.aperture,
        },
      },
      uWorld: {
        value: {
          spheres: this.ptScene.spheres,
        },
      },
      uNumSamples: { value: 1 },
      uMaxRayDepth: { value: 10 },
      uMaterials: { value: this.ptScene.materials },
      uBackgroundColorTop: { value: this.ptScene.backgroundColorTop },
      uBackgroundColorBottom: { value: this.ptScene.backgroundColorBottom },
      uEnableDoF: { value: this.settings.enableDepthOfField },
    };

    this.shaderDemo = new ShaderCanvas({
      width: window.innerWidth,
      height: window.innerHeight,
      fragmentShader: `#define MAX_SPHERES ${ptScene.spheres.length}
       ${fragShader}`,
      uniforms: this.uniforms,
      resolutionScale: 1.0,
    });

    // Setup Post Processing / Composer Passes
    this.renderTarget = new THREE.WebGLRenderTarget(
      0,
      0, // will be set by composer.setSize later
      {
        samples: window.devicePixelRatio === 1 ? 2 : 0,
      }
    );
    this.composer = new EffectComposer(this.renderer, this.renderTarget);
    this.renderPass = new RenderPass(this.ptScene.scene, this.camera);
    this.rtPass = new RenderPass(
      this.shaderDemo.screenScene,
      this.shaderDemo.screenCamera
    );
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2),
      this.ptScene.scene,
      this.camera
    );
    this.setupComposer();

    // Setup Transform Controls
    this.transformControls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );

    // Set Render Loop
    this.gizmo = this.transformControls.getHelper();
    this.gizmoScene = new THREE.Scene();
    this.gizmoScene.add(this.gizmo);

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(this.renderLoop.bind(this));
  }

  private setupComposer() {
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderPass.enabled = !this.settings.raytracingEnabled;
    this.composer.addPass(this.renderPass);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    this.composer.addPass(this.rtPass);
    this.rtPass.enabled = this.settings.raytracingEnabled;

    this.composer.addPass(this.outlinePass);

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaCorrectionPass);
  }

  private renderLoop() {
    this.renderer.clear();

    this.controls?.update();

    if (this.settings.raytracingEnabled) {
      this.camera.updateMatrixWorld();
      this.camera.updateProjectionMatrix();

      this.camera.getWorldDirection(this.cameraForward).normalize();
      this.cameraRight
        .crossVectors(this.cameraForward, this.worldUp)
        .normalize();
      this.cameraUp
        .crossVectors(this.cameraRight, this.cameraForward)
        .normalize();
      this.shaderDemo.render(this.renderer);
    }

    // transform controls
    this.transformControls.update(this.clock.getDelta());

    this.composer.render();
    this.renderer.render(this.gizmoScene, this.camera);

    // Event listeners
    this.attachEventListeners();
  }

  private attachEventListeners() {
    window.addEventListener("resize", () => {
      const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
      const halfHeight = Math.tan(verticalFov / 2);
      const halfWidth = halfHeight * this.camera.aspect;
      this.uniforms.uCamera.value.halfHeight = halfHeight;
      this.uniforms.uCamera.value.halfWidth = halfWidth;

      this.shaderDemo.setDimensions(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("resize", () => {
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    this.controls.addEventListener("change", () => {
      this.shaderDemo.resetAccumulation();
    });

    this.transformControls.addEventListener("change", () => {
      if (this.transformControls.dragging) this.shaderDemo.resetAccumulation();
    });

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
}

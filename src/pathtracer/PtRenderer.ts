import * as THREE from "three";
import { createFullScreenPerspectiveCamera } from "../core/createFullscreenCamera";
import { setupScene } from "../core/setupScene";
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

export default class PtRenderer {
  public scene: THREE.Scene; // TODO : make private
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private shaderDemo: ShaderCanvas;

  private renderTarget: THREE.WebGLRenderTarget;
  private composer: EffectComposer;

  private controls: OrbitControls | undefined;
  private transformControls: TransformControls;

  private gizmo: THREE.Object3D;
  private gizmoScene: THREE.Scene;

  private settings: any;
  private uniforms: any;

  private backgroundColorTop: THREE.Color;
  private backgroundColorBottom: THREE.Color;

  private cameraForward: THREE.Vector3;
  private cameraUp: THREE.Vector3;
  private cameraRight: THREE.Vector3;
  private worldUp: THREE.Vector3;

  constructor(canvas: HTMLCanvasElement, spheres: any[], materials: any[]) {
    this.backgroundColorTop = new THREE.Color(0.5, 0.7, 1); // Sky blue background
    this.backgroundColorBottom = new THREE.Color(1, 1, 1); // White ground

    this.settings = {
      raytracingEnabled: true,
      selectedPosition: new THREE.Vector3(),
      selectedRadius: 0,
      selectedColor: "#000000",
      selectedFuzz: 0,
      backgroundColorTop: this.backgroundColorTop,
      backgroundColorBottom: this.backgroundColorBottom,
      enableDepthOfField: false,
      aperture: 0.0,
      focusDistance: 1.0,
    };

    this.camera = createFullScreenPerspectiveCamera({
      position: new THREE.Vector3(0, 0.5, 2),
      lookAt: new THREE.Vector3(0, 0.5, 0),
      far: 10000,
    });
    const { scene, renderer, controls } = setupScene({
      canvas: canvas,
      camera: this.camera,
      enableOrbitControls: true,
    });
    this.scene = scene;
    this.scene.background = this.backgroundColorTop;
    this.renderer = renderer;
    this.renderer.autoClear = false;
    this.controls = controls;

    this.clock = new THREE.Clock();

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
          spheres: spheres,
          numSpheres: spheres.length,
        },
      },
      uNumSamples: { value: 10 },
      uMaxRayDepth: { value: 10 },
      uMaterials: { value: materials },
      uBackgroundColorTop: { value: this.backgroundColorTop },
      uBackgroundColorBottom: { value: this.backgroundColorBottom },
      uEnableDoF: { value: this.settings.enableDepthOfField },
    };

    this.shaderDemo = new ShaderCanvas({
      width: window.innerWidth,
      height: window.innerHeight,
      fragmentShader: fragShader,
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
    this.setupComposer();

    // Setup Transform Controls
    this.transformControls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );
    this.setupTransformControls();

    // Set Render Loop
    this.gizmo = this.transformControls.getHelper();
    this.gizmoScene = new THREE.Scene();
    this.gizmoScene.add(this.gizmo);

    this.clock = new THREE.Clock();
    renderer.setAnimationLoop(this.renderLoop.bind(this));
  }

  private setupComposer() {
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    window.addEventListener("resize", () => {
      this.composer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    const renderPass = new RenderPass(this.scene, this.camera);
    renderPass.enabled = !this.settings.raytracingEnabled;
    this.composer.addPass(renderPass);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    const rtPass = new RenderPass(
      this.shaderDemo.screenScene,
      this.shaderDemo.screenCamera
    );
    this.composer.addPass(rtPass);
    rtPass.enabled = this.settings.raytracingEnabled;

    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2),
      this.scene,
      this.camera
    );
    this.composer.addPass(outlinePass);

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaCorrectionPass);
  }

  // To Do
  private setupTransformControls() {
    // transformControls.addEventListener("dragging-changed", function (event) {
    //   this.controls.enabled = !event.value;
    // });
    // transformControls.mode = "translate";
    // transformControls.addEventListener("change", () => {
    //   if (transformControls.mode === "scale") {
    //     const scale = selectedObject.scale.x;
    //     selectedObject.scale.set(scale, scale, scale);
    //     spheres[selectedObject.index].radius =
    //       scale * selectedObject.geometry.parameters.radius;
    //     settings.selectedRadius = spheres[selectedObject.index].radius;
    //     selectedRadiusGUI.updateDisplay();
    //   } else {
    //     settings.selectedPosition.copy(selectedObject.position);
    //     selectedPositionXGUI.updateDisplay();
    //     selectedPositionYGUI.updateDisplay();
    //     selectedPositionZGUI.updateDisplay();
    //   }
    // });
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
    // // handle resize
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

    this.controls?.addEventListener("change", () => {
      this.shaderDemo.resetAccumulation();
    });

    this.transformControls.addEventListener("change", () => {
      this.shaderDemo.resetAccumulation();
    });
  }
}

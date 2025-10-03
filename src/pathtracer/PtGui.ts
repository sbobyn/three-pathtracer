import * as THREE from "three";
import { GUI, Controller } from "lil-gui";
import PtRenderer from "./PtRenderer";
import PtScene from "./PtScene";

const materialLabelDict = {
  0: "Lambert",
  1: "Metal",
  2: "Dielectric",
};

export default class PtGui {
  private selectedObject: THREE.Object3D | null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private intersectGroup: THREE.Group;

  private gui: GUI;

  private materialFolder: GUI;
  private selctedObjectFolder: GUI;
  private selectedRadiusGUI: Controller;

  constructor(ptRenderer: PtRenderer, ptScene: PtScene) {
    this.selectedObject = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.intersectGroup = ptScene.intersectGroup;

    this.gui = new GUI({ title: "Settings" });

    const raytracingToggleGUI = this.gui
      .add(ptRenderer.settings, "raytracingEnabled")
      .onChange(() => {
        ptRenderer.shaderDemo.resetAccumulation();
      });
    this.gui
      .addColor(ptRenderer.settings, "backgroundColorTop")
      .onChange((value: string | number | THREE.Color) => {
        const color = new THREE.Color(value);
        ptScene.scene.background = color;
        ptScene.dirLight.color = color;
        ptRenderer.shaderDemo.resetAccumulation();
      });

    this.gui
      .addColor(ptRenderer.settings, "backgroundColorBottom")
      .onChange((value: string | number | THREE.Color) => {
        const color = new THREE.Color(value);
        ptRenderer.uniforms.uBackgroundColorBottom.value = color;
        ptRenderer.shaderDemo.resetAccumulation();
      });

    this.gui.add(ptRenderer.camera, "fov", 10, 120, 1).onChange(() => {
      ptRenderer.camera.updateProjectionMatrix();
      ptRenderer.uniforms.uCamera.value.halfHeight = Math.tan(
        THREE.MathUtils.degToRad(ptRenderer.camera.fov) / 2
      );
      ptRenderer.uniforms.uCamera.value.halfWidth =
        ptRenderer.uniforms.uCamera.value.halfHeight * ptRenderer.camera.aspect;
      ptRenderer.shaderDemo.resetAccumulation();
    });

    const raytracingSettingsFolder = this.gui.addFolder("Raytracing Settings");
    if (!ptRenderer.settings.raytracingEnabled) {
      raytracingSettingsFolder.hide();
    }

    raytracingSettingsFolder
      .add(ptRenderer.uniforms.uNumSamples, "value", 1, 20, 1)
      .onChange(() => {
        ptRenderer.shaderDemo.resetAccumulation();
      })
      .name("Samples");

    raytracingSettingsFolder
      .add(ptRenderer.uniforms.uMaxRayDepth, "value", 1, 20, 1)
      .onChange(() => {
        ptRenderer.shaderDemo.resetAccumulation();
      })
      .name("Max Ray Depth");

    raytracingSettingsFolder
      .add(
        ptRenderer.shaderDemo,
        "resolutionScale",
        [2.0, 1.0, 0.5, 0.25, 0.125, 0.0625]
      )
      .onChange((value: number) => {
        ptRenderer.shaderDemo.updateRenderTarget();
      });

    raytracingToggleGUI.onChange((value: boolean) => {
      ptRenderer.rtPass.enabled = value;
      ptRenderer.renderPass.enabled = !value;
      if (value) {
        raytracingSettingsFolder.show();
      } else {
        raytracingSettingsFolder.hide();
      }
    });

    const toggleDoFGUI = raytracingSettingsFolder.add(
      ptRenderer.settings,
      "enableDepthOfField"
    );
    const apertureGUI = raytracingSettingsFolder
      .add(ptRenderer.settings, "aperture", 0, 0.1, 0.001)
      .onChange((value: number) => {
        ptRenderer.uniforms.uCamera.value.aperture = value;
        ptRenderer.shaderDemo.resetAccumulation();
      });
    if (!ptRenderer.settings.enableDepthOfField) apertureGUI.disable();
    const focusDistGUI = raytracingSettingsFolder
      .add(ptRenderer.settings, "focusDistance", 0.1, 10, 0.1)
      .onChange((value: number) => {
        ptRenderer.uniforms.uCamera.value.focusDistance = value;
        ptRenderer.shaderDemo.resetAccumulation();
      });
    if (!ptRenderer.settings.enableDepthOfField) focusDistGUI.disable();
    toggleDoFGUI.onChange((value: boolean) => {
      ptRenderer.uniforms.uEnableDoF.value = value;
      if (value) {
        apertureGUI.enable();
        focusDistGUI.enable();
      } else {
        apertureGUI.disable();
        focusDistGUI.disable();
      }
      ptRenderer.shaderDemo.resetAccumulation();
    });

    this.selctedObjectFolder = this.gui.addFolder("Selected Object");

    this.selctedObjectFolder
      .add(ptRenderer.transformControls, "mode", ["translate", "scale"])
      .name("transform mode")
      .onChange((value: string) => {
        if (value === "scale") {
          ptRenderer.transformControls.showY = false;
          ptRenderer.transformControls.showZ = false;
        } else {
          ptRenderer.transformControls.showY = true;
          ptRenderer.transformControls.showZ = true;
        }
      });

    const selectedPositionXGUI = this.selctedObjectFolder
      .add(ptRenderer.settings.selectedPosition, "x", -1)
      .onChange((value: number) => {
        if (this.selectedObject) this.selectedObject.position.x = value;
      });
    const selectedPositionYGUI = this.selctedObjectFolder
      .add(ptRenderer.settings.selectedPosition, "y", -1)
      .onChange((value: number) => {
        if (this.selectedObject) this.selectedObject.position.y = value;
      });
    const selectedPositionZGUI = this.selctedObjectFolder
      .add(ptRenderer.settings.selectedPosition, "z", -1)
      .onChange((value: number) => {
        if (this.selectedObject) this.selectedObject.position.z = value;
      });
    this.selectedRadiusGUI = this.selctedObjectFolder
      .add(ptRenderer.settings, "selectedRadius", 0)
      .onChange((value: number) => {
        if (this.selectedObject) {
          ptScene.spheres[this.selectedObject.index].radius = value;
          const scale = value / this.selectedObject.geometry.parameters.radius;
          this.selectedObject.scale.set(scale, scale, scale);
        }
      })
      .name("radius");

    this.materialFolder = this.selctedObjectFolder.addFolder("Material");

    this.selctedObjectFolder.hide();

    // on this.mouse down check for intersection
    window.addEventListener("mousedown", (e) => {
      if (this.gui.domElement.contains(e.target as Node)) return;
      if (ptRenderer.transformControls.dragging) return;

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.checkIntersection(ptRenderer, ptScene);
    });

    ptRenderer.transformControls.addEventListener(
      "dragging-changed",
      function (event) {
        ptRenderer.controls.enabled = !event.value;
      }
    );
    ptRenderer.transformControls.mode = "translate";

    ptRenderer.transformControls.addEventListener("change", () => {
      if (ptRenderer.transformControls.mode === "scale") {
        const scale = this.selectedObject.scale.x;
        this.selectedObject.scale.set(scale, scale, scale);
        ptScene.spheres[this.selectedObject.index].radius =
          scale * this.selectedObject.geometry.parameters.radius;
        ptRenderer.settings.selectedRadius =
          ptScene.spheres[this.selectedObject.index].radius;
        this.selectedRadiusGUI.updateDisplay();
      } else {
        ptRenderer.settings.selectedPosition.copy(this.selectedObject.position);
        selectedPositionXGUI.updateDisplay();
        selectedPositionYGUI.updateDisplay();
        selectedPositionZGUI.updateDisplay();
      }
    });
  }

  checkIntersection(ptRenderer: PtRenderer, ptScene: PtScene) {
    this.raycaster.setFromCamera(this.mouse, ptRenderer.camera);

    const intersects = this.raycaster.intersectObject(
      this.intersectGroup,
      true
    );

    if (intersects.length > 0) {
      this.selectedObject = intersects[0].object;

      ptRenderer.outlinePass.selectedObjects = [this.selectedObject];
      ptRenderer.transformControls.attach(this.selectedObject);
      this.selctedObjectFolder.show();
      // radius display must be manually updated

      ptRenderer.settings.selectedRadius =
        ptScene.spheres[this.selectedObject.index].radius;
      this.selectedRadiusGUI.updateDisplay();
      ptRenderer.settings.selectedColor =
        ptScene.materials[
          ptScene.spheres[this.selectedObject.index].materialId
        ].albedo.getHexString();
      this.populateMaterialGUI(
        this.selectedObject.material,
        ptScene.spheres[this.selectedObject.index].materialId,
        ptRenderer,
        ptScene
      );
    } else {
      ptRenderer.outlinePass.selectedObjects = [];
      ptRenderer.transformControls.detach();
      this.selctedObjectFolder.hide();
    }
  }

  populateMaterialGUI(
    material: THREE.MeshStandardMaterial,
    materialId: number,
    ptRenderer: PtRenderer,
    ptScene: PtScene
  ) {
    this.materialFolder.destroy();
    const materialType = materialLabelDict[ptScene.materials[materialId].type];

    this.materialFolder = this.selctedObjectFolder.addFolder(
      `Material - ${materialId} - ${materialType}`
    );

    this.materialFolder.addColor(material, "color").onChange(() => {
      material.needsUpdate = true;
      ptScene.materials[materialId].albedo = material.color;
      ptRenderer.shaderDemo.resetAccumulation();
    });

    if (materialType === "Metal") {
      if ("roughness" in material) {
        this.materialFolder.add(material, "roughness", 0, 1).onChange(() => {
          material.needsUpdate = true;
          ptScene.materials[materialId].fuzz = material.roughness;
          ptRenderer.shaderDemo.resetAccumulation();
        });
      }
    }

    if (materialType === "Dielectric") {
      if ("ior" in material) {
        this.materialFolder.add(material, "ior", 0, 2.5).onChange(() => {
          material.needsUpdate = true;
          ptScene.materials[materialId].ior = material.ior;
          ptRenderer.shaderDemo.resetAccumulation();
        });
      }
    }

    this.materialFolder.show();
  }
}

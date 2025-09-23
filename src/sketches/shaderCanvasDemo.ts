import * as THREE from "three";
import { ShaderCanvas } from "../core/ShaderCanvas";
import fragShader from "./shaders/shaderCanvasExample.fs";

export default function (): THREE.WebGLRenderer {
  const shaderDemo = new ShaderCanvas({
    fragmentShader: fragShader,
  });

  shaderDemo.start();

  return shaderDemo.getRenderer();
}

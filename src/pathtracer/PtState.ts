import * as THREE from "three";

export interface PtState {
  pathtracingEnabled: boolean;
  backgroundColorTop: THREE.Color;
  backgroundColorBottom: THREE.Color;
  fov: number;
  enableDepthOfField: boolean;
  aperture: number;
  focusDistance: number;
}

export const defaultState: PtState = {
  pathtracingEnabled: true,
  backgroundColorTop: new THREE.Color(0.7, 0.8, 1.0),
  backgroundColorBottom: new THREE.Color(1.0, 1.0, 1.0),
  fov: 20,
  enableDepthOfField: false,
  aperture: 0.0,
  focusDistance: 1.0,
};

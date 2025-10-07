# Three.js WebGL Pathtracer

Toy/demo Realtime WebGL-based Pathtracer integrated with Three.js, for educaitonal purposes.

Live demo is available here: https://sbobyn.github.io/three-pathtracer/

So far, the Pathtracer closely follows Peter Shirely's [Ray Tracing in One Weekend](https://raytracing.github.io/) (part 1). See the todos below for what's planned next.

![gif demo](three-pathtracer.gif)

## Detail

The pathtracer itself is contained in `main.fs`. So far, it closely follows RTIOW,
except that it's written in GLSL so there's some changes to the data structures,
no recursion, etc. and the random number generation is based off of the hash functionsa
from this ShaderToy: https://www.shadertoy.com/view/4djSRW

Right now it supports:

- ray-sphere intersection
- diffuse, metal, dielectric materials
- depth-of-field / defocus blur

Additionally progressive pathtracing is `ShaderCanvas.ts`:

- two render targets are used, swapped each frame
- the previous render target is uploaded as a texture to the current redner target
  to accumulate to
- accumulation is reset when the camera moves

The Three.js integration includes:a

- `THREE.Scene` scene graph used to manage scenes (spheres, camera)
  - a Three.js renderer is used as a debug renderer (can be toggled in the gui)
- camera orbit controls via `THREE.OrbitControls`
- object picking via `THREE.Raycaster`
- transform controls on selected object via `THREE.TransformControls`
- outline on selected object via postprocessing [OutlinePass](https://threejs.org/examples/webgl_postprocessing_outline.html)

In `PtApp`, a debug gui is implemented via `lil-gui` which can be used to change the pathtracer settings and edit selected object's transform and material properties.

# Running locally

With pnpm:

```sh
$pnpm i
$pnpm dev
```

## To Do Next

- [ ] skybox/environent map
- [ ] integrate threejs [sky example](https://threejs.org/examples/?q=sun#webgl_shaders_sky) for environment map using [THREE.CubeCamera](https://threejs.org/docs/#api/en/cameras/CubeCamera)

From [RTIOW Part 2](https://raytracing.github.io/books/RayTracingTheNextWeek.html), add:

- [ ] Textures
- [ ] Quads
- [ ] Area lights

Then

- [ ] Add ray-triangle intersection
- [ ] Add mesh-loading
- [ ] Convert to compute shader + replace hittable-related uniforms (spheres, tris) with textures
- [ ] Add bvh to accelerate hit testing using https://github.com/gkjohnson/three-mesh-bvh

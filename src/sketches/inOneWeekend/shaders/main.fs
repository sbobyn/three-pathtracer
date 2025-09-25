precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;

struct Camera {
    vec3 position;
    vec3 forward;
    vec3 up;
    vec3 right;
    float halfWidth;
    float halfHeight;
};

uniform Camera uCamera;

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 rayAt(Ray r, float t) {
    return r.origin + t * r.direction;
}

float lengthSquared(vec3 a) {
    return dot(a, a);
}

struct Sphere {
    vec3 position;
    float radius;
};

struct Hit {
    float t;
    vec3 position;
    vec3 normal;
    bool frontFace;
};

struct Interval {
    float min;
    float max;
};

bool intervalSurrounds(Interval i, float x) {
    return i.min < x && x < i.max;
}

#define MAX_SPHERES 2
struct World {
    Sphere spheres[MAX_SPHERES];
    int numSpheres;
};

uniform World uWorld;

void setFaceNormal(Ray ray, vec3 outwardNormal, inout Hit hit) {
    hit.frontFace = dot(ray.direction, outwardNormal) < 0.0;
    hit.normal = hit.frontFace ? outwardNormal : -outwardNormal;
}

bool hitSphere(Sphere s, Ray r, Interval rayInt, out Hit hit) {
    vec3 toSphere = s.position - r.origin;
    float a = lengthSquared(r.direction);
    float h = dot(r.direction, toSphere);
    float c = lengthSquared(toSphere) - s.radius * s.radius;

    float discriminant = h * h - a * c;
    if (discriminant < 0.) {
        return false;
    }

    float sqrtD = sqrt(discriminant);

    // find nearest root in accepted range
    float root = (h - sqrtD) / a;
    if (!intervalSurrounds(rayInt, root)) { // no hit, try other root
        root = (h + sqrtD) / a;
        if (!intervalSurrounds(rayInt, root)) { // no hit
            return false;
        }
    }

    hit.t = root;
    hit.position = rayAt(r, hit.t);

    vec3 outwardN = (hit.position - s.position) / s.radius;
    setFaceNormal(r, outwardN, hit);
    return true;
}

bool hitWorld(World world, Ray ray, Interval rayInt, out Hit hit) {
    Hit tempHit;
    bool hitAnything = false;
    float closestSoFar = rayInt.max;

    for (int i = 0; i < world.numSpheres; i++) {
        Sphere sphere = world.spheres[i];

        if (hitSphere(sphere, ray, Interval(rayInt.min, closestSoFar), tempHit)) {
            hitAnything = true;
            closestSoFar = tempHit.t;
            hit = tempHit;
        }
    }

    return hitAnything;
}

vec3 rayColor(Ray r, World w) {
    Hit hit;
    Interval rayInt = Interval(1e-3, 1e4);
    bool didHit = hitWorld(w, r, rayInt, hit);

    if (didHit) {
        return 0.5 * (hit.normal + 1.);
    }

    vec3 unitDir = normalize(r.direction);
    float a = 0.5 * (unitDir.y + 1.0);

    return (1.0 - a) * vec3(1) + a * vec3(0.5, 0.7, 1);
}

// source: Hash without Sine: https://www.shadertoy.com/view/4djSRW
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

uniform float uNumSamples;

void main() {
    vec3 color = vec3(0);
    for (int s = 0; s < int(uNumSamples); s++) {
        vec2 rand = hash22(vUv + vec2(float(s)));
        vec2 offset = (rand - 0.5) / uResolution;
        vec2 uv = vUv + offset;

        vec3 rayDir = uCamera.forward
                + uv.x * uCamera.halfWidth * uCamera.right
                + uv.y * uCamera.halfHeight * uCamera.up;

        Ray ray = Ray(uCamera.position, normalize(rayDir));
        color += rayColor(ray, uWorld);
    }

    gl_FragColor = vec4(color / uNumSamples, 1.0);
}

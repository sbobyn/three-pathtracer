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

struct Material {
    int type; // 0: lambertian
    vec3 albedo;
};

struct Sphere {
    vec3 position;
    float radius;
    int materialId;
};

struct Hit {
    float t;
    vec3 position;
    vec3 normal;
    bool frontFace;
    int materialId;
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

uniform Material uMaterials[MAX_SPHERES];

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
            hit.materialId = world.spheres[i].materialId;
        }
    }

    return hitAnything;
}

// vec3 rayColorNormal(Ray r, World w) {
//     Hit hit;
//     Interval rayInt = Interval(1e-3, 1e4);
//     bool didHit = hitWorld(w, r, rayInt, hit);

//     if (didHit) {
//         return 0.5 * (hit.normal + 1.);
//     }

//     vec3 unitDir = normalize(r.direction);
//     float a = 0.5 * (unitDir.y + 1.0);

//     return (1.0 - a) * vec3(1) + a * vec3(0.5, 0.7, 1);
// }

#define PI 3.141592653

// source: Hash without Sine: https://www.shadertoy.com/view/4djSRW
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 hash32(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

// analytical random in unit sphere https://www.shadertoy.com/view/7tBXDh
vec3 random_in_unit_sphere(vec2 p) {
    vec3 rand = hash32(p);
    float phi = 2.0 * PI * rand.x;
    float cosTheta = 2.0 * rand.y - 1.0;
    float u = rand.z;

    float theta = acos(cosTheta);
    float r = pow(u, 1.0 / 3.0);

    float x = r * sin(theta) * cos(phi);
    float y = r * sin(theta) * sin(phi);
    float z = r * cos(theta);

    return vec3(x, y, z);
}

vec3 random_unit_vector(vec2 p) {
    return normalize(random_in_unit_sphere(p));
}

bool nearZero(vec3 p) {
    float s = 1e-8;
    return p.x < s && p.y < s && p.z < s;
}

vec3 scatter(Hit hit, vec2 seed) {
    vec3 scatterDir = hit.normal + random_unit_vector(seed);
    if (nearZero(scatterDir)) { // catch degenerate scatter direction
        scatterDir = hit.normal;
    }
    return normalize(scatterDir);
}

uniform int uMaxRayDepth;

vec3 rayColor(Ray r, World w, vec2 seed) {
    Hit hit;

    vec3 color = vec3(1);

    int depth;
    for (depth = 0; depth < uMaxRayDepth; depth++) {
        Interval rayInt = Interval(1e-3, 1e4);
        bool didHit = hitWorld(w, r, rayInt, hit);

        if (didHit) { // hit a sphere
            r.origin = hit.position;
            r.direction = scatter(hit, seed * 256. + float(depth));
            color *= uMaterials[hit.materialId].albedo;
        } else { // hit sky
            vec3 unitDir = normalize(r.direction);
            float a = 0.5 * (unitDir.y + 1.0);

            vec3 backgroundColor = (1.0 - a) * vec3(1) + a * vec3(0.5, 0.7, 1);
            color *= backgroundColor;
            break;
        }
    }

    if (depth == uMaxRayDepth) { // never hit sky
        return vec3(0);
    }

    return color;
}

uniform float uNumSamples;

void main() {
    vec3 color = vec3(0);
    for (int s = 0; s < int(uNumSamples); s++) {
        vec2 seed2 = vUv + vec2(float(s));
        vec2 rand = hash22(seed2);
        vec2 offset = (rand - 0.5) / uResolution;
        vec2 uv = vUv + offset;

        vec3 rayDir = uCamera.forward
                + uv.x * uCamera.halfWidth * uCamera.right
                + uv.y * uCamera.halfHeight * uCamera.up;

        Ray ray = Ray(uCamera.position, normalize(rayDir));
        color += rayColor(ray, uWorld, seed2);
    }
    color /= uNumSamples;

    color = sqrt(color); // gamma correction
    gl_FragColor = vec4(color, 1.0);
}

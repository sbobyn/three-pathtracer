precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;

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

#define MAX_SPHERES 100
struct World {
    Sphere spheres[MAX_SPHERES];
    int numSpheres;
};

void setFaceNormal(Ray ray, vec3 outwardNormal, out Hit hit) {
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
    hit.position = rayAt(r, root);

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
        rayInt.max = closestSoFar;

        if (hitSphere(sphere, ray, rayInt, tempHit)) {
            hitAnything = true;
            closestSoFar = tempHit.t;
            hit = tempHit;
        }
    }

    return hitAnything;
}

vec3 rayColor(Ray r, World w) {
    Hit hit;
    Interval rayInt = Interval(0.0001, 10000.);
    bool didHit = hitWorld(w, r, rayInt, hit);

    if (didHit) {
        return 0.5 * (hit.normal + 1.);
    }

    vec3 unitDir = normalize(r.direction);
    float a = 0.5 * (unitDir.y + 1.0);

    return (1.0 - a) * vec3(1) + a * vec3(0.5, 0.7, 1);
}

uniform mat4 uInvViewProjMatrix;
uniform vec3 uCameraPosition;

void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = vUv;
    uv.x *= aspect;

    vec4 rayClip = vec4(uv, -1.0, 1.0); // view plane at z = -1
    vec4 rayWorld = uInvViewProjMatrix * rayClip;
    rayWorld /= rayWorld.w;

    vec3 rayDir = normalize(rayWorld.xyz - uCameraPosition);

    Ray ray = Ray(uCameraPosition, rayDir);

    Sphere sphere1 = Sphere(vec3(0, 0, 0), 0.5);
    Sphere sphere2 = Sphere(vec3(0.0, -100.5, 0), 100.);

    World world;
    world.spheres[0] = sphere1;
    world.spheres[1] = sphere2;
    world.numSpheres = 2;

    vec3 color = rayColor(ray, world);
    gl_FragColor = vec4(color, 1.0);
}

precision highp float;

uniform vec2 uResolution;

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 at(Ray r, float t) {
    return r.origin + t * r.direction;
}

struct Sphere {
    vec3 position;
    float radius;
};

float hitSphere(Sphere s, Ray r) {
    vec3 toSphere = s.position - r.origin;
    float a = dot(r.direction, r.direction);
    float b = -2. * dot(r.direction, toSphere);
    float c = dot(toSphere, toSphere) - s.radius * s.radius;
    float discriminant = b * b - 4. * a * c;

    if (discriminant < 0.) {
        return -1.;
    }

    return (-b - sqrt(discriminant)) / (2. * a);
}

vec3 rayColor(Ray r) {
    Sphere s = Sphere(vec3(0, 0, -1), 0.5);
    float t = hitSphere(s, r);

    if (t > 0.) {
        vec3 N = normalize(at(r, t) - s.position);
        return 0.5 * (N + 1.);
    }

    vec3 unitDir = normalize(r.direction);
    float a = 0.5 * (unitDir.y + 1.0);

    return (1.0 - a) * vec3(1) + a * vec3(0.5, 0.7, 1);
}

void main() {
    float focalLength = 1.0;
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0; // to ndc
    uv.y *= -1.0;
    uv.x *= aspect;

    vec3 cameraPos = vec3(0);

    vec3 rayDir = normalize(cameraPos - vec3(uv, focalLength));

    Ray r = Ray(cameraPos, rayDir);

    vec3 color = rayColor(r);
    gl_FragColor = vec4(color, 1.0);
}

precision highp float;

uniform vec2 uResolution;

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 rayColor(Ray r) {
    vec3 unitDir = normalize(r.direction);
    float a = 0.5 * (unitDir.y + 1.0);

    return (1.0 - a) * vec3(1) + a * vec3(0.5, 0.7, 1);
}

void main() {
    float focalLength = 1.0;
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0; // to ndc
    uv.x *= aspect;

    vec3 cameraPos = vec3(0);

    vec3 rayDir = vec3(uv, focalLength) - cameraPos;

    Ray r = Ray(cameraPos, rayDir);

    vec3 color = rayColor(r);
    gl_FragColor = vec4(color, 1.0);
}
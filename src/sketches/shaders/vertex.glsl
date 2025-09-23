uniform float uTime;

varying float vElevation;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    vec2 frequency = vec2(10., 5.);
    vec2 amplitude = vec2(0.1, 0.1);

    vElevation = sin(modelPosition.x * frequency.x - uTime) * amplitude.x;
    vElevation += sin(modelPosition.z * frequency.y - uTime) * amplitude.y;

    modelPosition.y += vElevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    float bound = max(amplitude.x, amplitude.y);
    // remap elevation to [0, 1] range
    vElevation = (vElevation + bound) / (2.0 * bound);
}
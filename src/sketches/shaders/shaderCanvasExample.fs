precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uMouse;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 mouse = uMouse.xy / uResolution;

    float dist = distance(uv, mouse);
    float brightness = 1.0 - smoothstep(.4, 1., dist);

    vec3 baseColor = 0.5 + 0.5 * cos(uTime + uv.xyx + vec3(0.0, 2.0, 4.0));
    gl_FragColor = vec4(baseColor * brightness, 1.0);
}

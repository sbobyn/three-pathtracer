precision highp float;

uniform vec2 uResolution;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    uv.y = 1.0 - uv.y;

    vec3 color = vec3(uv, 0);

    gl_FragColor = vec4(color, 1.0);
}

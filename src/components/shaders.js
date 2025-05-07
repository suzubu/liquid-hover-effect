// src/components/shaders.js

export const vertexShader = `
precision mediump float;

varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const fragmentShader = `
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_brush;
uniform vec2 u_mouse;
uniform float u_radius;
uniform float u_time;
varying vec2 v_uv;

void main() {
  vec2 brushUV = (v_uv - u_mouse) / u_radius + 0.5;

  // Sample brush alpha (transparency)
  float mask = texture2D(u_brush, brushUV).a;

  // Increase strength by exponent
  float strength = pow(mask, 2.5);
  strength = clamp(strength, 0.0, 1.0);

  // Background turbulence (always moving a little)
  vec2 baseWarp = 0.01 * vec2(
    sin(v_uv.y * 10.0 + u_time * 0.75),
    cos(v_uv.x * 10.0 - u_time * 0.75)
  );

  // Additional turbulence where brush is active
  vec2 brushWarp = strength * 0.1 * vec2(
    sin(v_uv.y * 20.0 + u_time * 2.0),
    sin(v_uv.x * 40.0 - u_time * 2.0)
  );

  // Final distorted UVs
  vec2 finalUV = v_uv + baseWarp + brushWarp;

  // Sample base texture with finalUV
  vec4 color = texture2D(u_texture, finalUV);

  gl_FragColor = color;
}
`;

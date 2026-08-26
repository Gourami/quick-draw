# @stilogik/quick-draw

Tiny first-party helpers for drawing to a canvas with WebGL. No Three.js, no gl-matrix, no CDN.

```bash
npm install @stilogik/quick-draw
```

Requires a browser with WebGL. `getGL` asks for **WebGL2** first and falls back to WebGL1. The example below uses GLSL ES 1.00 so it runs on both.

```html
<canvas id="c" style="width: 400px; height: 400px;"></canvas>
<script type="module">
  import {
    BufferObject,
    GLUtilities,
    Matrix4,
  } from "@stilogik/quick-draw";

  const canvas = document.getElementById("c");
  const gl = GLUtilities.getGL(canvas);
  if (!gl) throw new Error("WebGL is not available");

  GLUtilities.resetViewport(gl, canvas);

  const vs = `
    attribute vec3 aPosition;
    uniform mat4 uProjection;
    uniform mat4 uModelView;
    void main() {
      gl_Position = uProjection * uModelView * vec4(aPosition, 1.0);
    }
  `;
  const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0.2, 0.7, 1.0, 1.0);
    }
  `;

  const program = GLUtilities.initShaders(gl, vs, fs);
  gl.useProgram(program);
  const info = GLUtilities.loadProgramInfo(gl, program);

  const positions = new Float32Array([0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
  const buffer = new BufferObject(gl, {
    name: "position",
    data: positions,
    numComponents: 3,
    attribLoc: info.attribLocations.aPosition,
  });
  GLUtilities.loadBuffers(gl, [buffer]);

  const projection = new Matrix4().setOrtho(-1, 1, -1, 1, -1, 1);
  const modelView = new Matrix4();
  gl.uniformMatrix4fv(info.uniformLocations.uProjection, false, projection.elements);
  gl.uniformMatrix4fv(info.uniformLocations.uModelView, false, modelView.elements);

  gl.clearColor(0.1, 0.1, 0.12, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
</script>
```

Call `GLUtilities.resetViewport(gl, canvas)` on window resize so the drawing buffer stays aligned with CSS size × `devicePixelRatio`.

## API

| Export | Role |
| --- | --- |
| `GLUtilities` | Context, shaders, program info, viewport, buffer upload |
| `BufferObject` | GPU buffer + vertex-attrib metadata |
| `Matrix4` | Column-major 4×4 transforms (`elements` is a `Float32Array`) |
| `Vector3` / `Vector4` | Small vector helpers used by `Matrix4` |

`loadProgramInfo` introspects active attributes and uniforms from the linked program. Use the shader names as keys (`info.attribLocations.aPosition`, `info.uniformLocations.uProjection`, …).

TypeScript types ship with the package (`dist/*.d.ts`).

## Migrating from 1.x

This is a breaking release (`2.0.0`):

- `GLUtilities.initShaders(gl, vertexSource, fragmentSource)` takes two strings, not `[vs, fs]`.
- `GLUtilities.loadProgramInfo` returns name-keyed maps from the linked program. It no longer hardcodes `aVertexPosition` / `aVertexColor` / the three matrix uniforms.
- `BufferObject` takes an options object: `new BufferObject(gl, { data, numComponents, attribLoc })`.
- Shader compile/link failures throw `Error` (with the WebGL info log) instead of returning `null`.
- `getGL` no longer writes `gl.version` or `gl.programs`, and does not `console.log` on success.

`BufferObject`, `GLUtilities`, `Matrix4`, and `Vector3` are still the public names. `Vector4` is new (used by `Matrix4.multiplyVector4`).

## License

MIT

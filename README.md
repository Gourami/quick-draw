# @stilogik/quick-draw

Tiny first-party helpers for drawing to an HTML canvas with WebGL. No Three.js, no gl-matrix, no CDN.

```bash
npm install @stilogik/quick-draw
```

Requires a browser with WebGL2 (preferred) or WebGL1. The math classes (`Matrix4`, `Vector3`, `Vector4`) also run in Node.

## Minimal example

```js
import { BufferObject, GLUtilities, Matrix4 } from "@stilogik/quick-draw";

const canvas = document.querySelector("canvas");
const gl = GLUtilities.getGL(canvas);
if (!gl) throw new Error("WebGL is not available");

const { width, height } = GLUtilities.resetViewport(gl, canvas);

const vs = `#version 300 es
in vec4 aPosition;
uniform mat4 uModelView;
uniform mat4 uProjection;
void main() {
  gl_Position = uProjection * uModelView * aPosition;
}`;

const fs = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() {
  outColor = vec4(1.0, 0.4, 0.2, 1.0);
}`;

const program = GLUtilities.initShaders(gl, vs, fs);
if (!program) throw new Error("Shader compile/link failed");

const info = GLUtilities.loadProgramInfo(gl, program);

const positions = new Float32Array([0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
const positionBuffer = new BufferObject(gl, {
  data: positions,
  numComponents: 3,
  attribLocation: info.attribLocations.aPosition,
});
GLUtilities.loadBuffers(gl, [positionBuffer]);

const projection = new Matrix4().setPerspective(45, width / height, 0.1, 100);
const modelView = new Matrix4().setLookAt(0, 0, 3, 0, 0, 0, 0, 1, 0);

gl.useProgram(program);
gl.uniformMatrix4fv(info.uniformLocations.uProjection, false, projection.elements);
gl.uniformMatrix4fv(info.uniformLocations.uModelView, false, modelView.elements);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

WebGL1 shaders work too: use `attribute` / `varying` instead of `#version 300 es` and `in` / `out`.

## API

| Export | Role |
| --- | --- |
| `GLUtilities.getGL(canvas, attributes?)` | WebGL2, then WebGL1. Returns the context or `null`. Does not hang extra properties on `gl`. |
| `GLUtilities.initShaders(gl, vertSrc, fragSrc)` | Compile and link. Returns a `WebGLProgram` or `null`. |
| `GLUtilities.loadProgramInfo(gl, program)` | Reflects active attrib/uniform **names** from the linked program. |
| `GLUtilities.resetViewport(gl, canvas, dpr?)` | Sizes the drawing buffer with `devicePixelRatio`, then sets the viewport. |
| `GLUtilities.loadBuffers(gl, bufferObjects)` | Uploads data; enables attribs when `attribLocation >= 0`. |
| `BufferObject` | GPU buffer plus vertex-attrib metadata. Options object, not a hardcoded shader layout. |
| `Matrix4` | Column-major 4×4 (`translate`, `rotate`, `scale`, `lookAt`, `perspective`, `invert`, …). |
| `Vector3` / `Vector4` | Small float vectors used by the matrix helpers. |

## Migrating from 1.x

This is **2.0.0**. The public class names are the same; several call sites need updates:

- `initShaders(gl, [vs, fs])` → `initShaders(gl, vs, fs)`
- `loadProgramInfo` no longer hardcodes `aVertexPosition` / `aVertexColor` / `uProjectionMatrix`. Use `info.attribLocations.aPosition` (or whatever your shader named it) and `info.uniformLocations.uProjection`.
- `BufferObject` takes `(gl, { data, numComponents, attribLocation, ... })` instead of positional arguments.
- `getGL` does not set `gl.version` or `gl.programs`.
- `Matrix4.multiply()` now returns `this` (chainable). `Vector4` is exported for `multiplyVector4`.

## License

MIT

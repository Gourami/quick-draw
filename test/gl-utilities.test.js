import assert from "node:assert/strict";
import { test } from "node:test";
import { BufferObject, GLUtilities } from "../dist/index.js";

const VERTEX_SHADER = 0x8b31;
const FRAGMENT_SHADER = 0x8b30;
const COMPILE_STATUS = 0x8b81;
const LINK_STATUS = 0x8b82;
const ARRAY_BUFFER = 0x8892;
const ELEMENT_ARRAY_BUFFER = 0x8893;
const STATIC_DRAW = 0x88e4;
const FLOAT = 0x1406;
const ACTIVE_ATTRIBUTES = 0x8b89;
const ACTIVE_UNIFORMS = 0x8b86;

function mockGL(overrides = {}) {
  return {
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    COMPILE_STATUS,
    LINK_STATUS,
    ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER,
    STATIC_DRAW,
    FLOAT,
    ACTIVE_ATTRIBUTES,
    ACTIVE_UNIFORMS,
    drawingBufferWidth: 0,
    drawingBufferHeight: 0,
    createShader: () => ({ id: "shader" }),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => "",
    deleteShader() {},
    createProgram: () => ({ id: "program" }),
    attachShader() {},
    detachShader() {},
    linkProgram() {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => "",
    deleteProgram() {},
    getActiveAttrib: () => null,
    getAttribLocation: () => -1,
    getActiveUniform: () => null,
    getUniformLocation: () => null,
    createBuffer: () => ({ id: "buffer" }),
    bindBuffer() {},
    bufferData() {},
    vertexAttribPointer() {},
    enableVertexAttribArray() {},
    viewport() {},
    ...overrides,
  };
}

test("getGL prefers webgl2 and does not set gl.version", () => {
  const gl2 = { CONTEXT: "webgl2" };
  const canvas = {
    getContext(type) {
      if (type === "webgl2") return gl2;
      return { CONTEXT: "webgl" };
    },
  };
  const gl = GLUtilities.getGL(canvas);
  assert.equal(gl, gl2);
  assert.equal("version" in gl, false);
});

test("getGL falls back to webgl", () => {
  const gl1 = { CONTEXT: "webgl" };
  const canvas = {
    getContext(type) {
      if (type === "webgl2") return null;
      if (type === "webgl") return gl1;
      return null;
    },
  };
  assert.equal(GLUtilities.getGL(canvas), gl1);
});

test("getGL returns null when neither context exists", () => {
  const canvas = { getContext: () => null };
  assert.equal(GLUtilities.getGL(canvas), null);
});

test("loadShader ignores a non-empty info log when COMPILE_STATUS is true", () => {
  const gl = mockGL({
    getShaderParameter: () => true,
    getShaderInfoLog: () => "warning: unused variable",
  });
  const shader = GLUtilities.loadShader(gl, "void main(){}", gl.VERTEX_SHADER);
  assert.ok(shader);
});

test("loadShader fails on COMPILE_STATUS false", () => {
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(" "));
  try {
    const gl = mockGL({
      getShaderParameter: () => false,
      getShaderInfoLog: () => "syntax error",
    });
    assert.equal(GLUtilities.loadShader(gl, "nope", gl.FRAGMENT_SHADER), null);
    assert.match(logs.join("\n"), /syntax error/);
  } finally {
    console.error = original;
  }
});

test("createProgram uses gl.getProgramInfoLog, not program.getInfoLog", () => {
  let usedGlInfoLog = false;
  let usedProgramInfoLog = false;
  const program = {
    getInfoLog() {
      usedProgramInfoLog = true;
      return "should not be called";
    },
  };
  const gl = mockGL({
    createProgram: () => program,
    getProgramParameter: (_prog, pname) => {
      if (pname === COMPILE_STATUS) return true;
      if (pname === LINK_STATUS) return false;
      return true;
    },
    getProgramInfoLog() {
      usedGlInfoLog = true;
      return "link failed: mismatched types";
    },
  });
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(" "));
  try {
    assert.equal(GLUtilities.createProgram(gl, "vs", "fs"), null);
  } finally {
    console.error = original;
  }
  assert.equal(usedGlInfoLog, true);
  assert.equal(usedProgramInfoLog, false);
  assert.match(logs.join("\n"), /mismatched types/);
});

test("initShaders does not attach a programs array to gl", () => {
  const gl = mockGL();
  const program = GLUtilities.initShaders(gl, "vs", "fs");
  assert.ok(program);
  assert.equal("programs" in gl, false);
});

test("loadProgramInfo reflects active attribs and uniforms by name", () => {
  const attribs = [{ name: "aPosition" }, { name: "aColor" }];
  const uniforms = [{ name: "uProjection" }, { name: "uLights[0]" }];
  const gl = mockGL({
    getProgramParameter: (_prog, pname) => {
      if (pname === ACTIVE_ATTRIBUTES) return attribs.length;
      if (pname === ACTIVE_UNIFORMS) return uniforms.length;
      return 0;
    },
    getActiveAttrib: (_prog, i) => attribs[i],
    getAttribLocation: (_prog, name) => (name === "aPosition" ? 0 : 1),
    getActiveUniform: (_prog, i) => uniforms[i],
    getUniformLocation: (_prog, name) => ({ name }),
  });
  const info = GLUtilities.loadProgramInfo(gl, { id: "program" });
  assert.equal(info.attribLocations.aPosition, 0);
  assert.equal(info.attribLocations.aColor, 1);
  assert.equal(info.uniformLocations.uProjection.name, "uProjection");
  assert.equal(info.uniformLocations.uLights.name, "uLights[0]");
  assert.equal(Array.isArray(info.attribLocations), false);
});

test("resetViewport sizes the drawing buffer by dpr", () => {
  const viewports = [];
  const canvas = { clientWidth: 100, clientHeight: 50, width: 0, height: 0 };
  const gl = mockGL({
    drawingBufferWidth: 200,
    drawingBufferHeight: 100,
    viewport(x, y, w, h) {
      viewports.push([x, y, w, h]);
    },
  });
  const size = GLUtilities.resetViewport(gl, canvas, 2);
  assert.equal(canvas.width, 200);
  assert.equal(canvas.height, 100);
  assert.deepEqual(size, { width: 200, height: 100, dpr: 2 });
  assert.deepEqual(viewports[0], [0, 0, 200, 100]);
});

test("BufferObject and loadBuffers do not assume a shader layout", () => {
  const uploaded = [];
  const attribs = [];
  const gl = mockGL({
    bufferData(target, data, usage) {
      uploaded.push({ target, data, usage });
    },
    vertexAttribPointer(loc, size, type, normalized, stride, offset) {
      attribs.push({ loc, size, type, normalized, stride, offset });
    },
    enableVertexAttribArray() {},
  });
  const positions = new Float32Array([0, 1, 0]);
  const indices = new Uint16Array([0, 1, 2]);
  const position = new BufferObject(gl, {
    name: "position",
    data: positions,
    numComponents: 3,
    attribLocation: 7,
  });
  const index = new BufferObject(gl, {
    data: indices,
    target: gl.ELEMENT_ARRAY_BUFFER,
  });
  GLUtilities.loadBuffers(gl, [position, index]);
  assert.equal(uploaded.length, 2);
  assert.equal(attribs.length, 1);
  assert.equal(attribs[0].loc, 7);
  assert.equal(attribs[0].size, 3);
  assert.equal(index.glAttribLoc, -1);
});

test("loadBuffers skips attrib setup when location is -1", () => {
  let attribCalls = 0;
  const gl = mockGL({
    vertexAttribPointer() {
      attribCalls += 1;
    },
  });
  const bo = new BufferObject(gl, { data: new Float32Array(3), numComponents: 3 });
  GLUtilities.loadBuffers(gl, [bo]);
  assert.equal(attribCalls, 0);
});

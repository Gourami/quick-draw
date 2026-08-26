import assert from "node:assert/strict";
import { describe, it } from "node:test";
import GLUtilities from "../dist/GLUtilities.js";

const VERTEX_SHADER = 0x8b31;
const FRAGMENT_SHADER = 0x8b30;
const COMPILE_STATUS = 0x8b81;
const LINK_STATUS = 0x8b82;
const ACTIVE_ATTRIBUTES = 0x8b89;
const ACTIVE_UNIFORMS = 0x8b86;
const ARRAY_BUFFER = 0x8892;
const ELEMENT_ARRAY_BUFFER = 0x8893;
const FLOAT = 0x1406;
const STATIC_DRAW = 0x88e4;

function createMockGL(overrides = {}) {
  const shaders = new Map();
  const programs = new Map();
  let nextId = 1;

  const gl = {
    VERTEX_SHADER,
    FRAGMENT_SHADER,
    COMPILE_STATUS,
    LINK_STATUS,
    ACTIVE_ATTRIBUTES,
    ACTIVE_UNIFORMS,
    ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER,
    FLOAT,
    STATIC_DRAW,
    drawingBufferWidth: 0,
    drawingBufferHeight: 0,
    programs: undefined,
    version: undefined,
    viewportCalls: [],
    attribPointers: [],
    enabledAttribs: [],
    boundBuffers: [],
    bufferDataCalls: [],
    createShader(type) {
      const shader = { id: nextId++, type, source: "", deleted: false };
      shaders.set(shader, { compileOk: true, infoLog: "warning: unused variable\n" });
      return shader;
    },
    shaderSource(shader, source) {
      shader.source = source;
    },
    compileShader() {},
    getShaderParameter(shader, pname) {
      if (pname === COMPILE_STATUS) return shaders.get(shader).compileOk;
      return null;
    },
    getShaderInfoLog(shader) {
      return shaders.get(shader).infoLog;
    },
    deleteShader(shader) {
      shader.deleted = true;
    },
    createProgram() {
      const program = { id: nextId++, deleted: false };
      programs.set(program, { linkOk: true, infoLog: "" });
      return program;
    },
    attachShader() {},
    linkProgram() {},
    getProgramParameter(program, pname) {
      if (pname === LINK_STATUS) return programs.get(program).linkOk;
      if (pname === ACTIVE_ATTRIBUTES) return 2;
      if (pname === ACTIVE_UNIFORMS) return 1;
      return null;
    },
    getProgramInfoLog(program) {
      return programs.get(program).infoLog;
    },
    deleteProgram(program) {
      program.deleted = true;
    },
    getActiveAttrib(_program, index) {
      return [
        { name: "aPosition", size: 1, type: FLOAT },
        { name: "aColor", size: 1, type: FLOAT },
      ][index];
    },
    getAttribLocation(_program, name) {
      return { aPosition: 0, aColor: 1 }[name] ?? -1;
    },
    getActiveUniform(_program, index) {
      return [{ name: "uProjection", size: 1, type: 0x8b5c }][index];
    },
    getUniformLocation(_program, name) {
      return { id: name };
    },
    viewport(x, y, width, height) {
      this.viewportCalls.push([x, y, width, height]);
    },
    bindBuffer(target, buffer) {
      this.boundBuffers.push([target, buffer]);
    },
    bufferData(target, data, usage) {
      this.bufferDataCalls.push([target, data, usage]);
    },
    vertexAttribPointer(index, size, type, normalized, stride, offset) {
      this.attribPointers.push({ index, size, type, normalized, stride, offset });
    },
    enableVertexAttribArray(index) {
      this.enabledAttribs.push(index);
    },
    createBuffer() {
      return { id: nextId++ };
    },
    getContext() {
      return this;
    },
    ...overrides,
  };

  gl._shaders = shaders;
  gl._programs = programs;
  return gl;
}

function createCanvas(gl, { clientWidth = 100, clientHeight = 50 } = {}) {
  const canvas = {
    clientWidth,
    clientHeight,
    width: 0,
    height: 0,
    version: undefined,
    requested: [],
    getContext(type, attrs) {
      this.requested.push([type, attrs]);
      if (type === "webgl2") return gl.webgl2 ?? gl;
      if (type === "webgl") return gl.webgl ?? null;
      return null;
    },
  };
  return canvas;
}

describe("GLUtilities.getGL", () => {
  it("prefers WebGL2 and does not stamp version onto the context", () => {
    const gl = createMockGL();
    const canvas = createCanvas(gl);
    const result = GLUtilities.getGL(canvas);
    assert.equal(result, gl);
    assert.equal(gl.version, undefined);
    assert.equal(canvas.requested[0][0], "webgl2");
  });

  it("falls back to WebGL1 without mutating the canvas", () => {
    const gl1 = createMockGL();
    const canvas = {
      version: undefined,
      getContext(type) {
        if (type === "webgl2") return null;
        if (type === "webgl") return gl1;
        return null;
      },
    };
    const result = GLUtilities.getGL(canvas);
    assert.equal(result, gl1);
    assert.equal(canvas.version, undefined);
    assert.equal(gl1.version, undefined);
  });
});

describe("GLUtilities.loadShader / createProgram", () => {
  it("treats a non-empty info log as success when COMPILE_STATUS is true", () => {
    const gl = createMockGL();
    const shader = GLUtilities.loadShader(gl, "void main() {}", VERTEX_SHADER);
    assert.ok(shader);
    assert.equal(shader.deleted, false);
  });

  it("fails on COMPILE_STATUS, not info log length", () => {
    const gl = createMockGL();
    const originalCreate = gl.createShader.bind(gl);
    gl.createShader = (type) => {
      const shader = originalCreate(type);
      gl._shaders.set(shader, { compileOk: false, infoLog: "ERROR: 0:1: syntax error" });
      return shader;
    };
    assert.throws(
      () => GLUtilities.loadShader(gl, "nope", VERTEX_SHADER),
      /Failed to compile shader: ERROR: 0:1: syntax error/
    );
  });

  it("uses gl.getProgramInfoLog rather than program.getInfoLog", () => {
    const gl = createMockGL();
    const originalCreate = gl.createProgram.bind(gl);
    gl.createProgram = () => {
      const program = originalCreate();
      gl._programs.set(program, { linkOk: false, infoLog: "link exploded" });
      return program;
    };
    assert.throws(
      () => GLUtilities.createProgram(gl, "v", "f"),
      /Failed to link program: link exploded/
    );
  });

  it("initShaders returns the program and does not mutate gl.programs", () => {
    const gl = createMockGL();
    const program = GLUtilities.initShaders(gl, "v", "f");
    assert.ok(program);
    assert.equal(gl.programs, undefined);
  });
});

describe("GLUtilities.loadProgramInfo", () => {
  it("introspects active attributes and uniforms by shader name", () => {
    const gl = createMockGL();
    const program = GLUtilities.createProgram(gl, "v", "f");
    const info = GLUtilities.loadProgramInfo(gl, program);
    assert.equal(info.program, program);
    assert.deepEqual(info.attribLocations, { aPosition: 0, aColor: 1 });
    assert.equal(info.uniformLocations.uProjection.id, "uProjection");
    assert.equal(info.attribLocations.aVertexPosition, undefined);
  });
});

describe("GLUtilities.resetViewport", () => {
  it("sizes the drawing buffer by devicePixelRatio before setting the viewport", () => {
    const gl = createMockGL();
    const canvas = createCanvas(gl, { clientWidth: 100, clientHeight: 50 });
    const size = GLUtilities.resetViewport(gl, canvas, 2);
    assert.deepEqual(size, { width: 200, height: 100 });
    assert.equal(canvas.width, 200);
    assert.equal(canvas.height, 100);
    assert.deepEqual(gl.viewportCalls[0], [0, 0, 200, 100]);
  });
});

describe("GLUtilities.loadBuffers", () => {
  it("skips vertex attrib setup for element buffers and attribLoc < 0", () => {
    const gl = createMockGL();
    const positions = {
      name: "pos",
      target: ARRAY_BUFFER,
      data: new Float32Array([0, 0, 0]),
      glBufferID: { id: 1 },
      glUsage: STATIC_DRAW,
      glAttribLoc: 0,
      numComponents: 3,
      glDataType: FLOAT,
      stride: 0,
      offset: 0,
    };
    const indices = {
      name: "idx",
      target: ELEMENT_ARRAY_BUFFER,
      data: new Uint16Array([0, 1, 2]),
      glBufferID: { id: 2 },
      glUsage: STATIC_DRAW,
      glAttribLoc: -1,
      numComponents: 0,
      glDataType: 0,
      stride: 0,
      offset: 0,
    };
    const unnamed = {
      name: "raw",
      target: ARRAY_BUFFER,
      data: new Float32Array([1]),
      glBufferID: { id: 3 },
      glUsage: STATIC_DRAW,
      glAttribLoc: -1,
      numComponents: 1,
      glDataType: FLOAT,
      stride: 0,
      offset: 0,
    };
    GLUtilities.loadBuffers(gl, [positions, indices, unnamed]);
    assert.equal(gl.attribPointers.length, 1);
    assert.deepEqual(gl.attribPointers[0], {
      index: 0,
      size: 3,
      type: FLOAT,
      normalized: false,
      stride: 0,
      offset: 0,
    });
    assert.equal(gl.bufferDataCalls.length, 3);
  });
});

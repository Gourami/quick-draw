import type BufferObject from "./BufferObject.js";
import type { GL } from "./types.js";

export type ProgramInfo = {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, WebGLUniformLocation | null>;
};

export type ViewportSize = {
  width: number;
  height: number;
  dpr: number;
};

/**
 * First-party helpers for obtaining a WebGL context, compiling shaders,
 * sizing the drawing buffer, and uploading vertex data.
 */
export default class GLUtilities {
  /**
   * Create a drawing context. Tries WebGL2 first, then WebGL1.
   * Does not mutate the context or log on success.
   */
  static getGL(
    canvas: HTMLCanvasElement,
    attributes?: WebGLContextAttributes
  ): GL | null {
    const gl2 = canvas.getContext("webgl2", attributes);
    if (gl2) {
      return gl2;
    }
    return canvas.getContext("webgl", attributes);
  }

  /**
   * Compile and link a vertex + fragment shader pair.
   * Returns the program, or `null` if compile/link failed.
   */
  static initShaders(gl: GL, vertexSource: string, fragmentSource: string): WebGLProgram | null {
    return this.createProgram(gl, vertexSource, fragmentSource);
  }

  static createProgram(gl: GL, vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const vertShader = this.loadShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragShader = this.loadShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
    if (!vertShader || !fragShader) {
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      return null;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      const log = gl.getProgramInfoLog(program) || "";
      console.error("Failed to link program: " + log);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      return null;
    }

    gl.detachShader(program, vertShader);
    gl.detachShader(program, fragShader);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return program;
  }

  /**
   * Compile a single shader. Uses `COMPILE_STATUS`, not info-log length,
   * so driver warnings do not look like failures.
   */
  static loadShader(gl: GL, source: string, type: number): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      const log = gl.getShaderInfoLog(shader) || "";
      const kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
      console.error(`Failed to compile ${kind} shader: ${log}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Reflect active attributes and uniforms from a linked program.
   * Names are the GLSL identifiers (array uniforms drop a trailing `[0]`).
   */
  static loadProgramInfo(gl: GL, program: WebGLProgram): ProgramInfo {
    const attribLocations: Record<string, number> = {};
    const uniformLocations: Record<string, WebGLUniformLocation | null> = {};

    const attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
    for (let i = 0; i < attribCount; i++) {
      const info = gl.getActiveAttrib(program, i);
      if (!info) continue;
      attribLocations[info.name] = gl.getAttribLocation(program, info.name);
    }

    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i);
      if (!info) continue;
      const name = info.name.replace(/\[0\]$/, "");
      uniformLocations[name] = gl.getUniformLocation(program, info.name);
    }

    return { program, attribLocations, uniformLocations };
  }

  /**
   * Size the canvas drawing buffer for the current CSS size and device
   * pixel ratio, then set the GL viewport to the drawing buffer.
   */
  static resetViewport(gl: GL, canvas: HTMLCanvasElement, pixelRatio?: number): ViewportSize {
    const dpr =
      pixelRatio ??
      (typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1);
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
    const vw = gl.drawingBufferWidth || canvas.width;
    const vh = gl.drawingBufferHeight || canvas.height;
    gl.viewport(0, 0, vw, vh);
    return { width: canvas.width, height: canvas.height, dpr };
  }

  /**
   * Upload each buffer's data and, for array buffers with a valid
   * attribute location, enable the corresponding vertex attrib.
   */
  static loadBuffers(gl: GL, bufferObjects: BufferObject[]): void {
    for (const bo of bufferObjects) {
      gl.bindBuffer(bo.target, bo.glBufferID);
      gl.bufferData(bo.target, bo.data, bo.glUsage);

      if (bo.target === gl.ELEMENT_ARRAY_BUFFER) continue;
      if (bo.glAttribLoc < 0) continue;

      gl.vertexAttribPointer(
        bo.glAttribLoc,
        bo.numComponents,
        bo.glDataType,
        bo.normalized,
        bo.stride,
        bo.offset
      );
      gl.enableVertexAttribArray(bo.glAttribLoc);
    }
  }
}

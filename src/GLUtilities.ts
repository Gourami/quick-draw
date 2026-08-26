import type BufferObject from "./BufferObject.js";

export type GL = WebGLRenderingContext | WebGL2RenderingContext;

export type ProgramInfo = {
  program: WebGLProgram;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, WebGLUniformLocation | null>;
};

function defaultDevicePixelRatio(): number {
  if (typeof globalThis !== "undefined" && "devicePixelRatio" in globalThis) {
    const dpr = (globalThis as { devicePixelRatio?: number }).devicePixelRatio;
    if (typeof dpr === "number" && Number.isFinite(dpr) && dpr > 0) {
      return dpr;
    }
  }
  return 1;
}

export default class GLUtilities {
  /**
   * Request a WebGL2 context, then fall back to WebGL1.
   * Does not mutate the canvas or context.
   */
  static getGL(
    canvas: HTMLCanvasElement,
    attributes?: WebGLContextAttributes
  ): GL | null {
    const gl2 = canvas.getContext("webgl2", attributes);
    if (gl2) return gl2;
    return canvas.getContext("webgl", attributes);
  }

  /**
   * Compile and link a vertex + fragment shader pair.
   * Throws if compilation or linking fails.
   */
  static initShaders(gl: GL, vertexSource: string, fragmentSource: string): WebGLProgram {
    return this.createProgram(gl, vertexSource, fragmentSource);
  }

  static createProgram(gl: GL, vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertShader = this.loadShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragShader = this.loadShader(gl, fragmentSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      throw new Error("Failed to create program");
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      const log = gl.getProgramInfoLog(program) || "unknown error";
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      throw new Error(`Failed to link program: ${log}`);
    }

    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return program;
  }

  static loadShader(gl: GL, source: string, type: number): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Failed to create shader");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      const log = gl.getShaderInfoLog(shader) || "unknown error";
      gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${log}`);
    }

    return shader;
  }

  /**
   * Look up every active attribute and uniform on `program`.
   * Names come from the shader, not a hardcoded layout.
   */
  static loadProgramInfo(gl: GL, program: WebGLProgram): ProgramInfo {
    const attribLocations: Record<string, number> = {};
    const uniformLocations: Record<string, WebGLUniformLocation | null> = {};

    const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
    for (let i = 0; i < attributeCount; i++) {
      const info = gl.getActiveAttrib(program, i);
      if (!info) continue;
      attribLocations[info.name] = gl.getAttribLocation(program, info.name);
    }

    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i);
      if (!info) continue;
      uniformLocations[info.name] = gl.getUniformLocation(program, info.name);
    }

    return { program, attribLocations, uniformLocations };
  }

  /**
   * Size the drawing buffer to CSS pixels × devicePixelRatio, then set the viewport.
   */
  static resetViewport(
    gl: GL,
    canvas: HTMLCanvasElement,
    dpr: number = defaultDevicePixelRatio()
  ): { width: number; height: number } {
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const viewportWidth = gl.drawingBufferWidth || width;
    const viewportHeight = gl.drawingBufferHeight || height;
    gl.viewport(0, 0, viewportWidth, viewportHeight);
    return { width, height };
  }

  /**
   * Upload buffer data and, for ARRAY_BUFFER objects with a valid attrib location,
   * bind the vertex attribute pointer.
   */
  static loadBuffers(gl: GL, bufferObjects: BufferObject[]): void {
    for (const bo of bufferObjects) {
      gl.bindBuffer(bo.target, bo.glBufferID);
      gl.bufferData(bo.target, bo.data, bo.glUsage);

      if (bo.target === gl.ELEMENT_ARRAY_BUFFER || bo.glAttribLoc < 0) {
        continue;
      }

      gl.vertexAttribPointer(
        bo.glAttribLoc,
        bo.numComponents,
        bo.glDataType,
        false,
        bo.stride,
        bo.offset
      );
      gl.enableVertexAttribArray(bo.glAttribLoc);
    }
  }
}

import type { GL } from "./types.js";

export type BufferObjectInit = {
  /** Optional label for debugging. */
  name?: string;
  data: BufferSource;
  /** `gl.ARRAY_BUFFER` (default) or `gl.ELEMENT_ARRAY_BUFFER`. */
  target?: number;
  /** `gl.STATIC_DRAW` by default. */
  usage?: number;
  /** Attribute location to bind, or -1 to skip `vertexAttribPointer`. */
  attribLocation?: number;
  numComponents?: number;
  /** Component type, `gl.FLOAT` by default. */
  type?: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
};

/**
 * GPU buffer plus the vertex-attrib metadata needed to bind it.
 * Does not assume a particular shader layout; pass `attribLocation`
 * from `GLUtilities.loadProgramInfo`.
 */
export default class BufferObject {
  name: string;
  data: BufferSource;
  target: number;
  glBufferID: WebGLBuffer;
  glDataType: number;
  glAttribLoc: number;
  glUsage: number;
  numComponents: number;
  normalized: boolean;
  stride: number;
  offset: number;

  constructor(gl: GL, init: BufferObjectInit) {
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create WebGL buffer");
    }
    this.name = init.name ?? "";
    this.data = init.data;
    this.target = init.target ?? gl.ARRAY_BUFFER;
    this.glBufferID = buffer;
    this.glDataType = init.type ?? gl.FLOAT;
    this.glAttribLoc = init.attribLocation ?? -1;
    this.glUsage = init.usage ?? gl.STATIC_DRAW;
    this.numComponents = init.numComponents ?? 0;
    this.normalized = init.normalized ?? false;
    this.stride = init.stride ?? 0;
    this.offset = init.offset ?? 0;
  }
}

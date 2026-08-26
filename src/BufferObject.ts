export type BufferObjectOptions = {
  name?: string;
  data: ArrayBufferView;
  numComponents?: number;
  target?: number;
  glDataType?: number;
  attribLoc?: number;
  usage?: number;
  stride?: number;
  offset?: number;
};

/**
 * GPU buffer plus the vertex-attrib metadata needed to bind it.
 * Attribute location is supplied by the caller (typically from
 * `GLUtilities.loadProgramInfo`); nothing here assumes a fixed shader layout.
 */
export default class BufferObject {
  name: string;
  numComponents: number;
  target: number;
  data: ArrayBufferView;
  glBufferID: WebGLBuffer;
  glDataType: number;
  glAttribLoc: number;
  glUsage: number;
  stride: number;
  offset: number;

  constructor(gl: WebGLRenderingContext, options: BufferObjectOptions) {
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("Failed to create buffer");
    }
    this.name = options.name ?? "";
    this.numComponents = options.numComponents ?? 0;
    this.target = options.target ?? gl.ARRAY_BUFFER;
    this.data = options.data;
    this.glBufferID = buffer;
    this.glDataType = options.glDataType ?? gl.FLOAT;
    this.glAttribLoc = options.attribLoc ?? -1;
    this.glUsage = options.usage ?? gl.STATIC_DRAW;
    this.stride = options.stride ?? 0;
    this.offset = options.offset ?? 0;
  }
}

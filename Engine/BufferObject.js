export default class BufferObject {
  constructor(gl, name, numComponents, data, target, glDataType, glAttribLoc = -1) {
    this.name = name;
    this.numComponents = numComponents;
    this.target = target || gl.ARRAY_BUFFER;
    this.data = data;
    this.glBufferID = gl.createBuffer();
    this.glDataType = glDataType || gl.FLOAT;
    this.glAttribLoc = glAttribLoc;
    this.glUsage = gl.STATIC_DRAW;
  }
}

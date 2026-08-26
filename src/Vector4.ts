/** 4-component vector stored as a `Float32Array` of length 4 (x, y, z, w). */
export default class Vector4 {
  elements: Float32Array;

  /**
   * If `src` is given, the new vector is initialized from it.
   * Accepts an array-like of 4 numbers or another Vector4.
   */
  constructor(src?: ArrayLike<number> | Vector4) {
    const v = new Float32Array(4);
    if (src) {
      const s = src instanceof Vector4 ? src.elements : src;
      v[0] = s[0] ?? 0;
      v[1] = s[1] ?? 0;
      v[2] = s[2] ?? 0;
      v[3] = s[3] ?? 1;
    } else {
      v[3] = 1;
    }
    this.elements = v;
  }
}

export default class Vector4 {
  elements: Float32Array;

  /**
   * If `opt_src` is specified, the new vector is initialized from it.
   * Accepts a Vector4, a numeric array, or a typed array.
   */
  constructor(opt_src?: Vector4 | ArrayLike<number>) {
    const v = new Float32Array(4);
    if (opt_src instanceof Vector4) {
      v.set(opt_src.elements);
    } else if (opt_src && typeof opt_src === "object") {
      v[0] = opt_src[0];
      v[1] = opt_src[1];
      v[2] = opt_src[2];
      v[3] = opt_src[3] ?? 1;
    } else {
      v[3] = 1;
    }
    this.elements = v;
  }
}

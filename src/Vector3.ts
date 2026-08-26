export default class Vector3 {
  elements: Float32Array;

  /**
   * If `opt_src` is specified, the new vector is initialized from it.
   * Accepts a Vector3, a numeric array, or a typed array.
   */
  constructor(opt_src?: Vector3 | ArrayLike<number>) {
    const v = new Float32Array(3);
    if (opt_src instanceof Vector3) {
      v.set(opt_src.elements);
    } else if (opt_src && typeof opt_src === "object") {
      v[0] = opt_src[0];
      v[1] = opt_src[1];
      v[2] = opt_src[2];
    }
    this.elements = v;
  }

  /**
   * Normalize this vector to the given length (default 1).
   */
  normalize(ln = 1): this {
    const v = this.elements;
    const c = v[0];
    const d = v[1];
    const e = v[2];
    let g = Math.sqrt(c * c + d * d + e * e);
    if (g) {
      if (g === ln) return this;
    } else {
      v[0] = 0;
      v[1] = 0;
      v[2] = 0;
      return this;
    }
    g = ln / g;
    v[0] = c * g;
    v[1] = d * g;
    v[2] = e * g;
    return this;
  }

  /**
   * Scale this vector in all directions by a constant.
   */
  scale(f: number): this {
    const t = this.elements;
    t[0] *= f;
    t[1] *= f;
    t[2] *= f;
    return this;
  }

  /**
   * Return a new vector `this - other`. Neither input is mutated.
   */
  diff(other: Vector3): Vector3 {
    const a = this.elements;
    const b = other.elements;
    const v = new Vector3();
    v.elements[0] = a[0] - b[0];
    v.elements[1] = a[1] - b[1];
    v.elements[2] = a[2] - b[2];
    return v;
  }

  /**
   * Return a new vector `this + other`. Neither input is mutated.
   */
  sum(other: Vector3): Vector3 {
    const a = this.elements;
    const b = other.elements;
    const v = new Vector3();
    v.elements[0] = a[0] + b[0];
    v.elements[1] = a[1] + b[1];
    v.elements[2] = a[2] + b[2];
    return v;
  }

  /**
   * Add `other` to this vector in place.
   */
  plus(other: Vector3): this {
    const a = this.elements;
    const b = other.elements;
    a[0] = a[0] + b[0];
    a[1] = a[1] + b[1];
    a[2] = a[2] + b[2];
    return this;
  }

  length(): number {
    const c = this.elements;
    return Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
  }

  dot(other: Vector3): number {
    const a = this.elements;
    const b = other.elements;
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * Return a new vector `this × other`.
   */
  cross(other: Vector3): Vector3 {
    const a = this.elements;
    const b = other.elements;
    const v = new Vector3();
    const c = v.elements;
    c[0] = a[1] * b[2] - a[2] * b[1];
    c[1] = a[2] * b[0] - a[0] * b[2];
    c[2] = a[0] * b[1] - a[1] * b[0];
    return v;
  }
}

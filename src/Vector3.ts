/** 3-component vector stored as a `Float32Array` of length 3 (x, y, z). */
export default class Vector3 {
  elements: Float32Array;

  /**
   * If `src` is given, the new vector is initialized from it.
   * Accepts an array-like of 3 numbers or another Vector3.
   */
  constructor(src?: ArrayLike<number> | Vector3) {
    const v = new Float32Array(3);
    if (src) {
      const s = src instanceof Vector3 ? src.elements : src;
      v[0] = s[0] ?? 0;
      v[1] = s[1] ?? 0;
      v[2] = s[2] ?? 0;
    }
    this.elements = v;
  }

  /**
   * Normalize this vector to the given length (default 1).
   * A zero-length vector stays zero.
   */
  normalize(length = 1): this {
    const v = this.elements;
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const mag = Math.sqrt(x * x + y * y + z * z);
    if (!mag) {
      v[0] = 0;
      v[1] = 0;
      v[2] = 0;
      return this;
    }
    if (mag === length) {
      return this;
    }
    const scale = length / mag;
    v[0] = x * scale;
    v[1] = y * scale;
    v[2] = z * scale;
    return this;
  }

  /** Scale this vector in all directions by `f`. */
  scale(f: number): this {
    const t = this.elements;
    t[0] *= f;
    t[1] *= f;
    t[2] *= f;
    return this;
  }

  /** Difference `this - other` without mutating either vector. */
  diff(other: Vector3): Vector3 {
    const a = this.elements;
    const b = other.elements;
    return new Vector3([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
  }

  /** Sum `this + other` without mutating either vector. */
  sum(other: Vector3): Vector3 {
    const a = this.elements;
    const b = other.elements;
    return new Vector3([a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
  }

  /** Add `other` into this vector (mutates this). */
  plus(other: Vector3): this {
    const a = this.elements;
    const b = other.elements;
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
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

  /** Cross product `this × other` without mutating either vector. */
  cross(other: Vector3): Vector3 {
    const a = this.elements;
    const b = other.elements;
    return new Vector3([
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ]);
  }
}

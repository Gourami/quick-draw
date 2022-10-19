class Vector3 {
  /**
   * Constructor of Vector3
   * If opt_src is specified, new vector is initialized by opt_src.
   * @param opt_src source vector(option)
   */
  constructor(opt_src) {
    var v = new Float32Array(3);
    if (opt_src && typeof opt_src === "object") {
      v[0] = opt_src[0];
      v[1] = opt_src[1];
      v[2] = opt_src[2];
    }
    this.elements = v;
  }
  /**
   * Normalize this vector to given input length
   * or default length of 1
   * @return this Vector3
   */
  normalize(ln = 1) {
    var v = this.elements;
    var c = v[0],
      d = v[1],
      e = v[2],
      g = Math.sqrt(c * c + d * d + e * e);
    if (g) {
      if (g == ln) return this;
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
   * Scale a vector in all directions by given constant
   * @param f amount to scale in all directions
   */
  scale(f) {
    let t = this.elements;
    t[0] *= f;
    t[1] *= f;
    t[2] *= f;
    return this;
  }

  /**
   * Find a new vector representing the difference between
   * this Vector3 and another Vector3
   * this and input vector are not mutated
   * @param {Vector3} other
   * @returns new Vector3
   */
  diff(other) {
    var a = this.elements;
    var b = other.elements;
    var v = new Vector3();
    v.elements[0] = a[0] - b[0];
    v.elements[1] = a[1] - b[1];
    v.elements[2] = a[2] - b[2];

    return v;
  } //end of diff

  /**
   * Find a new vector representing the sum of
   * this Vector3 and another Vector3
   * this and input vector are not mutated
   * @param {Vector3} other
   * @returns Vector3
   */
  sum(other) {
    var a = this.elements;
    var b = other.elements;
    var v = new Vector3();
    v.elements[0] = a[0] + b[0];
    v.elements[1] = a[1] + b[1];
    v.elements[2] = a[2] + b[2];
    return v;
  }

  /**
   * This vector is mutated by adding another vector to it
   *
   * @param {Vector3} other
   * @returns Vector3
   */
  plus(other) {
    let a = this.elements;
    var b = other.elements;
    a[0] = a[0] + b[0];
    a[1] = a[1] + b[1];
    a[2] = a[2] + b[2];
    return this;
  }

  /**
   * Find the length of this vector
   * @returns float
   */
  length() {
    var c = this.elements;
    return Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
  }

  /**
   * Find the dot product of this vector and another vector
   * @param {Vector3} other
   * @returns float
   */
  dot(other) {
    var a = this.elements;
    var b = other.elements;
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * Find the cross product of this vector and another vector
   * @param {Vector3} other
   * @returns Vector3
   */
  cross(other) {
    var a = this.elements;
    var b = other.elements;
    var v = new Vector3();
    var c = v.elements;
    c[0] = a[1] * b[2] - a[2] * b[1];
    c[1] = a[2] * b[0] - a[0] * b[2];
    c[2] = a[0] * b[1] - a[1] * b[0];
    return v;
  }
}

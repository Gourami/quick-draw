import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Matrix4 from "../dist/Matrix4.js";
import Vector3 from "../dist/Vector3.js";
import Vector4 from "../dist/Vector4.js";

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function nearlyEqual(actual, expected, epsilon = 1e-5) {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < actual.length; i++) {
    assert.ok(
      Math.abs(actual[i] - expected[i]) <= epsilon,
      `index ${i}: ${actual[i]} vs ${expected[i]}`
    );
  }
}

describe("Matrix4", () => {
  it("starts as identity", () => {
    nearlyEqual(new Matrix4().elements, IDENTITY);
  });

  it("multiply returns this for chaining", () => {
    const a = new Matrix4().setTranslate(1, 2, 3);
    const b = new Matrix4().setScale(2, 2, 2);
    const result = a.multiply(b);
    assert.equal(result, a);
  });

  it("set returns this when copying onto itself", () => {
    const m = new Matrix4().setTranslate(4, 5, 6);
    assert.equal(m.set(m), m);
    nearlyEqual(m.elements, new Matrix4().setTranslate(4, 5, 6).elements);
  });

  it("translate then invert yields identity", () => {
    const m = new Matrix4().setTranslate(3, -4, 5);
    const inv = new Matrix4().setInverseOf(m);
    const product = new Matrix4(m).multiply(inv);
    nearlyEqual(product.elements, IDENTITY);
  });

  it("inverting a composed transform restores identity", () => {
    const m = new Matrix4()
      .setTranslate(1, 2, 3)
      .rotate(30, 0, 1, 0)
      .scale(2, 0.5, 1);
    m.invert();
    const original = new Matrix4()
      .setTranslate(1, 2, 3)
      .rotate(30, 0, 1, 0)
      .scale(2, 0.5, 1);
    nearlyEqual(new Matrix4(original).multiply(m).elements, IDENTITY, 1e-5);
  });

  it("setPerspective matches the standard WebGL frustum for 90deg, aspect 1, near 1, far 2", () => {
    const m = new Matrix4().setPerspective(90, 1, 1, 2);
    const e = m.elements;
    assert.equal(e[0], 1);
    assert.equal(e[5], 1);
    assert.equal(e[10], -3);
    assert.equal(e[11], -1);
    assert.equal(e[14], -4);
    assert.equal(e[15], 0);
  });

  it("setLookAt maps the eye point to the origin", () => {
    const view = new Matrix4().setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
    const eye = view.multiplyVector3(new Vector3([0, 0, 5]));
    nearlyEqual(eye.elements, [0, 0, 0]);
  });

  it("setLookAt maps the look-at point onto the -Z axis", () => {
    const view = new Matrix4().setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
    const center = view.multiplyVector3(new Vector3([0, 0, 0]));
    nearlyEqual(center.elements, [0, 0, -5]);
  });

  it("multiplyVector3 treats the input as a point (w = 1)", () => {
    const m = new Matrix4().setTranslate(10, 20, 30);
    const p = m.multiplyVector3(new Vector3([1, 2, 3]));
    nearlyEqual(p.elements, [11, 22, 33]);
  });

  it("multiplyVector4 uses Vector4 and preserves w", () => {
    const m = new Matrix4().setTranslate(10, 20, 30);
    const p = m.multiplyVector4(new Vector4([1, 2, 3, 1]));
    nearlyEqual(p.elements, [11, 22, 33, 1]);
    const dir = m.multiplyVector4(new Vector4([1, 0, 0, 0]));
    nearlyEqual(dir.elements, [1, 0, 0, 0]);
  });

  it("rotate 90 degrees around Z sends (1,0,0) to (0,1,0)", () => {
    const m = new Matrix4().setRotate(90, 0, 0, 1);
    const p = m.multiplyVector3(new Vector3([1, 0, 0]));
    nearlyEqual(p.elements, [0, 1, 0]);
  });

  it("copy constructor copies elements", () => {
    const a = new Matrix4().setTranslate(1, 2, 3);
    const b = new Matrix4(a);
    a.setIdentity();
    nearlyEqual(b.elements, new Matrix4().setTranslate(1, 2, 3).elements);
  });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { Matrix4, Vector3, Vector4 } from "../dist/index.js";

const EPS = 1e-5;

function almostEqual(actual, expected, eps = EPS) {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${actual} to be within ${eps} of ${expected}`
  );
}

function assertIdentity(m, eps = EPS) {
  const e = m.elements;
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (let i = 0; i < 16; i++) {
    almostEqual(e[i], I[i], eps);
  }
}

test("new Matrix4 is identity", () => {
  assertIdentity(new Matrix4());
});

test("setIdentity and copy constructor", () => {
  const a = new Matrix4().setTranslate(1, 2, 3);
  const b = new Matrix4(a);
  assert.deepEqual(Array.from(b.elements), Array.from(a.elements));
  b.setIdentity();
  assertIdentity(b);
  assert.notEqual(a.elements[12], 0);
});

test("set returns this even when copying onto itself", () => {
  const m = new Matrix4().setTranslate(4, 5, 6);
  const result = m.set(m);
  assert.equal(result, m);
  almostEqual(m.elements[12], 4);
});

test("multiply returns this and is chainable", () => {
  const m = new Matrix4();
  const result = m.multiply(new Matrix4().setTranslate(1, 0, 0));
  assert.equal(result, m);
  almostEqual(m.elements[12], 1);
});

test("translate then invert yields identity", () => {
  const m = new Matrix4().setTranslate(3, -2, 5);
  const inv = new Matrix4().setInverseOf(m);
  const product = new Matrix4(m).multiply(inv);
  assertIdentity(product);
});

test("rotate, scale, translate invert round-trip", () => {
  const m = new Matrix4().setTranslate(1, 2, 3).rotate(35, 0.2, 0.8, 0.3).scale(2, 0.5, 1.5);
  const inv = new Matrix4().setInverseOf(m);
  assertIdentity(new Matrix4(m).multiply(inv), 1e-4);
});

test("invert of identity is identity", () => {
  assertIdentity(new Matrix4().invert());
});

test("multiplyVector3 applies translation (w = 1)", () => {
  const m = new Matrix4().setTranslate(10, 20, 30);
  const out = m.multiplyVector3(new Vector3([1, 2, 3]));
  almostEqual(out.elements[0], 11);
  almostEqual(out.elements[1], 22);
  almostEqual(out.elements[2], 33);
});

test("multiplyVector4 applies a homogeneous transform", () => {
  const m = new Matrix4().setTranslate(10, 20, 30);
  const out = m.multiplyVector4(new Vector4([1, 2, 3, 1]));
  almostEqual(out.elements[0], 11);
  almostEqual(out.elements[1], 22);
  almostEqual(out.elements[2], 33);
  almostEqual(out.elements[3], 1);
});

test("setPerspective(90, 1, 1, 2) matches the OpenGL-style matrix", () => {
  const e = new Matrix4().setPerspective(90, 1, 1, 2).elements;
  almostEqual(e[0], 1);
  almostEqual(e[5], 1);
  almostEqual(e[10], -3);
  almostEqual(e[11], -1);
  almostEqual(e[14], -4);
  almostEqual(e[15], 0);
});

test("setLookAt from origin looking down -Z is identity", () => {
  const m = new Matrix4().setLookAt(0, 0, 0, 0, 0, -1, 0, 1, 0);
  assertIdentity(m);
});

test("setLookAt translates the eye to the origin", () => {
  const m = new Matrix4().setLookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
  const p = m.multiplyVector3(new Vector3([0, 0, 5]));
  almostEqual(p.elements[0], 0);
  almostEqual(p.elements[1], 0);
  almostEqual(p.elements[2], 0);
});

test("setOrtho maps the box to clip space", () => {
  const m = new Matrix4().setOrtho(-1, 1, -1, 1, -1, 1);
  almostEqual(m.elements[0], 1);
  almostEqual(m.elements[5], 1);
  almostEqual(m.elements[10], -1);
  almostEqual(m.elements[15], 1);
});

test("rotate 90 degrees about Z", () => {
  const p = new Matrix4().setRotate(90, 0, 0, 1).multiplyVector3(new Vector3([1, 0, 0]));
  almostEqual(p.elements[0], 0);
  almostEqual(p.elements[1], 1);
  almostEqual(p.elements[2], 0);
});

test("scale is chainable and multiplies the diagonal", () => {
  const m = new Matrix4().scale(2, 3, 4);
  almostEqual(m.elements[0], 2);
  almostEqual(m.elements[5], 3);
  almostEqual(m.elements[10], 4);
});

test("transpose swaps off-diagonal entries", () => {
  const m = new Matrix4().setTranslate(1, 2, 3).transpose();
  almostEqual(m.elements[3], 1);
  almostEqual(m.elements[7], 2);
  almostEqual(m.elements[11], 3);
  almostEqual(m.elements[12], 0);
});

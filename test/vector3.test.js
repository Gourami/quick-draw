import assert from "node:assert/strict";
import { test } from "node:test";
import { Vector3, Vector4 } from "../dist/index.js";

const EPS = 1e-5;

function almostEqual(actual, expected, eps = EPS) {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${actual} to be within ${eps} of ${expected}`
  );
}

test("Vector3 defaults to zeros", () => {
  assert.deepEqual(Array.from(new Vector3().elements), [0, 0, 0]);
});

test("Vector3 copies from an array or another Vector3", () => {
  const a = new Vector3([1, 2, 3]);
  const b = new Vector3(a);
  assert.deepEqual(Array.from(b.elements), [1, 2, 3]);
  a.elements[0] = 9;
  almostEqual(b.elements[0], 1);
});

test("length, normalize, and scale", () => {
  const v = new Vector3([3, 4, 0]);
  almostEqual(v.length(), 5);
  v.normalize();
  almostEqual(v.length(), 1);
  almostEqual(v.elements[0], 0.6);
  almostEqual(v.elements[1], 0.8);
  v.scale(10);
  almostEqual(v.length(), 10);
});

test("zero vector normalize stays zero", () => {
  const v = new Vector3().normalize();
  assert.deepEqual(Array.from(v.elements), [0, 0, 0]);
});

test("sum and diff do not mutate inputs", () => {
  const a = new Vector3([1, 2, 3]);
  const b = new Vector3([4, 6, 8]);
  const s = a.sum(b);
  const d = a.diff(b);
  assert.deepEqual(Array.from(a.elements), [1, 2, 3]);
  assert.deepEqual(Array.from(s.elements), [5, 8, 11]);
  assert.deepEqual(Array.from(d.elements), [-3, -4, -5]);
});

test("plus mutates this", () => {
  const a = new Vector3([1, 1, 1]);
  const result = a.plus(new Vector3([2, 3, 4]));
  assert.equal(result, a);
  assert.deepEqual(Array.from(a.elements), [3, 4, 5]);
});

test("dot and cross", () => {
  const i = new Vector3([1, 0, 0]);
  const j = new Vector3([0, 1, 0]);
  almostEqual(i.dot(j), 0);
  almostEqual(i.dot(i), 1);
  const k = i.cross(j);
  assert.deepEqual(Array.from(k.elements), [0, 0, 1]);
});

test("Vector4 defaults w to 1", () => {
  assert.deepEqual(Array.from(new Vector4().elements), [0, 0, 0, 1]);
  assert.deepEqual(Array.from(new Vector4([1, 2, 3, 4]).elements), [1, 2, 3, 4]);
});

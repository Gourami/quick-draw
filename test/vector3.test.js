import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Vector3 from "../dist/Vector3.js";
import Vector4 from "../dist/Vector4.js";

function nearlyEqual(actual, expected, epsilon = 1e-6) {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < actual.length; i++) {
    assert.ok(
      Math.abs(actual[i] - expected[i]) <= epsilon,
      `index ${i}: ${actual[i]} vs ${expected[i]}`
    );
  }
}

describe("Vector3", () => {
  it("initializes from an array", () => {
    nearlyEqual(new Vector3([1, 2, 3]).elements, [1, 2, 3]);
  });

  it("copies another Vector3", () => {
    const a = new Vector3([4, 5, 6]);
    const b = new Vector3(a);
    a.scale(2);
    nearlyEqual(b.elements, [4, 5, 6]);
  });

  it("normalizes to unit length", () => {
    const v = new Vector3([3, 0, 4]).normalize();
    nearlyEqual(v.elements, [0.6, 0, 0.8]);
    assert.ok(Math.abs(v.length() - 1) < 1e-6);
  });

  it("dot and cross products", () => {
    const a = new Vector3([1, 0, 0]);
    const b = new Vector3([0, 1, 0]);
    assert.equal(a.dot(b), 0);
    nearlyEqual(a.cross(b).elements, [0, 0, 1]);
  });

  it("sum and diff do not mutate inputs", () => {
    const a = new Vector3([1, 2, 3]);
    const b = new Vector3([3, 2, 1]);
    nearlyEqual(a.sum(b).elements, [4, 4, 4]);
    nearlyEqual(a.diff(b).elements, [-2, 0, 2]);
    nearlyEqual(a.elements, [1, 2, 3]);
    nearlyEqual(b.elements, [3, 2, 1]);
  });

  it("plus mutates in place", () => {
    const a = new Vector3([1, 1, 1]);
    assert.equal(a.plus(new Vector3([2, 3, 4])), a);
    nearlyEqual(a.elements, [3, 4, 5]);
  });
});

describe("Vector4", () => {
  it("defaults w to 1", () => {
    nearlyEqual(new Vector4().elements, [0, 0, 0, 1]);
    nearlyEqual(new Vector4([2, 3, 4]).elements, [2, 3, 4, 1]);
  });

  it("copies another Vector4", () => {
    const a = new Vector4([1, 2, 3, 4]);
    const b = new Vector4(a);
    a.elements[0] = 9;
    nearlyEqual(b.elements, [1, 2, 3, 4]);
  });
});

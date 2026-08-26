import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BufferObject,
  GLUtilities,
  Matrix4,
  Vector3,
  Vector4,
} from "../dist/index.js";

describe("package exports", () => {
  it("exports the public constructors", () => {
    assert.equal(typeof BufferObject, "function");
    assert.equal(typeof GLUtilities, "function");
    assert.equal(typeof Matrix4, "function");
    assert.equal(typeof Vector3, "function");
    assert.equal(typeof Vector4, "function");
  });
});

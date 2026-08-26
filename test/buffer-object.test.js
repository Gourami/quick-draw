import assert from "node:assert/strict";
import { describe, it } from "node:test";
import BufferObject from "../dist/BufferObject.js";

describe("BufferObject", () => {
  it("stores caller-supplied attrib location instead of a hardcoded layout", () => {
    const created = [];
    const gl = {
      ARRAY_BUFFER: 0x8892,
      FLOAT: 0x1406,
      STATIC_DRAW: 0x88e4,
      createBuffer() {
        const buffer = { id: created.length + 1 };
        created.push(buffer);
        return buffer;
      },
    };
    const data = new Float32Array([1, 2, 3]);
    const bo = new BufferObject(gl, {
      name: "aCustomPosition",
      data,
      numComponents: 3,
      attribLoc: 7,
    });
    assert.equal(bo.name, "aCustomPosition");
    assert.equal(bo.glAttribLoc, 7);
    assert.equal(bo.target, gl.ARRAY_BUFFER);
    assert.equal(bo.glDataType, gl.FLOAT);
    assert.equal(bo.glUsage, gl.STATIC_DRAW);
    assert.equal(bo.stride, 0);
    assert.equal(bo.offset, 0);
    assert.equal(bo.glBufferID, created[0]);
    assert.equal(bo.data, data);
  });

  it("throws if the context cannot create a buffer", () => {
    const gl = {
      ARRAY_BUFFER: 1,
      FLOAT: 2,
      STATIC_DRAW: 3,
      createBuffer() {
        return null;
      },
    };
    assert.throws(
      () => new BufferObject(gl, { data: new Float32Array(3) }),
      /Failed to create buffer/
    );
  });
});

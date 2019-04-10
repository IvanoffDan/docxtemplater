"use strict";

var _require = require("./utils"),
    expect = _require.expect,
    createDoc = _require.createDoc,
    shouldBeSame = _require.shouldBeSame;

describe("Checkbox Loops", function () {
  it("should work with a simple loop", function () {
    var doc = createDoc("checkbox-loops.docx");
    doc.setData({
      list: ["foo", "bar"]
    });
    doc.setOptions({
      delimiters: {
        start: "{{",
        end: "}}"
      }
    });
    doc.render();
    shouldBeSame({
      doc: doc,
      expectedName: "expected-checkbox-loops.docx"
    });
    expect(1).to.equal(1);
  });
});
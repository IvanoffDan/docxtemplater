"use strict";

var _require = require("./utils"),
    expect = _require.expect,
    createDoc = _require.createDoc,
    shouldBeSame = _require.shouldBeSame;

describe("Checkbox Tables", function () {
  it("should work with a simple table", function () {
    var doc = createDoc("checkbox-table.docx");
    doc.setData({
      list: ["foo", "bar"],
      test: "cat"
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
      expectedName: "expected-checkbox-table.docx"
    });
    expect(1).to.equal(1);
  });
});
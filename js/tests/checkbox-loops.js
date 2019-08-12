"use strict";

var _require = require("./utils"),
    expect = _require.expect,
    createDoc = _require.createDoc,
    shouldBeSame = _require.shouldBeSame; // for testing (same parser as in cbdev/validator/services/templater)


var _require2 = require("../doc-utils"),
    angularParser = _require2.angularParser;

describe("Checkbox Loops", function () {
  it("should work with a simple loop", function () {
    var doc = createDoc("checkbox-loops.docx");
    doc.setData({
      num: 10,
      num2: 15,
      list1: ["foo", "bar", "heyhey"],
      list2: [1, 2, 3],
      "list2:formatted": ["1.000", "2.000", "3.000"],
      list3: [10, 20, 30]
    });
    doc.setOptions({
      delimiters: {
        start: "{{",
        end: "}}"
      },
      parser: angularParser
    });
    doc.render();
    shouldBeSame({
      doc: doc,
      expectedName: "expected-checkbox-loops.docx"
    });
    expect(1).to.equal(1);
  });
});
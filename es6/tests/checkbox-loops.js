const {
  expect,
  createDoc,
  shouldBeSame,
} = require("./utils");

// for testing (same parser as in cbdev/validator/services/templater)
const {
  angularParser,
} = require("../doc-utils");

describe("Checkbox Loops", () => {
  it("should work with a simple loop", () => {
    const doc = createDoc("checkbox-loops.docx");

    doc.setData({
      num: 10,
      num2: 15,
      list1: ["foo", "bar", "heyhey"],
      list2: [1, 2, 3],
      "list2:formatted": ["1.000", "2.000", "3.000"],
      list3: [10, 20, 30],
    });

    doc.setOptions({ delimiters: { start: "{{", end: "}}" }, parser: angularParser });

    doc.render();

    shouldBeSame({ doc, expectedName: "expected-checkbox-loops.docx" });

    expect(1).to.equal(1);
  });
});

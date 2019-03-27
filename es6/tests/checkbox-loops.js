const {
  expect,
  createDoc,
  shouldBeSame,
} = require("./utils");

describe("Checkbox Loops", () => {
  it("should work with a simple loop", () => {
    const doc = createDoc("checkbox-loops.docx");

    doc.setData({
      list: ["foo", "bar"],
    });

    doc.setOptions({ delimiters: { start: "{{", end: "}}" } });

    doc.render();

    shouldBeSame({ doc, expectedName: "expected-checkbox-loops.docx" });

    expect(1).to.equal(1);
  });
});

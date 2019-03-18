const {
  expect,
  createDoc,
  shouldBeSame,
} = require("./utils");

describe("Checkbox Tables", () => {
  it("should work with a simple table", () => {
    const doc = createDoc("checkbox-table.docx");

    doc.setData({
      list: ["foo", "bar"],
      test: "cat",
    });

    doc.setOptions({ delimiters: { start: "{{", end: "}}" } });

    doc.render();

    shouldBeSame({ doc, expectedName: "expected-checkbox-table.docx" });

    expect(1).to.equal(1);
  });
});

"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var JSZip = require("jszip");

var _require = require("lodash"),
    merge = _require.merge;

var angularParser = require("./angular-parser");

var Docxtemplater = require("../docxtemplater.js");

var Errors = require("../errors.js");

var _require2 = require("./utils"),
    expect = _require2.expect,
    createXmlTemplaterDocx = _require2.createXmlTemplaterDocx,
    createDoc = _require2.createDoc,
    expectToThrow = _require2.expectToThrow,
    getContent = _require2.getContent;

var inspectModule = require("../inspect-module.js");

function getLength(obj) {
  if (obj instanceof ArrayBuffer) {
    return obj.byteLength;
  }

  return obj.length;
}

describe("Loading", function () {
  describe("ajax done correctly", function () {
    it("doc and img Data should have the expected length", function () {
      var doc = createDoc("tag-example.docx");
      expect(getLength(doc.loadedContent)).to.be.equal(19424);
    });
    it("should have the right number of files (the docx unzipped)", function () {
      var doc = createDoc("tag-example.docx");
      expect(Object.keys(doc.zip.files).length).to.be.equal(16);
    });
  });
  describe("basic loading", function () {
    it("should load file tag-example.docx", function () {
      var doc = createDoc("tag-example.docx");
      expect(_typeof(doc)).to.be.equal("object");
    });
  });
  describe("content_loading", function () {
    it("should load the right content for the footer", function () {
      var doc = createDoc("tag-example.docx");
      var fullText = doc.getFullText("word/footer1.xml");
      expect(fullText.length).not.to.be.equal(0);
      expect(fullText).to.be.equal("{last_name}{first_name}{phone}");
    });
    it("should load the right content for the document", function () {
      var doc = createDoc("tag-example.docx");
      var fullText = doc.getFullText();
      expect(fullText).to.be.equal("{last_name} {first_name}");
    });
    it("should load the right template files for the document", function () {
      var doc = createDoc("tag-example.docx");
      var templatedFiles = doc.getTemplatedFiles();
      expect(templatedFiles).to.be.eql(["word/header1.xml", "word/footer1.xml", "docProps/core.xml", "docProps/app.xml", "word/document.xml", "word/document2.xml"]);
    });
  });
  describe("output and input", function () {
    it("should be the same", function () {
      var zip = new JSZip(createDoc("tag-example.docx").loadedContent);
      var doc = new Docxtemplater().loadZip(zip);
      var output = doc.getZip().generate({
        type: "base64"
      });
      expect(output.length).to.be.equal(90732);
      expect(output.substr(0, 50)).to.be.equal("UEsDBAoAAAAAAAAAIQAMTxYSlgcAAJYHAAATAAAAW0NvbnRlbn");
    });
  });
});
describe("Api versioning", function () {
  it("should work with valid numbers", function () {
    var doc = createDoc("tag-example.docx");
    expect(doc.verifyApiVersion("3.6.0")).to.be.equal(true);
    expect(doc.verifyApiVersion("3.5.0")).to.be.equal(true);
    expect(doc.verifyApiVersion("3.4.2")).to.be.equal(true);
    expect(doc.verifyApiVersion("3.4.22")).to.be.equal(true);
  });
  it("should fail with invalid versions", function () {
    var doc = createDoc("tag-example.docx");
    expectToThrow(doc.verifyApiVersion.bind(null, "5.6.0"), Errors.XTAPIVersionError, {
      message: "The major api version do not match, you probably have to update docxtemplater with npm install --save docxtemplater",
      name: "APIVersionError",
      properties: {
        id: "api_version_error",
        currentModuleApiVersion: [3, 10, 0],
        neededVersion: [5, 6, 0]
      }
    });
    expectToThrow(doc.verifyApiVersion.bind(null, "3.44.0"), Errors.XTAPIVersionError, {
      message: "The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater",
      name: "APIVersionError",
      properties: {
        id: "api_version_error",
        currentModuleApiVersion: [3, 10, 0],
        neededVersion: [3, 44, 0]
      }
    });
  });
});
describe("Inspect module", function () {
  it("should get main tags", function () {
    var doc = createDoc("tag-loop-example.docx");
    var iModule = inspectModule();
    doc.attachModule(iModule);
    doc.compile();
    expect(iModule.getTags()).to.be.deep.equal({
      offre: {
        nom: {},
        prix: {},
        titre: {}
      },
      nom: {},
      prenom: {}
    });
    var data = {
      offre: [{}],
      prenom: "John"
    };
    doc.setData(data);
    doc.render();
    var _iModule$fullInspecte = iModule.fullInspected["word/document.xml"].nullValues,
        summary = _iModule$fullInspecte.summary,
        detail = _iModule$fullInspecte.detail;
    expect(iModule.inspect.tags).to.be.deep.equal(data);
    expect(detail).to.be.an("array");
    expect(summary).to.be.deep.equal([["offre", "nom"], ["offre", "prix"], ["offre", "titre"], ["nom"]]);
  });
  it("should get all tags", function () {
    var doc = createDoc("multi-page.pptx");
    var iModule = inspectModule();
    doc.attachModule(iModule);
    doc.compile();
    expect(iModule.getFileType()).to.be.deep.equal("pptx");
    expect(iModule.getAllTags()).to.be.deep.equal({
      tag: {},
      users: {
        name: {}
      }
    });
    expect(iModule.getTemplatedFiles()).to.be.deep.equal(["ppt/slides/slide1.xml", "ppt/slides/slide2.xml", "ppt/slideMasters/slideMaster1.xml", "ppt/presentation.xml", "docProps/app.xml", "docProps/core.xml"]);
  });
  it("should get all tags and merge them", function () {
    var doc = createDoc("multi-page-to-merge.pptx");
    var iModule = inspectModule();
    doc.attachModule(iModule);
    doc.compile();
    expect(iModule.getAllTags()).to.be.deep.equal({
      tag: {},
      users: {
        name: {},
        age: {},
        company: {}
      }
    });
  });
  it("should get all tags with additional data", function () {
    var doc = createDoc("tag-product-loop.docx");
    var iModule = inspectModule();
    doc.attachModule(iModule);
    doc.compile();
    expect(iModule.getAllStructuredTags()).to.be.deep.equal([{
      type: "placeholder",
      value: "products",
      raw: "#products",
      lIndex: 15,
      module: "loop",
      inverted: false,
      offset: 0,
      endLindex: 15,
      subparsed: [{
        type: "placeholder",
        value: "title",
        offset: 11,
        endLindex: 31,
        lIndex: 31
      }, {
        type: "placeholder",
        value: "name",
        offset: 33,
        endLindex: 55,
        lIndex: 55
      }, {
        type: "placeholder",
        value: "reference",
        offset: 59,
        endLindex: 71,
        lIndex: 71
      }, {
        type: "placeholder",
        value: "avantages",
        module: "loop",
        raw: "#avantages",
        inverted: false,
        offset: 70,
        endLindex: 89,
        lIndex: 89,
        subparsed: [{
          type: "placeholder",
          value: "title",
          offset: 82,
          endLindex: 105,
          lIndex: 105
        }, {
          type: "placeholder",
          value: "proof",
          module: "loop",
          raw: "#proof",
          inverted: false,
          offset: 117,
          endLindex: 133,
          lIndex: 133,
          subparsed: [{
            type: "placeholder",
            value: "reason",
            offset: 143,
            endLindex: 155,
            lIndex: 155
          }]
        }]
      }]
    }]);
  });
});
describe("Docxtemplater loops", function () {
  it("should replace all the tags", function () {
    var tags = {
      nom: "Hipp",
      prenom: "Edgar",
      telephone: "0652455478",
      description: "New Website",
      offre: [{
        titre: "titre1",
        prix: "1250"
      }, {
        titre: "titre2",
        prix: "2000"
      }, {
        titre: "titre3",
        prix: "1400",
        nom: "Offre"
      }]
    };
    var doc = createDoc("tag-loop-example.docx");
    doc.setData(tags);
    doc.render();
    expect(doc.getFullText()).to.be.equal("Votre proposition commercialeHippPrix: 1250Titre titre1HippPrix: 2000Titre titre2OffrePrix: 1400Titre titre3HippEdgar");
  });
  it("should work with loops inside loops", function () {
    var tags = {
      products: [{
        title: "Microsoft",
        name: "DOS",
        reference: "Win7",
        avantages: [{
          title: "Everyone uses it",
          proof: [{
            reason: "it is quite cheap"
          }, {
            reason: "it is quit simple"
          }, {
            reason: "it works on a lot of different Hardware"
          }]
        }]
      }, {
        title: "Linux",
        name: "Ubuntu",
        reference: "Ubuntu10",
        avantages: [{
          title: "It's very powerful",
          proof: [{
            reason: "the terminal is your friend"
          }, {
            reason: "Hello world"
          }, {
            reason: "it's free"
          }]
        }]
      }, {
        title: "Apple",
        name: "Mac",
        reference: "OSX",
        avantages: [{
          title: "It's very easy",
          proof: [{
            reason: "you can do a lot just with the mouse"
          }, {
            reason: "It's nicely designed"
          }]
        }]
      }]
    };
    var doc = createDoc("tag-product-loop.docx");
    doc.setData(tags);
    doc.render();
    var text = doc.getFullText();
    var expectedText = "MicrosoftProduct name : DOSProduct reference : Win7Everyone uses itProof that it works nicely : It works because it is quite cheap It works because it is quit simple It works because it works on a lot of different HardwareLinuxProduct name : UbuntuProduct reference : Ubuntu10It's very powerfulProof that it works nicely : It works because the terminal is your friend It works because Hello world It works because it's freeAppleProduct name : MacProduct reference : OSXIt's very easyProof that it works nicely : It works because you can do a lot just with the mouse It works because It's nicely designed";
    expect(text.length).to.be.equal(expectedText.length);
    expect(text).to.be.equal(expectedText);
  });
  it("should work with object value", function () {
    var content = "<w:t>{#todo}{todo}{/todo}</w:t>";
    var expectedContent = '<w:t xml:space="preserve">abc</w:t>';
    var scope = {
      todo: {
        todo: "abc"
      }
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope
    });
    xmlTemplater.render();
    expect(getContent(xmlTemplater)).to.be.deep.equal(expectedContent);
  });
  it("should work with string value", function () {
    var content = "<w:t>{#todo}{todo}{/todo}</w:t>";
    var expectedContent = '<w:t xml:space="preserve">abc</w:t>';
    var scope = {
      todo: "abc"
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope
    });
    xmlTemplater.render();
    var c = getContent(xmlTemplater);
    expect(c).to.be.deep.equal(expectedContent);
  });
  it("should not have sideeffects with inverted with array length 3", function () {
    var content = "<w:t>{^todos}No {/todos}Todos</w:t>\n<w:t>{#todos}{.}{/todos}</w:t>";
    var expectedContent = "<w:t xml:space=\"preserve\">Todos</w:t>\n<w:t xml:space=\"preserve\">ABC</w:t>";
    var scope = {
      todos: ["A", "B", "C"]
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope
    });
    var c = getContent(xmlTemplater);
    expect(c).to.be.deep.equal(expectedContent);
  });
  it("should not have sideeffects with inverted with empty array", function () {
    var content = "<w:t>{^todos}No {/todos}Todos</w:t>\n\t\t<w:t>{#todos}{.}{/todos}</w:t>";
    var expectedContent = "<w:t xml:space=\"preserve\">No Todos</w:t>\n\t\t<w:t/>";
    var scope = {
      todos: []
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope
    });
    var c = getContent(xmlTemplater);
    expect(c).to.be.deep.equal(expectedContent);
  });
  it("should provide inverted loops", function () {
    var content = "<w:t>{^products}No products found{/products}</w:t>";
    [{
      products: []
    }, {
      products: false
    }, {}].forEach(function (tags) {
      var doc = createXmlTemplaterDocx(content, {
        tags: tags
      });
      doc.render();
      expect(doc.getFullText()).to.be.equal("No products found");
    });
    [{
      products: [{
        name: "Bread"
      }]
    }, {
      products: true
    }, {
      products: "Bread"
    }, {
      products: {
        name: "Bread"
      }
    }].forEach(function (tags) {
      var doc = createXmlTemplaterDocx(content, {
        tags: tags
      });
      doc.render();
      expect(doc.getFullText()).to.be.equal("");
    });
  });
  it("should be possible to close loops with {/}", function () {
    var content = "<w:t>{#products}Product {name}{/}</w:t>";
    var tags = {
      products: [{
        name: "Bread"
      }]
    };
    var doc = createXmlTemplaterDocx(content, {
      tags: tags
    });
    doc.render();
    expect(doc.getFullText()).to.be.equal("Product Bread");
  });
  it("should be possible to close double loops with {/}", function () {
    var content = "<w:t>{#companies}{#products}Product {name}{/}{/}</w:t>";
    var tags = {
      companies: [{
        products: [{
          name: "Bread"
        }]
      }]
    };
    var doc = createXmlTemplaterDocx(content, {
      tags: tags
    });
    doc.render();
    expect(doc.getFullText()).to.be.equal("Product Bread");
  });
  it("should work with complex loops", function () {
    var content = "<w:t>{title} {#users} {name} friends are : {#friends} {.</w:t>TAG..TAG<w:t>},{/friends} {/users</w:t>TAG2<w:t>}</w:t>";
    var scope = {
      title: "###Title###",
      users: [{
        name: "John Doe",
        friends: ["Jane", "Henry"]
      }, {}],
      name: "Default",
      friends: ["None"]
    };
    var doc = createXmlTemplaterDocx(content, {
      tags: scope
    });
    doc.render();
    expect(doc.getFullText()).to.be.equal("###Title###  John Doe friends are :  Jane, Henry,  Default friends are :  None, ");
  });
});
describe("Changing the parser", function () {
  it("should work with uppercassing", function () {
    var content = "<w:t>Hello {name}</w:t>";
    var scope = {
      name: "Edgar"
    };

    function parser(tag) {
      return _defineProperty({}, "get", function get(scope) {
        return scope[tag].toUpperCase();
      });
    }

    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope,
      parser: parser
    });
    xmlTemplater.render();
    expect(xmlTemplater.getFullText()).to.be.equal("Hello EDGAR");
  });
  it("should work when setting from the Docxtemplater interface", function () {
    var doc = createDoc("tag-example.docx");
    var zip = new JSZip(doc.loadedContent);
    var d = new Docxtemplater().loadZip(zip);
    var tags = {
      first_name: "Hipp",
      last_name: "Edgar",
      phone: "0652455478",
      description: "New Website"
    };
    d.setData(tags);

    d.parser = function (tag) {
      return _defineProperty({}, "get", function get(scope) {
        return scope[tag].toUpperCase();
      });
    };

    d.render();
    expect(d.getFullText()).to.be.equal("EDGAR HIPP");
    expect(d.getFullText("word/header1.xml")).to.be.equal("EDGAR HIPP0652455478NEW WEBSITE");
    expect(d.getFullText("word/footer1.xml")).to.be.equal("EDGARHIPP0652455478");
  });
  it("should work with angular parser", function () {
    var tags = {
      person: {
        first_name: "Hipp",
        last_name: "Edgar",
        birth_year: 1955,
        age: 59
      }
    };
    var doc = createDoc("angular-example.docx");
    doc.setData(tags);
    doc.setOptions({
      parser: angularParser
    });
    doc.render();
    expect(doc.getFullText()).to.be.equal("Hipp Edgar 2014");
  });
  it("should work with loops", function () {
    var content = "<w:t>Hello {#person.adult}you{/person.adult}</w:t>";
    var scope = {
      person: {
        name: "Edgar",
        adult: true
      }
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope,
      parser: angularParser
    });
    xmlTemplater.render();
    expect(xmlTemplater.getFullText()).to.be.equal("Hello you");
  });
  it("should be able to access meta to get the index", function () {
    var content = "<w:t>Hello {#users}{$index} {name} {/users}</w:t>";
    var scope = {
      users: [{
        name: "Jane"
      }, {
        name: "Mary"
      }]
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope,
      parser: function parser(tag) {
        return {
          get: function get(scope, context) {
            if (tag === "$index") {
              var indexes = context.scopePathItem;
              return indexes[indexes.length - 1];
            }

            return scope[tag];
          }
        };
      }
    });
    xmlTemplater.render();
    expect(xmlTemplater.getFullText()).to.be.equal("Hello 0 Jane 1 Mary ");
  });
  it("should be able to access meta to get the type of tag", function () {
    var content = "<w:p><w:t>Hello {#users}{name}{/users}</w:t></w:p>\n\t\t<w:p><w:t>{@rrr}</w:t></w:p>\n\t\t";
    var scope = {
      users: [{
        name: "Jane"
      }],
      rrr: ""
    };
    var contexts = [];
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope,
      parser: function parser(tag) {
        return {
          get: function get(scope, context) {
            contexts.push(context);

            if (tag === "$index") {
              var indexes = context.scopePathItem;
              return indexes[indexes.length - 1];
            }

            return scope[tag];
          }
        };
      }
    });
    expect(xmlTemplater.getFullText()).to.be.equal("Hello Jane");
    var values = contexts.map(function (_ref3) {
      var _ref3$meta$part = _ref3.meta.part,
          type = _ref3$meta$part.type,
          value = _ref3$meta$part.value,
          module = _ref3$meta$part.module;
      return {
        type: type,
        value: value,
        module: module
      };
    });
    expect(values).to.be.deep.equal([{
      type: "placeholder",
      value: "users",
      module: "loop"
    }, {
      type: "placeholder",
      value: "name",
      module: undefined
    }, {
      type: "placeholder",
      value: "rrr",
      module: "rawxml"
    }]);
  });
});
describe("Change the delimiters", function () {
  it("should work with lt and gt delimiter < and >", function () {
    var doc = createDoc("delimiter-gt.docx");
    doc.setOptions({
      delimiters: {
        start: "<",
        end: ">"
      }
    });
    doc.setData({
      user: "John"
    });
    doc.render();
    var fullText = doc.getFullText();
    expect(fullText).to.be.equal("Hello John");
  });
});
describe("Special characters", function () {
  it("should parse placeholder containing special characters", function () {
    var content = "<w:t>Hello {&gt;name}</w:t>";
    var scope = {
      ">name": "Edgar"
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope
    });
    var c = getContent(xmlTemplater);
    expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello Edgar</w:t>');
  });
  it("should render placeholder containing special characters", function () {
    var content = "<w:t>Hello {name}</w:t>";
    var scope = {
      name: "<Edgar>"
    };
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope
    });
    var c = getContent(xmlTemplater);
    expect(c).to.be.deep.equal('<w:t xml:space="preserve">Hello &lt;Edgar&gt;</w:t>');
  });
  it("should read full text correctly", function () {
    var doc = createDoc("cyrillic.docx");
    var fullText = doc.getFullText();
    expect(fullText.charCodeAt(0)).to.be.equal(1024);
    expect(fullText.charCodeAt(1)).to.be.equal(1050);
    expect(fullText.charCodeAt(2)).to.be.equal(1048);
    expect(fullText.charCodeAt(3)).to.be.equal(1046);
    expect(fullText.charCodeAt(4)).to.be.equal(1044);
    expect(fullText.charCodeAt(5)).to.be.equal(1045);
    expect(fullText.charCodeAt(6)).to.be.equal(1039);
    expect(fullText.charCodeAt(7)).to.be.equal(1040);
  });
  it("should still read full text after applying tags", function () {
    var doc = createDoc("cyrillic.docx");
    doc.setData({
      name: "Edgar"
    });
    doc.render();
    var fullText = doc.getFullText();
    expect(fullText.charCodeAt(0)).to.be.equal(1024);
    expect(fullText.charCodeAt(1)).to.be.equal(1050);
    expect(fullText.charCodeAt(2)).to.be.equal(1048);
    expect(fullText.charCodeAt(3)).to.be.equal(1046);
    expect(fullText.charCodeAt(4)).to.be.equal(1044);
    expect(fullText.charCodeAt(5)).to.be.equal(1045);
    expect(fullText.charCodeAt(6)).to.be.equal(1039);
    expect(fullText.charCodeAt(7)).to.be.equal(1040);
    expect(fullText.indexOf("Edgar")).to.be.equal(9);
  });
  it("should insert russian characters", function () {
    var russian = "Пупкина";
    var doc = createDoc("tag-example.docx");
    var zip = new JSZip(doc.loadedContent);
    var d = new Docxtemplater().loadZip(zip);
    d.setData({
      last_name: russian
    });
    d.render();
    var outputText = d.getFullText();
    expect(outputText.substr(0, 7)).to.be.equal(russian);
  });
});
describe("Complex table example", function () {
  it("should not do anything special when loop outside of table", function () {
    ["<w:t>{#tables}</w:t>\n<w:table><w:tr><w:tc>\n<w:t>{user}</w:t>\n</w:tc></w:tr></w:table>\n<w:t>{/tables}</w:t>"].forEach(function (content) {
      var scope = {
        tables: [{
          user: "John"
        }, {
          user: "Jane"
        }]
      };
      var doc = createXmlTemplaterDocx(content, {
        tags: scope
      });
      doc.render();
      var c = getContent(doc);
      expect(c).to.be.equal("<w:t/>\n<w:table><w:tr><w:tc>\n<w:t xml:space=\"preserve\">John</w:t>\n</w:tc></w:tr></w:table>\n<w:t/>\n<w:table><w:tr><w:tc>\n<w:t xml:space=\"preserve\">Jane</w:t>\n</w:tc></w:tr></w:table>\n<w:t/>");
    });
  });
  it("should work when looping inside tables", function () {
    var tags = {
      table1: [1],
      key: "value"
    };
    var template = "<w:tr>\n\t\t<w:tc><w:t>{#table1}Hi</w:t></w:tc>\n\t\t<w:tc><w:t>{/table1}</w:t> </w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc><w:p><w:t>{#table1}Ho</w:t></w:p></w:tc>\n\t\t<w:tc><w:p><w:t>{/table1}</w:t></w:p></w:tc>\n\t\t</w:tr>\n\t\t<w:t>{key}</w:t>\n\t\t";
    var doc = createXmlTemplaterDocx(template, {
      tags: tags
    });
    doc.render();
    var fullText = doc.getFullText();
    expect(fullText).to.be.equal("HiHovalue");
    var expected = "<w:tr>\n\t\t<w:tc><w:t xml:space=\"preserve\">Hi</w:t></w:tc>\n\t\t<w:tc><w:t/> </w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc><w:p><w:t xml:space=\"preserve\">Ho</w:t></w:p></w:tc>\n\t\t<w:tc><w:p><w:t/></w:p></w:tc>\n\t\t</w:tr>\n\t\t<w:t xml:space=\"preserve\">value</w:t>\n\t\t";
    var c = getContent(doc);
    expect(c).to.be.equal(expected);
  });
});
describe("Raw Xml Insertion", function () {
  it("should work with simple example", function () {
    var inner = "<w:p><w:r><w:t>{@complexXml}</w:t></w:r></w:p>";
    var content = "<w:document>".concat(inner, "</w:document>");
    var scope = {
      complexXml: '<w:p w:rsidR="00612058" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val="FF0000"/></w:rPr><w:t>My custom XML</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblStyle w: val="Grilledutableau"/><w:tblW w: w="0" w:type="auto"/><w:tblLook w: val="04A0" w: firstRow="1" w: lastRow="0" w: firstColumn="1" w: lastColumn="0" w: noHBand="0" w: noVBand="1"/></w:tblPr><w:tblGrid><w: gridCol w: w="2952"/><w: gridCol w: w="2952"/><w: gridCol w: w="2952"/></w:tblGrid><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: b/><w: color w: val="000000" w:themeColor="text1"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val="000000" w:themeColor="text1"/></w:rPr><w:t>Test</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: b/><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: b/><w: color w: val="FF0000"/></w:rPr><w:t>Xml</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="DDD9C3" w:themeFill="background2" w:themeFillShade="E6"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val="FF0000"/></w:rPr><w:t>Generated</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="000000" w:themeColor="text1"/><w: u w: val="single"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w: color w: val="000000" w:themeColor="text1"/><w: u w: val="single"/></w:rPr><w:t>Underline</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w: color w: val="FF0000"/><w: highlight w: val="yellow"/></w:rPr><w:t>Highlighting</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="C6D9F1" w:themeFill="text2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w:rFonts w: ascii="Bauhaus 93" w: hAnsi="Bauhaus 93"/><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w:rFonts w: ascii="Bauhaus 93" w: hAnsi="Bauhaus 93"/><w: color w: val="FF0000"/></w:rPr><w:t>Font</w:t></w:r></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00EA4B08"><w:pPr><w: jc w: val="center"/><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r><w:rPr><w: color w: val="FF0000"/></w:rPr><w:t>Centering</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRPr="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: i/><w: color w: val="FF0000"/></w:rPr></w:pPr><w:r w:rsidRPr="00EA4B08"><w:rPr><w: i/><w: color w: val="FF0000"/></w:rPr><w:t>Italic</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="F2DBDB" w:themeFill="accent2" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="E5DFEC" w:themeFill="accent4" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr><w:tr w:rsidR="00EA4B08" w:rsidTr="00EA4B08"><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc><w:tc><w:tcPr><w:tcW w: w="2952" w:type="dxa"/><w: shd w: val="clear" w: color="auto" w: fill="FDE9D9" w:themeFill="accent6" w:themeFillTint="33"/></w:tcPr><w:p w:rsidR="00EA4B08" w:rsidRDefault="00EA4B08" w:rsidP="00612058"><w:pPr><w:rPr><w: color w: val="FF0000"/></w:rPr></w:pPr></w:p></w:tc></w:tr></w:tbl>'
    };
    var doc = createXmlTemplaterDocx(content, {
      tags: scope
    });
    doc.render();
    var c = getContent(doc);
    expect(c.length).to.be.equal(content.length + scope.complexXml.length - inner.length);
    expect(c).to.contain(scope.complexXml);
  });
  it("should work even when tags are after the xml", function () {
    var content = "<w:tbl>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{@complexXml}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{name}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{first_name}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t<w:tr>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{#products} {year}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{name}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t<w:tc>\n\t\t<w:p>\n\t\t<w:r>\n\t\t<w:t>{company}{/products}</w:t>\n\t\t</w:r>\n\t\t</w:p>\n\t\t</w:tc>\n\t\t</w:tr>\n\t\t</w:tbl>\n\t\t";
    var scope = {
      complexXml: "<w:p><w:r><w:t>Hello</w:t></w:r></w:p>",
      name: "John",
      first_name: "Doe",
      products: [{
        year: 1550,
        name: "Moto",
        company: "Fein"
      }, {
        year: 1987,
        name: "Water",
        company: "Test"
      }, {
        year: 2010,
        name: "Bread",
        company: "Yu"
      }]
    };
    var doc = createXmlTemplaterDocx(content, {
      tags: scope
    });
    doc.render();
    var c = getContent(doc);
    expect(c).to.contain(scope.complexXml);
    expect(doc.getFullText()).to.be.equal("HelloJohnDoe 1550MotoFein 1987WaterTest 2010BreadYu");
  });
  it("should work with closing tag in the form of <w:t>}{/body}</w:t>", function () {
    var scope = {
      body: [{
        paragraph: "hello"
      }]
    };
    var content = "<w:t>{#body}</w:t>\n\t\t<w:t>{paragraph</w:t>\n\t\t\t<w:t>}{/body}</w:t>";
    var xmlTemplater = createXmlTemplaterDocx(content, {
      tags: scope
    });
    xmlTemplater.render();
    var c = getContent(xmlTemplater);
    expect(c).not.to.contain("</w:t></w:t>");
  });
  it("should work with simple example and given options", function () {
    var scope = {
      xmlTag: '<w:r><w:rPr><w:color w:val="FF0000"/></w:rPr><w:t>My custom</w:t></w:r><w:r><w:rPr><w:color w:val="00FF00"/></w:rPr><w:t>XML</w:t></w:r>'
    };
    var doc = createDoc("one-raw-xml-tag.docx");
    doc.setOptions({
      fileTypeConfig: merge({}, Docxtemplater.FileTypeConfig.docx, {
        tagRawXml: "w:r"
      })
    });
    doc.setData(scope);
    doc.render();
    expect(doc.getFullText()).to.be.equal("asdfMy customXMLqwery");
  });
});
describe("Serialization", function () {
  it("should be serialiazable (useful for logging)", function () {
    var doc = createDoc("tag-example.docx");
    JSON.stringify(doc);
  });
});
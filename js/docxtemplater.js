"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DocUtils = require("./doc-utils");

DocUtils.traits = require("./traits");
DocUtils.moduleWrapper = require("./module-wrapper");

var Lexer = require("./lexer");

var defaults = DocUtils.defaults,
    str2xml = DocUtils.str2xml,
    xml2str = DocUtils.xml2str,
    moduleWrapper = DocUtils.moduleWrapper,
    utf8ToWord = DocUtils.utf8ToWord,
    concatArrays = DocUtils.concatArrays,
    unique = DocUtils.unique;

var _require = require("./errors"),
    XTInternalError = _require.XTInternalError,
    throwFileTypeNotIdentified = _require.throwFileTypeNotIdentified,
    throwFileTypeNotHandled = _require.throwFileTypeNotHandled,
    throwApiVersionError = _require.throwApiVersionError;

var currentModuleApiVersion = [3, 10, 0];

var Docxtemplater =
/*#__PURE__*/
function () {
  function Docxtemplater() {
    _classCallCheck(this, Docxtemplater);

    if (arguments.length > 0) {
      throw new Error("The constructor with parameters has been removed in docxtemplater 3, please check the upgrade guide.");
    }

    this.compiled = {};
    this.modules = [];
    this.setOptions({});
  }

  _createClass(Docxtemplater, [{
    key: "getModuleApiVersion",
    value: function getModuleApiVersion() {
      return currentModuleApiVersion.join(".");
    }
  }, {
    key: "verifyApiVersion",
    value: function verifyApiVersion(neededVersion) {
      neededVersion = neededVersion.split(".").map(function (i) {
        return parseInt(i, 10);
      });

      if (neededVersion.length !== 3) {
        throwApiVersionError("neededVersion is not a valid version", {
          neededVersion: neededVersion,
          explanation: "the neededVersion must be an array of length 3"
        });
      }

      if (neededVersion[0] !== currentModuleApiVersion[0]) {
        throwApiVersionError("The major api version do not match, you probably have to update docxtemplater with npm install --save docxtemplater", {
          neededVersion: neededVersion,
          currentModuleApiVersion: currentModuleApiVersion,
          explanation: "moduleAPIVersionMismatch : needed=".concat(neededVersion.join("."), ", current=").concat(currentModuleApiVersion.join("."))
        });
      }

      if (neededVersion[1] > currentModuleApiVersion[1]) {
        throwApiVersionError("The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater", {
          neededVersion: neededVersion,
          currentModuleApiVersion: currentModuleApiVersion,
          explanation: "moduleAPIVersionMismatch : needed=".concat(neededVersion.join("."), ", current=").concat(currentModuleApiVersion.join("."))
        });
      }

      return true;
    }
  }, {
    key: "setModules",
    value: function setModules(obj) {
      this.modules.forEach(function (module) {
        module.set(obj);
      });
    }
  }, {
    key: "sendEvent",
    value: function sendEvent(eventName) {
      this.modules.forEach(function (module) {
        module.on(eventName);
      });
    }
  }, {
    key: "attachModule",
    value: function attachModule(module) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var prefix = options.prefix;

      if (prefix) {
        module.prefix = prefix;
      }

      var wrappedModule = moduleWrapper(module);
      this.modules.push(wrappedModule);
      wrappedModule.on("attached");
      return this;
    }
  }, {
    key: "setOptions",
    value: function setOptions(options) {
      var _this = this;

      if (options.delimiters) {
        options.delimiters.start = utf8ToWord(options.delimiters.start);
        options.delimiters.end = utf8ToWord(options.delimiters.end);
      }

      this.options = options;
      Object.keys(defaults).forEach(function (key) {
        var defaultValue = defaults[key];
        _this.options[key] = _this.options[key] != null ? _this.options[key] : defaultValue;
        _this[key] = _this.options[key];
      });

      if (this.zip) {
        this.updateFileTypeConfig();
      }

      return this;
    }
  }, {
    key: "loadZip",
    value: function loadZip(zip) {
      if (zip.loadAsync) {
        throw new XTInternalError("Docxtemplater doesn't handle JSZip version >=3, see changelog");
      }

      this.zip = zip;
      this.updateFileTypeConfig();
      this.modules = concatArrays([this.fileTypeConfig.baseModules.map(function (moduleFunction) {
        return moduleFunction();
      }), this.modules]);
      return this;
    }
  }, {
    key: "compileFile",
    value: function compileFile(fileName) {
      var currentFile = this.createTemplateClass(fileName);
      currentFile.parse();
      this.compiled[fileName] = currentFile;
    }
  }, {
    key: "resolveData",
    value: function resolveData(data) {
      var _this2 = this;

      return Promise.all(Object.keys(this.compiled).map(function (from) {
        var currentFile = _this2.compiled[from];
        return currentFile.resolveTags(data);
      })).then(function (resolved) {
        return concatArrays(resolved);
      });
    }
  }, {
    key: "compile",
    value: function compile() {
      var _this3 = this;

      if (Object.keys(this.compiled).length) {
        return this;
      }

      this.options = this.modules.reduce(function (options, module) {
        return module.optionsTransformer(options, _this3);
      }, this.options);
      this.options.xmlFileNames = unique(this.options.xmlFileNames);
      this.xmlDocuments = this.options.xmlFileNames.reduce(function (xmlDocuments, fileName) {
        var content = _this3.zip.files[fileName].asText();

        xmlDocuments[fileName] = str2xml(content);
        return xmlDocuments;
      }, {});
      this.setModules({
        zip: this.zip,
        xmlDocuments: this.xmlDocuments
      });
      this.getTemplatedFiles();
      this.setModules({
        compiled: this.compiled
      }); // Loop inside all templatedFiles (ie xml files with content).
      // Sometimes they don't exist (footer.xml for example)

      this.templatedFiles.forEach(function (fileName) {
        if (_this3.zip.files[fileName] != null) {
          _this3.compileFile(fileName);
        }
      });
      return this;
    }
  }, {
    key: "updateFileTypeConfig",
    value: function updateFileTypeConfig() {
      var fileType;

      if (this.zip.files.mimetype) {
        fileType = "odt";
      }

      if (this.zip.files["word/document.xml"] || this.zip.files["word/document2.xml"]) {
        fileType = "docx";
      }

      if (this.zip.files["ppt/presentation.xml"]) {
        fileType = "pptx";
      }

      if (fileType === "odt") {
        throwFileTypeNotHandled(fileType);
      }

      if (!fileType) {
        throwFileTypeNotIdentified();
      }

      this.fileType = fileType;
      this.fileTypeConfig = this.options.fileTypeConfig || Docxtemplater.FileTypeConfig[this.fileType];
      return this;
    }
  }, {
    key: "render",
    value: function render() {
      var _this4 = this;

      this.setModules({
        data: this.data,
        Lexer: Lexer
      });
      this.compile();
      this.mapper = this.modules.reduce(function (value, module) {
        return module.getRenderedMap(value);
      }, {});
      this.fileTypeConfig.tagsXmlLexedArray = unique(this.fileTypeConfig.tagsXmlLexedArray);
      this.fileTypeConfig.tagsXmlTextArray = unique(this.fileTypeConfig.tagsXmlTextArray);
      Object.keys(this.mapper).forEach(function (to) {
        var _this4$mapper$to = _this4.mapper[to],
            from = _this4$mapper$to.from,
            data = _this4$mapper$to.data;
        var currentFile = _this4.compiled[from];
        currentFile.setTags(data);
        currentFile.render(to);

        _this4.zip.file(to, currentFile.content, {
          createFolders: true
        });
      });
      this.sendEvent("syncing-zip");
      this.syncZip();
      return this;
    }
  }, {
    key: "syncZip",
    value: function syncZip() {
      var _this5 = this;

      Object.keys(this.xmlDocuments).forEach(function (fileName) {
        _this5.zip.remove(fileName);

        var content = xml2str(_this5.xmlDocuments[fileName]);
        return _this5.zip.file(fileName, content, {
          createFolders: true
        });
      });
    }
  }, {
    key: "setData",
    value: function setData(data) {
      this.data = data;
      return this;
    }
  }, {
    key: "getZip",
    value: function getZip() {
      return this.zip;
    }
  }, {
    key: "createTemplateClass",
    value: function createTemplateClass(path) {
      var usedData = this.zip.files[path].asText();
      return this.createTemplateClassFromContent(usedData, path);
    }
  }, {
    key: "createTemplateClassFromContent",
    value: function createTemplateClassFromContent(content, filePath) {
      var _this6 = this;

      var xmltOptions = {
        filePath: filePath
      };
      Object.keys(defaults).forEach(function (key) {
        xmltOptions[key] = _this6[key];
      });
      xmltOptions.fileTypeConfig = this.fileTypeConfig;
      xmltOptions.modules = this.modules;
      return new Docxtemplater.XmlTemplater(content, xmltOptions);
    }
  }, {
    key: "getFullText",
    value: function getFullText(path) {
      return this.createTemplateClass(path || this.fileTypeConfig.textPath(this.zip)).getFullText();
    }
  }, {
    key: "getTemplatedFiles",
    value: function getTemplatedFiles() {
      this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
      return this.templatedFiles;
    }
  }]);

  return Docxtemplater;
}();

Docxtemplater.DocUtils = DocUtils;
Docxtemplater.Errors = require("./errors");
Docxtemplater.XmlTemplater = require("./xml-templater");
Docxtemplater.FileTypeConfig = require("./file-type-config");
Docxtemplater.XmlMatcher = require("./xml-matcher");
module.exports = Docxtemplater;
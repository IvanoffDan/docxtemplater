"use strict";

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var wrapper = require("../module-wrapper");

var _require = require("../doc-utils"),
    isTagEnd = _require.isTagEnd,
    isTagStart = _require.isTagStart,
    chunkBy = _require.chunkBy;

var _require2 = require("../prefix-matcher"),
    match = _require2.match,
    getValue = _require2.getValue,
    getValues = _require2.getValues;

var get = require("lodash/get");

var moduleName = "checkbox-table";
var defaultEmptyValue = "";

function isTableRowStart(options) {
  return isTagStart("w:tr", options);
}

function isTableRowEnd(options) {
  return isTagEnd("w:tr", options);
}

function isCheckboxTablePlaceholder(chunk) {
  return chunk.type === "placeholder" && chunk.module === moduleName;
}

var CheckboxTable =
/*#__PURE__*/
function () {
  function CheckboxTable() {
    _classCallCheck(this, CheckboxTable);

    this.name = moduleName;
    this.prefix = {
      rows: /^Rows\((.*)\)$/
    };
  }

  _createClass(CheckboxTable, [{
    key: "set",
    value: function set(obj) {
      if (obj.data) {
        this.data = obj.data;
      }
    }
  }, {
    key: "optionsTransformer",
    value: function optionsTransformer(options) {
      this.tags = options.tags;
      return options;
    }
  }, {
    key: "parse",
    value: function parse(placeHolderContent) {
      var type = "placeholder";
      var module = this.name;
      var rows = this.prefix.rows;

      if (match(rows, placeHolderContent)) {
        var values = getValues(rows, placeHolderContent);
        return {
          type: type,
          value: values[1],
          module: module
        };
      }

      return null;
    }
  }, {
    key: "postparse",
    value: function postparse(postparsed, meta) {
      var newPostparsed = [];

      for (var i = 0; i < postparsed.length; i++) {
        var part = postparsed[i];

        if (isTableRowStart(part)) {
          var _processRow = processRow({
            postparsed: postparsed,
            part: part,
            index: i,
            data: this.data
          }),
              newChunks = _processRow.newChunks,
              newIndex = _processRow.newIndex;

          i = newIndex;
          newPostparsed.push.apply(newPostparsed, _toConsumableArray(newChunks));
        } else {
          newPostparsed.push(_objectSpread({}, part, {
            lIndex: newPostparsed.length
          }));
        }
      }

      return newPostparsed;
    }
  }, {
    key: "render",
    value: function render(part, options) {
      return null;
    }
  }]);

  return CheckboxTable;
}();

function processRow(_ref) {
  var postparsed = _ref.postparsed,
      part = _ref.part,
      index = _ref.index,
      data = _ref.data;
  var row = [part];
  var rowEndIndex = index;

  for (var i = index; i < postparsed.length; i++) {
    var currentPart = postparsed[i];

    if (!isTableRowEnd(currentPart)) {
      row.push(currentPart);
    } else {
      row.push(currentPart);
      rowEndIndex = i;
      break;
    }
  }

  var tags = getTags(row);

  if (tags.length > 0) {
    var currentLIndex = part.lIndex;
    var numberOfCopies = getNumberOfRows(tags, data);
    var rowsToAdd = [];

    for (var _i = 0; _i < numberOfCopies; _i++) {
      var newRow = copyRow(row, _i, currentLIndex, data);
      rowsToAdd.push(newRow);
      currentLIndex += newRow.length;
    }

    return {
      newChunks: [].concat.apply([], rowsToAdd),
      newIndex: rowEndIndex
    };
  }

  return {
    newChunks: row,
    newIndex: rowEndIndex
  };
}

function copyRow(row, iteration, currentLIndex, data) {
  return row.map(function (element, i) {
    var el = element;

    if (isCheckboxTablePlaceholder(element)) {
      el = convertToTemplaterTag(element, iteration, data);
    }

    return _objectSpread({}, el, {
      lIndex: currentLIndex + i
    });
  });
}

function convertToTemplaterTag(element, iteration, data) {
  var value = "";

  if (get(data, [element.value, iteration])) {
    value = "".concat(element.value, "[").concat(iteration, "]");
  }

  return _objectSpread({}, element, {
    module: undefined,
    value: value
  });
}

function getRowChunks(parsed) {
  var chunks = chunkBy(parsed, function (p) {
    if (isTableRowStart(p)) {
      return "start";
    }

    if (isTableRowEnd(p)) {
      return "end";
    }

    return null;
  });
  return chunks.slice(1, -1);
}

function getTags(row) {
  var tags = [];
  row.forEach(function (part) {
    if (part.type === "placeholder" && part.module === moduleName) {
      tags.push(part);
    }
  });
  return tags;
}

function getNumberOfRows(tags, data) {
  return tags.reduce(function (max, v) {
    // TODO: Make this safe + add error handling
    var length = data[v.value].length;

    if (length > max) {
      return length;
    }

    return max;
  }, 0);
}

module.exports = function () {
  return wrapper(new CheckboxTable());
};
/* Stashing */
// const rowChunks = getRowChunks(postparsed);
// rowChunks.forEach((row) => {
//   const tags = getTags(row);
//   if (tags.length > 0) {
//     const numberOfCopies = getNumberOfRows(tags, this.data);
//     const rowsToAdd = [];
//     for (let i = 0; i < numberOfCopies; i++) {
//       const newRow = copyRow(row, i, this.data);
//       rowsToAdd.push(newRow);
//     }
//     console.log(rowsToAdd);
//   }
// });

/* Stashing end */
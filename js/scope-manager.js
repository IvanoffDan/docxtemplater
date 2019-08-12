"use strict";

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require("./errors"),
    getScopeParserExecutionError = _require.getScopeParserExecutionError;

var get = require("lodash/get");

function find(list, fn) {
  var length = list.length >>> 0;
  var value;

  for (var i = 0; i < length; i++) {
    value = list[i];

    if (fn.call(this, value, i, list)) {
      return value;
    }
  }

  return undefined;
}

function _getValue(tag, meta, num) {
  var _this = this;

  this.num = num;
  var scope = this.scopeList[this.num];

  if (this.resolved) {
    var w = this.resolved;
    this.scopePath.forEach(function (p, index) {
      var lIndex = _this.scopeLindex[index];
      w = find(w, function (r) {
        return r.lIndex === lIndex;
      });
      w = w.value[_this.scopePathItem[index]];
    });
    return find(w, function (r) {
      return meta.part.lIndex === r.lIndex;
    }).value;
  } // <<<<<<<<<<< CBX
  // replace .item with array index for CBX loops


  var processedTag = tag;

  if (this.loopIndices.length > 0) {
    processedTag = tag.replace(/.item/g, "[".concat(this.loopIndices[num - 1], "]"));
  } // >>>>>>>>>>
  // search in the scopes (in reverse order) and keep the first defined value


  var result;
  var parser = this.parser(processedTag, {
    scopePath: this.scopePath
  });

  try {
    result = parser.get(scope, this.getContext(meta));
  } catch (error) {
    throw getScopeParserExecutionError({
      processedTag: processedTag,
      scope: scope,
      error: error
    });
  }

  if (result == null && this.num > 0) {
    return _getValue.call(this, processedTag, meta, num - 1);
  }

  return result;
}

function _getValueAsync(tag, meta, num) {
  var _this2 = this;

  this.num = num;
  var scope = this.scopeList[this.num]; // search in the scopes (in reverse order) and keep the first defined value

  var parser = this.parser(tag, {
    scopePath: this.scopePath
  });
  return Promise.resolve(parser.get(scope, this.getContext(meta))).catch(function (error) {
    throw getScopeParserExecutionError({
      tag: tag,
      scope: scope,
      error: error
    });
  }).then(function (result) {
    if (result == null && num > 0) {
      return _getValueAsync.call(_this2, tag, meta, num - 1);
    }

    return result;
  });
}

var CheckboxList = function CheckboxList(list) {
  _classCallCheck(this, CheckboxList);

  this.list = list;
}; // This class responsibility is to manage the scope


var ScopeManager =
/*#__PURE__*/
function () {
  function ScopeManager(options) {
    _classCallCheck(this, ScopeManager);

    this.loopIndices = options.loopIndices; // << CBX to track loop index >>

    this.scopePath = options.scopePath;
    this.scopePathItem = options.scopePathItem;
    this.scopeList = options.scopeList;
    this.scopeLindex = options.scopeLindex;
    this.parser = options.parser;
    this.resolved = options.resolved;
  }

  _createClass(ScopeManager, [{
    key: "loopOver",
    value: function loopOver(tag, callback, inverted, meta) {
      inverted = inverted || false; // Handle CBX loop scope to equal parent scope

      if (meta.part && meta.part.module === "checkbox-loops") {
        return this.loopOverValue(new CheckboxList(this.getValue(tag, meta)), callback, inverted);
      }

      return this.loopOverValue(this.getValue(tag, meta), callback, inverted);
    }
  }, {
    key: "functorIfInverted",
    value: function functorIfInverted(inverted, functor, value, i) {
      if (inverted) {
        functor(value, i);
      }

      return inverted;
    }
  }, {
    key: "isValueFalsy",
    value: function isValueFalsy(value, type) {
      return value == null || !value || type === "[object Array]" && value.length === 0;
    }
  }, {
    key: "loopOverValue",
    value: function loopOverValue(value, functor, inverted) {
      if (this.resolved) {
        inverted = false;
      }

      var type = Object.prototype.toString.call(value);
      var currentValue = this.scopeList[this.num];

      if (this.isValueFalsy(value, type)) {
        return this.functorIfInverted(inverted, functor, currentValue, 0);
      } // Handle CBX loop scope to equal parent scope


      if (value instanceof CheckboxList) {
        for (var i = 0; i < value.list.length; i++) {
          this.functorIfInverted(!inverted, functor, currentValue, i);
        }

        return true;
      }

      if (type === "[object Array]") {
        for (var _i = 0, scope; _i < value.length; _i++) {
          scope = value[_i];
          this.functorIfInverted(!inverted, functor, scope, _i);
        }

        return true;
      }

      if (type === "[object Object]") {
        return this.functorIfInverted(!inverted, functor, value, 0);
      }

      return this.functorIfInverted(!inverted, functor, currentValue, 0);
    }
  }, {
    key: "getValue",
    value: function getValue(tag, meta) {
      var num = this.scopeList.length - 1;
      return _getValue.call(this, tag, meta, num);
    }
  }, {
    key: "getValueAsync",
    value: function getValueAsync(tag, meta) {
      var num = this.scopeList.length - 1;
      return _getValueAsync.call(this, tag, meta, num);
    }
  }, {
    key: "getContext",
    value: function getContext(meta) {
      return {
        num: this.num,
        meta: meta,
        scopeList: this.scopeList,
        resolved: this.resolved,
        scopePath: this.scopePath,
        scopePathItem: this.scopePathItem
      };
    }
  }, {
    key: "createSubScopeManager",
    value: function createSubScopeManager(scope, tag, i, part) {
      return new ScopeManager({
        resolved: this.resolved,
        parser: this.parser,
        loopIndices: this.loopIndices.concat(this.loopIndices[this.loopIndices.length - 1]),
        // CBX
        scopeList: this.scopeList.concat(scope),
        scopePath: this.scopePath.concat(tag),
        scopePathItem: this.scopePathItem.concat(i),
        scopeLindex: this.scopeLindex.concat(part.lIndex)
      });
    }
  }, {
    key: "createCheckboxLoopScopeManager",
    value: function createCheckboxLoopScopeManager(scope, tag, i, part, loopIndex) {
      return new ScopeManager({
        resolved: this.resolved,
        parser: this.parser,
        loopIndices: this.loopIndices.concat(loopIndex),
        // CBX
        scopeList: this.scopeList.concat(scope),
        scopePath: this.scopePath.concat(tag),
        scopePathItem: this.scopePathItem.concat(i),
        scopeLindex: this.scopeLindex.concat(part.lIndex)
      });
    }
  }]);

  return ScopeManager;
}();

module.exports = function (options) {
  options.loopIndices = [];
  options.scopePath = [];
  options.scopePathItem = [];
  options.scopeLindex = [];
  options.scopeList = [options.tags];
  return new ScopeManager(options);
};
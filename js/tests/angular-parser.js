"use strict";

var expressions = require("angular-expressions");

function angularParser(tag) {
  if (tag === ".") {
    return {
      get: function get(s) {
        return s;
      }
    };
  }

  var expr = expressions.compile(tag.replace(/(’|“|”|‘)/g, "'"));
  return {
    get: function get(s) {
      return expr(s);
    }
  };
}

module.exports = angularParser;
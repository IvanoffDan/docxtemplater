"use strict";
const { getScopeParserExecutionError } = require("./errors");
const get = require("lodash/get");

function find(list, fn) {
	const length = list.length >>> 0;
	let value;

	for (let i = 0; i < length; i++) {
		value = list[i];
		if (fn.call(this, value, i, list)) {
			return value;
		}
	}
	return undefined;
}

function getValue(tag, meta, num) {
	this.num = num;
	const scope = this.scopeList[this.num];
	if (this.resolved) {
		let w = this.resolved;
		this.scopePath.forEach((p, index) => {
			const lIndex = this.scopeLindex[index];
			w = find(w, function(r) {
				return r.lIndex === lIndex;
			});
			w = w.value[this.scopePathItem[index]];
		});
		return find(w, function(r) {
			return meta.part.lIndex === r.lIndex;
		}).value;
	}
	// search in the scopes (in reverse order) and keep the first defined value
	let result;
	const parser = this.parser(tag, { scopePath: this.scopePath });
	try {
		result = parser.get(scope, this.getContext(meta));
	} catch (error) {
		throw getScopeParserExecutionError({ tag, scope, error });
	}
	if (result == null && this.num > 0) {
		return getValue.call(this, tag, meta, num - 1);
	}
	return result;
}
function getValueAsync(tag, meta, num) {
	this.num = num;
	const scope = this.scopeList[this.num];
	// search in the scopes (in reverse order) and keep the first defined value
	const parser = this.parser(tag, { scopePath: this.scopePath });
	return Promise.resolve(parser.get(scope, this.getContext(meta)))
		.catch(function(error) {
			throw getScopeParserExecutionError({ tag, scope, error });
		})
		.then(result => {
			if (result == null && num > 0) {
				return getValueAsync.call(this, tag, meta, num - 1);
			}
			return result;
		});
}

// This class responsibility is to manage the scope
const ScopeManager = class ScopeManager {
	constructor(options) {
		this.scopePath = options.scopePath;
		this.scopePathItem = options.scopePathItem;
		this.scopeList = options.scopeList;
		this.scopeLindex = options.scopeLindex;
		this.parser = options.parser;
		this.resolved = options.resolved;
	}
	loopOver(tag, callback, inverted, meta) {
		inverted = inverted || false;
		return this.loopOverValue(this.getValue(tag, meta), callback, inverted);
	}
	functorIfInverted(inverted, functor, value, i) {
		if (inverted) {
			functor(value, i);
		}
		return inverted;
	}
	isValueFalsy(value, type) {
		return (
			value == null ||
			!value ||
			(type === "[object Array]" && value.length === 0)
		);
	}
	loopOverValue(value, functor, inverted) {
		if (this.resolved) {
			inverted = false;
		}
		const type = Object.prototype.toString.call(value);
		const currentValue = this.scopeList[this.num];
		if (this.isValueFalsy(value, type)) {
			return this.functorIfInverted(inverted, functor, currentValue, 0);
		}
		if (type === "[object Array]") {
			for (let i = 0, scope; i < value.length; i++) {
				scope = value[i];
				this.functorIfInverted(!inverted, functor, scope, i);
			}
			return true;
		}
		if (type === "[object Object]") {
			return this.functorIfInverted(!inverted, functor, value, 0);
		}
		return this.functorIfInverted(!inverted, functor, currentValue, 0);
	}
	getValue(tag, meta) {
		const num = this.scopeList.length - 1;
		return getValue.call(this, tag, meta, num);
  }
  getListValue(tag) {
    // TODO: handle with null getter
    return get(this.scopeList, [0, tag, this.scopePathItem[this.scopePathItem.length - 1]], "");
  }
	getValueAsync(tag, meta) {
		const num = this.scopeList.length - 1;
		return getValueAsync.call(this, tag, meta, num);
	}
	getContext(meta) {
		return {
			num: this.num,
			meta,
			scopeList: this.scopeList,
			resolved: this.resolved,
			scopePath: this.scopePath,
			scopePathItem: this.scopePathItem,
		};
	}
	createSubScopeManager(scope, tag, i, part) {
		return new ScopeManager({
			resolved: this.resolved,
			parser: this.parser,
			scopeList: this.scopeList.concat(scope),
			scopePath: this.scopePath.concat(tag),
			scopePathItem: this.scopePathItem.concat(i),
			scopeLindex: this.scopeLindex.concat(part.lIndex),
		});
	}
};

module.exports = function(options) {
	options.scopePath = [];
	options.scopePathItem = [];
	options.scopeLindex = [];
	options.scopeList = [options.tags];
	return new ScopeManager(options);
};

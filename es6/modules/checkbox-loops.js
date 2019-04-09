const {
	mergeObjects,
	chunkBy,
	last,
	isParagraphStart,
	isParagraphEnd,
	isContent,
} = require("../doc-utils");
const wrapper = require("../module-wrapper");
const { match, getValue, getValues } = require("../prefix-matcher");

const moduleName = "checkbox-loops";

const startRegEx = /^LOOP\((.+)\)$/;
const endRegEx = /^ENDLOOP\((.+)\)$/;

function hasContent(parts) {
	return parts.some(function(part) {
		return isContent(part);
	});
}

function isEnclosedByParagraphs(parsed) {
	if (parsed.length === 0) {
		return false;
	}
	return isParagraphStart(parsed[0]) && isParagraphEnd(last(parsed));
}

function getOffset(chunk) {
	return hasContent(chunk) ? 0 : chunk.length;
}

class LoopModule {
	constructor() {
		this.name = "LoopModule";
		this.prefix = {
			start: startRegEx,
			end: endRegEx,
		};
	}
	parse(placeHolderContent) {
		const module = moduleName;
		const type = "placeholder";
		const { start, end } = this.prefix;
		if (match(start, placeHolderContent)) {
			return {
				type,
				value: getValue(start, placeHolderContent),
				expandTo: "auto",
				module,
				location: "start",
				inverted: false,
			};
		}

		if (match(end, placeHolderContent)) {
			return {
				type,
				value: getValue(end, placeHolderContent),
				module,
				location: "end",
			};
		}

		return null;
	}
	getTraits(traitName, parsed) {
		if (traitName !== "expandPair") {
			return;
		}

		return parsed.reduce(function(tags, part, offset) {
			if (part.type === "placeholder" && part.module === moduleName) {
				tags.push({ part, offset });
			}
			return tags;
		}, []);
  }

	postparse(parsed, { basePart }) {
		if (!isEnclosedByParagraphs(parsed)) {
			return parsed;
		}
		if (
			!basePart ||
			basePart.expandTo !== "auto" ||
			basePart.module !== moduleName
		) {
			return parsed;
		}
		const chunks = chunkBy(parsed, function(p) {
			if (isParagraphStart(p)) {
				return "start";
			}
			if (isParagraphEnd(p)) {
				return "end";
			}
			return null;
		});
		if (chunks.length <= 2) {
			return parsed;
		}
		const firstChunk = chunks[0];
		const lastChunk = last(chunks);
		const firstOffset = getOffset(firstChunk);
		const lastOffset = getOffset(lastChunk);
		if (firstOffset === 0 || lastOffset === 0) {
			return parsed;
		}
		return parsed.slice(firstOffset, parsed.length - lastOffset);
	}
	render(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}
		let totalValue = [];
		let errors = [];
		function loopOver(scope, i) {
			const scopeManager = options.scopeManager.createSubScopeManager(
				scope,
				part.value,
				i,
				part
			);
			const subRendered = options.render(
				mergeObjects({}, options, {
					compiled: part.subparsed,
					tags: {},
					scopeManager,
				})
			);
			totalValue = totalValue.concat(subRendered.parts);
			errors = errors.concat(subRendered.errors || []);
		}
		const result = options.scopeManager.loopOver(
			part.value,
			loopOver,
			part.inverted,
			{
				part,
			}
		);
		if (result === false) {
			return {
				value: part.emptyValue || "",
				errors,
			};
		}
		return { value: totalValue.join(""), errors };
	}
	resolve(part, options) {
		if (part.type !== "placeholder" || part.module !== moduleName) {
			return null;
		}
		const value = options.scopeManager.getValue(part.value, { part });
		const promises = [];
		function loopOver(scope, i) {
			const scopeManager = options.scopeManager.createSubScopeManager(
				scope,
				part.value,
				i,
				part
			);
			promises.push(
				options.resolve(
					mergeObjects(options, {
						compiled: part.subparsed,
						tags: {},
						scopeManager,
					})
				)
			);
		}
		return Promise.resolve(value)
			.then(function(value) {
				options.scopeManager.loopOverValue(value, loopOver, part.inverted);
				return Promise.all(promises).then(function(r) {
					return r.map(function({ resolved }) {
						return resolved;
					});
				});
			})
			.then(function(r) {
				return r;
			});
	}
}

module.exports = () => wrapper(new LoopModule());

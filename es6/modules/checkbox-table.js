const wrapper = require("../module-wrapper");
const {isTagEnd, isTagStart, chunkBy} = require("../doc-utils");
const { match, getValue, getValues } = require("../prefix-matcher");
const get = require("lodash/get");

const moduleName = "checkbox-table";
const defaultEmptyValue = "";

function isTableRowStart(options) {
  return isTagStart("w:tr", options);
}

function isTableRowEnd(options) {
  return isTagEnd("w:tr", options);
}

function isCheckboxTablePlaceholder(chunk) {
  return chunk.type === "placeholder" && chunk.module === moduleName;
}

class CheckboxTable {
  constructor() {
  this.name = moduleName;
  this.prefix = {
      rows: /^Rows\((.*)\)$/,
    };
  }

  set(obj) {
    if (obj.data) {
      this.data = obj.data;
    }
  }

  optionsTransformer(options) {
    this.tags = options.tags;
    return options;
  }

  parse(placeHolderContent) {
    const type = "placeholder";
    const module = this.name;
    const { rows } = this.prefix;

    if (match(rows, placeHolderContent)) {
      const values = getValues(rows, placeHolderContent);
			return {
				type,
				value: values[1],
				module,
			};
    }

    return null;
  }

  postparse(postparsed, meta) {
    const newPostparsed = [];
    for (let i = 0; i < postparsed.length; i++) {
      const part = postparsed[i];
      if (isTableRowStart(part)) {
        const {newChunks, newIndex} = processRow({
          postparsed,
          part,
          index: i,
          data: this.data,
        });

        i = newIndex;
        newPostparsed.push(...newChunks);
      } else {
        newPostparsed.push({
          ...part,
          lIndex: newPostparsed.length,
        });
      }
    }

    return newPostparsed;
  }

  render(part, options) {
    return null;
  }
}

function processRow({postparsed, part, index, data}) {
  const row = [part];
  let rowEndIndex = index;

  for (let i = index + 1; i < postparsed.length; i++) {
    const currentPart = postparsed[i];
    if (!isTableRowEnd(currentPart)) {
      row.push(currentPart);
    } else {
      row.push(currentPart);
      rowEndIndex = i;
      break;
    }
  }

  const tags = getTags(row);

  if (tags.length > 0) {
    let currentLIndex = part.lIndex;
    const numberOfCopies = getNumberOfRows(tags, data);

    const rowsToAdd = [];

    for (let i = 0; i < numberOfCopies; i++) {
      const newRow = copyRow(row, i, currentLIndex, data);
      rowsToAdd.push(newRow);
      currentLIndex += newRow.length;
    }

    return ({
      newChunks: [].concat.apply([], rowsToAdd),
      newIndex: rowEndIndex,
    });
  }

  return ({
    newChunks: row,
    newIndex: rowEndIndex,
  });
}

function copyRow(row, iteration, currentLIndex, data) {
  return row.map((element, i) => {
    let el = element;
    if (isCheckboxTablePlaceholder(element)) {
      el = convertToTemplaterTag(element, iteration, data);
    }

    return {
      ...el,
      lIndex: currentLIndex + i,
    };
  });
}

function convertToTemplaterTag(element, iteration, data) {
  let value = "";
  if (get(data, [element.value, iteration])) {
    value = `${element.value}[${iteration}]`;
  }

  return {
    ...element,
    module: undefined,
    value,
  };
}

function getRowChunks(parsed) {
  const chunks = chunkBy(parsed, (p) => {
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
  const tags = [];

  row.forEach((part) => {
    if (part.type === "placeholder" && part.module === moduleName) {
      tags.push(part);
    }
  });

  return tags;
}

function getNumberOfRows(tags, data) {
  return tags.reduce((max, v) => {
    // TODO: Make this safe + add error handling
    const length = data[v.value].length;

    if (length > max) {
      return length;
    }

    return max;
  }, 0);
}

module.exports = () => wrapper(new CheckboxTable());

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

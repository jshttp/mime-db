const fs = require("fs");
const path = require("path");

const DB_FILE_NAME = "db.json";
const DEF_FILE_NAME = "db.d.ts";

const db = JSON.parse(
  fs
    .readFileSync(path.join(__dirname, "..", DB_FILE_NAME), {
      encoding: "utf-8",
    })
    .toString()
);

const mimeArr = Object.keys(db)
  .map((a) => [a.toLowerCase(), a.toUpperCase()])
  .reduce((a, b) => [...a, ...b], []);
const mimeArrWithOptions = Object.entries(db)
  .map(([mime, { charset }]) =>
    charset != null
      ? [
          mime.toLowerCase() + ";charset=" + charset,
          mime.toUpperCase() + ";CHARSET=" + charset,
        ]
      : []
  )
  .reduce((a, b) => [...a, ...b], []);

const OR_FORMAT = "\n  | ";
const MIME_TYPES_NAME = "MimeTypes";
const MIME_TYPES_OPTIONS_NAME = "MimeTypesWithOptions";
const MIME_TYPES_BOTH_NAME = "MimeTypesBoth";

function typeString(literalArr, typeName, orFormat = OR_FORMAT) {
  return `export declare type ${typeName} =${orFormat}${literalArr
    .map((a) => `"${a}"`)
    .join(orFormat)};\n`;
}

const mimeArrType = typeString(mimeArr, MIME_TYPES_NAME);
const mimeArrWithOptionsType = typeString(
  mimeArrWithOptions,
  MIME_TYPES_OPTIONS_NAME
);
const mimeArrBothType = `export declare type ${MIME_TYPES_BOTH_NAME} = ${MIME_TYPES_NAME} | ${MIME_TYPES_OPTIONS_NAME};\n`;

fs.writeFileSync(
  path.join(__dirname, "..", DEF_FILE_NAME),
  [mimeArrType, mimeArrWithOptionsType, mimeArrBothType, "export {  };\n"].join(
    "\n"
  ),
  { encoding: "utf-8" }
);

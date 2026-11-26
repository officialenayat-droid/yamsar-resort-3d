import { createRequire as __cr } from "node:module";
__cr(import.meta.url);
import { t as ACTIVE_STATUSES } from "./store-DMqNC0hO.mjs";
import net from "net";
import tls from "tls";
import Stream from "stream";
import crypto from "crypto";
import util from "util";
import os from "os";
import fs from "fs";
import dc from "diagnostics_channel";
// node_modules/postgres/src/errors.js
var PostgresError = class extends Error {
	constructor(x) {
		super(typeof x === "string" ? x : x && x.message);
		this.name = this.constructor.name;
		x && typeof x === "object" && Object.assign(this, x);
	}
	toJSON() {
		return {
			...this,
			message: this.message
		};
	}
};
const Errors = {
	connection,
	postgres,
	generic,
	notSupported
};
function connection(code, options, host, port) {
	const address = options.path || host, error = Object.assign(/* @__PURE__ */ new Error("write " + code + " " + (options.path || host + ":" + port)), {
		code,
		errno: code,
		address
	}, options.path ? {} : { port });
	Error.captureStackTrace(error, connection);
	return error;
}
function postgres(x) {
	const error = new PostgresError(x);
	Error.captureStackTrace(error, postgres);
	return error;
}
function generic(code, message) {
	const error = Object.assign(/* @__PURE__ */ new Error(code + ": " + message), { code });
	Error.captureStackTrace(error, generic);
	return error;
}
function notSupported(x) {
	const error = Object.assign(/* @__PURE__ */ new Error(x + " (B) is not supported"), {
		code: "MESSAGE_NOT_SUPPORTED",
		name: x
	});
	Error.captureStackTrace(error, notSupported);
	return error;
}
const places = locations();
const ours = (line) => places.some((here) => line.includes(here) && !line.slice(line.indexOf(here) + here.length).split(":")[0].includes("/"));
function locations() {
	try {
		const url = new URL(".", import.meta.url);
		return url.protocol === "file:" ? [url.href, decodeURIComponent(url.pathname)] : [url.href];
	} catch (error) {
		return [];
	}
}
function withOrigin(error, origin) {
	origin && Object.defineProperty(error, "stack", {
		value: [firstLine(error), ...origin.split("\n").slice(1).filter((x) => !ours(x))].join("\n"),
		writable: true,
		configurable: true,
		enumerable: false
	});
	return error;
}
function firstLine(error) {
	return typeof error.stack === "string" ? error.stack.split("\n")[0] : (error.name || "Error") + (error.message ? ": " + error.message : "");
}
function queryError(error, q, debug) {
	if (!error || typeof error !== "object") error = new Error(error);
	if (!q || "query" in error) return error;
	const built = q.built;
	Object.defineProperties(error, {
		query: {
			value: built ? built.text : q.strings[0],
			enumerable: !!debug,
			configurable: true,
			writable: true
		},
		parameters: {
			value: built ? built.values : [],
			enumerable: !!debug,
			configurable: true,
			writable: true
		},
		args: {
			value: q.args,
			enumerable: !!debug,
			configurable: true,
			writable: true
		},
		types: {
			value: built ? built.oids : [],
			enumerable: !!debug,
			configurable: true,
			writable: true
		}
	});
	return withOrigin(error, q.origin);
}
// node_modules/postgres/src/types.js
const number = (x) => +x;
const bool = (x) => x === "t";
const json = (x) => JSON.parse(x);
const string = (x) => x instanceof Date ? serializeDate(x) : Array.isArray(x) ? serializeArray(x, string) : literal(x) ? JSON.stringify(x) : "" + x;
const literal = (x) => x !== null && typeof x === "object" && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const arrays = {
	16: 1e3,
	17: 1001,
	18: 1002,
	19: 1003,
	20: 1016,
	21: 1005,
	22: 1006,
	23: 1007,
	24: 1008,
	25: 1009,
	26: 1028,
	27: 1010,
	28: 1011,
	29: 1012,
	30: 1013,
	114: 199,
	142: 143,
	600: 1017,
	601: 1018,
	602: 1019,
	603: 1020,
	604: 1027,
	628: 629,
	650: 651,
	700: 1021,
	701: 1022,
	718: 719,
	774: 775,
	790: 791,
	829: 1040,
	869: 1041,
	1033: 1034,
	1042: 1014,
	1043: 1015,
	1082: 1182,
	1083: 1183,
	1114: 1115,
	1184: 1185,
	1186: 1187,
	1266: 1270,
	1560: 1561,
	1562: 1563,
	1700: 1231,
	1790: 2201,
	2202: 2207,
	2203: 2208,
	2204: 2209,
	2205: 2210,
	2206: 2211,
	2249: 2287,
	2275: 1263,
	2950: 2951,
	2970: 2949,
	3220: 3221,
	3614: 3643,
	3615: 3645,
	3734: 3735,
	3769: 3770,
	3802: 3807,
	3904: 3905,
	3906: 3907,
	3908: 3909,
	3910: 3911,
	3912: 3913,
	3926: 3927,
	4072: 4073,
	4089: 4090,
	4096: 4097,
	5038: 5039,
	5069: 271
};
const types = {
	string: {
		to: 25,
		from: null,
		serialize: string
	},
	number: {
		to: 0,
		from: [
			21,
			23,
			26,
			700,
			701
		],
		serialize: string,
		parse: number
	},
	json: {
		to: 114,
		from: [114, 3802],
		serialize: (x) => JSON.stringify(x),
		parse: json
	},
	boolean: {
		to: 16,
		from: [16],
		serialize: (x) => x === true ? "t" : "f",
		parse: bool
	},
	date: {
		to: 1184,
		from: [
			1082,
			1114,
			1184
		],
		serialize: serializeDate,
		parse: null
	},
	bytea: {
		to: 17,
		from: [17],
		serialize: (x) => "\\x" + Buffer.from(x).toString("hex"),
		parse: (x) => Buffer.from(x.slice(2), "hex")
	}
};
const dates = {
	1082: parseDate,
	1114: parseTimestamp,
	1184: parseTimestamptz
};
const elementsOf = {
	1e3: 16,
	1005: 21,
	1007: 23,
	1016: 20
};
const readers = {
	16: binaryArray((x, i) => x[i] === 1),
	21: binaryArray((x, i) => (x[i] << 24 | x[i + 1] << 16) >> 16),
	23: binaryArray((x, i) => x[i] << 24 | x[i + 1] << 16 | x[i + 2] << 8 | x[i + 3]),
	20: binaryArray((x, i) => x.readBigInt64BE(i).toString())
};
function bytes(x, i, end) {
	return Buffer.from(x.subarray(i, end));
}
function binaryArray(read) {
	return function(x, i) {
		const dims = int32(x, i);
		if (dims === 0) return [];
		const sizes = new Array(dims);
		for (let d = 0; d < dims; d++) sizes[d] = int32(x, i + 12 + d * 8);
		let at = i + 12 + dims * 8;
		return level(0);
		function level(d) {
			const n = sizes[d], xs = new Array(n);
			if (d < dims - 1) {
				for (let k = 0; k < n; k++) xs[k] = level(d + 1);
				return xs;
			}
			for (let k = 0; k < n; k++) {
				const length = int32(x, at);
				at += 4;
				if (length === -1) xs[k] = null;
				else {
					xs[k] = read(x, at);
					at += length;
				}
			}
			return xs;
		}
	};
}
function int32(x, i) {
	return x[i] << 24 | x[i + 1] << 16 | x[i + 2] << 8 | x[i + 3];
}
function integer(x, i, end) {
	const negative = x[i] === 45;
	let n = 0;
	for (negative && i++; i < end; i++) n = n * 10 + x[i] - 48;
	return negative ? -n : n;
}
function boolean(x, i) {
	return x[i] === 116;
}
const latin1 = typeof Buffer.prototype.latin1Slice === "function" ? (x, start, end) => x.latin1Slice(start, end) : (x, start, end) => x.toString("latin1", start, end);
function digits(x, i, n) {
	let v = 0;
	for (const end = i + n; i < end; i++) {
		const d = x[i] - 48;
		if (d < 0 || d > 9) return -1;
		v = v * 10 + d;
	}
	return v;
}
function clock(x, i, end, zoned) {
	const year = digits(x, i, 4);
	if (year < 1e3 || x[i + 4] !== 45 || x[i + 7] !== 45) return NaN;
	const month = digits(x, i + 5, 2), day = digits(x, i + 8, 2);
	if (end - i === 10) return zoned || month < 1 || day < 1 ? NaN : Date.UTC(year, month - 1, day);
	if (x[i + 10] !== 32 || x[i + 13] !== 58 || x[i + 16] !== 58) return NaN;
	const hour = digits(x, i + 11, 2), minute = digits(x, i + 14, 2), second = digits(x, i + 17, 2);
	let at = i + 19, ms = 0;
	if (x[at] === 46) {
		let scale = 100;
		for (at++; at < end && x[at] >= 48 && x[at] <= 57; at++) {
			ms += (x[at] - 48) * scale;
			scale = scale / 10 | 0;
		}
	}
	let offset = 0;
	if (zoned) {
		const sign = x[at];
		if (sign !== 43 && sign !== 45 || end - at !== 3 && (end - at !== 6 || x[at + 3] !== 58)) return NaN;
		offset = digits(x, at + 1, 2) * 60 + (end - at === 6 ? digits(x, at + 4, 2) : 0);
		if (offset < 0 || digits(x, at + 1, 2) < 0 || end - at === 6 && digits(x, at + 4, 2) < 0) return NaN;
		sign === 45 && (offset = -offset);
		at = end;
	}
	if (at !== end || month < 1 || day < 1 || hour < 0 || minute < 0 || second < 0) return NaN;
	return Date.UTC(year, month - 1, day, hour, minute, second, ms) - offset * 6e4;
}
function timestamptz(x, i, end) {
	const t = clock(x, i, end, true);
	return Number.isNaN(t) ? parseTimestamptz(latin1(x, i, end)) : new Date(t);
}
function utcStamp(x, i, end) {
	const t = clock(x, i, end, false);
	return Number.isNaN(t) ? parseDate(latin1(x, i, end)) : new Date(t);
}
const shaped = (is, serialize) => (x) => is(x) ? serialize(x) : string(x);
const shapedTypes = {
	...types,
	boolean: {
		...types.boolean,
		serialize: shaped((x) => typeof x === "boolean", types.boolean.serialize)
	},
	date: {
		...types.date,
		serialize: shaped((x) => x instanceof Date, types.date.serialize)
	},
	bytea: {
		...types.bytea,
		serialize: shaped((x) => x instanceof Uint8Array, types.bytea.serialize)
	}
};
function Types(options = {}) {
	const parsers = {}, serializers = {}, elements = {}, undefinedValue = options.transform && options.transform.undefined;
	Object.entries(arrays).forEach(([oid, array]) => elements[array] = [+oid, +oid === 603 ? ";" : ","]);
	register(options.infer === false ? shapedTypes : types);
	Object.assign(parsers, dates);
	options.infer === false && (parsers[1114] = parseDate);
	const custom = Object.values(options.types || {}), named = custom.filter((x) => [x.to].concat(x.from || []).some((y) => typeof y === "string")), oids = {}, own = /* @__PURE__ */ new Set();
	register(custom.filter((x) => !named.includes(x)));
	custom.forEach((x) => [x.to].concat(x.from || []).forEach((oid) => own.add(oid)));
	const keys = options.transform && options.transform.json && options.transform.column.to;
	keys && [114, 3802].forEach((oid) => own.has(oid) || (serializers[oid] = renamed(serializers[oid], keys)));
	const bases = {};
	return {
		parser,
		decoder,
		known,
		unknown,
		binary,
		serializer,
		load,
		infer,
		resolve,
		named: named.length > 0,
		plain: !custom.some((x) => x.serialize),
		parsers,
		serializers
	};
	function binary(oid) {
		if (own.has(oid)) return null;
		if (oid === 17) return parsers[17] === types.bytea.parse ? bytes : null;
		const element = elementsOf[oid];
		return element !== void 0 && !own.has(element) && (element !== 20 || !(20 in parsers)) ? readers[element] : null;
	}
	function unknown(oids) {
		for (let i = 0; i < oids.length; i++) {
			const oid = oids[i];
			if (oid >= 16384 && !(oid in parsers) && !(oid in serializers) && !(oid in elements) && !(oid in bases)) return true;
		}
		return false;
	}
	function known(oid) {
		return oid in serializers || oid in elements;
	}
	function resolve(type) {
		return typeof type === "string" ? oids[type] || 0 : type;
	}
	function decoder(oid, parse) {
		return parse === number && (oid === 21 || oid === 23 || oid === 26) ? integer : parse === bool && oid === 16 ? boolean : parse === parseTimestamptz && oid === 1184 ? timestamptz : parse === parseDate && (oid === 1114 || oid === 1082) ? utcStamp : null;
	}
	function register(xs) {
		Object.values(xs).forEach((x) => {
			const from = [].concat(x.from || []);
			x.parse && from.forEach((oid) => parsers[oid] = x.parse);
			if (x.serialize) {
				serializers[x.to] = x.serialize;
				from.forEach((oid) => serializers[oid] = x.serialize);
			}
		});
	}
	function parser(oid) {
		if (oid in parsers) return parsers[oid];
		if (oid in bases) return parsers[oid] = parser(bases[oid]);
		if (oid in elements) {
			const [element, delimiter] = elements[oid], parse = parser(element);
			return parsers[oid] = (x) => parseArray(x, parse === identity ? null : parse, delimiter);
		}
		return identity;
	}
	function serializer(oid) {
		if (oid in serializers) return serializers[oid];
		if (oid in bases) return serializers[oid] = serializer(bases[oid]);
		if (oid in elements) {
			const [element, delimiter] = elements[oid], serialize = serializer(element);
			return serializers[oid] = (xs) => Array.isArray(xs) ? serializeArray(xs, serialize, delimiter, undefinedValue) : serialize(xs);
		}
		return string;
	}
	function load(run) {
		return Promise.all([fetched(run), named.length && names(run)]);
	}
	async function names(run) {
		const wanted = [...new Set(named.flatMap((x) => [x.to].concat(x.from || [])).filter((x) => typeof x === "string"))], rows = await run("select t.oid::int, t.typarray::int as array, t.typdelim as delimiter, t.typname as name, n.nspname as schema, pg_catalog.pg_type_is_visible(t.oid) as visible from pg_catalog.pg_type t join pg_catalog.pg_namespace n on n.oid = t.typnamespace where t.typname in (" + wanted.map((x) => "'" + x.split(".").pop().replace(/'/g, "''") + "'").join(",") + ")"), missing = [];
		wanted.forEach((x) => {
			const [schema, name] = x.includes(".") ? x.split(".") : [null, x], row = rows.find((r) => r.name === name && (schema ? r.schema === schema : r.visible));
			row ? (oids[x] = row.oid, row.array && !(row.array in elements) && (elements[row.array] = [row.oid, row.delimiter])) : missing.push(x);
		});
		if (missing.length) throw Errors.generic("TYPE_NOT_FOUND", missing.length > 1 ? "The types " + missing.join(", ") + " do not exist" : "The type " + missing[0] + " does not exist");
		register(named.map((x) => ({
			...x,
			to: resolve(x.to),
			from: [].concat(x.from || []).map(resolve)
		})));
		named.forEach((x) => [x.to].concat(x.from || []).forEach((y) => own.add(resolve(y))));
	}
	function fetched(run) {
		return run("select oid::int, typelem::int as element, typdelim as delimiter, typbasetype::int as base, typtype as kind from pg_catalog.pg_type where typtype = 'd' or (typcategory = 'A' and oid >= 16384)").then((rows) => rows.forEach(({ oid, element, delimiter, base, kind }) => {
			if (oid in parsers || oid in serializers) return;
			kind === "d" ? bases[oid] = base : element && !(oid in elements) && (elements[oid] = [element, delimiter]);
		}));
	}
}
const identity = (x) => x;
identity.identity = true;
var Parameter = class {
	constructor(value, type) {
		this.value = value;
		this.type = type;
	}
};
function infer(x) {
	return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? arrays[infer(x[0])] || 0 : 0;
}
function parseArray(x, parse, delimiter = ",") {
	let i = x[0] === "[" ? x.indexOf("=") + 1 : 0;
	return level();
	function level() {
		const xs = [];
		i++;
		while (i < x.length && x[i] !== "}") {
			if (x[i] === "{") xs.push(level());
			else if (x[i] === "\"") {
				let s = "";
				for (i++; x[i] !== "\""; i++) s += x[i] === "\\" ? x[++i] : x[i];
				i++;
				xs.push(parse ? parse(s) : s);
			} else {
				const start = i;
				while (x[i] !== delimiter && x[i] !== "}") i++;
				const s = x.slice(start, i);
				xs.push(s === "NULL" ? null : parse ? parse(s) : s);
			}
			x[i] === delimiter && i++;
		}
		i++;
		return xs;
	}
}
function serializeArray(xs, serialize = string, delimiter = ",", undefinedValue) {
	return "{" + xs.map((x) => {
		const typed = x instanceof Parameter;
		typed && (x = x.value);
		x === void 0 && (x = undefinedValue);
		if (x === void 0) throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
		return Array.isArray(x) && !typed ? serializeArray(x, serialize, delimiter, undefinedValue) : x === null ? "NULL" : "\"" + ("" + serialize(x)).replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
	}).join(delimiter) + "}";
}
function serializeDate(x) {
	return x === Infinity ? "infinity" : x === -Infinity ? "-infinity" : (x instanceof Date ? x : new Date(x)).toISOString();
}
const timestamp = /^(\d{4,})-(\d\d)-(\d\d)(?: (\d\d):(\d\d):(\d\d)(?:\.(\d+))?)?(?:([+-])(\d\d)(?::(\d\d))?(?::(\d\d))?)?( BC)?$/;
function parts(x) {
	const m = x.match(timestamp);
	if (!m) return null;
	const year = m[12] ? 1 - m[1] : +m[1], ms = m[7] ? +(m[7] + "00").slice(0, 3) : 0, offset = m[8] ? (m[8] === "-" ? -1 : 1) * ((m[9] * 60 + +(m[10] || 0)) * 60 + +(m[11] || 0)) * 1e3 : 0;
	return {
		year,
		month: m[2] - 1,
		day: +m[3],
		hour: +(m[4] || 0),
		minute: +(m[5] || 0),
		second: +(m[6] || 0),
		ms,
		offset
	};
}
function infinite(x) {
	return x === "infinity" ? Infinity : x === "-infinity" ? -Infinity : null;
}
function utc(x) {
	const date = new Date(Date.UTC(2e3, x.month, x.day, x.hour, x.minute, x.second, x.ms));
	date.setUTCFullYear(x.year);
	return date;
}
function plain$1(x) {
	const n = x.length;
	return x.charCodeAt(0) !== 48 && x.charCodeAt(n - 1) !== 67 && !(x.charCodeAt(n - 3) === 58 && x.charCodeAt(n - 6) === 58) && x.charCodeAt(0) !== 45 && x.charCodeAt(0) !== 105;
}
function parseTimestamptz(x) {
	if (plain$1(x)) return new Date(x);
	const p = infinite(x) || parts(x);
	if (!p) return new Date(x);
	if (typeof p === "number") return p;
	const date = utc(p);
	date.setTime(date.getTime() - p.offset);
	return date;
}
function parseDate(x) {
	const p = infinite(x) || parts(x);
	return !p ? new Date(x) : typeof p === "number" ? p : utc(p);
}
function parseTimestamp(x) {
	const p = infinite(x) || parts(x);
	if (!p || typeof p === "number") return p || new Date(x);
	if (p.year >= 100) return new Date(p.year, p.month, p.day, p.hour, p.minute, p.second, p.ms);
	const date = new Date(2e3, 0, 1);
	date.setFullYear(p.year, p.month, p.day);
	date.setHours(p.hour, p.minute, p.second, p.ms);
	return date;
}
const toCamel = (x) => {
	let str = x.slice(0, 1);
	for (let i = 1; i < x.length; i++) str += x[i] === "_" && i < x.length - 1 ? x[++i].toUpperCase() : x[i];
	return str;
};
const toPascal = (x) => {
	let str = x.slice(0, 1).toUpperCase();
	for (let i = 1; i < x.length; i++) str += x[i] === "_" && i < x.length - 1 ? x[++i].toUpperCase() : x[i];
	return str;
};
const toKebab = (x) => x.replace(/_/g, "-");
const fromCamel = (x) => x.replace(/([A-Z])/g, "_$1").toLowerCase();
const fromPascal = (x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase();
const fromKebab = (x) => x.replace(/-/g, "_");
function renamed(serialize, fn) {
	return (x) => serialize(rename(x, fn));
}
function rename(x, fn) {
	if (Array.isArray(x)) return x.map((x) => rename(x, fn));
	if (x === null || typeof x !== "object" || Object.getPrototypeOf(x) !== Object.prototype && Object.getPrototypeOf(x) !== null) return x;
	const out = {};
	for (const k in x) Object.hasOwn(x, k) && Object.defineProperty(out, fn(k), {
		value: rename(x[k], fn),
		enumerable: true,
		writable: true,
		configurable: true
	});
	return out;
}
function createJsonTransform(fn) {
	jsonTransform.keys = true;
	return jsonTransform;
	function jsonTransform(x, column) {
		return typeof x === "object" && x !== null && (column.type === 114 || column.type === 3802) ? Array.isArray(x) ? x.map((x) => jsonTransform(x, column)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column) }), {}) : x;
	}
}
toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };
const camel = { ...toCamel };
camel.column.to = fromCamel;
toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };
const pascal = { ...toPascal };
pascal.column.to = fromPascal;
toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };
const kebab = { ...toKebab };
kebab.column.to = fromKebab;
// node_modules/postgres/src/build.js
const isQuery = Symbol("query");
var NotTagged = class {
	then() {
		notTagged();
	}
	catch() {
		notTagged();
	}
	finally() {
		notTagged();
	}
};
var Identifier = class extends NotTagged {
	constructor(value) {
		super();
		this.value = value;
	}
};
var Join = class {
	constructor(separator, items) {
		this.separator = separator;
		this.items = items;
	}
};
const joinStrings = Object.assign(["", ""], { raw: ["", ""] });
var Builder = class extends NotTagged {
	constructor(first, rest) {
		super();
		this.first = first;
		this.rest = rest;
	}
};
function build(query, options) {
	const values = [], oids = [], o = {
		transform: options.transform,
		infer: options.infer !== false,
		resolve: options.resolve,
		values,
		oids,
		dynamic: !query.tagged
	};
	const text = query.tagged ? stringify(query, o) : (query.args.forEach((x) => value(x, o)), "" + query.strings[0]);
	if (values.length >= 65534) throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
	const types = oids.join();
	return {
		strings: query.strings,
		dynamic: o.dynamic,
		types,
		text,
		values,
		oids
	};
}
function stringify(q, o) {
	let string = q.strings[0];
	for (let i = 1; i < q.strings.length; i++) string += part(string, q.args[i - 1], o, q.strings[i]) + q.strings[i];
	return string;
}
function part(before, x, o, after = "") {
	if (x instanceof Builder || x instanceof Identifier || isFragment(x) || Array.isArray(x) && isFragment(x[0])) o.dynamic = true;
	return isFragment(x) && x.strings === joinStrings ? joined(x.args[0], o, before, after) : x instanceof Join ? joined(x, o, "", "") : x instanceof Builder ? helper(before, x, o) : isFragment(x) ? fragment(x, o) : x instanceof Identifier ? x.value : Array.isArray(x) && isFragment(x[0]) ? x.reduce((acc, x) => acc + " " + fragment(x, o), "") : value(x, o);
}
function joined(join, o, before, after) {
	let text = "";
	join.items.forEach((item, i) => {
		i > 0 && (text = spaced(text, fragment(join.separator, o)));
		text = spaced(text, part("", item, o));
	});
	before && text && !/\s$/.test(before) && !/^\s/.test(text) && (text = " " + text);
	after && text && !/^\s/.test(after) && !/\s$/.test(text) && (text = text + " ");
	return text;
}
function spaced(a, b) {
	return a && b && !/\s$/.test(a) && !/^\s/.test(b) ? a + " " + b : a + b;
}
function isFragment(x) {
	return !!x && x[isQuery] === true;
}
function fragment(q, o) {
	return q.tagged ? stringify(q, o) : q.strings[0];
}
function value(x, o) {
	let v = x instanceof Parameter ? x.value : x;
	if (v === void 0) {
		v = o.transform.undefined;
		if (v === void 0) throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
		x instanceof Parameter || (x = v);
	}
	o.values.push(v);
	o.oids.push(x instanceof Parameter ? o.resolve(x.type) : o.infer ? infer(x) : 0);
	return "$" + o.values.length;
}
const builders = {
	values,
	in: (...xs) => {
		const x = values(...xs);
		return x === "()" ? "(null)" : x;
	},
	select,
	update,
	insert,
	call
};
function call(first, rest, o) {
	if (first === null || typeof first !== "object" || Array.isArray(first) || isFragment(first)) return select(first, rest, o);
	return columns(first, rest).map((x) => escapeIdentifier(column(x, o)) + " => " + part("values", first[x], o)).join(",");
}
const clauses = {
	in: "in",
	values: "values",
	select: "select",
	returning: "select",
	set: "update",
	distinct: "select"
};
const stops = /* @__PURE__ */ new Set([
	"from",
	"where",
	"on",
	"to",
	"join",
	"group",
	"order",
	"by",
	"having",
	"limit",
	"offset",
	"union",
	"intersect",
	"except",
	"using",
	"and",
	"or",
	"when",
	"then",
	"else",
	"with",
	"table",
	"grant",
	"revoke",
	"delete",
	"update",
	"case",
	"not",
	"like",
	"ilike",
	"between",
	"is",
	"exists",
	"conflict",
	"do",
	"nothing",
	"window",
	"over",
	"partition",
	"filter",
	"lateral",
	"cross",
	"inner",
	"left",
	"right",
	"full",
	"outer",
	"natural",
	"into"
]);
function helper(before, x, o) {
	const kind = context$2(before);
	return kind ? builders[kind](x.first, x.rest, o) : identifiers(typeof x.first === "string" ? [x.first].concat(x.rest) : x.first, o);
}
function context$2(sql) {
	const words = [];
	let i = sql.length - 1, depth = 0;
	while (i >= 0) {
		const c = sql[i];
		if (c === ")") {
			depth++;
			i--;
		} else if (c === "(") {
			if (depth === 0) {
				const word = previous(sql, i - 1);
				if (words.length === 0) return word === "in" || word === "values" ? word : word && !clauses[word] && !stops.has(word) ? "call" : "select";
				return "select";
			}
			depth--;
			i--;
		} else if (c === "'" || c === "\"") {
			const end = i;
			i--;
			while (i >= 0 && !(sql[i] === c && sql[i - 1] !== c)) sql[i] === c ? i -= 2 : i--;
			i--;
			if (sql[i] === ".") i--;
			else if (depth === 0 && c === "\"" && sql[end + 1] === "." && words.length) words[words.length - 1] = sql.slice(i + 1, end + 1) + words[words.length - 1];
			else if (depth === 0 && c === "\"") words.push(sql.slice(i + 1, end + 1));
		} else if (/[a-z_0-9$]/i.test(c)) {
			const end = i + 1;
			while (i >= 0 && /[a-z_0-9$.]/i.test(sql[i])) i--;
			const word = depth === 0 && sql.slice(i + 1, end).toLowerCase();
			if (word && clauses[word]) return clauses[word];
			if (word === "into") return insert_into(words, sql, i) ? "insert" : null;
			if (word && stops.has(word)) return null;
			word && words.push(word);
		} else i--;
	}
	return null;
}
function previous(sql, i) {
	while (i >= 0 && /\s/.test(sql[i])) i--;
	if (sql[i] === "\"") return "\"";
	const end = i + 1;
	while (i >= 0 && /[a-z_0-9$.]/i.test(sql[i])) i--;
	return sql.slice(i + 1, end).toLowerCase();
}
function insert_into(words, sql, i) {
	return (words.length === 1 || words.length === 3 && words[1] === "as") && previous(sql, i) === "insert";
}
function valuesBuilder(first, columns, o) {
	return first.map((row) => "(" + columns.map((x) => part("values", row[x], o)).join(",") + ")").join(",");
}
function values(first, rest, o) {
	const rows = Array.isArray(first) && first.length > 0 && first[0] !== null && typeof first[0] === "object" && !isFragment(first[0]), picked = columns(rows ? first[0] : first, rest);
	return valuesBuilder(rows ? first : [first], picked, o);
}
function update(first, rest, o) {
	const picked = columns(first, rest);
	picked.length || empty("update");
	return picked.map((x) => escapeIdentifier(column(x, o)) + "=" + part("values", first[x], o));
}
function insert(first, rest, o) {
	if (Array.isArray(first) && first.every((x) => typeof x === "string")) return "(" + escapeIdentifiers(first.concat(rest.flat()), o) + ")";
	const picked = columns(Array.isArray(first) ? first[0] || {} : first, rest);
	picked.length || empty("insert");
	return "(" + escapeIdentifiers(picked, o) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], picked, o);
}
function columns(first, rest) {
	return rest.length ? rest.flat() : Object.keys(first);
}
function empty(x) {
	throw Errors.generic("NO_COLUMNS", "The " + x + " helper got no columns");
}
function identifiers(first, o) {
	return Array.isArray(first) ? first.map((x) => member(x, o)).join(",") : member(first, o);
}
function member(x, o) {
	return isFragment(x) ? fragment(x, o) : x instanceof Identifier ? x.value : escapeIdentifier(column(x, o));
}
function select(first, rest, o) {
	typeof first === "string" && (first = [first].concat(rest));
	if (Array.isArray(first)) return identifiers(first, o);
	return columns(first, rest).map((x) => {
		const v = first[x];
		return (isFragment(v) ? fragment(v, o) : v instanceof Identifier ? v.value : value(v, o)) + " as " + escapeIdentifier(column(x, o));
	}).join(",");
}
function column(x, o) {
	return o.transform.column.to ? o.transform.column.to(x) : x;
}
function escapeIdentifiers(xs, o) {
	return xs.map((x) => escapeIdentifier(column(x, o))).join(",");
}
function escapeIdentifier(x) {
	return "\"" + x.replace(/"/g, "\"\"").replace(/\./g, "\".\"") + "\"";
}
function notTagged() {
	throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}
// node_modules/postgres/src/diagnostics.js
const channels = {
	query: tracing("postgres:query"),
	connect: tracing("postgres:connect"),
	transaction: tracing("postgres:transaction"),
	pool: plain("postgres:pool"),
	notice: plain("postgres:notice")
};
const done = Symbol("done");
const now = () => performance.now();
const userName = (options) => typeof options.user === "function" ? null : options.user;
function active(t) {
	return !!t && (t.hasSubscribers !== void 0 ? t.hasSubscribers : t.start.hasSubscribers || t.end.hasSubscribers || t.asyncStart.hasSubscribers || t.asyncEnd.hasSubscribers || t.error.hasSubscribers);
}
function listened(channel) {
	return !!channel && channel.hasSubscribers;
}
function start(t, context, fn) {
	return typeof t.start.runStores === "function" ? t.start.runStores(context, run) : (t.start.publish(context), run());
	function run() {
		try {
			return fn();
		} finally {
			t.end.publish(context);
		}
	}
}
function finish(t, context, error, result) {
	if (context[done]) return;
	context[done] = true;
	if (error) {
		context.error = error;
		t.error.publish(context);
	} else context.result = result;
	t.asyncStart.publish(context);
	t.asyncEnd.publish(context);
}
function tracing(name) {
	try {
		return typeof dc.tracingChannel === "function" ? dc.tracingChannel(name) : null;
	} catch (error) {
		return null;
	}
}
function plain(name) {
	try {
		return dc.channel(name);
	} catch (error) {
		return null;
	}
}
// node_modules/postgres/src/result.js
var Result = class extends Array {
	#count = null;
	#state = null;
	#command = null;
	#columns = null;
	#statement = null;
	get count() {
		return this.#count;
	}
	set count(x) {
		this.#count = x;
	}
	get state() {
		return this.#state;
	}
	set state(x) {
		this.#state = x;
	}
	get command() {
		return this.#command;
	}
	set command(x) {
		this.#command = x;
	}
	get columns() {
		return this.#columns;
	}
	set columns(x) {
		this.#columns = x;
	}
	get statement() {
		const x = this.#statement;
		return x && x.kind ? this.#statement = statement(x) : x;
	}
	set statement(x) {
		this.#statement = x;
	}
	static get [Symbol.species]() {
		return Array;
	}
};
function statement(item) {
	const x = item.statement;
	return {
		name: x ? x.name : "",
		string: x ? x.text : item.text || "",
		types: item.params || item.entry && item.entry.oids || x && x.oids || [],
		columns: item.columns || []
	};
}
// node_modules/postgres/src/query.js
const origins = /* @__PURE__ */ new WeakMap();
const noop$4 = () => {};
const CLOSE = {};
var Query$1 = class Query$1 extends Promise {
	constructor(strings, args, handler, options = {}) {
		let resolve, reject;
		super((a, b) => {
			resolve = a;
			reject = b;
		});
		this.fulfil = resolve;
		this.fail = reject;
		this[isQuery] = true;
		this.tagged = Array.isArray(strings.raw);
		this.strings = strings;
		this.args = args;
		this.handler = handler;
		this.options = options;
		this.state = null;
		this.source = null;
		this.active = false;
		this.executed = false;
		this.settled = false;
		this.built = null;
		this.trace = null;
		this.aborts = null;
		this.timer = null;
		this.timedOut = false;
		this.originError = handler.debug ? /* @__PURE__ */ new Error() : null;
		this.tagged && !handler.debug && !origins.has(strings) && origins.set(strings, located());
	}
	static get [Symbol.species]() {
		return Promise;
	}
	join(items) {
		const kept = [...items].filter((x) => x !== false && x !== null && x !== void 0), joined = new Query$1(joinStrings, [new Join(this, kept)], this.handler);
		Object.defineProperty(joined, "length", { value: kept.length });
		return joined;
	}
	resolve(x) {
		this.timer && untime(this);
		this.aborts && this.aborts();
		this.active = false;
		this.settled = true;
		this.trace && traced$1(this, null, x);
		this.fulfil(x);
	}
	reject(x) {
		this.timer && untime(this);
		this.timedOut && x && timedOut(x) && (x = late(this, x));
		this.aborts && this.aborts();
		this.active = false;
		this.settled = true;
		this.trace && traced$1(this, x);
		this.fail(x);
	}
	get origin() {
		return this.originError ? this.originError.stack : this.tagged && origins.get(this.strings) || "";
	}
	get statement() {
		return this.source && statement(this.source);
	}
	build() {
		return this.built || (this.built = build(this, this.handler.options));
	}
	get text() {
		return this.build().text;
	}
	get parameters() {
		return this.build().values;
	}
	[util.inspect.custom](depth, options, inspect) {
		if (!this.handler.debug) return "Query {}";
		let x;
		try {
			x = this.build();
		} catch (error) {
			return "Query { " + error.message + " }";
		}
		return "Query " + inspect({
			text: x.text,
			parameters: x.values
		}, options);
	}
	cancel() {
		return this.handler.cancel ? this.handler.cancel(this) : Promise.resolve();
	}
	signal(signal) {
		if (!signal || this.settled) return this;
		if (signal.aborted) return this.cancel().catch(noop$4), this;
		const abort = () => this.cancel().catch(noop$4);
		signal.addEventListener("abort", abort, { once: true });
		this.aborts = () => (this.aborts = null, signal.removeEventListener("abort", abort));
		return this;
	}
	simple() {
		this.options.simple = true;
		this.options.prepare = false;
		return this;
	}
	async readable() {
		this.simple();
		this.streaming = true;
		return this;
	}
	async writable() {
		this.simple();
		this.streaming = true;
		return this;
	}
	cursor(rows = 1, fn) {
		this.options.simple = false;
		if (typeof rows === "function") {
			fn = rows;
			rows = 1;
		}
		this.cursorRows = rows;
		if (typeof fn === "function") return this.cursorFn = fn, this;
		let prev;
		return { [Symbol.asyncIterator]: () => ({
			next: () => {
				if (this.executed && !this.active) return { done: true };
				prev && prev();
				const promise = new Promise((resolve, reject) => {
					this.cursorFn = (value) => {
						resolve({
							value,
							done: false
						});
						return new Promise((r) => prev = r);
					};
					this.resolve = (x) => (this.active = false, this.settled = true, this.trace && traced$1(this, null, x), resolve({ done: true }));
					this.reject = (x) => (this.active = false, this.settled = true, this.trace && traced$1(this, x), reject(x));
				});
				this.execute();
				return promise;
			},
			return() {
				prev && prev(CLOSE);
				return { done: true };
			}
		}) };
	}
	describe() {
		this.options.simple = false;
		this.onlyDescribe = this.options.prepare = true;
		return this;
	}
	stream() {
		throw new Error(".stream has been renamed to .forEach");
	}
	forEach(fn) {
		this.forEachFn = fn;
		this.handle();
		return this;
	}
	raw() {
		this.isRaw = true;
		return this;
	}
	values() {
		this.isRaw = "values";
		return this;
	}
	parsers(parsers) {
		this.ownParsers = parsers || null;
		return this;
	}
	handle() {
		if (this.executed) return;
		this.executed = true;
		queueMicrotask(() => this.run());
	}
	run() {
		active(channels.query) ? start(channels.query, this.trace = context$1(this), () => this.handler(this)) : this.handler(this);
	}
	execute() {
		this.handle();
		return this;
	}
	then(fulfilled, rejected) {
		this.handle();
		return super.then(fulfilled, rejected);
	}
	catch(rejected) {
		this.handle();
		return super.catch(rejected);
	}
	finally(fn) {
		this.handle();
		return super.finally(fn);
	}
};
function untime(q) {
	q.handler.options.timers.clearTimeout(q.timer);
	q.timer = null;
}
function timedOut(x) {
	return x.code === "57014" || x.code === "CONNECTION_DESTROYED" && !!x.cause && x.cause.code === "CANCEL_UNANSWERED";
}
function late(q, error) {
	const x = Errors.generic("QUERY_TIMEOUT", "The query did not finish within query_timeout (" + q.handler.options.query_timeout + " seconds)");
	x.cause = error.code === "CONNECTION_DESTROYED" ? error.cause : error;
	return queryError(x, q, q.handler.debug);
}
function context$1(q) {
	const options = q.handler.options || {};
	let text = null;
	if (q.strings.length) try {
		text = q.text;
	} catch (error) {
		text = null;
	}
	return {
		query: text,
		parameters: void 0,
		database: options.database,
		user: userName(options),
		host: null,
		port: null,
		connection: null,
		statement: null,
		command: null,
		count: null,
		queued: now(),
		sent: null,
		firstByte: null,
		complete: null
	};
}
function traced$1(q, error, result) {
	const x = q.trace;
	q.trace = null;
	x.complete = now();
	if (result && typeof result === "object" && "command" in result) {
		x.command = result.command;
		x.count = result.count;
	}
	finish(channels.query, x, error, result);
}
function located() {
	const limit = Error.stackTraceLimit;
	Error.stackTraceLimit = 8;
	try {
		return trim(String((/* @__PURE__ */ new Error()).stack));
	} catch (error) {
		return "";
	} finally {
		Error.stackTraceLimit = limit;
	}
}
function trim(stack) {
	const lines = stack.split("\n"), i = lines.findIndex((x, i) => i > 0 && !ours(x));
	return i === -1 ? stack : lines.slice(0, i + 1).join("\n");
}
// node_modules/postgres/src/protocol.js
function Writer(size = 16384) {
	let b = Buffer.allocUnsafe(size), i = 0, at = 0;
	const w = {
		get length() {
			return i;
		},
		type(x) {
			fit(5);
			at = i;
			b[i] = x;
			i += 5;
			return w;
		},
		untyped() {
			fit(4);
			at = i;
			i += 4;
			return w;
		},
		end() {
			b.writeInt32BE(i - at - 1, at + 1);
			return w;
		},
		endUntyped() {
			b.writeInt32BE(i - at, at);
			return w;
		},
		str(x) {
			fit(x.length * 3 + 1);
			i += b.write(x, i);
			b[i++] = 0;
			return w;
		},
		bytes(x) {
			if (typeof x === "string") {
				fit(x.length * 3);
				i += b.write(x, i);
			} else {
				fit(x.length);
				b.set(x, i);
				i += x.length;
			}
			return w;
		},
		value(x) {
			if (x === null || x === void 0) return w.i32(-1);
			const n = i;
			i += 4;
			w.bytes(x);
			b.writeInt32BE(i - n - 4, n);
			return w;
		},
		u8(x) {
			fit(1);
			b[i++] = x;
			return w;
		},
		i16(x) {
			fit(2);
			b.writeInt16BE(x, i);
			i += 2;
			return w;
		},
		u16(x) {
			fit(2);
			b.writeUInt16BE(x, i);
			i += 2;
			return w;
		},
		i32(x) {
			fit(4);
			b.writeInt32BE(x, i);
			i += 4;
			return w;
		},
		truncate(n) {
			i = n;
			return w;
		},
		take() {
			const out = i < 4096 ? Buffer.from(b.subarray(0, i)) : b.subarray(0, i);
			i >= 4096 && (b = Buffer.allocUnsafe(size));
			i = at = 0;
			return out;
		}
	};
	return w;
	function fit(n) {
		if (b.length - i >= n) return;
		const prev = b;
		b = Buffer.allocUnsafe(Math.max(size, prev.length * 2, i + n));
		prev.copy(b, 0, 0, i);
	}
}
const own$1 = Writer(1024);
const S$1 = 83;
const H = 72;
const X = 88;
const c = 99;
const Q = 81;
const p = 112;
const d = 100;
const f = 102;
const D$1 = 68;
const C = 67;
const E$1 = 69;
const P = 80;
const B = 66;
const sync = (w) => w.type(S$1).end();
const flush = (w) => w.type(H).end();
const terminate = (w) => w.type(X).end();
const copyDone = (w) => w.type(c).end();
const sslRequest = (w) => w.untyped().i32(80877103).endUntyped();
const query = (w, text) => w.type(Q).str(text).end();
const password = (w, x) => w.type(p).str(x).end();
const saslResponse = (w, x) => w.type(p).bytes(x).end();
const copyData = (w, x) => w.type(d).bytes(x).end();
const copyFail = (w, x) => w.type(f).str(x).end();
const describe = (w, kind, name) => w.type(D$1).u8(kind.charCodeAt(0)).str(name).end();
const close = (w, kind, name) => w.type(C).u8(kind.charCodeAt(0)).str(name).end();
const execute = (w, portal, rows = 0) => w.type(E$1).str(portal).i32(rows).end();
const cancel$1 = (w, pid, secret) => w.untyped().i32(80877102).i32(pid).i32(secret).endUntyped();
const Terminate = one(terminate);
const SSLRequest = one(sslRequest);
const Query = one(query);
const Password = one(password);
const SASLResponse = one(saslResponse);
const Cancel = one(cancel$1);
const Startup = one(startup);
const SASL = one(sasl);
function one(fn) {
	return (...xs) => {
		try {
			fn(own$1, ...xs);
		} catch (error) {
			own$1.truncate(0);
			throw error;
		}
		return own$1.take();
	};
}
function startup(w, parameters) {
	w.untyped().i32(196608);
	for (const k in parameters) parameters[k] && w.str(unbroken(k, k)).str(unbroken(k, "" + parameters[k]));
	return w.u8(0).endUntyped();
}
function unbroken(k, x) {
	if (x.indexOf("\0") !== -1) throw Object.assign(/* @__PURE__ */ new Error("The connection parameter " + k + " contains a NUL character"), { code: "NUL_CHARACTER" });
	return x;
}
function sasl(w, mechanism, initial) {
	return w.type(p).str(mechanism).i32(Buffer.byteLength(initial)).bytes(initial).end();
}
function parse$1(w, name, text, oids = []) {
	w.type(P).str(name).str(text).u16(oids.length);
	for (let j = 0; j < oids.length; j++) w.i32(oids[j] | 0);
	return w.end();
}
function bind(w, portal, name, values = [], formats = [], resultFormats = []) {
	w.type(B).str(portal).str(name).i16(formats.length);
	for (let j = 0; j < formats.length; j++) w.i16(formats[j]);
	w.u16(values.length);
	for (let j = 0; j < values.length; j++) w.value(values[j]);
	w.i16(resultFormats.length);
	for (let j = 0; j < resultFormats.length; j++) w.i16(resultFormats[j]);
	return w.end();
}
function run(w, portal, name, values, rows, flushing, formats) {
	bind(w, portal, name, values, void 0, formats || void 0);
	execute(w, portal, rows);
	return flushing ? flush(w) : sync(w);
}
const largest = 1073741824;
function Frames(onframe, shared = false, onerror = null) {
	const chunks = [], owned = /* @__PURE__ */ new WeakSet();
	let data = null, owning = false, at = 0, part = null, filled = 0, paused = false, running = false, broken = false;
	return {
		push(x) {
			if (broken) return;
			chunks.push(shared && (paused || owning) ? own(x) : x);
			run();
		},
		get paused() {
			return paused;
		},
		owns(x) {
			return !shared || owned.has(x);
		},
		own(x) {
			owning = x;
			x && settle();
		},
		pause() {
			paused = true;
			settle();
		},
		resume() {
			paused = false;
			run();
		}
	};
	function own(x) {
		const copy = Buffer.from(x);
		owned.add(copy);
		return copy;
	}
	function settle() {
		if (!shared) return;
		data && at < data.length && !owned.has(data) && (data = own(data.subarray(at)), at = 0);
		for (let i = 0; i < chunks.length; i++) owned.has(chunks[i]) || (chunks[i] = own(chunks[i]));
	}
	function run() {
		if (running) return;
		running = true;
		try {
			while (true) {
				if (broken || paused || !(data && at < data.length || next())) break;
				part ? fill() : frame();
			}
		} finally {
			running = false;
		}
	}
	function invalid(length) {
		if (length >= 4 && length <= largest) return false;
		broken = true;
		chunks.length = 0;
		data = part = null;
		at = filled = 0;
		const error = Object.assign(/* @__PURE__ */ new Error("The server sent a message with an invalid length (" + length + ")"), { code: "PROTOCOL_ERROR" });
		onerror && onerror(error);
		return true;
	}
	function next() {
		data = chunks.shift() || null;
		at = 0;
		return data !== null;
	}
	function frame() {
		if (data.length - at < 5) return start(5);
		const length = data.readInt32BE(at + 1);
		if (invalid(length)) return;
		const end = at + 1 + length;
		if (end > data.length) return start(end - at);
		const begin = at;
		at = end;
		onframe(data[begin], data, begin, end);
	}
	function start(length) {
		part = Buffer.allocUnsafe(length);
		shared && owned.add(part);
		filled = data.copy(part, 0, at);
		at = data.length;
	}
	function fill() {
		const n = data.copy(part, filled, at, at + part.length - filled);
		filled += n;
		at += n;
		if (filled < part.length) return;
		if (part.length === 5) {
			const head = part, length = head.readInt32BE(1);
			if (invalid(length)) return;
			part = Buffer.allocUnsafe(1 + length);
			shared && owned.add(part);
			filled = head.copy(part);
			return filled === part.length && done();
		}
		done();
	}
	function done() {
		const x = part;
		part = null;
		onframe(x[0], x, 0, x.length);
	}
}
const errorFields = {
	83: "severity_local",
	86: "severity",
	67: "code",
	77: "message",
	68: "detail",
	72: "hint",
	80: "position",
	112: "internal_position",
	113: "internal_query",
	87: "where",
	115: "schema_name",
	116: "table_name",
	99: "column_name",
	100: "data_type_name",
	110: "constraint_name",
	70: "file",
	76: "line",
	82: "routine"
};
function error(x, start, end) {
	const fields = {};
	for (let i = start + 5; i < end - 1;) {
		const zero = x.indexOf(0, i + 1);
		fields[errorFields[x[i]] || String.fromCharCode(x[i])] = x.toString("utf8", i + 1, zero);
		i = zero + 1;
	}
	fields.severity || (fields.severity = fields.severity_local);
	return fields;
}
const text$1 = typeof Buffer.prototype.utf8Slice === "function" ? (x, start, end) => x.utf8Slice(start, end) : (x, start, end) => x.toString("utf8", start, end);
const u32 = (x, i) => (x[i] << 24 | x[i + 1] << 16 | x[i + 2] << 8 | x[i + 3]) >>> 0;
const u16 = (x, i) => x[i] << 8 | x[i + 1];
const field = (name, table, number, type) => ({
	name,
	table,
	number,
	type
});
function rowDescription(x, start, end, make = field) {
	const columns = new Array(x[start + 5] << 8 | x[start + 6]);
	for (let i = start + 7, j = 0; j < columns.length; j++) {
		let zero = i;
		while (x[zero] !== 0) zero++;
		columns[j] = make(text$1(x, i, zero), u32(x, zero + 1), u16(x, zero + 5), u32(x, zero + 7));
		i = zero + 19;
	}
	return columns;
}
function parameterDescription(x, start) {
	const oids = new Array(x.readUInt16BE(start + 5));
	for (let j = 0; j < oids.length; j++) oids[j] = x.readUInt32BE(start + 7 + j * 4);
	return oids;
}
function commandComplete(x, start, end) {
	const first = start + 5;
	let e = end - 1, count = null;
	while (true) {
		let s = e - 1;
		while (s >= first && x[s] >= 48 && x[s] <= 57) s--;
		if (s === e - 1 || s < first || x[s] !== 32) break;
		count === null && (count = +text$1(x, s + 1, e));
		e = s;
	}
	return {
		command: text$1(x, first, e),
		count
	};
}
function readyForQuery(x, start) {
	return String.fromCharCode(x[start + 5]);
}
function notification(x, start) {
	const zero = x.indexOf(0, start + 9);
	return {
		pid: x.readInt32BE(start + 5),
		channel: x.toString("utf8", start + 9, zero),
		payload: x.toString("utf8", zero + 1, x.indexOf(0, zero + 1))
	};
}
function parameterStatus(x, start) {
	const zero = x.indexOf(0, start + 5);
	return [x.toString("utf8", start + 5, zero), x.toString("utf8", zero + 1, x.indexOf(0, zero + 1))];
}
function backendKeyData(x, start) {
	return {
		pid: x.readInt32BE(start + 5),
		secret: x.readInt32BE(start + 9)
	};
}
// node_modules/postgres/src/socket.js
const noop$3 = () => {};
const agent = globalThis.navigator && globalThis.navigator.userAgent || "";
const workers = agent.startsWith("Cloudflare-Workers");
const onreadSafe = !agent || agent.startsWith("Node.js") || agent.startsWith("Bun") || agent.startsWith("Deno");
const node = !agent || agent.startsWith("Node.js");
const contexts = /* @__PURE__ */ new WeakMap();
async function Socket(options, host, port, track = noop$3) {
	return wrap(options.socket ? await options.socket(options, host, port) : await connect(options, host, port, track), host);
}
function secureOptions(ssl) {
	return ssl === "require" || ssl === "allow" || ssl === "prefer" ? workers ? {} : { rejectUnauthorized: false } : typeof ssl === "object" ? context(ssl) : {};
}
function context(ssl) {
	if (!node || ssl.secureContext || !ssl.ca) return ssl;
	const values = { ...ssl };
	let last = contexts.get(ssl);
	last && same(values, last.values) || contexts.set(ssl, last = {
		values,
		secureContext: tls.createSecureContext(values)
	});
	return {
		...values,
		secureContext: last.secureContext
	};
}
function same(a, b) {
	return [...Object.keys(a), ...Object.keys(b)].every((k) => a[k] === b[k]);
}
const secured = (options) => !!options.ssl && options.ssl !== "disable";
const direct = (options) => secured(options) && options.sslnegotiation === "direct";
function connect(options, host, port, track) {
	return new Promise((resolve, reject) => {
		const tlsNow = direct(options), reads = (!secured(options) || tlsNow) && onreadSafe && options.onread !== false && {
			buffer: Buffer.allocUnsafe(65536),
			callback: (n, b) => socket.ondata(b.subarray(0, n))
		}, target = options.path ? { path: options.path } : {
			port,
			host
		}, socket = tlsNow ? tls.connect({
			...target,
			servername: net.isIP(host || "") || options.path ? void 0 : host,
			...secureOptions(options.ssl),
			ALPNProtocols: ["postgresql"],
			...reads ? { onread: reads } : {}
		}) : net.connect({
			...target,
			...reads ? { onread: reads } : {}
		});
		track(socket);
		socket.shared = !!reads;
		socket.secure = tlsNow;
		socket.ondata = noop$3;
		socket.once("error", reject);
		socket.once(tlsNow ? "secureConnect" : "connect", () => {
			socket.off("error", reject);
			socket.setNoDelay(true);
			resolve(socket);
		});
	});
}
function wrap(socket, host) {
	let closed = false, failure = null;
	socket.shared && (socket.ondata = data);
	const x = {
		ondata: noop$3,
		ondrain: noop$3,
		onclose: noop$3,
		get raw() {
			return socket;
		},
		get closed() {
			return closed;
		},
		get shared() {
			return !!socket.shared;
		},
		get negotiated() {
			return !!socket.secure || !!socket.negotiated;
		},
		get serial() {
			return !!socket.serial;
		},
		certificate() {
			const x = typeof socket.getPeerCertificate === "function" && socket.getPeerCertificate();
			return x && x.raw || null;
		},
		write: (data) => !closed && socket.write(data),
		upgrade,
		pause: () => socket.pause(),
		resume: () => socket.resume(),
		ref: () => socket.ref && socket.ref(),
		unref: () => socket.unref && socket.unref(),
		end(data) {
			closed || (data ? socket.end(data) : socket.end());
		},
		destroy(error) {
			error && !failure && (failure = error);
			socket.destroy();
		},
		keepAlive(seconds) {
			seconds && socket.setKeepAlive && socket.setKeepAlive(true, 1e3 * seconds);
		}
	};
	listen();
	return x;
	function listen() {
		socket.on("data", data);
		socket.on("drain", drain);
		socket.on("error", error);
		socket.on("close", close);
	}
	function unlisten() {
		socket.off("data", data);
		socket.off("drain", drain);
		socket.off("error", error);
		socket.off("close", close);
	}
	function data(buffer) {
		x.ondata(buffer);
	}
	function drain() {
		x.ondrain();
	}
	function error(err) {
		failure || (failure = err);
		socket.destroy();
		close();
	}
	function close() {
		if (closed) return;
		closed = true;
		x.onclose(failure);
	}
	function upgrade(options = {}) {
		return new Promise((resolve, reject) => {
			unlisten();
			const secure = tls.connect({
				socket,
				host: host || void 0,
				servername: net.isIP(host || "") ? void 0 : host,
				...options
			});
			const fail = (err) => {
				secure.off("secureConnect", ready);
				reject(err);
			};
			function ready() {
				secure.off("error", fail);
				socket = secure;
				listen();
				resolve(x);
			}
			secure.once("secureConnect", ready);
			secure.once("error", fail);
		});
	}
}
// node_modules/postgres/src/startup.js
const R = 82;
const S = 83;
const K = 75;
const E = 69;
const N = 78;
const D = 68;
const Z = 90;
async function open(options, signal = {
	aborted: false,
	sockets: /* @__PURE__ */ new Set()
}, first = 0) {
	const hosts = options.path ? [null] : options.host, wanted = options.target_session_attrs, passes = wanted === "prefer-standby" ? ["standby", "any"] : [wanted || "any"];
	let last;
	for (const want of passes) for (let n = 0; n < hosts.length; n++) {
		const i = (first + n) % hosts.length, host = hosts[i], port = options.port[i] || options.port[0], [failed, error, ready] = await traced(options, host, port, signal).then((x) => [
			false,
			null,
			x
		], (x) => [true, x]);
		if (!failed && fits(want, ready.attributes)) return ready.index = i, ready;
		failed || ready.socket.end(Terminate());
		last = failed ? error : Errors.connection("CONNECTION_DESTROYED", options, host, port);
		if (signal.aborted) throw last;
	}
	throw last;
}
function traced(options, host, port, signal) {
	if (!active(channels.connect)) return attempt(options, host, port, signal);
	const context = {
		host: options.path ? null : host,
		port: options.path ? null : port,
		path: options.path || null,
		database: options.database,
		user: userName(options),
		ssl: secured(options),
		sslnegotiation: options.sslnegotiation || "postgres"
	};
	let promise;
	start(channels.connect, context, () => promise = attempt(options, host, port, signal));
	return promise.then((ready) => {
		finish(channels.connect, context, null, {
			pid: ready.backend.pid,
			status: ready.status,
			readOnly: ready.attributes.readOnly,
			standby: ready.attributes.standby
		});
		return ready;
	}, (error) => {
		finish(channels.connect, context, error);
		throw error;
	});
}
function fits(want, { readOnly, standby }) {
	return want === "any" || want === "read-write" && !readOnly || want === "read-only" && readOnly || want === "primary" && !standby || want === "standby" && standby;
}
function attempt(options, host, port, signal) {
	const { setTimeout, clearTimeout } = options.timers, fail = (code) => Errors.connection(code, options, host, port);
	return new Promise((resolve, reject) => {
		const timer = options.connect_timeout && setTimeout(() => done(true, fail("CONNECT_TIMEOUT")), options.connect_timeout * 1e3);
		let socket = null, raw = null, settled = false;
		session().then((x) => done(false, null, x), (e) => done(true, e));
		function done(failed, error, ready) {
			if (settled) return;
			settled = true;
			timer && clearTimeout(timer);
			socket && signal.sockets.delete(socket);
			signal.aborted && !failed && (failed = true, error = fail("CONNECTION_DESTROYED"));
			if (failed) {
				socket ? socket.destroy() : raw && raw.destroy();
				return reject(error);
			}
			ready.socket.onclose = () => {};
			resolve(ready);
		}
		async function session() {
			socket = await Socket(options, host, port, (x) => raw = x);
			if (settled || signal.aborted) return socket.destroy(), done(true, fail("CONNECTION_DESTROYED"));
			signal.sockets.add(socket);
			socket.onclose = (error) => done(true, signal.aborted ? fail("CONNECTION_DESTROYED") : error && error.code ? error : fail("CONNECTION_CLOSED"));
			socket.keepAlive(options.keep_alive);
			await negotiate(socket, options);
			const user = typeof options.user === "function" ? await options.user() : options.user;
			return startup(user, options.database || user);
		}
		function startup(user, database) {
			return new Promise((resolve, reject) => {
				const stored = () => pgpass(options.passfile, options.path ? "localhost" : host, port, database, user) || "", auth = Auth({
					user,
					pass: options.pass || stored,
					binding: options.channel_binding,
					socket
				}), parameters = {}, backend = {
					pid: null,
					secret: null
				}, frames = Frames(frame, false, (error) => (reject(error), socket.destroy())), rows = [];
				let probing = false, status = null, authing = Promise.resolve();
				socket.ondata = (x) => frames.push(x);
				socket.write(Startup({
					user,
					database,
					client_encoding: "UTF8",
					...options.connection
				}));
				function frame(type, x, start, end) {
					try {
						type === R ? authenticate(Buffer.from(x.subarray(start, end))) : type === S ? (([k, v]) => parameters[k] = v)(parameterStatus(x, start)) : type === K ? Object.assign(backend, backendKeyData(x, start)) : type === E ? reject(Errors.postgres(error(x, start, end))) : type === N ? notice(error(x, start, end)) : type === D ? rows.push(x.toString("utf8", start + 11, start + 11 + x.readInt32BE(start + 7))) : type === Z && settled(readyForQuery(x, start), Buffer.from(x.subarray(end)));
					} catch (error) {
						reject(error);
					}
				}
				function notice(x) {
					try {
						options.onnotice ? options.onnotice(x) : options.onnotice === false || console.log(x);
					} catch (error) {}
				}
				function authenticate(x) {
					authing = authing.then(() => auth(x)).then((reply) => reply && socket.write(reply));
					authing.catch((error) => (reject(error), socket.destroy()));
				}
				function settled(x, rest) {
					authing.then(() => ready(x, rest), () => {});
				}
				function ready(x, rest) {
					if (!auth.authenticated) return reject(Errors.generic("AUTHENTICATION_INCOMPLETE", "The server was ready before it accepted the authentication"));
					status = x;
					const known = "in_hot_standby" in parameters && "default_transaction_read_only" in parameters;
					if (options.target_session_attrs && !known && !probing) {
						probing = true;
						return socket.write(Query("show transaction_read_only; select pg_catalog.pg_is_in_recovery()"));
					}
					frames.pause();
					socket.ondata = () => {};
					socket.pause();
					resolve({
						socket,
						rest,
						backend,
						parameters,
						status,
						attributes: {
							readOnly: (known ? parameters.default_transaction_read_only : rows[0]) === "on",
							standby: known ? parameters.in_hot_standby === "on" : rows[1] === "t"
						},
						host,
						port,
						cancel: () => cancel(options, host, port, backend)
					});
				}
			});
		}
	});
}
async function negotiate(socket, options) {
	if (!secured(options) || socket.negotiated) return;
	const ssl = options.ssl, tls = secureOptions(ssl);
	if (options.sslnegotiation === "direct") return socket.upgrade({
		...tls,
		ALPNProtocols: ["postgresql"]
	});
	const answer = new Promise((r) => socket.ondata = (x) => r(x[0]));
	socket.write(SSLRequest());
	if (await answer === S) return socket.upgrade(tls);
	if (ssl !== "prefer" && ssl !== "allow") throw Errors.generic("SSL_NOT_SUPPORTED", "The server does not support SSL connections");
}
function cancel(options, host, port, { pid, secret }) {
	const { setTimeout, clearTimeout } = options.timers;
	return new Promise((resolve, reject) => {
		let socket = null, raw = null, written = false, settled = false;
		const limit = options.cancel_timeout || options.connect_timeout, timer = limit && setTimeout(() => done(!written && Errors.connection("CONNECT_TIMEOUT", options, host, port)), limit * 1e3);
		Socket(options, host, port, (x) => raw = x).then(async (x) => {
			socket = x;
			if (settled) return socket.destroy();
			await negotiate(socket, options);
			socket.onclose = () => done();
			written = true;
			socket.end(Cancel(pid, secret));
		}).catch(done);
		function done(error) {
			if (settled) return;
			settled = true;
			timer && clearTimeout(timer);
			socket ? socket.destroy() : raw && raw.destroy();
			error ? reject(error) : resolve();
		}
	});
}
const salted = /* @__PURE__ */ new Map();
function Auth({ user, pass, binding = "prefer", socket }) {
	let nonce, signature, verified = true, bound = false, header = "n,,";
	respond.authenticated = false;
	return respond;
	async function respond(x) {
		const type = x.readInt32BE(5);
		if ((type === 3 || type === 5) && binding === "require") throw unbound("the server asked for " + (type === 3 ? "a cleartext" : "an MD5") + " password");
		return type === 0 ? ok() : type === 3 ? Password(await password()) : type === 5 ? Password("md5" + md5(Buffer.concat([Buffer.from(md5(await password() + user)), x.subarray(9, 13)]))) : type === 10 ? start(x) : type === 11 ? proceed(x, await password()) : type === 12 ? finish(x) : unsupported(type);
	}
	function start(x) {
		const offered = x.toString("utf8", 9).split("\0"), certificate = binding !== "disable" && socket && socket.certificate && socket.certificate(), hash = certificate && endpoint(certificate), plus = !!hash && offered.includes("SCRAM-SHA-256-PLUS");
		if (binding === "require" && !plus) throw unbound(offered.includes("SCRAM-SHA-256-PLUS") ? "the server certificate could not be hashed for it" : "the server did not offer it");
		if (!plus && !offered.includes("SCRAM-SHA-256")) throw Errors.generic("SASL_MECHANISM_NOT_SUPPORTED", "The server offered no supported SASL mechanism");
		header = plus ? "p=tls-server-end-point,," : hash ? "y,," : "n,,";
		bound = plus ? hash : false;
		nonce = crypto.randomBytes(18).toString("base64");
		verified = false;
		return SASL(plus ? "SCRAM-SHA-256-PLUS" : "SCRAM-SHA-256", header + "n=*,r=" + nonce);
	}
	function proceed(x, pass) {
		const res = x.toString("utf8", 9).split(",").reduce((acc, x) => (acc[x[0]] = x.slice(2), acc), {}), key = sha256(pass + "\0" + res.s + "\0" + res.i).toString("base64");
		if (!res.r.startsWith(nonce)) throw Errors.generic("SASL_NONCE_MISMATCH", "The server nonce does not start with the client nonce");
		if (!salted.has(key)) {
			salted.size >= 64 && salted.delete(salted.keys().next().value);
			salted.set(key, crypto.pbkdf2Sync(pass, Buffer.from(res.s, "base64"), +res.i, 32, "sha256"));
		}
		const saltedPassword = salted.get(key), clientKey = hmac(saltedPassword, "Client Key"), channel = (bound ? Buffer.concat([Buffer.from(header), bound]) : Buffer.from(header)).toString("base64"), auth = "n=*,r=" + nonce + ",r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=" + channel + ",r=" + res.r;
		signature = hmac(hmac(saltedPassword, "Server Key"), auth).toString("base64");
		return SASLResponse("c=" + channel + ",r=" + res.r + ",p=" + xor(clientKey, hmac(sha256(clientKey), auth)).toString("base64"));
	}
	function finish(x) {
		if (!signature || x.toString("utf8", 9).split("\0", 1)[0].slice(2) !== signature) throw Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature");
		verified = true;
		return null;
	}
	function ok() {
		if (!verified) throw Errors.generic("SASL_SIGNATURE_MISMATCH", "The server ended SCRAM authentication without proving it knows the password");
		if (binding === "require" && !bound) throw unbound("the server authenticated without it");
		respond.authenticated = true;
		return null;
	}
	function unsupported(type) {
		throw Errors.generic("AUTH_TYPE_NOT_IMPLEMENTED", "Authentication type " + type + " is not supported");
	}
	function password() {
		return Promise.resolve(typeof pass === "function" ? pass() : pass);
	}
}
function unbound(reason) {
	return Errors.generic("CHANNEL_BINDING_REQUIRED", "channel_binding is require, but " + reason);
}
const signatures = {
	"2a864886f70d010104": "sha256",
	"2a864886f70d010105": "sha256",
	"2a864886f70d01010e": "sha224",
	"2a864886f70d01010b": "sha256",
	"2a864886f70d01010c": "sha384",
	"2a864886f70d01010d": "sha512",
	"2a8648ce3d0401": "sha256",
	"2a8648ce3d040301": "sha224",
	"2a8648ce3d040302": "sha256",
	"2a8648ce3d040303": "sha384",
	"2a8648ce3d040304": "sha512",
	"2a8648ce380403": "sha256",
	"608648016503040302": "sha256"
};
const digests = {
	"2b0e03021a": "sha256",
	"608648016503040201": "sha256",
	"608648016503040202": "sha384",
	"608648016503040203": "sha512",
	"608648016503040204": "sha224"
};
function endpoint(certificate) {
	try {
		const x = Buffer.from(certificate), algorithm = signature(x);
		return algorithm ? crypto.createHash(algorithm).update(x).digest() : null;
	} catch (_) {
		return null;
	}
}
function signature(x) {
	const algorithm = der(x, der(x, der(x, 0).body).end), oid = der(x, algorithm.body), name = x[oid.start] === 6 && x.toString("hex", oid.body, oid.end);
	if (name !== "2a864886f70d01010a") return signatures[name];
	if (oid.end >= algorithm.end) return "sha256";
	const params = der(x, oid.end), first = params.body < params.end && der(x, params.body);
	if (!first || x[first.start] !== 160) return "sha256";
	const hash = der(x, der(x, first.body).body);
	return digests[x.toString("hex", hash.body, hash.end)];
}
function der(x, start) {
	let length = x[start + 1], body = start + 2;
	if (length & 128) {
		const n = length & 127;
		length = 0;
		for (let i = 0; i < n; i++) length = length * 256 + x[body + i];
		body += n;
	}
	if (body + length > x.length) throw new Error("Truncated certificate");
	return {
		start,
		body,
		end: body + length
	};
}
function md5(x) {
	return crypto.createHash("md5").update(x).digest("hex");
}
function hmac(key, x) {
	return crypto.createHmac("sha256", key).update(x).digest();
}
function sha256(x) {
	return crypto.createHash("sha256").update(x).digest();
}
function xor(a, b) {
	const x = Buffer.allocUnsafe(a.length);
	for (let i = 0; i < a.length; i++) x[i] = a[i] ^ b[i];
	return x;
}
function pgpass(file, host, port, database, user) {
	if (!file) return null;
	let text;
	try {
		const stat = fs.statSync(file);
		if (!stat.isFile() || process.platform !== "win32" && stat.mode & 63) return null;
		text = fs.readFileSync(file, "utf8");
	} catch (_) {
		return null;
	}
	const wanted = [
		host,
		String(port),
		database,
		user
	];
	for (const line of text.split(/\r?\n/)) {
		const fields = line && line[0] !== "#" ? split$1(line) : [];
		if (fields.length === 5 && wanted.every((x, i) => fields[i] === "*" || fields[i] === x)) return fields[4];
	}
	return null;
}
function split$1(line) {
	const fields = [];
	let field = "";
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (c === "\\" && i + 1 < line.length) field += line[++i];
		else if (c === ":" && fields.length < 4) fields.push(field), field = "";
		else field += c;
	}
	fields.push(field);
	return fields;
}
const text = text$1;
const noop$2 = () => {};
const ending = /^\s*(commit|end|abort|rollback(?!\s+to\b)|prepare\s+transaction)\b/i;
const limit$1 = 1e3;
const refused = "postgres.js: query could not be built";
const skip = Symbol("skip");
const held = Symbol("held");
const unknown = 100;
const states = /* @__PURE__ */ new WeakMap();
const after = 16;
const variety = 16;
let ids = 1;
let compiles = true;
function Connection(ready, options, events) {
	const { socket } = ready, timers = options.timers, defer = timers.nextTick || process.nextTick, { transform } = options, sent = [], pending = [], running = /* @__PURE__ */ new Set(), open = /* @__PURE__ */ new Set(), prepared = /* @__PURE__ */ new Map(), out = Writer(), frames = Frames(frame, socket.shared, (error) => (connection.fatal = error, socket.destroy()));
	let blocker = null, stash = null, heard = timers.now(), rolling = false, fence = null, drained = null, status = ready.status, flushing = false, closed = null, closing = null, portals = 0, traced = 0, epoch = 0, headSince = 0, notables = 0;
	const connection = {
		id: ids++,
		host: ready.host,
		port: ready.port,
		backend: ready.backend,
		parameters: ready.parameters,
		prepared,
		lease: null,
		get status() {
			return status;
		},
		get inflight() {
			return sent.length + pending.length;
		},
		get exclusive() {
			return !!blocker && exclusive(blocker);
		},
		get copying() {
			return !!blocker && blocker.streaming && blocker.open;
		},
		get closed() {
			return closed;
		},
		get closing() {
			return !!closing;
		},
		send,
		batch,
		simple,
		describe: describe$1,
		local,
		cancel,
		close: close$1,
		destroy,
		go,
		ref: () => socket.ref(),
		unref: () => socket.unref(),
		backlog,
		heavy,
		get notable() {
			return notables > 0;
		}
	};
	socket.ondata = (x) => (heard = timers.now(), frames.push(x));
	socket.ondrain = ondrain;
	socket.onclose = onclose;
	ready.rest && ready.rest.length && frames.push(ready.rest);
	socket.resume();
	return connection;
	function ondrain() {
		const x = drained;
		drained = null;
		x && x();
	}
	function schedule(now) {
		if (now || out.length >= 65536) return flush$1();
		flushing || (flushing = true, defer(flush$1));
		return true;
	}
	function flush$1() {
		flushing = false;
		if (closed) return out.take(), true;
		return out.length ? socket.write(out.take()) : true;
	}
	function holds(x) {
		return x.describing || x.described && socket.serial && !x.nosync && !x.done || x.gate && x.learn && !x.error || !!x.error && !x.done || x.flushing && !x.synced || x.streaming && x.open || x.alone && !x.done;
	}
	function exclusive(x) {
		return x.flushing || x.streaming || x.alone;
	}
	function refresh() {
		blocker && !holds(blocker) && (blocker = null);
		release();
	}
	function queue(x) {
		if (closed) return settleError(x, copy(closed));
		if (blocker && blocker.streaming && blocker.open) return settleError(x, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy"));
		x.query && (x.query.state = connection.backend);
		if (fence) pending.splice(pending.indexOf(fence), 0, x);
		else if (x.ends && open.size) pending.push(fence = x);
		else if (blocker || pending.length) pending.push(x);
		else return write(x), schedule();
		release();
	}
	function release() {
		while (!blocker && pending.length && pending[0] !== fence) write(pending.shift());
		schedule();
	}
	function write(x) {
		if (x.kind === "local" && sent.length === 0) return queueMicrotask(() => settle(x));
		const mark = out.length;
		let result;
		try {
			result = x.write(x);
		} catch (error) {
			x.own = error;
			result = skip;
		}
		if (result === held) {
			out.truncate(mark);
			x.loose = false;
			blocker = sent.find((y) => y.gate && holds(y)) || null;
			blocker && blocker.nosync && !blocker.flushed && (blocker.flushed = true, flush(out), schedule());
			return pending.unshift(x);
		}
		if (result === skip) {
			out.truncate(mark);
			x.fresh = null;
			x.parses = [];
			x.portal = "";
			x.describing = x.synced = x.flushing = x.open = false;
			if (x.batch) {
				x.entry = null;
				parse$1(out, "", refused);
				x.parses = [""];
				abort(x);
			} else if (!x.own || x.kind === "step" || !connection.lease) {
				x.kind = "local";
				x.cost >= 5 && notables--;
				x.cost = void 0;
				return sent.length === 0 ? queueMicrotask(() => settle(x)) : sent.push(x);
			} else {
				x.kind = "simple";
				x.text = refused;
				x.results = [];
				x.entry = null;
				sync$1(x, true);
			}
		}
		x.fresh && register(x.fresh);
		x.portal && x.kind === "query" && open.add(x);
		x.query && (x.query.active = sent.length === 0);
		x.ends && epoch++;
		x.epoch = epoch;
		options.scheduler && sent.length === 0 && (headSince = timers.now());
		sent.push(x);
		holds(x) && (blocker = x);
		x.trace && wrote(x);
	}
	function sync$1(x, refuse) {
		if (x.synced) return;
		x.synced = true;
		refuse ? query(out, refused) : sync(out);
		schedule();
	}
	function register(entry) {
		prepared.get(entry.name) && prepared.delete(entry.name);
		prepared.set(entry.name, entry);
		entry.owner.entry = entry;
		entry.owner.fresh = null;
		if (prepared.size <= limit$1) return;
		for (const [name, x] of prepared) if (x.state !== "parsing") {
			prepared.delete(name);
			close(out, "S", name);
			return;
		}
	}
	function drop(entry) {
		prepared.get(entry.name) === entry && prepared.delete(entry.name);
	}
	function send(query) {
		const { statement } = query.wire, x = Exchange("query", query, connection.lease, extended);
		x.statement = statement;
		x.ends = statement.ends === void 0 ? statement.ends = ending.test(statement.text) : statement.ends;
		options.scheduler && cost(x);
		queue(x);
	}
	function batch(query, parts) {
		const b = {
			query,
			parts,
			results: new Array(parts.length),
			settled: new Array(parts.length).fill(false),
			left: parts.length,
			error: null,
			index: -1,
			aborted: null
		};
		parts.forEach((part, i) => {
			part.resolve = (result) => batched(b, i, null, result);
			part.reject = (error) => batched(b, i, error);
			if (b.aborted) return batched(b, i, skipped(b.aborted, i));
			const x = Exchange("query", part, connection.lease, extended);
			x.statement = part.wire.statement;
			x.ends = x.statement.ends === void 0 ? x.statement.ends = ending.test(x.statement.text) : x.statement.ends;
			x.batch = b;
			x.nosync = i < parts.length - 1;
			options.scheduler && cost(x);
			queue(x);
		});
	}
	function batched(b, i, error, result) {
		if (b.settled[i]) return;
		b.settled[i] = true;
		b.left--;
		error ? (b.error === null || i < b.index && !error.skipped) && (b.error = error, b.index = i) : b.results[i] = result;
		if (b.left) return;
		const { query, parts, results } = b;
		if (b.error) {
			b.error.index = b.index;
			parts.forEach((part, j) => {
				Query$1.prototype.reject.call(part, j === b.index ? b.error : skipped(b.error, b.index));
				part.catch(noop$2);
			});
			return query.reject(b.error);
		}
		parts.forEach((part, j) => Query$1.prototype.resolve.call(part, results[j]));
		query.resolve(results);
	}
	function skipped(error, index) {
		const x = copy(error);
		x.index = index;
		x.skipped = true;
		return x;
	}
	function part(x) {
		sent.shift();
		options.scheduler && timed(x);
		x.done = true;
		x.open = false;
		x.trace && traced--;
		blocker === x && (blocker = null);
		settle(x);
		const next = sent[0];
		if (next && next.query) {
			next.query.active = true;
			next.cancel && turn(next);
		}
		release();
	}
	function abort(x) {
		if (x.aborted) return;
		x.aborted = true;
		const b = x.batch, error = x.own || x.error;
		b.aborted = error;
		let synced = !x.nosync && x.synced;
		const at = sent.indexOf(x);
		for (let i = at === -1 ? sent.length : at + 1; i < sent.length;) {
			const y = sent[i];
			if (y.batch === b) {
				sent.splice(i, 1);
				synced = synced || !y.nosync && y.synced;
				drop(y);
				blocker === y && (blocker = null);
			} else i++;
		}
		for (let i = 0; i < pending.length;) {
			const y = pending[i];
			y.batch === b ? (pending.splice(i, 1), drop(y)) : i++;
		}
		synced || sync(out);
		x.nosync = false;
		x.synced = true;
		schedule();
		function drop(y) {
			y.entry && y.entry.owner === y && y.entry.state === "parsing" && (y.entry.state = "stale");
			y.done = true;
			y.trace && traced--;
			y.cost >= 5 && notables--;
			settleError(y, skipped(error, b.parts.indexOf(y.query)));
		}
	}
	function cost(x) {
		const { query } = x;
		query.cost && !query.cursorFn && !query.streaming && (x.cost = query.cost.est === void 0 ? unknown : query.cost.est);
		x.cost >= 5 && notables++;
	}
	function timed(x) {
		const t = timers.now();
		if (x.cost !== void 0) {
			x.cost >= 5 && notables--;
			const sample = t - headSince, c = x.query.cost;
			c.est = c.est === void 0 || sample > c.est ? sample : c.est + (sample - c.est) * .1;
			events.ontimed && events.ontimed(sample, t);
		}
		headSince = t;
	}
	function backlog(t) {
		let w = 0;
		for (let i = 0; i < sent.length; i++) {
			const e = sent[i].cost || 0;
			if (i === 0) {
				const elapsed = t - headSince;
				w += elapsed < e ? e - elapsed : elapsed;
			} else w += e;
		}
		for (let i = 0; i < pending.length; i++) w += pending[i].cost || 0;
		return w;
	}
	function heavy() {
		for (let i = 0; i < sent.length; i++) if (sent[i].cost >= 100) return true;
		for (let i = 0; i < pending.length; i++) if (pending[i].cost >= 100) return true;
		return false;
	}
	function extended(x) {
		const { query } = x, { built } = query.wire, statement = x.statement, name = statement.name, current = name ? prepared.get(name) : null;
		if (query.cursorFn) {
			x.rows = query.cursorRows;
			x.portal = transaction() ? "c" + portals++ : "";
			x.flushing = !x.portal;
		}
		x.streaming = x.open = !!query.streaming;
		if (current && current.state === "parsing" && current.oids === null && current.owner && !current.owner.error) {
			if (!current.owner.loose) throw Errors.generic("STATEMENT_PENDING", "A statement was used before its description arrived");
			current.owner.gate = true;
			return held;
		}
		if (current && current !== x.previous && usable(current, statement)) {
			const b = query.isRaw === true || query.ownParsers ? null : binaries(current);
			x.entry = current;
			x.columns = b ? b.columns : current.columns;
			x.formats = b ? b.formats : null;
			x.values = serialize(current.oids, built, current);
			return run$1(x, name);
		}
		if (x.retried) {
			x.verify = true;
			parse$1(out, "", statement.text, built.oids);
			describe(out, "S", "");
			flush(out);
			x.describing = true;
			return;
		}
		const typed = !inferred(built);
		name && (x.fresh = Entry(name, x, typed ? built.oids : null));
		current && close(out, "S", name);
		parse(x, name, statement.text, built.oids);
		describe(out, "S", name);
		if (!typed && !loose(x, built)) {
			flush(out);
			x.describing = true;
			return;
		}
		x.learn = true;
		x.values = typed ? serialize(built.oids, built, x.fresh || {}) : untyped(built);
		run$1(x, name);
	}
	function binaries(entry) {
		if (entry.binaryOf === entry.columns) return entry.binary;
		const columns = entry.columns, formats = new Array(columns.length);
		let binary = null;
		for (let i = 0; i < columns.length; i++) {
			const decode = events.binary(columns[i].type);
			formats[i] = decode ? 1 : 0;
			decode && ((binary || (binary = columns.slice()))[i] = {
				...columns[i],
				decode
			});
		}
		entry.binaryOf = columns;
		return entry.binary = binary && {
			columns: binary,
			formats
		};
	}
	function loose(x, built) {
		if (!events.plain || x.query.cursorFn || x.streaming) return false;
		const { oids, values } = built;
		for (let i = 0; i < oids.length; i++) if (!oids[i] && values[i] !== null && !(typeof values[i] === "number" && isFinite(values[i]))) return false;
		return x.loose = true;
	}
	function untyped(built) {
		const { oids, values } = built, out = new Array(values.length);
		for (let i = 0; i < values.length; i++) out[i] = values[i] === null ? null : oids[i] ? events.serializer(oids[i])(values[i]) : "" + values[i];
		return out;
	}
	function parse(x, name, text, oids) {
		parse$1(out, name, text, oids);
		x.parses.push(name);
	}
	function run$1(x, name) {
		const mark = out.length;
		try {
			x.nosync ? (bind(out, x.portal, name, x.values, void 0, x.formats || void 0), execute(out, x.portal, x.rows)) : run(out, x.portal, name, x.values, x.rows, x.flushing, x.formats);
		} catch (error) {
			out.truncate(mark);
			throw error;
		}
		x.flushing || (x.synced = true);
		const oids = x.entry ? x.entry.oids : x.params || (x.loose ? null : x.query.wire.built.oids);
		oids ? debug(x.statement.text, x.values, oids) : x.later = true;
	}
	function logged(item, oids) {
		item.later && oids && (item.later = false, debug(item.statement.text, item.values, oids));
	}
	function usable(entry, statement) {
		return entry.oids !== null && (entry.state === "parsing" || entry.state === "ready" && entry.version === statement.version);
	}
	function learned(entry, statement) {
		const shape = entry.oids.join() + ":" + entry.columns.map((x) => x.type).join();
		if (statement.shape !== shape) {
			statement.shape === void 0 || statement.version++;
			statement.shape = shape;
		}
		entry.version = statement.version;
	}
	function inferred(built) {
		for (let i = 0; i < built.oids.length; i++) if (!built.oids[i]) return true;
		return false;
	}
	function serialize(oids, built, cache) {
		const serializers = cache.serializers || (cache.serializers = oids.map(events.serializer)), values = built.values, out = new Array(values.length);
		for (let i = 0; i < values.length; i++) {
			out[i] = values[i] === null ? null : serializers[i](values[i]);
			out[i] === null || out[i] === void 0 || typeof out[i] === "string" || out[i] instanceof Uint8Array || Buffer.byteLength(out[i]);
		}
		return out;
	}
	function transaction() {
		return !!connection.lease && connection.lease.kind === "transaction";
	}
	function described(x) {
		x.describing = false;
		x.described = true;
		const { built } = x.query.wire, name = x.statement.name, params = x.params || [], columns = x.columns || [];
		try {
			if (x.verify) {
				const previous = x.previous;
				if (previous && same(previous, params, columns)) {
					if (x.original) {
						x.own = x.original;
						return sync$1(x);
					}
				} else if (previous) {
					stale(previous);
					x.statement.version++;
				}
				x.values = serialize(params, built, {});
				return run$1(x, "");
			}
			const entry = x.entry;
			entry && (entry.oids = params, entry.columns = columns, learned(entry, x.statement));
			x.values = serialize(params, built, entry || {});
			run$1(x, name);
		} catch (error) {
			x.own = error;
			x.batch ? (parse$1(out, "", refused), x.parses.push(""), abort(x)) : sync$1(x, !!connection.lease);
		}
	}
	function same(entry, params, columns) {
		const a = entry.oids || [], b = entry.columns;
		return !!b && a.length === params.length && params.every((x, i) => x === a[i]) && b.length === columns.length && columns.every((x, i) => x.type === b[i].type);
	}
	function describe$1(statement, oids, query) {
		return new Promise((resolve, reject) => {
			const x = Exchange("describe", null, connection.lease, (x) => {
				parse$1(out, "", statement.text, oids);
				describe(out, "S", "");
				sync$1(x);
			});
			x.for = query || null;
			x.resolve = resolve;
			x.reject = reject;
			queue(x);
		});
	}
	function simple(query$1, sql) {
		const x = Exchange("simple", query$1, connection.lease, (x) => {
			debug(sql, [], []);
			query(out, sql);
			x.synced = true;
		});
		x.text = sql;
		x.results = [];
		x.ends = ending.test(sql);
		x.streaming = x.open = !!query$1.streaming;
		options.scheduler && cost(x);
		queue(x);
	}
	function local(query, error) {
		queue(Exchange("query", query, connection.lease, () => {
			throw error;
		}));
	}
	function cancel(query) {
		if (query.parts) return cancelBatch(query);
		if (stash && sent[0] && sent[0].query === query) {
			sent[0].own = Errors.generic("57014", "canceling statement due to user request");
			go();
			return Promise.resolve();
		}
		if (running.has(query) || sent[0] && sent[0].query === query && sent[0].awaiting) return query.aborted = Errors.generic("57014", "canceling statement due to user request"), Promise.resolve();
		const i = pending.findIndex((x) => x.query === query || x.for === query);
		if (i !== -1) {
			const [x] = pending.splice(i, 1);
			x === fence && (fence = null);
			x.cost >= 5 && notables--;
			settleError(x, Errors.generic("57014", "canceling statement due to user request"));
			release();
			return Promise.resolve();
		}
		const x = sent.find((x) => x.query === query || x.for === query);
		if (!x) return Promise.resolve();
		if (x === sent[0] && x.completed) return expect(x), Promise.resolve();
		if (x === sent[0] && (query.active || x.for)) return cancelling(x);
		quiet(x);
		return new Promise((resolve, reject) => x.cancel = {
			resolve,
			reject
		});
	}
	function turn(x) {
		x.silence && (timers.clearTimeout(x.silence), x.silence = null);
		const go = () => {
			x.silence = null;
			if (closed || x.done || sent[0] !== x) return x.cancel.resolve();
			if (x.completed) return expect(x), x.cancel.resolve();
			cancelling(x).then(x.cancel.resolve, x.cancel.reject);
		};
		x.query && x.query.timedOut && options.query_timeout ? x.silence = timers.setTimeout(go, options.query_timeout * 1e3) : defer(go);
	}
	function quiet(x) {
		if (!options.cancel_timeout || x.silence) return;
		const ms = options.cancel_timeout * 1e3, check = () => {
			x.silence = null;
			const query = x.query || x.for;
			if (closed || x.done || !query || query.settled) return;
			const idle = timers.now() - heard;
			idle >= ms ? destroy(Errors.generic("CANCEL_UNANSWERED", "The server sent nothing within cancel_timeout (" + options.cancel_timeout + " seconds) while a canceled query waited, so whether it ran is unknown")) : x.silence = timers.setTimeout(check, ms - idle);
		};
		x.silence = timers.setTimeout(check, ms);
	}
	function cancelling(x) {
		expect(x);
		return ready.cancel();
	}
	function expect(x) {
		options.cancel_timeout && !x.unanswered && (x.unanswered = timers.setTimeout(() => unanswered(x), options.cancel_timeout * 1e3));
	}
	function unanswered(x) {
		x.unanswered = null;
		const query = x.batch ? x.batch.query : x.query || x.for;
		if (closed || x.done && !x.batch || !query || query.settled) return;
		destroy(Errors.generic("CANCEL_UNANSWERED", "The server did not answer within cancel_timeout (" + options.cancel_timeout + " seconds) after a query was canceled, so whether it ran is unknown"));
	}
	function answered(x) {
		x.silence && (timers.clearTimeout(x.silence), x.silence = null);
		x.unanswered && (!x.batch || x.batch.query.settled) && (timers.clearTimeout(x.unanswered), x.unanswered = null);
	}
	function cancelBatch(query) {
		const x = sent.find((x) => x.batch && x.batch.query === query);
		if (x) return x === sent[0] ? cancelling(x) : new Promise((resolve, reject) => x.cancel = {
			resolve,
			reject
		});
		const first = pending.find((x) => x.batch && x.batch.query === query);
		if (first) {
			first.own = Errors.generic("57014", "canceling statement due to user request");
			first.write = () => {
				throw first.own;
			};
		}
		return Promise.resolve();
	}
	function close$1() {
		closing || (closing = new Promise((r) => {
			connection.onended = r;
			idle() && terminate();
		}));
		return closing;
	}
	function idle() {
		return sent.length === 0 && pending.length === 0;
	}
	function terminate() {
		if (closed) return connection.onended && connection.onended();
		flush$1();
		socket.end(Terminate());
	}
	function destroy(error) {
		closing || (closing = Promise.resolve());
		socket.destroy(error);
	}
	function onclose(error) {
		if (closed) return;
		out.take();
		blocker = null;
		fence = null;
		notables = 0;
		const head = sent[0], failed = head && head.error && head.error.severity === "FATAL" ? head.error : null, fatal = connection.fatal || failed;
		connection.uncertain = !!(fatal && head && head.ends);
		closed = Errors.connection(closing ? "CONNECTION_DESTROYED" : "CONNECTION_CLOSED", options, ready.host, ready.port);
		closed.cause = fatal || error || void 0;
		sent.concat(pending).forEach((x) => x.cancel && x.cancel.resolve());
		sent.splice(0).forEach((x) => {
			x.stream && x.stream.destroy(closed);
			x.own ? settle(x) : failed ? settleError(x, x === head ? failed : copy(failed)) : settleError(x, copy(closed));
		});
		pending.splice(0).forEach((x) => x.own ? settle(x) : settleError(x, copy(closed)));
		running.forEach((query) => query.settled || query.reject(decorate(query, copy(closed))));
		running.clear();
		open.clear();
		connection.onended && connection.onended();
		events.onclose(connection, closed);
	}
	function decorate(query, error) {
		return queryError(error, query, options.debug);
	}
	function settleError(x, error) {
		answered(x);
		x.kind === "describe" ? x.reject(error) : x.query && !x.query.settled && x.query.reject(decorate(x.query, error));
	}
	function debug(text, values, oids) {
		typeof options.debug === "function" && options.debug(connection.id, text, values, oids);
	}
	function wrote(x) {
		const trace = x.trace;
		traced++;
		trace.query = x.text || x.statement.text;
		trace.statement = x.statement ? x.statement.name : "";
		trace.parameters = options.debug ? x.query.parameters : void 0;
		trace.connection = connection.id;
		trace.host = connection.host;
		trace.port = connection.port;
		trace.sent = now();
	}
	function first() {
		const x = sent[0];
		x && x.trace && x.trace.firstByte === null && (x.trace.firstByte = now());
	}
	function frame(type, x, start, end) {
		if (!events.typed && stash === null && (type === 84 || type === 116) && events.unknown(type === 84 ? rowDescription(x, start, end, oidOf) : parameterDescription(x, start))) {
			stash = {
				type,
				x: Buffer.from(x.subarray(start, end))
			};
			frames.pause();
			return events.need(connection);
		}
		dispatch(type, x, start, end);
	}
	function go() {
		if (!stash) return;
		const { type, x } = stash;
		dispatch(type, x, 0, x.length);
		stash = null;
		frames.resume();
	}
	function dispatch(type, x, start, end) {
		traced && first();
		try {
			type === 68 ? DataRow(x, start) : type === 100 ? CopyData(x, start, end) : type === 90 ? ReadyForQuery(x, start) : type === 67 ? CommandComplete(x, start, end) : type === 50 ? BindComplete() : type === 49 ? ParseComplete() : type === 51 || (type === 116 ? ParameterDescription(x, start) : type === 84 ? RowDescription(x, start) : type === 110 ? NoData() : type === 69 ? ErrorResponse(x, start, end) : type === 115 ? PortalSuspended() : type === 73 ? EmptyQueryResponse() : type === 65 ? NotificationResponse(x, start) : type === 78 ? NoticeResponse(x, start, end) : type === 83 ? ParameterStatus(x, start) : type === 71 ? CopyInResponse() : type === 72 ? CopyOutResponse() : type === 87 ? CopyBothResponse() : type === 99 ? CopyDone() : type === 86 ? unsupported("FunctionCallResponse") : type === 118 && unsupported("NegotiateProtocolVersion"));
		} catch (error) {
			const x = sent[0];
			x ? fail(x, error) : destroy(error);
		}
		blocker && !holds(blocker) && (blocker = null, release());
		out.length && schedule();
	}
	function fail(x, error) {
		x.error = x.error || error;
		x.describing = false;
		x.open = false;
		x.batch ? abort(x) : sync$1(x);
	}
	function unsupported(x) {
		sent[0] && fail(sent[0], Errors.notSupported(x));
	}
	function ParseComplete() {
		const x = sent[0], name = x.parses.shift();
		name && x.entry && x.entry.name === name && x.entry.owner === x && x.entry.state === "parsing" && (x.entry.state = "ready");
	}
	function BindComplete() {
		const x = sent[0];
		x.bound = true;
		if (!x.columns && x.entry) {
			x.columns = x.entry.columns;
			x.result.columns = x.columns;
		}
	}
	function ParameterDescription(x, start) {
		const item = sent[0];
		item.params = parameterDescription(x, start);
		item.loose && item.entry && item.entry.owner === item && item.entry.oids === null && (item.entry.oids = item.params);
		logged(item, item.params);
	}
	function RowDescription(x, start) {
		received(sent[0], rowDescription(x, start, 0, column));
	}
	function NoData() {
		received(sent[0], []);
	}
	function received(x, columns) {
		if (x.kind === "simple" && x.result.command !== null) {
			x.results.push(x.result);
			x.result = new Result();
		}
		x.columns = columns;
		x.result.columns = columns;
		if (x.learn) {
			x.learn = false;
			x.entry && x.entry.owner === x && (x.entry.columns = columns, learned(x.entry, x.statement));
		}
		x.describing && described(x);
	}
	function column(name, table, number, type) {
		const parser = events.parser(type);
		return {
			name: transform.column.from ? transform.column.from(name) : name,
			parser: parser.identity ? null : parser,
			decode: events.decoder(type, parser),
			table,
			number,
			type
		};
	}
	function DataRow(x, start) {
		const item = sent[0], { query } = item, raw = query.isRaw, from = raw !== true ? transform.value.from : null, shape = item.shaped === item.columns ? item.reader : (item.shaped = item.columns, item.reader = query.ownParsers && raw !== true ? Parsed(item.columns, query.ownParsers) : Rows(item.columns)), columns = shape.columns, fast = raw !== true && read(shape, !!raw, text, from), n = columns.length, result = item.result;
		let row;
		if (fast) row = fast(x, start + 7);
		else {
			row = raw ? new Array(n) : {};
			let i = start + 7;
			for (let j = 0; j < n; j++) {
				const length = x[i] << 24 | x[i + 1] << 16 | x[i + 2] << 8 | x[i + 3], column = columns[j];
				i += 4;
				let value = null;
				if (length !== -1) {
					value = raw === true ? Buffer.from(x.subarray(i, i + length)) : column.decode ? column.decode(x, i, i + length) : column.parser ? column.parser(text(x, i, i + length)) : text(x, i, i + length);
					i += length;
				}
				from && (value = from(value, column));
				raw ? row[j] = value : column.name === "__proto__" ? own(row, column.name, value) : row[column.name] = value;
			}
		}
		const out = transform.row.from ? transform.row.from(row) : row;
		query.forEachFn ? query.forEachFn(out, result) : result[result.length] = out;
	}
	function CommandComplete(x, start, end) {
		const item = sent[0], { command, count } = commandComplete(x, start, end), result = item.result;
		result.command = command;
		result.count = count;
		result.state = connection.backend;
		result.statement = item;
		item.query && (item.query.source = item);
		item.kind === "simple" || (result.columns = result.columns || item.columns);
		item.final && (item.stream && Object.assign(item.stream, {
			count,
			command
		}), item.final(), item.final = null);
		item.kind !== "simple" && (item.completed = true);
		if (item.kind === "simple") {
			item.results.push(item.result);
			item.result = new Result();
			return;
		}
		if (item.rows) {
			item.finished = true;
			item.flushing && sync$1(item);
			if (result.count || result.length) (item.last = new Promise((r) => r(item.query.cursorFn(result)))).catch(noop$2);
		}
		item.nosync && !item.error && part(item);
	}
	function unsafe(item) {
		const error = () => Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1");
		rolling = true;
		item.own = error();
		sent.forEach((x) => x.kind !== "local" && (x.own = error()));
		pending.unshift(Exchange("internal", null, null, (x) => (query(out, "rollback"), x.synced = true)));
	}
	function EmptyQueryResponse() {
		const item = sent[0];
		item.kind === "simple" && (item.results.push(item.result), item.result = new Result());
		item.nosync && !item.error && part(item);
	}
	async function PortalSuspended() {
		const item = sent[0];
		if (!item.flushing) return item.suspended = true;
		try {
			item.awaiting = true;
			const next = await item.query.cursorFn(item.result);
			item.awaiting = false;
			item.result = new Result();
			if (closed || item.synced || sent[0] !== item) return;
			if (item.query.aborted) throw item.query.aborted;
			next === CLOSE ? (close(out, "P", ""), sync$1(item)) : (execute(out, "", item.rows), flush(out), schedule());
		} catch (error) {
			item.awaiting = false;
			if (closed || item.synced || sent[0] !== item) return;
			fail(item, error);
		}
		refresh();
	}
	function ErrorResponse(x, start, end) {
		const item = sent[0], error$1 = Errors.postgres(error(x, start, end));
		if (!item) return connection.fatal = error$1;
		item.stream && item.stream.destroy(error$1);
		item.final && (item.final(error$1), item.final = null);
		fail(item, error$1);
	}
	function ReadyForQuery(x, start) {
		status = readyForQuery(x, start);
		frames.own(false);
		const item = sent.shift();
		options.scheduler && timed(item);
		item.done = true;
		item.open = false;
		item.trace && traced--;
		item.kind === "internal" && (rolling = false);
		status !== "I" && !rolling && !item.lease && !connection.lease && options.max !== 1 && unsafe(item);
		blocker === item && (blocker = null);
		settle(item);
		item.entry && item.entry.owner === item && (item.entry.owner = null);
		while (sent.length && sent[0].kind === "local") settle(sent.shift());
		release();
		const next = sent[0];
		if (next && next.query) {
			next.query.active = true;
			next.cancel && turn(next);
		}
		closing && idle() && terminate();
		events.onready(connection);
	}
	function settle(x) {
		answered(x);
		settling(x);
		x.batch && answered(x);
	}
	function settling(x) {
		if (x.kind === "internal") return;
		if (x.kind === "describe") return x.error ? x.reject(x.error) : x.resolve({
			params: x.params || [],
			columns: x.columns
		});
		const { query } = x, cursor = x.origin || (x.portal ? x : null);
		cursor && (x.own || x.error || !x.suspended) && unfence(cursor);
		if (x.own) return query.reject(decorate(query, x.own));
		if (x.error) return failed(x);
		if (x.suspended) return suspended(x);
		x.last ? x.last.then(() => query.settled || finish(x), (error) => query.settled || query.reject(decorate(query, error))) : query.settled || finish(x);
	}
	function unfence(cursor) {
		if (!open.delete(cursor) || open.size || !fence) return;
		fence = null;
		release();
	}
	function failed(x) {
		const entry = x.kind === "query" ? x.entry : null;
		const parsing = x.fresh || entry && entry.owner === x && entry.state === "parsing";
		if (x.error.code === "42P05" && x.kind === "query" && x.statement.name && parsing) {
			entry && drop(entry);
			x.statement.name += "_";
			return retryable(x) ? again(x, null) : settleError(x, x.error);
		}
		if (!entry) return settleError(x, x.error);
		if (entry.owner === x && entry.state === "parsing") return drop(entry), settleError(x, x.error);
		if (x.error.code === "26000") {
			drop(entry);
			return retryable(x) ? again(x, null) : settleError(x, x.error);
		}
		if (x.bound) return settleError(x, x.error);
		if (retryable(x)) return again(x, x.error);
		stale(entry);
		settleError(x, x.error);
	}
	function stale(entry) {
		prepared.get(entry.name) === entry && (entry.state = "stale");
	}
	function retryable(x) {
		return !x.retried && !x.batch && !x.cancel && !x.query.cancelled && !x.query.cursorFn && !x.streaming && x.lease === connection.lease && status === "I" && !closing && (sent.length === 0 || !x.lease && options.max !== 1);
	}
	function again(x, original) {
		const retry = Exchange("query", x.query, x.lease, extended);
		retry.statement = x.statement;
		retry.ends = x.ends;
		retry.retried = true;
		retry.original = original;
		retry.previous = x.entry;
		retry.trace = x.trace;
		retry.cost = x.cost;
		if (sent.length) return queue(retry);
		pending.unshift(retry);
		release();
	}
	function suspended(x) {
		const cursor = x.origin || x, { query } = x;
		running.add(query);
		new Promise((r) => r(query.cursorFn(x.result))).then((next) => {
			running.delete(query);
			if (query.settled) return unfence(cursor);
			queue(step(cursor, next === CLOSE || !!query.aborted, query.aborted || null));
		}, (error) => {
			running.delete(query);
			if (query.settled) return unfence(cursor);
			queue(step(cursor, true, error));
		});
	}
	function step(cursor, end, failure) {
		const x = Exchange("step", cursor.query, cursor.lease, stepped);
		x.origin = cursor;
		x.statement = cursor.statement;
		x.entry = cursor.entry;
		x.columns = cursor.columns;
		x.portal = cursor.portal;
		x.rows = cursor.rows;
		x.end = end;
		x.failure = failure;
		return x;
	}
	function stepped(x) {
		const cursor = x.origin;
		if (connection.lease !== cursor.lease || cursor.epoch !== epoch) {
			if (x.failure) throw x.failure;
			if (!x.end) throw outlived();
			return skip;
		}
		x.own = x.failure;
		x.end ? close(out, "P", x.portal) : execute(out, x.portal, x.rows);
		sync$1(x);
	}
	function outlived() {
		return Errors.generic("UNSAFE_TRANSACTION", "The cursor outlived its transaction");
	}
	function finish(x) {
		const { query } = x;
		if (x.kind === "simple") {
			x.result.command !== null && x.results.push(x.result);
			const results = x.results;
			return query.resolve(results.length > 1 ? results : results[0] || x.result);
		}
		query.resolve(x.result);
	}
	function NotificationResponse(x, start) {
		const { pid, channel, payload } = notification(x, start);
		events.onnotify && guard(events.onnotify, channel, payload, pid);
	}
	function guard(fn, ...xs) {
		try {
			fn(...xs);
		} catch (error) {}
	}
	function NoticeResponse(x, start, end) {
		const notice = error(x, start, end);
		listened(channels.notice) && channels.notice.publish({
			notice,
			connection: connection.id,
			host: connection.host,
			port: connection.port,
			database: options.database
		});
		options.onnotice ? guard(options.onnotice, notice) : options.onnotice === false || console.log(notice);
	}
	function ParameterStatus(x, start) {
		const [k, v] = parameterStatus(x, start);
		connection.parameters[k] = v;
		events.onparameter && guard(events.onparameter, k, v);
	}
	function writeData(chunk, callback) {
		copyData(out, chunk);
		flush$1() ? callback() : drained = callback;
	}
	function writable(item) {
		return {
			autoDestroy: true,
			write(chunk, encoding, callback) {
				writeData(chunk, callback);
			},
			destroy(error, callback) {
				callback(error);
				item.stream = null;
				if (!item.copied && !closed && !item.error) {
					copyFail(out, (error || "The COPY stream was destroyed") + "");
					item.copied = true;
					item.open = false;
					schedule(true);
					refresh();
				}
			},
			final(callback) {
				copyDone(out);
				item.copied = true;
				item.open = false;
				item.final = callback;
				schedule(true);
				refresh();
			}
		};
	}
	function CopyInResponse() {
		const item = sent[0];
		item.stream = new Stream.Writable(writable(item));
		item.query.resolve(item.stream);
	}
	function readable(item) {
		return () => {
			item.wanted = true;
			if (!frames.paused) return;
			frames.resume();
			frames.paused || socket.resume();
		};
	}
	function abandoned(item) {
		return (error, callback) => {
			callback(error);
			if (!item.stream) return;
			item.stream = null;
			if (frames.paused) {
				frames.resume();
				frames.paused || socket.resume();
			}
		};
	}
	function CopyOutResponse() {
		const item = sent[0];
		item.stream = new Stream.Readable({
			read: readable(item),
			destroy: abandoned(item)
		});
		item.open = false;
		frames.own(true);
		item.query.resolve(item.stream);
	}
	function CopyBothResponse() {
		const item = sent[0];
		item.stream = new Stream.Duplex({
			...writable(item),
			read: readable(item)
		});
		frames.own(true);
		item.query.resolve(item.stream);
	}
	function CopyData(x, start, end) {
		const item = sent[0];
		if (!item.stream) return;
		item.wanted = false;
		if (!item.stream.push(frames.owns(x) ? x.subarray(start + 5, end) : Buffer.from(x.subarray(start + 5, end))) && !item.wanted) {
			frames.pause();
			socket.pause();
		}
	}
	function CopyDone() {
		frames.own(false);
		const item = sent[0];
		item.stream && item.stream.push(null);
		item.stream = null;
	}
}
function oidOf(name, table, number, type) {
	return type;
}
function copy(error) {
	const x = Object.create(Object.getPrototypeOf(error), Object.getOwnPropertyDescriptors(error));
	Object.defineProperty(x, "stack", {
		value: error.stack,
		writable: true,
		configurable: true
	});
	[
		"query",
		"parameters",
		"args",
		"types"
	].forEach((k) => delete x[k]);
	return x;
}
function key(name) {
	const x = JSON.stringify(String(name));
	return name === "__proto__" ? "[" + x + "]" : x;
}
function own(row, name, value) {
	Object.defineProperty(row, name, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function Exchange(kind, query, lease, write) {
	return {
		kind,
		query,
		lease,
		write,
		trace: query && query.trace || null,
		statement: null,
		text: "",
		entry: null,
		fresh: null,
		previous: null,
		parses: [],
		values: null,
		params: null,
		columns: null,
		shaped: null,
		reader: null,
		result: new Result(),
		results: null,
		origin: null,
		portal: "",
		rows: 0,
		end: false,
		failure: null,
		flushing: false,
		streaming: false,
		open: false,
		alone: !!(query && query.alone),
		describing: false,
		learn: false,
		batch: null,
		nosync: false,
		aborted: false,
		flushed: false,
		loose: false,
		gate: false,
		later: false,
		formats: null,
		verify: false,
		synced: false,
		bound: false,
		suspended: false,
		finished: false,
		done: false,
		ends: false,
		epoch: 0,
		retried: false,
		original: null,
		error: null,
		own: null,
		cancel: null,
		unanswered: null,
		silence: null,
		completed: false,
		for: null,
		stream: null,
		copied: false,
		wanted: false,
		final: null,
		resolve: null,
		reject: null,
		cost: void 0
	};
}
function Entry(name, owner, oids) {
	return {
		name,
		owner,
		oids,
		columns: null,
		serializers: null,
		binary: null,
		binaryOf: null,
		state: "parsing",
		version: -1
	};
}
function Rows(columns) {
	let state = states.get(columns);
	if (state === void 0) {
		state = {
			columns,
			seen: 0,
			object: null,
			array: null,
			variants: null,
			compilable: compiles && columns.length <= 512 && !columns.some((x) => String(x.name) === "__proto__")
		};
		states.set(columns, state);
	}
	return state;
}
function Parsed(columns, parsers) {
	const state = Rows(columns), list = columns.map(typeof parsers === "function" ? (c) => parsers(c) || null : (c) => c.type in parsers ? parsers[c.type] || null : c.parser);
	if (list.every((x, i) => x === columns[i].parser)) return state;
	const variants = state.variants || (state.variants = []), found = variants.find((v) => v.list.every((x, i) => x === list[i]));
	if (found) return found.state;
	const variant = {
		list,
		state: Rows(columns.map((c, i) => list[i] === c.parser ? c : {
			...c,
			parser: list[i],
			decode: null
		}))
	};
	variants.length === variety && variants.shift();
	variants.push(variant);
	return variant.state;
}
function read(state, array, text, from) {
	const key = array ? "array" : "object";
	if (state[key] !== null) return state[key];
	if (!state.compilable || ++state.seen < after) return null;
	try {
		return state[key] = compile(state.columns, array, text, from);
	} catch (_) {
		compiles = state.compilable = false;
		return null;
	}
}
function compile(columns, array, text, from) {
	const locals = [], body = ["let l = 0"];
	columns.forEach((c, j) => {
		c.decode ? locals.push("d" + j + " = c[" + j + "].decode") : c.parser && locals.push("p" + j + " = c[" + j + "].parser");
		const value = c.decode ? "d" + j + "(x, i, i + l)" : c.parser ? "p" + j + "(text(x, i, i + l))" : "text(x, i, i + l)";
		body.push("l = (x[i] << 24) | (x[i + 1] << 16) | (x[i + 2] << 8) | x[i + 3]", "i += 4", "let v" + j + " = null", "l !== -1 && (v" + j + " = " + value + ", i += l)", from ? "v" + j + " = from(v" + j + ", c[" + j + "])" : "");
	});
	body.push(array ? "return [" + columns.map((c, j) => "v" + j).join(",") + "]" : "return {" + columns.map((c, j) => key(c.name) + ":v" + j).join(",") + "}");
	return new Function("c", "text", "from", (locals.length ? "const " + locals.join(", ") + "\n" : "") + "return function row(x, i) {\n" + body.filter(Boolean).join("\n") + "\n}")(columns, text, from);
}
// node_modules/postgres/src/pool.js
const begins = /\bbegin\b/i;
const noop$1 = () => {};
const starts = /\bstart\b/gi;
const transaction = /^transaction\b/i;
function Pool(options, types) {
	const { setTimeout, clearTimeout, now } = options.timers, statements = Statements(options.scheduler), connections = /* @__PURE__ */ new Set(), waiting = Queue(), events = {
		parser: types.parser,
		decoder: types.decoder,
		binary: types.binary,
		serializer: types.serializer,
		plain: types.plain,
		onready,
		onclose,
		onnotify: options.onnotify,
		onparameter,
		ontimed,
		typed: options.fetch_types === false,
		unknown: (oids) => !typesLoaded && types.unknown(oids),
		need
	}, work = {
		fast: 0,
		slow: 0,
		at: 0
	};
	const signal = {
		aborted: false,
		sockets: /* @__PURE__ */ new Set()
	}, replacing = [], eager = types.named || !!options.eager_types, paused = /* @__PURE__ */ new Set();
	let opening = 0, ending = null, used = false, endTimer = null, retries = 0, failingSince = null, nextAttempt = 0, retryTimer = null, typesLoaded = options.fetch_types === false, typesError = null, typesFailed = 0, failure = null, typesLoading = false, retryTypes = null, typeRetries = 0, typesFailing = null;
	const pool = {
		query,
		lease,
		cancel,
		end,
		close,
		get stats() {
			return {
				connections: connections.size,
				opening,
				idle: [...connections].filter((x) => x.inflight === 0 && !x.lease).length,
				leased: [...connections].filter((x) => x.lease).length,
				waiting: waiting.length
			};
		}
	};
	return pool;
	function query(q, lease) {
		options.query_timeout && !q.timer && !q.settled && !q.cursorFn && !q.streaming && deadline(q);
		if (ending && !lease) return q.reject(queryError(Errors.connection("CONNECTION_ENDED", options, options.host[0], options.port[0]), q, options.debug));
		if (q.parts) return batch(q, lease);
		let built;
		try {
			built = q.build();
		} catch (error) {
			return unbuilt(q, error, lease);
		}
		const free = !lease && options.max !== 1;
		if (q.options.simple && !built.values.length) {
			const known = (free || options.scheduler) && statements.known(built.text);
			q.alone = free && alone(known);
			options.scheduler && (q.cost = known);
			return place({
				q,
				simple: built.text,
				exclusive: !!q.streaming || q.alone
			}, lease);
		}
		if (q.onlyDescribe) return describeOnly(q, built, lease);
		const statement = statements.get(built, options.prepare && q.options.prepare !== false);
		q.alone = free && alone(statement.live ? statement : statements.known(built.text));
		q.wire = {
			statement,
			built
		};
		options.scheduler && (q.cost = statement.cost);
		place({
			q,
			statement,
			typed: !typesLoaded && unknown(built.oids),
			exclusive: !!q.cursorFn || !!q.streaming || q.alone
		}, lease);
	}
	function unknown(oids) {
		for (let i = 0; i < oids.length; i++) if (oids[i] && !types.known(oids[i])) return true;
		return false;
	}
	function deadline(q) {
		q.timer = setTimeout(() => {
			q.timer = null;
			q.settled || (q.timedOut = true, cancel(q).catch(noop$1));
		}, options.query_timeout * 1e3);
	}
	function batch(q, lease) {
		const parts = q.parts;
		if (!parts.length) return q.resolve([]);
		for (let i = 0; i < parts.length; i++) try {
			parts[i].build();
		} catch (error) {
			error && typeof error === "object" && (error.index = i);
			return unbuilt(q, error, lease);
		}
		parts.forEach((x) => {
			const built = x.built;
			x.wire = {
				statement: statements.get(built, options.prepare && x.options.prepare !== false),
				built
			};
		});
		const run = (c) => (q.connection = c, c.batch(q, parts), q.onwrite && q.onwrite());
		place({
			q,
			run,
			typed: !typesLoaded && parts.some((x) => unknown(x.built.oids))
		}, lease);
	}
	function describeOnly(q, built, lease) {
		const statement = {
			name: "",
			text: built.text,
			oids: built.oids,
			columns: null
		}, run = (c) => (q.connection = c, c.describe(statement, built.oids, q).then(({ params, columns }) => q.resolve({
			string: built.text,
			types: params,
			name: "",
			columns
		}), (error) => q.reject(queryError(error, q, options.debug))), q.onwrite && q.onwrite());
		lease ? run(lease.connection) : place({
			run,
			q,
			reject: (error) => q.reject(queryError(error, q, options.debug))
		});
	}
	function unbuilt(q, error, lease) {
		error = queryError(error, q, options.debug);
		if (!lease || lease.released || lease.connection.closed) return q.reject(error);
		q.connection = lease.connection;
		lease.connection.local(q, error);
		q.onwrite && q.onwrite();
	}
	function place(job, lease) {
		used = true;
		const missing = !lease && retype();
		if (missing) return reject(job, missing);
		if (job.q && job.q.cancelled) return job.q.reject(queryError(Errors.generic("57014", "canceling statement due to user request"), job.q, options.debug));
		if (lease) return lease.connection.closed ? job.q.reject(queryError(lease.connection.closed, job.q, options.debug)) : lease.released ? job.q.reject(queryError(ended(lease), job.q, options.debug)) : run(lease.connection, job);
		if (signal.aborted) return reject(job, Errors.connection("CONNECTION_DESTROYED", options, options.host[0], options.port[0]));
		if (failingFast()) return reject(job, copy(failure.error));
		const c = waiting.length === 0 && pick(job);
		if (c) return run(c, job);
		waiting.push(wait(job));
		drain();
	}
	function wait(job) {
		if (!options.queue_timeout) return job;
		job.timer = setTimeout(() => {
			job.timer = null;
			waiting.remove((x) => x === job) && reject(job, Errors.generic("QUEUE_TIMEOUT", "Waited more than " + options.queue_timeout + " seconds for a connection"));
		}, options.queue_timeout * 1e3);
		typeof job.timer.unref === "function" && job.timer.unref();
		return job;
	}
	function started(job) {
		job.timer && (clearTimeout(job.timer), job.timer = null);
	}
	function run(c, job) {
		started(job);
		hold(c);
		if (job.run) return job.run(c);
		job.q.connection = c;
		job.simple !== void 0 ? c.simple(job.q, job.simple) : c.send(job.q);
		job.q.onwrite && job.q.onwrite();
	}
	function drain() {
		while (waiting.length) {
			const job = waiting.peek(), c = pick(job);
			if (!c && !copying(job)) break;
			waiting.shift();
			!c ? reject(job, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy")) : job.lease ? grant(c, job) : run(c, job);
		}
		waiting.length && listened(channels.pool) && event("wait", null, { waiting: waiting.length });
		grow();
	}
	function plain(job) {
		return !!job.q && !job.lease && !job.exclusive && !job.run;
	}
	function copying(job) {
		if (!job.q || connections.size + opening < options.max || connections.size === 0) return false;
		for (const c of connections) if (!c.copying) return false;
		return true;
	}
	function quiet(c) {
		return c.inflight === 0 || !!c.typing && !c.typing.settled && c.inflight === 1;
	}
	function usable(c) {
		return !c.closed && !c.closing && !c.lease && !c.releasing && !c.retiring && !c.exclusive && !c.loading;
	}
	function pick(job) {
		const statement = job.statement, any = !statement || !statement.name;
		if (!typesLoaded && (eager ? job.lease || job.typed : job.typed)) return eager || need(), null;
		let best = null, soon = false;
		for (const c of connections) {
			c.loading && !c.closed && (soon = true);
			const free = usable(c);
			if (free && quiet(c)) {
				if (any || c.prepared.has(statement.name)) return c;
				best = best && quiet(best) ? best : c;
			} else if (free && !job.lease && !job.exclusive && c.inflight < options.max_pipeline && (!best || c.inflight < best.inflight)) best = c;
		}
		if (best && quiet(best)) return best;
		if (soon || connections.size + opening < options.max && !failingSince) return null;
		best && options.scheduler && job.q && needed(job) && (best = scheduled(job) || best);
		return best && opening && best.inflight >= Math.ceil(waiting.length / (opening + 1)) ? null : best;
	}
	function needed(job) {
		if (!job.q.cost || job.q.cost.est === void 0 || job.q.cost.est >= 5) return true;
		for (const c of connections) if (c.notable) return true;
		return false;
	}
	function scheduled(job) {
		const t = now(), e = job.q.cost ? job.q.cost.est : void 0;
		if (e === void 0 || e < 100) return soonest(t, Infinity, false);
		let heavy = 0;
		for (const c of connections) c.inflight && c.heavy() && heavy++;
		decay(t);
		const reserve = Math.max(1, Math.min(Math.ceil(work.fast / 2e3 * 1.5) + 1, connections.size - Math.ceil(work.slow / 2e3)));
		return heavy < connections.size - reserve ? soonest(t, Infinity, false) : soonest(t, 2 * e, true) || soonest(t, Infinity, false);
	}
	function soonest(t, most, heavy) {
		let best = null, value = Infinity, ties = 0;
		for (const c of connections) {
			const v = usable(c) && c.inflight < options.max_pipeline && (!heavy || c.heavy()) ? c.backlog(t) : Infinity;
			if (v <= most && v < value) best = c, value = v, ties = 1;
			else if (v <= most && v === value && v !== Infinity && Math.random() * ++ties < 1) best = c;
		}
		return best;
	}
	function ontimed(sample, t) {
		decay(t);
		sample < 100 ? work.fast += sample : work.slow += sample;
	}
	function decay(t) {
		const d = Math.exp((work.at - t) / 2e3);
		work.fast *= d;
		work.slow *= d;
		work.at = t;
	}
	function grow() {
		if (ending && waiting.length === 0) return;
		if (failingSince !== null) {
			if (opening || !waiting.length || retryTimer || [...connections].some((x) => x.loading)) return;
			const wait = nextAttempt - now();
			return wait > 0 ? retryTimer = setTimeout(() => (retryTimer = null, grow()), wait) : connect();
		}
		let loading = 0;
		for (const c of connections) c.loading && loading++;
		const wanted = Math.max(Math.min(waiting.length - opening - loading, options.max - connections.size - opening), used && !ending ? Math.min(options.min, options.max) - connections.size - opening : 0);
		for (let i = 0; i < wanted; i++) connect();
	}
	function connect() {
		opening++;
		retryTimer && (clearTimeout(retryTimer), retryTimer = null);
		(options.open || open)(options, signal, replacing.length ? replacing.shift() : 0).then(opened, failed);
	}
	function copy(error) {
		if (!error || typeof error !== "object") return error;
		const x = Object.create(Object.getPrototypeOf(error), Object.getOwnPropertyDescriptors(error));
		Object.defineProperty(x, "stack", {
			value: error.stack,
			writable: true,
			configurable: true
		});
		[
			"query",
			"parameters",
			"args",
			"types"
		].forEach((k) => delete x[k]);
		return x;
	}
	function failingFast() {
		return !!failure && retries > 1 && opening === 0 && now() < nextAttempt && stuck();
	}
	function stuck() {
		for (const c of connections) if (!c.lease) return false;
		return true;
	}
	function opened(ready) {
		opening--;
		if (signal.aborted || ending && waiting.length === 0) {
			ready.socket.destroy();
			return finishing();
		}
		Object.entries(ready.parameters).forEach(([k, v]) => onparameter(k, v));
		const c = Connection(ready, options, events);
		c.index = ready.index || 0;
		connections.add(c);
		lifetime(c);
		listened(channels.pool) && event("open", c);
		typesLoaded || !eager || (typesLoading ? c.loading = true : loadTypes(c));
		c.loading || c.typing || eager && typesLoading || recovered();
		drain();
	}
	function recovered() {
		retries = 0;
		failingSince = null;
		failure = null;
	}
	function need(c) {
		c && paused.add(c);
		if (typesLoaded) return resume();
		if (typesLoading) return;
		typesLoading = true;
		const idle = [...connections].find((x) => !paused.has(x) && usable(x) && x.inflight === 0);
		idle ? fetched(types.load(runner(idle))) : (options.open || open)(options, signal, 0).then((ready) => {
			const c = Connection(ready, options, {
				...events,
				onready: () => {},
				onclose: () => {},
				onparameter: () => {},
				ontimed: () => {},
				need: () => {}
			});
			fetched(types.load(runner(c)).finally(() => c.close()));
		}, (error) => fetched(Promise.reject(error)));
	}
	function fetched(loading) {
		let failure = null;
		loading.then(() => typesLoaded = true, (error) => error instanceof PostgresError ? typesLoaded = true : failure = error).then(() => {
			typesLoading = false;
			events.typed = typesLoaded;
			if (typesLoaded) {
				typeRetries = 0;
				typesFailing = null;
				return resume();
			}
			typesFailing === null && (typesFailing = now());
			typeRetries++;
			if (options.connect_timeout && now() - typesFailing >= options.connect_timeout * 1e3) {
				typeRetries = 0;
				typesFailing = null;
				return [...paused].forEach((x) => {
					paused.delete(x);
					x.destroy(failure || Errors.connection("CONNECTION_CLOSED", options, x.host, x.port));
				});
			}
			const wait = 1e3 * (typeof options.backoff === "function" ? options.backoff(typeRetries) : options.backoff);
			paused.size && (retryTypes = setTimeout(() => (retryTypes = null, need()), wait));
		});
	}
	function resume() {
		const xs = [...paused];
		paused.clear();
		xs.forEach((x) => x.closed || x.go());
		drain();
	}
	function runner(c) {
		return (text) => new Promise((resolve, reject) => {
			const q = new Query$1([text], [], Object.assign(() => {}, { options }), { simple: true });
			q.executed = true;
			q.then(resolve, reject);
			bound(c, q);
			c.simple(q, text);
		});
	}
	function bound(c, q) {
		if (!options.query_timeout) return;
		const timer = setTimeout(() => q.settled || c.cancel(q).catch(noop$1), options.query_timeout * 1e3);
		q.then(() => clearTimeout(timer), () => clearTimeout(timer));
	}
	function retype() {
		if (!typesError) return null;
		if (now() - typesFailed < 1e3) return copy(typesError);
		typesError = null;
		connections.forEach((x) => x.loading = true);
		[...connections].some((x) => !x.closed && (loadTypes(x), true));
		return null;
	}
	function loadTypes(c) {
		hold(c);
		typesLoading = true;
		c.loading = types.named;
		c.typing = null;
		types.load((text) => new Promise((resolve, reject) => {
			const q = new Query$1([text], [], Object.assign(() => {}, { options }), { simple: true });
			q.executed = true;
			q.then(resolve, reject);
			types.named || (c.typing = q);
			bound(c, q);
			c.simple(q, text);
		})).then(() => typesLoaded = true, (error) => error instanceof PostgresError ? typesLoaded = true : error && error.code === "TYPE_NOT_FOUND" && (typesError = error, typesFailed = now())).then(() => {
			typesLoading = false;
			events.typed = typesLoaded;
			c.typing = null;
			connections.forEach((x) => x.loading = !typesLoaded && !typesError);
			(typesLoaded || typesError) && recovered();
			typesError ? waiting.take().forEach((job) => reject(job, copy(typesError))) : typesLoaded || [...connections].some((x) => !x.closed && !x.typing && (loadTypes(x), true));
			drain();
		});
	}
	function failed(error) {
		opening--;
		if (signal.aborted) return finishing();
		attempted(error);
		ending ? finishing() : grow();
	}
	function attempted(error) {
		failingSince === null && (failingSince = now());
		retries++;
		nextAttempt = now() + 1e3 * (typeof options.backoff === "function" ? options.backoff(retries) : options.backoff);
		const transient = !!error && (error.code === "CONNECTION_CLOSED" || error.code === "53300"), expired = options.connect_timeout && now() - failingSince >= options.connect_timeout * 1e3;
		failure = !transient || expired ? { error } : null;
		stuck() && opening === 0 && (failure || ending) && waiting.take().forEach((job, i) => reject(job, i ? copy(error) : error));
	}
	function reject(job, error) {
		started(job);
		job.lease ? job.reject(error) : job.q ? job.q.reject(queryError(error, job.q, options.debug)) : job.reject(error);
	}
	function lifetime(c) {
		const life = typeof options.max_lifetime === "function" ? options.max_lifetime() : options.max_lifetime;
		life && (c.lifeTimer = unref(setTimeout(() => {
			c.retiring = true;
			c.inflight === 0 && !c.lease && c.close();
		}, life * 1e3)));
		idle(c);
	}
	function event(name, c, extra) {
		channels.pool.publish({
			event: name,
			connection: c ? c.id : null,
			host: c ? c.host : null,
			port: c ? c.port : null,
			database: options.database,
			stats: pool.stats,
			...extra
		});
	}
	function idle(c) {
		listened(channels.pool) && event("idle", c);
		if (c.inflight || c.lease) return;
		options.unref_sockets && !c.loading && waiting.length === 0 && c.unref();
		if (!options.idle_timeout) return;
		c.idleSince = now();
		c.idleTimer || (c.idleTimer = unref(setTimeout(() => idled(c), options.idle_timeout * 1e3)));
	}
	function hold(c) {
		options.unref_sockets && c.ref();
	}
	function unref(timer) {
		options.unref_sockets && timer && typeof timer.unref === "function" && timer.unref();
		return timer;
	}
	function idled(c) {
		c.idleTimer = null;
		if (c.inflight || c.lease || c.closed) return;
		if (connections.size <= options.min) return;
		const left = options.idle_timeout * 1e3 - (now() - c.idleSince);
		left >= 1 ? c.idleTimer = unref(setTimeout(() => idled(c), left)) : c.close();
	}
	function onready(c) {
		if (c.releasing) {
			if (c.inflight) return;
			c.releasing = false;
			if (c.status !== "I") return c.close();
		}
		if (c.inflight === 0 && !c.lease && (c.retiring || ending && waiting.length === 0)) return c.close();
		idle(c);
		while (waiting.length > connections.size + opening && usable(c) && c.inflight < options.max_pipeline && plain(waiting.peek())) run(c, waiting.shift());
		waiting.length && !c.lease && c.inflight < options.max_pipeline && drain();
		ending && waiting.length === 0 && finishing();
	}
	function onclose(c, error) {
		connections.delete(c);
		(c.loading || c.typing) && !signal.aborted && attempted(copy(error));
		paused.delete(c);
		ending || replacing.push((c.index + 1) % (options.path ? 1 : options.host.length));
		replacing.length > options.max && replacing.shift();
		c.retired && c.retired.forEach((r) => r());
		c.idleTimer && clearTimeout(c.idleTimer);
		c.lifeTimer && clearTimeout(c.lifeTimer);
		c.lease && c.lease.onclose && c.lease.onclose(error.cause && error.cause.severity === "FATAL" && !c.uncertain ? error.cause : error.code === "CONNECTION_DESTROYED" ? Errors.connection("CONNECTION_CLOSED", options, c.host, c.port) : error);
		options.onclose && options.onclose(c.id);
		listened(channels.pool) && event("close", c, { error });
		connections.size === 0 && opening === 0 && statements.clear();
		drain();
		ending && finishing();
	}
	function onparameter(k, v) {
		options.parameters[k] !== v && (options.parameters[k] = v, options.onparameter && options.onparameter(k, v));
	}
	async function lease(kind) {
		used = true;
		await 1;
		if (ending) throw Errors.connection("CONNECTION_ENDED", options, options.host[0], options.port[0]);
		if (failingFast()) throw copy(failure.error);
		const missing = retype();
		if (missing) throw missing;
		return new Promise((resolve, reject) => {
			waiting.push(wait({
				lease: true,
				kind,
				resolve,
				reject,
				queued: listened(channels.pool) ? now() : 0
			}));
			drain();
		});
	}
	function grant(c, job) {
		started(job);
		hold(c);
		c.idleTimer && (clearTimeout(c.idleTimer), c.idleTimer = null);
		let chain = Promise.resolve(), released = false, lost;
		const closed = new Promise((_, reject) => lost = reject);
		closed.catch(() => {});
		const x = {
			kind: job.kind,
			error: null,
			connection: c,
			closed,
			get released() {
				return released;
			},
			send(q) {
				if (c.closed) return q.reject(queryError(c.closed, q, options.debug));
				if (released) return q.reject(queryError(ended(x), q, options.debug));
				chain = chain.then(() => new Promise((resolve) => {
					q.onwrite = resolve;
					q.then(resolve, resolve);
					query(q, x);
				}));
			},
			release() {
				if (released) return;
				released = true;
				c.lease === x && (c.lease = null);
				listened(channels.pool) && event("release", c, { kind: job.kind });
				if (c.closed) return;
				if (c.inflight) return c.releasing = true;
				c.status === "I" ? onready(c) : c.close();
			},
			onclose(error) {
				x.error = error;
				lost(error);
			}
		};
		c.lease = x;
		listened(channels.pool) && event("lease", c, {
			kind: job.kind,
			waited: job.queued ? now() - job.queued : 0
		});
		job.resolve(x);
	}
	function ended(lease) {
		return Errors.generic("UNSAFE_TRANSACTION", "The " + lease.kind + " has ended");
	}
	function cancel(q) {
		if (waiting.remove((x) => x.q === q && (started(x), true))) {
			q.reject(queryError(Errors.generic("57014", "canceling statement due to user request"), q, options.debug));
			return Promise.resolve();
		}
		if (q.connection) return q.connection.cancel(q);
		q.cancelled = true;
		return Promise.resolve();
	}
	function end({ timeout = null } = {}) {
		if (ending) return ending;
		ending = new Promise((resolve) => {
			pool.ended = resolve;
			timeout !== null && (endTimer = setTimeout(destroy, timeout * 1e3));
			retryTimer && (clearTimeout(retryTimer), retryTimer = null);
			Promise.resolve().then(finishing);
		});
		return ending;
	}
	function finishing() {
		if (!pool.ended) return;
		if (waiting.length === 0) connections.forEach((c) => c.inflight === 0 && !c.lease && c.close());
		if (connections.size === 0 && opening === 0 && waiting.length) {
			const error = Errors.connection("CONNECTION_ENDED", options, options.host[0], options.port[0]);
			waiting.take().forEach((job) => reject(job, error));
		}
		if (connections.size === 0 && (opening === 0 || signal.aborted) && waiting.length === 0) {
			endTimer && clearTimeout(endTimer);
			retryTimer && clearTimeout(retryTimer);
			retryTypes && clearTimeout(retryTypes);
			const resolve = pool.ended;
			pool.ended = null;
			resolve();
		}
	}
	function destroy() {
		endTimer = null;
		signal.aborted = true;
		signal.sockets.forEach((x) => x.destroy());
		const error = Errors.connection("CONNECTION_DESTROYED", options, options.host[0], options.port[0]);
		waiting.take().forEach((job) => reject(job, error));
		connections.forEach((c) => c.destroy());
		connections.size === 0 && finishing();
	}
	function close() {
		used = false;
		return Promise.all([...connections].map((c) => c.lease ? new Promise((r) => (c.retiring = true, (c.retired || (c.retired = [])).push(r))) : c.close()));
	}
}
function Queue() {
	let xs = [], head = 0;
	return {
		get length() {
			return xs.length - head;
		},
		push: (x) => xs.push(x),
		peek: () => xs[head],
		shift() {
			const x = xs[head];
			xs[head++] = void 0;
			head === xs.length ? (xs = [], head = 0) : head > 1024 && head * 2 > xs.length && (xs = xs.slice(head), head = 0);
			return x;
		},
		take() {
			const all = xs.slice(head);
			xs = [];
			head = 0;
			return all;
		},
		remove(fn) {
			for (let i = head; i < xs.length; i++) if (fn(xs[i])) return xs.splice(i, 1), true;
			return false;
		}
	};
}
const limit = 2e3;
function alone(x) {
	return x.alone === void 0 ? x.alone = opens(x.text) : x.alone;
}
function opens(text) {
	if (begins.test(text)) return true;
	starts.lastIndex = 0;
	let match;
	while (match = starts.exec(text)) {
		const from = match.index + 5;
		let i = from;
		while (true) {
			while (i < text.length && /\s/.test(text[i])) i++;
			if (text[i] !== "/" || text[i + 1] !== "*") break;
			const end = text.indexOf("*/", i + 2);
			if (end === -1) return false;
			i = end + 2;
		}
		if (i > from && transaction.test(text.slice(i, i + 12))) return true;
		starts.lastIndex = Math.max(starts.lastIndex, i);
	}
	return false;
}
function Statements(scheduler) {
	const prefix = Math.random().toString(36).slice(2, 10), map = /* @__PURE__ */ new Map(), templates = /* @__PURE__ */ new WeakMap();
	let counter = 1, clock = 0;
	const texts = /* @__PURE__ */ new Map();
	return {
		get,
		clear,
		known
	};
	function known(text) {
		let x = texts.get(text);
		if (x) return x;
		texts.set(text, x = {
			text,
			est: void 0,
			alone: void 0
		});
		texts.size > limit && texts.delete(texts.keys().next().value);
		return x;
	}
	function get(built, prepare) {
		if (!prepare) return unnamed(built.text);
		const tagged = !built.dynamic && (templates.get(built.strings) || set(built.strings)), cached = tagged && tagged.get(built.types);
		if (cached && cached.live) return cached.used = clock++, cached;
		const key = built.types + "\0" + built.text;
		let statement = map.get(key);
		statement ? statement.used = clock++ : statement = add(key, built.text);
		tagged && tagged.set(built.types, statement);
		return statement;
	}
	function unnamed(text) {
		return {
			key: null,
			live: false,
			name: "",
			text,
			ends: void 0,
			shape: void 0,
			version: 0,
			used: 0,
			cost: scheduler ? known(text) : null
		};
	}
	function add(key, text) {
		const statement = {
			key,
			live: true,
			name: prefix + counter++,
			text,
			ends: void 0,
			shape: void 0,
			version: 0,
			used: clock++,
			cost: { est: void 0 },
			alone: void 0
		};
		map.set(key, statement);
		map.size > limit && evict();
		return statement;
	}
	function evict() {
		let oldest = null;
		for (const x of map.values()) (!oldest || x.used < oldest.used) && (oldest = x);
		oldest.live = false;
		map.delete(oldest.key);
	}
	function set(strings) {
		const x = /* @__PURE__ */ new Map();
		templates.set(strings, x);
		return x;
	}
	function clear() {
		map.forEach((x) => x.live = false);
		map.clear();
	}
}
// node_modules/postgres/src/subscribe.js
const noop = () => {};
const statusInterval = 1e4;
const epoch = BigInt(Date.UTC(2e3, 0, 1)) * 1000n;
const lsnToString = (x) => (x >> 32n).toString(16).toUpperCase() + "/" + (x & 4294967295n).toString(16).toUpperCase();
function Subscribe(postgres, options) {
	const subscribers = /* @__PURE__ */ new Map(), persistent = !!options.slot, slot = options.slot || "postgresjs_" + Math.random().toString(36).slice(2), state = {}, timers = options.timers;
	let connection, current = null, ended = false, retries = 0;
	const sql = subscribe.sql = postgres({
		...options,
		query_timeout: 0,
		transform: {
			column: {},
			value: {},
			row: {}
		},
		max: 1,
		idle_timeout: null,
		max_lifetime: null,
		connection: {
			...options.connection,
			replication: "database"
		},
		onclose: () => {
			current && current.stop();
			current = null;
			state.pid = state.secret = void 0;
			ended || restart();
		},
		no_subscribe: true,
		eager_types: true
	});
	const end = sql.end, close = sql.close;
	sql.end = async () => {
		ended = true;
		current && await current.finish();
		return end();
	};
	sql.close = async () => {
		current && await current.finish();
		return close();
	};
	return subscribe;
	async function subscribe(event, fn, onsubscribe = noop, onerror) {
		event = parseEvent(event);
		connection || (connection = init());
		const subscriber = {
			fn,
			onsubscribe,
			onerror
		};
		const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, /* @__PURE__ */ new Set([subscriber])).get(event);
		const unsubscribe = () => {
			fns.delete(subscriber);
			fns.size === 0 && subscribers.delete(event);
		};
		return connection.then(() => {
			onsubscribe();
			return {
				unsubscribe,
				state,
				sql
			};
		}, (error) => {
			unsubscribe();
			connection = null;
			throw error;
		});
	}
	function restart() {
		const delay = Math.min(100 * 2 ** retries++, 1e4);
		connection = new Promise((r) => timers.setTimeout(r, retries === 1 ? 0 : delay)).then(() => ended || init()).then((x) => {
			retries = 0;
			ended || subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
			return x;
		}, (error) => {
			report(error);
			ended || restart();
		});
		connection.catch(noop);
	}
	async function init() {
		if (!options.publications) throw new Error("Missing publication names");
		await sql.unsafe(`CREATE_REPLICATION_SLOT ${slot}${persistent ? "" : " TEMPORARY"} LOGICAL pgoutput NOEXPORT_SNAPSHOT`).catch((error) => {
			if (!persistent || error.code !== "42710") throw error;
		});
		const query = sql.unsafe(`START_REPLICATION SLOT ${slot} LOGICAL 0/0 (proto_version '1', publication_names '${options.publications}')`);
		query.catch(noop);
		current = Stream(await query.writable());
		state.pid = query.state && query.state.pid;
		state.secret = query.state && query.state.secret;
		return current;
	}
	function Stream(stream) {
		const relations = {};
		let acked = 0n, received = 0n, transaction = null, queue = null, failed = false, stopped = false, timer = timers.setTimeout(tick, statusInterval), soon = null;
		stream.on("data", data);
		stream.on("error", (error) => failed || report(error));
		stream.on("close", () => {
			const unexpected = !stopped;
			stop();
			unexpected && close();
		});
		return {
			stop,
			finish
		};
		function data(x) {
			if (x[0] === 119) {
				received = max(received, x.readBigUInt64BE(9));
				parse(x.subarray(25), relations, sql.options.parsers, message, options.transform);
			} else if (x[0] === 107) {
				received = max(received, x.readBigUInt64BE(1));
				idle() && (acked = max(acked, received));
				x[17] && status();
			}
		}
		function message(kind, x, info) {
			if (kind === "begin") return transaction = {
				lsn: x.lsn,
				end: null,
				time: x.time,
				xid: x.xid
			};
			if (kind === "commit") {
				const done = transaction;
				done.end = x.end;
				transaction = null;
				return run(() => commit(done));
			}
			const at = transaction || {};
			info.lsn = at.lsn && lsnToString(at.lsn);
			info.time = at.time;
			info.xid = at.xid;
			run(() => handle(x, info));
		}
		function run(fn) {
			if (failed || stopped) return;
			if (queue) {
				queue = queue.then(() => failed || stopped ? null : fn());
				return;
			}
			const result = fn();
			if (result && typeof result.then === "function") {
				queue = result;
				stream.pause();
				drain();
			}
		}
		function drain() {
			const at = queue;
			at.then(() => {
				if (queue !== at) return queue && drain();
				queue = null;
				stopped || failed || stream.resume();
			}, noop);
		}
		function commit(done) {
			acked = max(acked, done.end);
			persistent && !soon && (soon = timers.setImmediate(() => (soon = null, status())));
		}
		function handle(row, info) {
			const path = info.relation.schema + "." + info.relation.table, key = row && info.relation.keys.length ? "=" + info.relation.keys.map((x) => row[x.name]) : "", pending = [];
			call(pending, "*", row, info);
			call(pending, "*:" + path, row, info);
			key && call(pending, "*:" + path + key, row, info);
			call(pending, info.command, row, info);
			call(pending, info.command + ":" + path, row, info);
			key && call(pending, info.command + ":" + path + key, row, info);
			return pending.length ? Promise.all(pending) : null;
		}
		function call(pending, event, row, info) {
			subscribers.has(event) && subscribers.get(event).forEach((subscriber) => {
				let result;
				try {
					result = subscriber.fn(row, info, event);
				} catch (error) {
					return fail(error, subscriber);
				}
				result && typeof result.then === "function" && pending.push(result.catch((error) => fail(error, subscriber)));
			});
		}
		function fail(error, subscriber) {
			report(error, subscriber);
			if (!persistent || failed) return;
			failed = true;
			queue = null;
			stop();
			stream.destroy(/* @__PURE__ */ new Error("A subscriber failed, so the transaction is delivered again"));
			close();
		}
		function idle() {
			return !transaction && !queue;
		}
		function tick() {
			timer = null;
			if (stopped) return;
			status();
			timer = timers.setTimeout(tick, statusInterval);
		}
		function status() {
			if (stopped || stream.destroyed || !stream.writable) return;
			const x = Buffer.alloc(34);
			x[0] = 114;
			x.writeBigUInt64BE(acked, 1);
			x.writeBigUInt64BE(acked, 9);
			x.writeBigUInt64BE(acked, 17);
			x.writeBigInt64BE(BigInt(Date.now()) * 1000n - epoch, 25);
			stream.write(x);
		}
		async function finish() {
			queue && await queue.catch(noop);
			if (!failed) {
				idle() && (acked = max(acked, received));
				status();
			}
			stop();
			stream.destroyed || await new Promise((r) => (stream.once("close", r), stream.end()));
		}
		function stop() {
			if (stopped) return;
			stopped = true;
			timer && timers.clearTimeout(timer);
			soon && timers.clearImmediate(soon);
			timer = soon = null;
		}
	}
	function report(error, subscriber) {
		const listeners = (subscriber ? [subscriber.onerror] : [...subscribers.values()].flatMap((x) => [...x].map((x) => x.onerror))).filter(Boolean);
		listeners.length ? listeners.forEach((fn) => fn(error)) : console.error("postgres.js: logical replication error", error);
	}
}
function max(a, b) {
	return a > b ? a : b;
}
function Time(x) {
	return new Date(Date.UTC(2e3, 0, 1) + Number(x / 1000n));
}
function parse(x, relations, parsers, message, transform) {
	const type = x[0];
	if (type === 82) {
		let i = 1;
		const r = relations[x.readUInt32BE(i)] = {
			schema: x.toString("utf8", i += 4, i = x.indexOf(0, i)) || "pg_catalog",
			table: x.toString("utf8", i + 1, i = x.indexOf(0, i + 1)),
			columns: Array(x.readUInt16BE(i += 2)),
			keys: []
		};
		i += 2;
		let columnIndex = 0, column;
		while (i < x.length) {
			column = r.columns[columnIndex++] = {
				key: x[i++],
				name: transform.column.from ? transform.column.from(x.toString("utf8", i, i = x.indexOf(0, i))) : x.toString("utf8", i, i = x.indexOf(0, i)),
				type: x.readUInt32BE(i += 1),
				parser: parsers[x.readUInt32BE(i)],
				atttypmod: x.readUInt32BE(i += 4)
			};
			column.key && r.keys.push(column);
			i += 4;
		}
	} else if (type === 66) message("begin", {
		lsn: x.readBigUInt64BE(1),
		time: Time(x.readBigInt64BE(9)),
		xid: x.readUInt32BE(17)
	});
	else if (type === 67) message("commit", {
		lsn: x.readBigUInt64BE(2),
		end: x.readBigUInt64BE(10)
	});
	else if (type === 73) {
		const relation = relations[x.readUInt32BE(1)];
		message("change", tuples(x, relation.columns, 8, transform).row, {
			command: "insert",
			relation
		});
	} else if (type === 68) {
		let i = 1;
		const relation = relations[x.readUInt32BE(i)];
		i += 4;
		const key = x[i] === 75;
		message("change", key || x[i] === 79 ? tuples(x, relation.columns, i += 3, transform).row : null, {
			command: "delete",
			relation,
			key
		});
	} else if (type === 85) {
		let i = 1;
		const relation = relations[x.readUInt32BE(i)];
		i += 4;
		const key = x[i] === 75;
		const xs = key || x[i] === 79 ? tuples(x, relation.columns, i += 3, transform) : null;
		xs && (i = xs.i);
		const { row } = tuples(x, relation.columns, i + 3, transform);
		message("change", row, {
			command: "update",
			relation,
			key,
			old: xs && xs.row
		});
	} else if (type === 84) {
		const count = x.readUInt32BE(1), flags = x[5];
		for (let i = 0; i < count; i++) message("change", null, {
			command: "truncate",
			relation: relations[x.readUInt32BE(6 + i * 4)],
			cascade: (flags & 1) === 1,
			restartIdentity: (flags & 2) === 2
		});
	}
}
function tuples(x, columns, xi, transform) {
	let type, column, value;
	const row = {};
	for (let i = 0; i < columns.length; i++) {
		type = x[xi++];
		column = columns[i];
		value = type === 110 ? null : type === 117 ? void 0 : column.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
		value = transform.value.from ? transform.value.from(value, column) : value;
		column.name === "__proto__" ? own(row, column.name, value) : row[column.name] = value;
	}
	return {
		i: xi,
		row: transform.row.from ? transform.row.from(row) : row
	};
}
function parseEvent(x) {
	const [, command, path, key] = x.match(/^(\*|insert|update|delete|truncate)?:?([^.]+?\.?[^=]+)?=?(.+)?/i);
	return (command || "*") + (path ? ":" + (path.indexOf(".") === -1 ? "public." + path : path) : "") + (key ? "=" + key : "");
}
// node_modules/postgres/src/large.js
function largeObject(sql, oid, mode = 393216) {
	return new Promise(async (resolve, reject) => {
		await sql.begin(async (sql) => {
			let finish;
			!oid && ([{oid}] = await sql`select lo_creat(-1) as oid`);
			const [{ fd }] = await sql`select lo_open(${oid}, ${mode}) as fd`;
			const lo = {
				writable,
				readable,
				close: () => sql`select lo_close(${fd})`.then(finish),
				tell: () => sql`select lo_tell64(${fd})`,
				read: (x) => sql`select loread(${fd}, ${x}) as data`,
				write: (x) => sql`select lowrite(${fd}, ${x})`,
				truncate: (x) => sql`select lo_truncate64(${fd}, ${x})`,
				seek: (x, whence = 0) => sql`select lo_lseek64(${fd}, ${x}, ${whence})`,
				size: () => sql`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
			};
			resolve(lo);
			return new Promise(async (r) => finish = r);
			async function readable({ highWaterMark = 16384, start = 0, end = Infinity } = {}) {
				let max = end - start;
				start && await lo.seek(start);
				return new Stream.Readable({
					highWaterMark,
					async read(size) {
						const l = Math.min(size, max);
						max -= l;
						const [{ data }] = await lo.read(l);
						data.length && this.push(data);
						if (data.length < l || max === 0) this.push(null);
					}
				});
			}
			async function writable({ highWaterMark = 16384, start = 0 } = {}) {
				start && await lo.seek(start);
				return new Stream.Writable({
					highWaterMark,
					write(chunk, encoding, callback) {
						lo.write(chunk).then(() => callback(), callback);
					}
				});
			}
		}).catch(reject);
	});
}
// node_modules/postgres/src/index.js
Object.assign(Postgres, {
	PostgresError,
	toPascal,
	pascal,
	toCamel,
	camel,
	toKebab,
	kebab,
	fromPascal,
	fromCamel,
	fromKebab,
	BigInt: {
		to: 20,
		from: [20],
		parse: (x) => BigInt(x),
		serialize: (x) => x.toString()
	}
});
var src_default = Postgres;
function Postgres(a, b) {
	const options = parseOptions(a, b), types = options.shared_types || Types(options), pool = Pool(options, types), subscribe = options.no_subscribe || Subscribe(Postgres, {
		...options,
		shared_types: types
	}), listener = Listen(options);
	if (types.named && options.fetch_types === false) throw Errors.generic("TYPE_NOT_FOUND", "Custom types given by name need fetch_types to look them up");
	options.resolve = types.resolve;
	options.parsers = view(types.parsers, types.parser);
	options.serializers = view(types.serializers, types.serializer);
	const sql = Sql(handler);
	Object.defineProperties(sql, {
		parameters: {
			get: () => options.parameters,
			enumerable: true
		},
		stats: {
			get: () => pool.stats,
			enumerable: true
		}
	});
	Object.assign(sql, {
		largeObject: largeObject.bind(null, sql),
		subscribe,
		CLOSE,
		END: CLOSE,
		PostgresError,
		options,
		reserve,
		listen: listener.listen,
		begin,
		close,
		end
	});
	Symbol.asyncDispose && (sql[Symbol.asyncDispose] = () => end());
	return sql;
	function handler(q) {
		pool.query(q);
	}
	function Sql(handler) {
		handler.debug = options.debug;
		handler.options = options;
		handler.cancel = handler.cancel || pool.cancel;
		const typed = (value, type) => new Parameter(value, type);
		Object.entries(options.types).forEach(([name, type]) => typed[name] = (x) => new Parameter(x, type.to));
		Object.assign(sql, {
			types: typed,
			typed,
			unsafe,
			identifier: (...parts) => {
				if (!parts.length) throw Errors.generic("NO_PARTS", "sql.identifier needs at least one part");
				return new Identifier(parts.map(identifier).join("."));
			},
			batch,
			notify,
			array,
			json,
			file
		});
		return sql;
		function sql(strings, ...args) {
			return strings && Array.isArray(strings.raw) ? new Query$1(strings, args, handler) : typeof strings === "string" && !args.length ? new Identifier(escapeIdentifier(options.transform.column.to ? options.transform.column.to(strings) : strings)) : new Builder(strings, args);
		}
		function unsafe(string, args = [], options = {}) {
			arguments.length === 2 && !Array.isArray(args) && (options = args, args = []);
			return new Query$1([string], args, handler, {
				prepare: false,
				...options,
				simple: "simple" in options ? options.simple : args.length === 0
			});
		}
		function batch(queries) {
			if (!Array.isArray(queries)) throw Errors.generic("BATCH_NOT_ARRAY", "sql.batch takes an array of queries");
			queries.forEach((x, i) => {
				if (!(x instanceof Query$1)) throw Errors.generic("BATCH_NOT_QUERY", "Item " + i + " of the batch is not a query");
				if (x.executed) throw Errors.generic("BATCH_EXECUTED", "Item " + i + " of the batch has already run");
				if (x.cursorFn || x.cursorRows || x.streaming || x.forEachFn || x.onlyDescribe) throw Errors.generic("BATCH_UNSUPPORTED", "Item " + i + " of the batch is a cursor, stream, forEach or describe");
			});
			const q = new Query$1([], [], handler, {});
			q.parts = queries;
			queries.forEach((x) => (x.executed = true, x.cancel = () => q.cancel()));
			return q;
		}
		async function notify(channel, payload) {
			return await sql`select pg_notify(${channel}, ${"" + payload})`;
		}
		function file(path, args = [], options = {}) {
			arguments.length === 2 && !Array.isArray(args) && (options = args, args = []);
			const fileHandler = (query) => fs.readFile(path, "utf8", (err, string) => {
				if (err) return query.reject(err);
				query.strings = [string];
				handler(query);
			});
			Object.assign(fileHandler, handler);
			return new Query$1([], args, fileHandler, {
				...options,
				simple: "simple" in options ? options.simple : args.length === 0
			});
		}
	}
	function json(x) {
		return new Parameter(x, 3802);
	}
	function array() {
		throw Errors.generic("ARRAY_REMOVED", "sql.array() is removed in v4, pass the array as it is");
	}
	async function reserve() {
		const lease = await pool.lease("reserve"), reserved = Sql(Object.assign((q) => lease.send(q), { cancel: pool.cancel }));
		reserved.release = () => lease.release();
		Symbol.dispose && (reserved[Symbol.dispose] = reserved.release);
		Symbol.asyncDispose && (reserved[Symbol.asyncDispose] = async () => reserved.release());
		return reserved;
	}
	function begin(mode, fn) {
		!fn && (fn = mode, mode = "");
		if (!active(channels.transaction)) return transaction(mode, fn, null);
		const context = {
			mode,
			database: options.database,
			user: userName(options),
			connection: null,
			host: null,
			port: null,
			outcome: null
		};
		let promise;
		start(channels.transaction, context, () => promise = transaction(mode, fn, context));
		return promise.then((result) => (finish(channels.transaction, context, null, result), result), (error) => {
			finish(channels.transaction, context, error);
			throw error;
		});
	}
	async function transaction(mode, fn, context) {
		const lease = await pool.lease("transaction");
		let savepoints = 0, prepare = null;
		context && Object.assign(context, {
			connection: lease.connection.id,
			host: lease.connection.host,
			port: lease.connection.port
		});
		try {
			await control(lease, "begin " + mode.replace(/[^a-z ]/gi, ""));
			const done = scope(fn);
			done.catch(() => {});
			return await Promise.race([done, lease.closed]);
		} finally {
			lease.release();
		}
		async function scope(fn, name, inside, above = () => false, outer = () => false) {
			let uncaught, result, rolled = null, after = null, ending = false;
			if (above()) throw rolledBack();
			const stopped = () => !!rolled || above(), over = () => ending || outer(), scoped = Sql(Object.assign((q) => {
				if (stopped()) return q.reject(after || (after = rolledBack()));
				if (over()) return q.reject(Errors.generic("UNSAFE_TRANSACTION", "The transaction has ended"));
				q.catch((e) => uncaught || (uncaught = e));
				lease.send(q);
			}, { cancel: pool.cancel }));
			scoped.savepoint = savepoint;
			scoped.begin = nested;
			scoped.rollback = () => rolled || (rolled = control(lease, name ? "rollback to " + identifier(name) : "rollback").then(() => {}));
			scoped.prepare = (x) => {
				if (inside) throw Errors.generic("NESTED_TRANSACTION_MODE", "A nested transaction can not be prepared, only the outermost one");
				prepare = x.replace(/[^a-z0-9$\-_. ]/gi, "");
			};
			name && await control(lease, "savepoint " + identifier(name));
			try {
				result = await new Promise((resolve, reject) => {
					const x = fn(scoped);
					Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve, reject);
				});
				if (uncaught && !stopped()) throw uncaught;
				if (lease.connection.closed) throw lease.error || lease.connection.closed;
			} catch (error) {
				ending = true;
				context && !name && (context.outcome = "rollback");
				stopped() ? rolled && await rolled.catch(() => {}) : lease.connection.closed || await control(lease, name ? "rollback to " + identifier(name) : "rollback");
				throw error instanceof PostgresError && error.code === "25P02" && uncaught || error;
			}
			if (stopped()) {
				rolled && await rolled;
				context && !name && (context.outcome = "rollback");
				if (after) throw after;
				return result;
			}
			if (!name) {
				ending = true;
				const done = await control(lease, prepare ? "prepare transaction '" + prepare.replace(/'/g, "''") + "'" : "commit");
				context && (context.outcome = prepare ? "prepare" : done.command === "COMMIT" ? "commit" : "rollback");
				if (!prepare && done.command !== "COMMIT") throw Errors.generic("TRANSACTION_ROLLED_BACK", "The server rolled back the transaction instead of committing it");
			}
			return result;
			function savepoint(name, fn) {
				if (name && Array.isArray(name.raw)) return savepoint((sql) => sql.apply(sql, arguments));
				arguments.length === 1 && (fn = name, name = null);
				return scope(fn, "s" + savepoints++ + (name ? "_" + name : ""), false, stopped, over);
			}
			async function nested(inner, fn) {
				!fn && (fn = inner, inner = "");
				if (normal(inner) && normal(inner) !== normal(mode)) throw Errors.generic("NESTED_TRANSACTION_MODE", "A nested transaction runs in a savepoint, which can not change the transaction mode");
				return scope(fn, "s" + savepoints++, true, stopped, over);
			}
		}
	}
	function rolledBack() {
		return Errors.generic("TRANSACTION_ROLLED_BACK", "The query was not sent, the transaction was rolled back with sql.rollback()");
	}
	function normal(x) {
		return (x || "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
	}
	function identifier(x) {
		return "\"" + x.replace(/"/g, "\"\"") + "\"";
	}
	function control(lease, text) {
		return new Query$1([text], [], Object.assign((q) => lease.send(q), {
			options,
			cancel: pool.cancel
		}), { simple: true }).execute();
	}
	async function end(options) {
		await Promise.all([listener.end(), subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : null]);
		return pool.end(options);
	}
	function close() {
		return pool.close();
	}
}
function Listen(options) {
	const channels = /* @__PURE__ */ new Map();
	let sql = null, closing = null, alive = null;
	return {
		listen,
		end: () => {
			release();
			channels.forEach((channel) => channel.timer && options.timers.clearTimeout(channel.timer));
			return closing || (sql ? closing = sql.end({ timeout: 0 }) : Promise.resolve());
		}
	};
	function connection() {
		return sql || (sql = Postgres({
			...options,
			query_timeout: 0,
			max: 1,
			idle_timeout: null,
			max_lifetime: null,
			unref_sockets: true,
			fetch_types: false,
			no_subscribe: true,
			onclose() {
				if (closing) return;
				channels.forEach((channel, name) => relisten(channel, name));
			},
			onnotify(channel, payload) {
				channels.has(channel) && [...channels.get(channel).listeners].forEach((l) => l.fn(payload));
			}
		}));
	}
	function relisten(channel, name, retries = 0) {
		channel.timer = null;
		channel.result = start(name);
		channel.result.then((result) => {
			Object.assign(channel.state, result.state);
			channel.listeners.forEach((l) => l.onlisten && l.onlisten());
		}, () => {
			if (closing || channels.get(name) !== channel) return;
			retries++;
			const seconds = typeof options.backoff === "function" ? options.backoff(retries) : options.backoff;
			channel.timer = options.timers.setTimeout(() => !closing && channels.get(name) === channel && relisten(channel, name, retries), seconds * 1e3);
		});
	}
	function hold() {
		alive || (alive = setInterval(() => {}, 1 << 30));
	}
	function release() {
		alive && (clearInterval(alive), alive = null);
	}
	function start(name) {
		const x = connection();
		return x`listen ${x.identifier(name)}`;
	}
	async function listen(name, fn, onlisten) {
		const listener = {
			fn,
			onlisten
		};
		if (!channels.has(name)) channels.set(name, {
			listeners: /* @__PURE__ */ new Set(),
			result: start(name),
			state: {}
		});
		const channel = channels.get(name);
		channel.listeners.add(listener);
		hold();
		let result;
		try {
			result = await channel.result;
		} catch (error) {
			channel.listeners.delete(listener);
			channel.listeners.size || channels.delete(name);
			channels.size || release();
			throw error;
		}
		Object.assign(channel.state, result.state);
		listener.onlisten && listener.onlisten();
		return {
			state: channel.state,
			unlisten
		};
		async function unlisten() {
			if (!channel.listeners.delete(listener) || channel.listeners.size) return;
			channels.get(name) === channel && channels.delete(name);
			channels.size || release();
			const x = sql;
			if (closing || !x) return;
			await x`unlisten ${x.identifier(name)}`.catch((e) => {
				if (!/^CONNECTION_/.test(e.code)) throw e;
			});
		}
	}
}
function parseOptions(a, b) {
	if (a && a.shared) return a;
	const env = process.env, o = (!a || typeof a === "string" ? b : a) || {}, url = parseUrl(a), query = [...url.url.searchParams].reduce((a, [b, c]) => (a[b] = c, a), {}), targets = hosts(o, query, url, env), port = o.port || query.port || env.PGPORT || 5432, user = o.user || o.username || url.url.username || env.PGUSERNAME || env.PGUSER || osUsername();
	o.no_prepare && (o.prepare = false);
	query.sslmode && (query.ssl = query.sslmode, delete query.sslmode);
	"timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
	const files = certificates(query);
	const ints = [
		"idle_timeout",
		"connect_timeout",
		"max_lifetime",
		"max_pipeline",
		"backoff",
		"keep_alive",
		"min",
		"queue_timeout",
		"query_timeout",
		"cancel_timeout"
	];
	const defaults = {
		max: globalThis.Cloudflare ? 3 : 10,
		min: 0,
		ssl: false,
		sslnegotiation: null,
		channel_binding: "prefer",
		idle_timeout: null,
		connect_timeout: 30,
		queue_timeout: 0,
		query_timeout: 0,
		cancel_timeout: 5,
		max_lifetime,
		max_pipeline: 100,
		scheduler: true,
		backoff,
		keep_alive: 60,
		prepare: true,
		debug: false,
		fetch_types: true,
		infer: false,
		publications: "alltables",
		slot: null,
		target_session_attrs: null
	};
	const options = {
		host: targets.map((x) => x[0]),
		port: Array.isArray(port) ? port : targets.map((x) => o.port || query.port ? +port : x[1] || +port),
		path: o.path || targets[0][0].indexOf("/") > -1 && targets[0][0] + "/.s.PGSQL." + (targets[0][1] || port),
		database: o.database || o.db || (url.url.pathname || "").slice(1) || env.PGDATABASE || (typeof user === "function" ? null : user),
		user,
		pass: o.pass || o.password || url.url.password || env.PGPASSWORD || "",
		...Object.entries(defaults).reduce((acc, [k, d]) => {
			const value = k in o && o[k] !== void 0 ? o[k] : k in query ? query[k] === "disable" || query[k] === "false" ? false : query[k] : k === "ssl" && env.PGSSLMODE || env["PG" + k.toUpperCase()] || d;
			acc[k] = typeof value === "string" && ints.includes(k) ? +value : value;
			return acc;
		}, {}),
		connection: {
			application_name: env.PGAPPNAME || "postgres.js",
			...o.connection,
			...Object.entries(query).reduce((acc, [k, v]) => (k in defaults || k === "host" || k === "port" || (acc[k] = v), acc), {})
		},
		types: o.types || {},
		target_session_attrs: tsa(o, url.url, env),
		channel_binding: binding(o, url.url, env),
		onnotice: o.onnotice,
		onnotify: o.onnotify,
		onclose: o.onclose,
		onparameter: o.onparameter,
		socket: o.socket,
		onread: o.onread !== false,
		open: o.open,
		no_subscribe: o.no_subscribe,
		unref_sockets: !!o.unref_sockets,
		passfile: passfile(env),
		shared_types: o.shared_types,
		eager_types: !!o.eager_types,
		transform: parseTransform(o.transform || { undefined: void 0 }),
		parameters: {},
		shared: { retries: 0 },
		timers: o.timers || {
			setTimeout,
			clearTimeout,
			setImmediate,
			clearImmediate,
			now: () => performance.now()
		}
	};
	options.ssl = withCertificates(options.ssl, files);
	options.infer = options.infer === true || options.infer === "true";
	options.max === 1 && (options.scheduler = false);
	return options;
}
function certificates(query) {
	const { sslrootcert, sslcert, sslkey } = query, files = {};
	delete query.sslrootcert;
	delete query.sslcert;
	delete query.sslkey;
	sslrootcert === "system" && (query.ssl = "verify-full");
	sslrootcert && sslrootcert !== "system" && (files.ca = fs.readFileSync(sslrootcert));
	sslcert && (files.cert = fs.readFileSync(sslcert));
	sslkey && (files.key = fs.readFileSync(sslkey));
	Object.keys(files).length && !query.ssl && (query.ssl = process.env.PGSSLMODE || process.env.PGSSL || "require");
	return files;
}
function withCertificates(ssl, files) {
	if (!ssl || ssl === "disable" || !Object.keys(files).length) return ssl;
	return typeof ssl === "object" ? {
		...files,
		...ssl
	} : ssl === true || ssl === "true" || ssl === "verify-full" ? files : files.ca ? {
		...files,
		checkServerIdentity: () => void 0
	} : {
		...files,
		rejectUnauthorized: false
	};
}
function tsa(o, url, env) {
	const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
	if (!x || [
		"read-write",
		"read-only",
		"primary",
		"standby",
		"prefer-standby"
	].includes(x)) return x;
	throw new Error("target_session_attrs " + x + " is not supported");
}
function binding(o, url, env) {
	const x = o.channel_binding || url.searchParams.get("channel_binding") || env.PGCHANNELBINDING || "prefer";
	if ([
		"disable",
		"prefer",
		"require"
	].includes(x)) return x;
	throw new Error("channel_binding " + x + " is not supported");
}
function backoff(retries) {
	return (.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
function max_lifetime() {
	return 60 * (30 + Math.random() * 30);
}
function parseTransform(x) {
	const value = typeof x.value === "function" ? x.value : x.value && x.value.from;
	return {
		undefined: x.undefined,
		json: x.json === true || (x.json === false ? false : void 0),
		column: {
			from: typeof x.column === "function" ? x.column : x.column && x.column.from,
			to: x.column && x.column.to
		},
		value: {
			from: x.json === false && value && value.keys ? void 0 : value,
			to: x.value && x.value.to
		},
		row: {
			from: typeof x.row === "function" ? x.row : x.row && x.row.from,
			to: x.row && x.row.to
		}
	};
}
function parseUrl(url) {
	if (!url || typeof url !== "string") return {
		url: { searchParams: /* @__PURE__ */ new Map() },
		targets: []
	};
	const rest = url.slice(url.indexOf("://") + 3), end = rest.search(/[/?]/), authority = end === -1 ? rest : rest.slice(0, end), at = authority.lastIndexOf("@"), userinfo = at === -1 ? "" : authority.slice(0, at), colon = userinfo.indexOf(":"), tail = new URL("postgres://x" + (end === -1 ? "" : rest.slice(end)));
	return {
		url: {
			username: decode(colon === -1 ? userinfo : userinfo.slice(0, colon)),
			password: colon === -1 ? "" : decode(userinfo.slice(colon + 1)),
			pathname: decode(tail.pathname),
			searchParams: tail.searchParams
		},
		targets: authority.slice(at + 1) ? split(authority.slice(at + 1), decode) : []
	};
}
function decode(x) {
	try {
		return decodeURIComponent(x);
	} catch (_) {
		return x;
	}
}
function hosts(o, query, url, env) {
	const given = o.hostname || o.host || query.host;
	if (given) return Array.isArray(given) ? given.map((x) => [x, null]) : split(given);
	if (url.targets.some(([x]) => x)) return url.targets;
	return split(env.PGHOST || "localhost").map(([x, p], i) => [x, p || url.targets[i] && url.targets[i][1] || null]);
}
function split(x, decoded = (x) => x) {
	return x.split(",").filter(Boolean).map((x) => {
		const m = x.match(/^\[([^\]]*)\](?::(\d*))?$/) || x.match(/^([^:]*)(?::(\d*))?$/) || [x, x];
		return [decoded(m[1]), m[2] ? +m[2] : null];
	});
}
function passfile(env) {
	try {
		return env.PGPASSFILE || (process.platform === "win32" ? (env.APPDATA || "") + "\\postgresql\\pgpass.conf" : os.homedir() + "/.pgpass");
	} catch (_) {
		return null;
	}
}
function osUsername() {
	try {
		return os.userInfo().username;
	} catch (_) {
		return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
	}
}
function view(known, get) {
	return new Proxy(known, { get: (x, oid) => typeof oid === "symbol" ? x[oid] : get(+oid) });
}
// server/store-postgres.ts
/** Postgres store (postgres.js). Optional: DATABASE_URL=postgres://… Schema: db/postgres-schema.sql */
const toBooking = (r) => ({
	ref: r.ref,
	createdAt: new Date(r.created_at).toISOString(),
	updatedAt: new Date(r.updated_at).toISOString(),
	status: r.status,
	cabin: r.cabin,
	stayName: r.stay_name,
	checkIn: r.check_in,
	checkOut: r.check_out,
	nights: r.nights,
	adults: r.adults,
	children: r.children,
	addons: r.addons,
	name: r.name,
	phone: r.phone,
	email: r.email,
	notes: r.notes,
	adminNotes: r.admin_notes,
	quote: r.quote,
	total: Number(r.total),
	source: r.source
});
const BOOKING_COLS = "ref, created_at, updated_at, status, cabin, stay_name, check_in::text AS check_in, check_out::text AS check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source";
function storeFor(sql, root) {
	return {
		async getKV(key, fallback) {
			const rows = await sql`SELECT value FROM website.kv WHERE key = ${key}`;
			return rows.length ? rows[0].value : fallback;
		},
		async setKV(key, value) {
			await sql`INSERT INTO website.kv (key, value) VALUES (${key}, ${sql.json(value)})
                ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`;
		},
		async insertBooking(b) {
			await sql`INSERT INTO website.bookings
        (ref, created_at, updated_at, status, cabin, stay_name, check_in, check_out, nights, adults, children, addons, name, phone, email, notes, admin_notes, quote, total, source)
        VALUES (${b.ref}, ${b.createdAt}, ${b.updatedAt}, ${b.status}, ${b.cabin}, ${b.stayName}, ${b.checkIn}, ${b.checkOut}, ${b.nights}, ${b.adults}, ${b.children},
                ${sql.json(b.addons)}, ${b.name}, ${b.phone}, ${b.email}, ${b.notes}, ${b.adminNotes}, ${sql.json(b.quote)}, ${b.total}, ${b.source})`;
		},
		async listBookings(f) {
			const like = f.q ? `%${f.q}%` : null;
			return (await sql.unsafe(`SELECT ${BOOKING_COLS} FROM website.bookings
         WHERE ($1::text IS NULL OR status = $1)
           AND ($2::date IS NULL OR check_out > $2::date)
           AND ($3::date IS NULL OR check_in < $3::date)
           AND ($4::text IS NULL OR ref ILIKE $4 OR name ILIKE $4 OR phone ILIKE $4 OR email ILIKE $4)
         ORDER BY check_in ASC, created_at ASC LIMIT 1000`, [
				f.status ?? null,
				f.from ?? null,
				f.to ?? null,
				like
			])).map(toBooking);
		},
		async getBooking(ref) {
			const rows = await sql.unsafe(`SELECT ${BOOKING_COLS} FROM website.bookings WHERE ref = $1`, [ref]);
			return rows.length ? toBooking(rows[0]) : null;
		},
		async updateBooking(ref, patch) {
			const rows = await sql.unsafe(`UPDATE website.bookings SET status = COALESCE($2, status), admin_notes = COALESCE($3, admin_notes), updated_at = now()
         WHERE ref = $1 RETURNING ${BOOKING_COLS}`, [
				ref,
				patch.status ?? null,
				patch.adminNotes ?? null
			]);
			return rows.length ? toBooking(rows[0]) : null;
		},
		async listBlocks() {
			return (await sql`SELECT id, cabin, from_date::text AS from_date, to_date::text AS to_date, units, reason FROM website.blocks ORDER BY from_date`).map((r) => ({
				id: Number(r.id),
				cabin: r.cabin,
				from: r.from_date,
				to: r.to_date,
				units: r.units,
				reason: r.reason
			}));
		},
		async addBlock(b) {
			await sql`INSERT INTO website.blocks (cabin, from_date, to_date, units, reason) VALUES (${b.cabin}, ${b.from}, ${b.to}, ${b.units}, ${b.reason})`;
		},
		async deleteBlock(id) {
			await sql`DELETE FROM website.blocks WHERE id = ${id}`;
		},
		async activeBookingsBetween(from, to) {
			return (await sql`SELECT ref, cabin, check_in::text AS check_in, check_out::text AS check_out FROM website.bookings
                             WHERE status IN ${sql(ACTIVE_STATUSES)} AND check_in < ${to}::date AND check_out > ${from}::date`).map((r) => ({
				ref: r.ref,
				cabin: r.cabin,
				checkIn: r.check_in,
				checkOut: r.check_out
			}));
		},
		async blocksBetween(from, to) {
			return (await sql`SELECT cabin, from_date::text AS from_date, to_date::text AS to_date, units FROM website.blocks
                             WHERE from_date < ${to}::date AND to_date > ${from}::date`).map((r) => ({
				cabin: r.cabin,
				from: r.from_date,
				to: r.to_date,
				units: r.units
			}));
		},
		async exclusive(cabin, fn) {
			return await root.begin(async (tx) => {
				await tx`SELECT pg_advisory_xact_lock(hashtext(${"yamsar-booking-" + cabin}))`;
				return fn(storeFor(tx, root));
			});
		}
	};
}
function createPostgresStore(url) {
	const sql = src_default(url, {
		prepare: false,
		max: 3,
		idle_timeout: 20,
		connect_timeout: 10
	});
	return storeFor(sql, sql);
}
export { createPostgresStore };

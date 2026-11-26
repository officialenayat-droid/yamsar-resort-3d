import { createRequire as __cr } from "node:module";
__cr(import.meta.url);
import { a as CABIN_IDS, c as parseDay, i as seed, l as quote, n as availability, o as addDaysISO, r as getConfig, s as inr, u as todayIST } from "./chunks/store-DophuWVO.mjs";
import fs, { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http, { STATUS_CODES, ServerResponse, createServer } from "node:http";
import { Http2ServerRequest, constants } from "node:http2";
import { PassThrough, Readable, Stream, Transform, finished, pipeline } from "node:stream";
import process$1, { versions } from "node:process";
import path, { dirname, join, relative, resolve } from "node:path";
import urllib, { fileURLToPath } from "node:url";
import crypto, { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Buffer as Buffer$1 } from "node:buffer";
import EventEmitter$1, { EventEmitter } from "node:events";
import net from "node:net";
import util from "node:util";
import https from "node:https";
import zlib from "node:zlib";
import dns from "node:dns";
import os from "node:os";
import tls from "node:tls";
import { spawn } from "node:child_process";
// server/env.ts
if (existsSync(".env")) process.loadEnvFile(".env");
// node_modules/@hono/node-server/dist/index.mjs
var RequestError = class extends Error {
	constructor(message, options) {
		super(message, options);
		this.name = "RequestError";
	}
};
const nonJoinedHeaders = /* @__PURE__ */ new Set([
	"age",
	"authorization",
	"content-length",
	"content-type",
	"etag",
	"expires",
	"from",
	"host",
	"if-modified-since",
	"if-unmodified-since",
	"last-modified",
	"location",
	"max-forwards",
	"proxy-authorization",
	"referer",
	"retry-after",
	"server",
	"user-agent"
]);
const validHeaderName = /^[!#$%&'*+\-.^_`|~\dA-Za-z]+$/;
const isHttpWhitespace = (code) => code === 9 || code === 10 || code === 13 || code === 32;
const normalizeHeaderValue = (value) => {
	if (!isHttpWhitespace(value.charCodeAt(0)) && !isHttpWhitespace(value.charCodeAt(value.length - 1))) return value;
	let start = 0;
	let end = value.length;
	while (start < end && isHttpWhitespace(value.charCodeAt(start))) start++;
	while (end > start && isHttpWhitespace(value.charCodeAt(end - 1))) end--;
	return value.slice(start, end);
};
const forbiddenHeaderValue = /[\0\r\n]/;
const GlobalHeaders = globalThis.Headers;
const materializeHeaders = (rawHeaders, HeadersCtor = GlobalHeaders) => {
	const headers = new HeadersCtor();
	for (let i = 0; i < rawHeaders.length; i += 2) {
		const name = rawHeaders[i];
		if (!name.startsWith(":")) headers.append(name, rawHeaders[i + 1]);
	}
	return headers;
};
var RequestHeaders = class {
	#incoming;
	#rawHeaders;
	#headers;
	#invalidValue;
	constructor(incoming) {
		this.#incoming = incoming;
		if (incoming instanceof Http2ServerRequest) this.#rawHeaders = incoming.rawHeaders.slice();
	}
	get #lazyRawHeaders() {
		return this.#rawHeaders ??= this.#incoming.rawHeaders.slice();
	}
	get #native() {
		if (!this.#headers) {
			this.#headers = materializeHeaders(this.#lazyRawHeaders);
			this.#rawHeaders = void 0;
		}
		return this.#headers;
	}
	#normalizedName(name) {
		if (typeof name !== "string") return;
		if (!validHeaderName.test(name)) throw new TypeError(`Invalid header name: ${name}`);
		return name.toLowerCase();
	}
	#lookupHttp1(lowerName) {
		const headers = this.#incoming instanceof Http2ServerRequest ? void 0 : this.#incoming.headers;
		if (!headers || nonJoinedHeaders.has(lowerName) || lowerName === "set-cookie" || lowerName === "__proto__") return;
		if (!Object.hasOwn(headers, lowerName)) return null;
		const rawValue = headers[lowerName];
		if (typeof rawValue === "string") {
			const value = normalizeHeaderValue(rawValue);
			return forbiddenHeaderValue.test(value) ? void 0 : value;
		}
	}
	#lookup(rawHeaders, lowerName) {
		const separator = lowerName === "cookie" ? "; " : ", ";
		let value = null;
		for (let i = 0; i < rawHeaders.length; i += 2) {
			const rawName = rawHeaders[i];
			if (rawName.length === lowerName.length && rawName.toLowerCase() === lowerName) {
				const rawValue = normalizeHeaderValue(rawHeaders[i + 1]);
				if (forbiddenHeaderValue.test(rawValue)) {
					this.#invalidValue = true;
					return;
				}
				value = value === null ? rawValue : value + separator + rawValue;
			}
		}
		return value;
	}
	append(name, value) {
		this.#native.append(name, value);
	}
	delete(name) {
		this.#native.delete(name);
	}
	get(name) {
		const lowerName = this.#normalizedName(name);
		if (lowerName && !this.#headers && !this.#invalidValue) {
			const http1Value = this.#lookupHttp1(lowerName);
			if (http1Value !== void 0) return http1Value;
			const value = this.#lookup(this.#lazyRawHeaders, lowerName);
			if (value !== void 0) return value;
		}
		return this.#native.get(name);
	}
	has(name) {
		const lowerName = this.#normalizedName(name);
		if (lowerName && !this.#headers && !this.#invalidValue) {
			const http1Value = this.#lookupHttp1(lowerName);
			if (http1Value !== void 0) return http1Value !== null;
			const value = this.#lookup(this.#lazyRawHeaders, lowerName);
			if (value !== void 0) return value !== null;
		}
		return this.#native.has(name);
	}
	set(name, value) {
		this.#native.set(name, value);
	}
	getSetCookie() {
		return this.#native.getSetCookie();
	}
	keys() {
		return this.#native.keys();
	}
	values() {
		return this.#native.values();
	}
	entries() {
		return this.#native.entries();
	}
	forEach(callback, thisArg) {
		this.#native.forEach((value, key) => {
			callback.call(thisArg, value, key, this);
		});
	}
	[Symbol.iterator]() {
		return this.entries();
	}
};
Object.defineProperty(RequestHeaders.prototype, Symbol.for("nodejs.util.inspect.custom"), { value: function(depth, options, inspectFn) {
	return `Headers (lightweight) ${inspectFn(Object.fromEntries(this), {
		...options,
		depth: depth == null ? null : depth - 1
	})}`;
} });
Object.setPrototypeOf(RequestHeaders.prototype, GlobalHeaders.prototype);
const newHeadersFromIncoming = (incoming) => globalThis.Headers === GlobalHeaders ? new RequestHeaders(incoming) : materializeHeaders(incoming.rawHeaders, globalThis.Headers);
const reValidRequestUrl = /^\/[!#$&-;=?-\[\]_a-z~]*$/;
const reDotSegment = /\/\.\.?(?:[/?#]|$)/;
const reValidHost = /^[a-z0-9._-]+(?::(?:[1-5]\d{3,4}|[6-9]\d{3}))?$/;
const validateRequestTarget = (target) => {
	const backslash = target.indexOf("\\");
	if (backslash !== -1) {
		const query = target.indexOf("?");
		if (query === -1 || backslash < query) throw new RequestError("Backslash in request path");
	}
};
const buildUrl = (scheme, host, incomingUrl) => {
	const url = `${scheme}://${host}${incomingUrl}`;
	if (!reValidHost.test(host)) {
		validateRequestTarget(incomingUrl);
		const urlObj = new URL(url);
		if (urlObj.hostname.length !== host.length && urlObj.hostname !== (host.includes(":") ? host.replace(/:\d+$/, "") : host).toLowerCase()) throw new RequestError("Invalid host header");
		return urlObj.href;
	} else if (incomingUrl.length === 0) return url + "/";
	else {
		if (incomingUrl.charCodeAt(0) !== 47) throw new RequestError("Invalid URL");
		if (!reValidRequestUrl.test(incomingUrl) || reDotSegment.test(incomingUrl)) {
			validateRequestTarget(incomingUrl);
			return new URL(url).href;
		}
		return url;
	}
};
const toRequestError = (e) => {
	if (e instanceof RequestError) return e;
	return new RequestError(e.message, { cause: e });
};
const GlobalRequest = global.Request;
var Request$1 = class Request$1 extends GlobalRequest {
	static [Symbol.hasInstance](instance) {
		if (this === Request$1) return instance instanceof GlobalRequest || Function.prototype[Symbol.hasInstance].call(this, instance);
		return Function.prototype[Symbol.hasInstance].call(this, instance);
	}
	constructor(input, options) {
		if (typeof input === "object" && getRequestCache in input) {
			const hasReplacementBody = options !== void 0 && "body" in options && options.body != null;
			if (input[bodyConsumedDirectlyKey] && !hasReplacementBody) throw new TypeError("Cannot construct a Request with a Request object that has already been used.");
			input = input[getRequestCache]();
		}
		if (typeof (options?.body)?.getReader !== "undefined") options.duplex ??= "half";
		super(input, options);
	}
};
const wrapBodyStream = Symbol("wrapBodyStream");
const byteExactEncodings = /* @__PURE__ */ new Set([
	"latin1",
	"binary",
	"hex",
	"base64",
	"base64url"
]);
const isByteExactEncoding = (encoding) => encoding === null || byteExactEncodings.has(encoding);
const bodyBufferedBeforeDisconnectKey = Symbol("bodyBufferedBeforeDisconnect");
const bodyBufferedLengthBeforeDisconnectKey = Symbol("bodyBufferedLengthBeforeDisconnect");
const toBufferChunk = (chunk, encoding) => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding ?? "utf8");
const isRecoverableDisconnectedIncoming = (incoming) => !(incoming instanceof Http2ServerRequest) && !!incoming.complete && !!incoming.readableAborted && typeof incoming.read === "function" && isByteExactEncoding(incoming.readableEncoding);
const recordBodyBufferedBeforeDisconnect = (incoming) => {
	if (incoming.readableDidRead || !isRecoverableDisconnectedIncoming(incoming)) return;
	const incomingWithRecovery = incoming;
	incomingWithRecovery[bodyBufferedLengthBeforeDisconnectKey] ??= incoming.readableLength;
};
const readBodyBufferedBeforeDisconnect = (incoming, chunks) => {
	if (incoming.readableDidRead && !chunks || !isRecoverableDisconnectedIncoming(incoming)) return;
	const incomingWithRecovery = incoming;
	if (incomingWithRecovery[bodyBufferedBeforeDisconnectKey] !== void 0) return incomingWithRecovery[bodyBufferedBeforeDisconnectKey];
	let result;
	const errored = incoming.errored;
	if (errored && errored.code !== "ECONNRESET") result = errored;
	else if (incomingWithRecovery[bodyBufferedLengthBeforeDisconnectKey] !== void 0 && incoming.readableLength !== incomingWithRecovery[bodyBufferedLengthBeforeDisconnectKey]) result = newBodyUnusableError();
	else {
		const bodyChunks = chunks ?? [];
		let chunk;
		while ((chunk = incoming.read()) !== null) bodyChunks.push(toBufferChunk(chunk, incoming.readableEncoding));
		const buffer = bodyChunks.length === 1 ? bodyChunks[0] : Buffer.concat(bodyChunks);
		result = buffer;
		const contentLength = incoming.headers["content-length"];
		if (typeof contentLength === "string" && /^\d+$/.test(contentLength)) {
			const expectedLength = Number(contentLength);
			if (Number.isSafeInteger(expectedLength) && buffer.length !== expectedLength) result = newBodyUnusableError();
		}
	}
	incomingWithRecovery[bodyBufferedBeforeDisconnectKey] = result;
	return result;
};
const enqueueBufferedBody = (controller, buffered) => {
	if (buffered instanceof Error) {
		controller.error(buffered);
		return;
	}
	if (buffered.length > 0) controller.enqueue(buffered);
	controller.close();
};
const newRequestFromIncoming = (method, url, headers, incoming, abortController) => {
	const init = {
		method,
		headers,
		signal: abortController.signal
	};
	if (method === "TRACE") {
		init.method = "GET";
		const req = new Request$1(url, init);
		Object.defineProperty(req, "method", { get() {
			return "TRACE";
		} });
		return req;
	}
	if (!(method === "GET" || method === "HEAD")) if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) init.body = new ReadableStream({ start(controller) {
		controller.enqueue(incoming.rawBody);
		controller.close();
	} });
	else if (incoming[wrapBodyStream]) {
		let reader;
		init.body = new ReadableStream({ async pull(controller) {
			try {
				if (!reader) {
					const buffered = readBodyBufferedBeforeDisconnect(incoming);
					if (buffered !== void 0) {
						enqueueBufferedBody(controller, buffered);
						return;
					}
				}
				reader ||= Readable.toWeb(incoming).getReader();
				const { done, value } = await reader.read();
				if (done) controller.close();
				else controller.enqueue(value);
			} catch (error) {
				controller.error(error);
			}
		} });
	} else {
		const buffered = readBodyBufferedBeforeDisconnect(incoming);
		if (buffered !== void 0) init.body = new ReadableStream({ start(controller) {
			enqueueBufferedBody(controller, buffered);
		} });
		else init.body = Readable.toWeb(incoming);
	}
	return new Request$1(url, init);
};
const getRequestCache = Symbol("getRequestCache");
const requestCache = Symbol("requestCache");
const incomingKey = Symbol("incomingKey");
const urlKey = Symbol("urlKey");
const methodKey = Symbol("methodKey");
const headersKey = Symbol("headersKey");
const abortControllerKey = Symbol("abortControllerKey");
const getAbortController = Symbol("getAbortController");
const abortRequest = Symbol("abortRequest");
const bodyBufferKey = Symbol("bodyBuffer");
const bodyReadPromiseKey = Symbol("bodyReadPromise");
const bodyConsumedDirectlyKey = Symbol("bodyConsumedDirectly");
const bodyLockReaderKey = Symbol("bodyLockReader");
const abortReasonKey = Symbol("abortReason");
const newBodyUnusableError = () => {
	return /* @__PURE__ */ new TypeError("Body is unusable");
};
const rejectBodyUnusable = () => {
	return Promise.reject(newBodyUnusableError());
};
const textDecoder = new TextDecoder();
const consumeBodyDirectOnce = (request) => {
	if (request[bodyConsumedDirectlyKey]) return rejectBodyUnusable();
	request[bodyConsumedDirectlyKey] = true;
};
const toArrayBuffer = (buf) => {
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
};
const contentType = (request) => {
	return (request[headersKey] ||= newHeadersFromIncoming(request[incomingKey])).get("content-type") || "";
};
const methodTokenRegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const normalizeIncomingMethod = (method) => {
	if (typeof method !== "string" || method.length === 0) return "GET";
	switch (method) {
		case "DELETE":
		case "GET":
		case "HEAD":
		case "OPTIONS":
		case "PATCH":
		case "POST":
		case "PUT":
		case "QUERY": return method;
	}
	const upper = method.toUpperCase();
	switch (upper) {
		case "DELETE":
		case "GET":
		case "HEAD":
		case "OPTIONS":
		case "POST":
		case "PUT": return upper;
		default: return method;
	}
};
const validateDirectReadMethod = (method) => {
	if (!methodTokenRegExp.test(method)) return /* @__PURE__ */ new TypeError(`'${method}' is not a valid HTTP method.`);
	const normalized = method.toUpperCase();
	if (normalized === "CONNECT" || normalized === "TRACK" || normalized === "TRACE" && method !== "TRACE") return /* @__PURE__ */ new TypeError(`'${method}' HTTP method is unsupported.`);
};
const readBodyWithFastPath = (request, method, fromBuffer) => {
	if (request[bodyConsumedDirectlyKey]) return rejectBodyUnusable();
	const methodName = request.method;
	if (methodName === "GET" || methodName === "HEAD") return request[getRequestCache]()[method]();
	const methodValidationError = validateDirectReadMethod(methodName);
	if (methodValidationError) return Promise.reject(methodValidationError);
	if (request[requestCache]) {
		if (methodName !== "TRACE") return request[requestCache][method]();
	}
	const alreadyUsedError = consumeBodyDirectOnce(request);
	if (alreadyUsedError) return alreadyUsedError;
	const raw = readRawBodyIfAvailable(request);
	if (raw) {
		const result = Promise.resolve(fromBuffer(raw, request));
		request[bodyBufferKey] = void 0;
		return result;
	}
	return readBodyDirect(request).then((buf) => {
		const result = fromBuffer(buf, request);
		request[bodyBufferKey] = void 0;
		return result;
	});
};
const readRawBodyIfAvailable = (request) => {
	const incoming = request[incomingKey];
	if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) return incoming.rawBody;
};
const normalizeAbortError = (request, incoming) => {
	if (incoming.errored) return incoming.errored;
	const reason = request[abortReasonKey];
	if (reason !== void 0) return reason instanceof Error ? reason : new Error(String(reason));
	return /* @__PURE__ */ new Error("Client connection prematurely closed.");
};
const readBodyDirect = (request) => {
	if (request[bodyBufferKey]) return Promise.resolve(request[bodyBufferKey]);
	if (request[bodyReadPromiseKey]) return request[bodyReadPromiseKey];
	const incoming = request[incomingKey];
	if (incoming.readableDidRead) return rejectBodyUnusable();
	const buffered = readBodyBufferedBeforeDisconnect(incoming);
	if (buffered !== void 0) {
		if (buffered instanceof Error) return Promise.reject(buffered);
		request[bodyBufferKey] = buffered;
		return Promise.resolve(buffered);
	}
	const promise = new Promise((resolve, reject) => {
		const chunks = [];
		let settled = false;
		const finish = (callback) => {
			if (settled) return;
			settled = true;
			cleanup();
			callback();
		};
		const recoverCompleteBodyAfterDisconnect = (error) => {
			const streamError = incoming.errored ?? error;
			if (!isRecoverableDisconnectedIncoming(incoming) || streamError && streamError.code !== "ECONNRESET") return false;
			finish(() => {
				const recovered = readBodyBufferedBeforeDisconnect(incoming, chunks);
				if (recovered instanceof Error) reject(recovered);
				else if (recovered === void 0) reject(error ?? normalizeAbortError(request, incoming));
				else {
					request[bodyBufferKey] = recovered;
					resolve(recovered);
				}
			});
			return true;
		};
		const onData = (chunk) => {
			chunks.push(toBufferChunk(chunk, incoming.readableEncoding));
		};
		const onEnd = () => {
			finish(() => {
				const buffer = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);
				request[bodyBufferKey] = buffer;
				resolve(buffer);
			});
		};
		const onError = (error) => {
			if (recoverCompleteBodyAfterDisconnect(error)) return;
			finish(() => {
				reject(error);
			});
		};
		const onClose = () => {
			if (incoming.readableEnded) {
				onEnd();
				return;
			}
			if (recoverCompleteBodyAfterDisconnect()) return;
			finish(() => {
				reject(normalizeAbortError(request, incoming));
			});
		};
		const cleanup = () => {
			incoming.off("data", onData);
			incoming.off("end", onEnd);
			incoming.off("error", onError);
			incoming.off("close", onClose);
			request[bodyReadPromiseKey] = void 0;
		};
		incoming.on("data", onData);
		incoming.on("end", onEnd);
		incoming.on("error", onError);
		incoming.on("close", onClose);
		queueMicrotask(() => {
			if (settled) return;
			if (incoming.readableEnded) onEnd();
			else if (incoming.errored) onError(incoming.errored);
			else if (incoming.destroyed) onClose();
		});
	});
	request[bodyReadPromiseKey] = promise;
	return promise;
};
const requestPrototype = {
	get method() {
		return this[methodKey];
	},
	get url() {
		return this[urlKey];
	},
	get headers() {
		return this[headersKey] ||= newHeadersFromIncoming(this[incomingKey]);
	},
	[abortRequest](reason) {
		if (this[abortReasonKey] === void 0) this[abortReasonKey] = reason;
		const abortController = this[abortControllerKey];
		if (abortController && !abortController.signal.aborted) abortController.abort(reason);
	},
	[getAbortController]() {
		this[abortControllerKey] ||= new AbortController();
		if (this[abortReasonKey] !== void 0 && !this[abortControllerKey].signal.aborted) this[abortControllerKey].abort(this[abortReasonKey]);
		return this[abortControllerKey];
	},
	[getRequestCache]() {
		const abortController = this[getAbortController]();
		if (this[requestCache]) return this[requestCache];
		const method = this.method;
		if (this[bodyConsumedDirectlyKey] && !(method === "GET" || method === "HEAD")) {
			this[bodyBufferKey] = void 0;
			const init = {
				method: method === "TRACE" ? "GET" : method,
				headers: this.headers,
				signal: abortController.signal
			};
			if (method !== "TRACE") {
				init.body = new ReadableStream({ start(c) {
					c.close();
				} });
				init.duplex = "half";
			}
			const req = new Request$1(this[urlKey], init);
			if (method === "TRACE") Object.defineProperty(req, "method", { get() {
				return "TRACE";
			} });
			return this[requestCache] = req;
		}
		return this[requestCache] = newRequestFromIncoming(this.method, this[urlKey], this.headers, this[incomingKey], abortController);
	},
	get body() {
		if (!this[bodyConsumedDirectlyKey]) return this[getRequestCache]().body;
		const request = this[getRequestCache]();
		if (!this[bodyLockReaderKey] && request.body) this[bodyLockReaderKey] = request.body.getReader();
		return request.body;
	},
	get bodyUsed() {
		if (this[bodyConsumedDirectlyKey]) return true;
		if (this[requestCache]) return this[requestCache].bodyUsed;
		return false;
	}
};
Object.defineProperty(requestPrototype, "signal", { get() {
	return this[getAbortController]().signal;
} });
[
	"cache",
	"credentials",
	"destination",
	"duplex",
	"integrity",
	"mode",
	"redirect",
	"referrer",
	"referrerPolicy",
	"keepalive"
].forEach((k) => {
	Object.defineProperty(requestPrototype, k, { get() {
		return this[getRequestCache]()[k];
	} });
});
["clone", "formData"].forEach((k) => {
	Object.defineProperty(requestPrototype, k, { value: function() {
		if (this[bodyConsumedDirectlyKey]) {
			if (k === "clone") throw newBodyUnusableError();
			return rejectBodyUnusable();
		}
		return this[getRequestCache]()[k]();
	} });
});
Object.defineProperty(requestPrototype, "text", { value: function() {
	return readBodyWithFastPath(this, "text", (buf) => textDecoder.decode(buf));
} });
Object.defineProperty(requestPrototype, "arrayBuffer", { value: function() {
	return readBodyWithFastPath(this, "arrayBuffer", (buf) => toArrayBuffer(buf));
} });
Object.defineProperty(requestPrototype, "blob", { value: function() {
	return readBodyWithFastPath(this, "blob", (buf, request) => {
		const type = contentType(request);
		return new Response(buf, type ? { headers: { "content-type": type } } : void 0).blob();
	});
} });
Object.defineProperty(requestPrototype, "bytes", { value: function() {
	return this.arrayBuffer().then((buf) => new Uint8Array(buf));
} });
Object.defineProperty(requestPrototype, "json", { value: function() {
	if (this[bodyConsumedDirectlyKey]) return rejectBodyUnusable();
	return this.text().then(JSON.parse);
} });
Object.defineProperty(requestPrototype, Symbol.for("nodejs.util.inspect.custom"), { value: function(depth, options, inspectFn) {
	return `Request (lightweight) ${inspectFn({
		method: this.method,
		url: this.url,
		headers: this.headers,
		nativeRequest: this[requestCache]
	}, {
		...options,
		depth: depth == null ? null : depth - 1
	})}`;
} });
Object.setPrototypeOf(requestPrototype, Request$1.prototype);
const newRequest = (incoming, defaultHostname) => {
	const req = Object.create(requestPrototype);
	req[incomingKey] = incoming;
	req[methodKey] = normalizeIncomingMethod(incoming.method);
	const incomingUrl = incoming.url || "";
	if (incomingUrl[0] !== "/" && (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
		if (incoming instanceof Http2ServerRequest) throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
		try {
			validateRequestTarget(incomingUrl);
			req[urlKey] = new URL(incomingUrl).href;
		} catch (e) {
			throw new RequestError("Invalid absolute URL", { cause: e });
		}
		return req;
	}
	const host = (incoming instanceof Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
	if (!host) throw new RequestError("Missing host header");
	let scheme;
	if (incoming instanceof Http2ServerRequest) {
		scheme = incoming.scheme;
		if (!(scheme === "http" || scheme === "https")) throw new RequestError("Unsupported scheme");
	} else scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
	try {
		req[urlKey] = buildUrl(scheme, host, incomingUrl);
	} catch (e) {
		if (e instanceof RequestError) throw e;
		else throw new RequestError("Invalid URL", { cause: e });
	}
	return req;
};
const defaultContentType = "text/plain; charset=UTF-8";
const responseCache = Symbol("responseCache");
const getResponseCache = Symbol("getResponseCache");
const cacheKey = Symbol("cache");
const GlobalResponse = global.Response;
var Response$1 = class Response$1 {
	#body;
	#init;
	static [Symbol.hasInstance](instance) {
		if (this === Response$1) return instance instanceof GlobalResponse || Function.prototype[Symbol.hasInstance].call(this, instance);
		return Function.prototype[Symbol.hasInstance].call(this, instance);
	}
	[getResponseCache]() {
		const cache = this[cacheKey];
		const liveHeaders = cache && cache[2] instanceof Headers ? cache[2] : void 0;
		delete this[cacheKey];
		return this[responseCache] ||= new GlobalResponse(this.#body, liveHeaders ? {
			status: this.#init?.status,
			statusText: this.#init?.statusText,
			headers: liveHeaders
		} : this.#init);
	}
	constructor(body, init) {
		let headers;
		this.#body = body;
		if (init instanceof GlobalResponse) {
			const cachedGlobalResponse = init[responseCache];
			if (cachedGlobalResponse) {
				this.#init = cachedGlobalResponse;
				this[getResponseCache]();
				return;
			}
			this.#init = #init in init ? init.#init : init;
			headers = new Headers(init.headers);
		} else this.#init = init;
		if (body == null || typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) this[cacheKey] = [
			init?.status || 200,
			body ?? null,
			headers || init?.headers
		];
	}
	get headers() {
		const cache = this[cacheKey];
		if (cache) {
			if (!(cache[2] instanceof Headers)) cache[2] = new Headers(cache[2] || (cache[1] === null ? void 0 : { "content-type": defaultContentType }));
			return cache[2];
		}
		return this[getResponseCache]().headers;
	}
	get status() {
		return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
	}
	get ok() {
		const status = this.status;
		return status >= 200 && status < 300;
	}
};
[
	"body",
	"bodyUsed",
	"redirected",
	"statusText",
	"trailers",
	"type",
	"url"
].forEach((k) => {
	Object.defineProperty(Response$1.prototype, k, { get() {
		return this[getResponseCache]()[k];
	} });
});
[
	"arrayBuffer",
	"blob",
	"bytes",
	"clone",
	"formData",
	"json",
	"text"
].forEach((k) => {
	Object.defineProperty(Response$1.prototype, k, { value: function() {
		return this[getResponseCache]()[k]();
	} });
});
Object.defineProperty(Response$1.prototype, Symbol.for("nodejs.util.inspect.custom"), { value: function(depth, options, inspectFn) {
	return `Response (lightweight) ${inspectFn({
		status: this.status,
		headers: this.headers,
		ok: this.ok,
		nativeResponse: this[responseCache]
	}, {
		...options,
		depth: depth == null ? null : depth - 1
	})}`;
} });
Object.setPrototypeOf(Response$1, GlobalResponse);
Object.setPrototypeOf(Response$1.prototype, GlobalResponse.prototype);
const validRedirectUrl = /^https?:\/\/[!#-;=?-[\]_a-z~A-Z]+$/;
const parseRedirectUrl = (url) => {
	if (url instanceof URL) return url.href;
	if (validRedirectUrl.test(url)) return url;
	return new URL(url).href;
};
const validRedirectStatuses = /* @__PURE__ */ new Set([
	301,
	302,
	303,
	307,
	308
]);
Object.defineProperty(Response$1, "redirect", {
	value: function redirect(url, status = 302) {
		if (!validRedirectStatuses.has(status)) throw new RangeError("Invalid status code");
		return new Response$1(null, {
			status,
			headers: { location: parseRedirectUrl(url) }
		});
	},
	writable: true,
	configurable: true
});
Object.defineProperty(Response$1, "json", {
	value: function json(data, init) {
		const body = JSON.stringify(data);
		if (body === void 0) throw new TypeError("The data is not JSON serializable");
		const initHeaders = init?.headers;
		let headers;
		if (initHeaders) {
			headers = new Headers(initHeaders);
			if (!headers.has("content-type")) headers.set("content-type", "application/json");
		} else headers = { "content-type": "application/json" };
		return new Response$1(body, {
			status: init?.status ?? 200,
			statusText: init?.statusText,
			headers
		});
	},
	writable: true,
	configurable: true
});
async function readWithoutBlocking(readPromise) {
	return Promise.race([readPromise, Promise.resolve().then(() => Promise.resolve(void 0))]);
}
function writeFromReadableStreamDefaultReader(reader, writable, currentReadPromise) {
	const cancel = (error) => {
		reader.cancel(error).catch(() => {});
	};
	const stream = writable.stream;
	if (writable.destroyed || stream?.closed || stream?.destroyed) {
		cancel();
		return reader.closed;
	}
	writable.on("close", cancel);
	writable.on("error", cancel);
	(currentReadPromise ?? reader.read()).then(flow, handleStreamError);
	return reader.closed.finally(() => {
		writable.off("close", cancel);
		writable.off("error", cancel);
	});
	function handleStreamError(error) {
		if (error) writable.destroy(error);
	}
	function onDrain() {
		reader.read().then(flow, handleStreamError);
	}
	function flow({ done, value }) {
		try {
			if (done) writable.end();
			else if (!writable.write(value)) writable.once("drain", onDrain);
			else reader.read().then(flow, handleStreamError);
		} catch (e) {
			handleStreamError(e);
		}
	}
}
function writeFromReadableStream(stream, writable) {
	if (stream.locked) throw new TypeError("ReadableStream is locked.");
	else if (writable.destroyed) {
		stream.cancel().catch(() => {});
		return;
	}
	return writeFromReadableStreamDefaultReader(stream.getReader(), writable);
}
const buildOutgoingHttpHeaders = (headers, defaultContentType) => {
	const res = {};
	if (!(headers instanceof Headers)) headers = new Headers(headers ?? void 0);
	if (headers.has("set-cookie")) {
		const cookies = [];
		for (const [k, v] of headers) if (k === "set-cookie") cookies.push(v);
		else res[k] = v;
		if (cookies.length > 0) res["set-cookie"] = cookies;
	} else for (const [k, v] of headers) res[k] = v;
	if (defaultContentType) res["content-type"] ??= defaultContentType;
	return res;
};
const outgoingEnded = Symbol("outgoingEnded");
const incomingDraining = Symbol("incomingDraining");
const DRAIN_TIMEOUT_MS = 500;
const MAX_DRAIN_BYTES = 67108864;
const drainIncoming = (incoming) => {
	const incomingWithDrainState = incoming;
	if (incoming.destroyed || incomingWithDrainState[incomingDraining]) return;
	incomingWithDrainState[incomingDraining] = true;
	if (incoming instanceof Http2ServerRequest) {
		try {
			incoming.stream?.close?.(constants.NGHTTP2_NO_ERROR);
		} catch {}
		return;
	}
	let bytesRead = 0;
	const cleanup = () => {
		clearTimeout(timer);
		incoming.off("data", onData);
		incoming.off("end", cleanup);
		incoming.off("error", cleanup);
	};
	const forceClose = () => {
		cleanup();
		const socket = incoming.socket;
		if (socket && !socket.destroyed) {
			if (typeof socket.destroySoon === "function") socket.destroySoon();
			else if (typeof socket.destroy === "function") socket.destroy();
		}
	};
	const timer = setTimeout(forceClose, DRAIN_TIMEOUT_MS);
	timer.unref?.();
	const onData = (chunk) => {
		bytesRead += chunk.length;
		if (bytesRead > MAX_DRAIN_BYTES) forceClose();
	};
	incoming.on("data", onData);
	incoming.on("end", cleanup);
	incoming.on("error", cleanup);
	incoming.resume();
};
const makeCloseHandler = (req, incoming, outgoing, needsBodyCleanup) => () => {
	if (incoming.errored) {
		recordBodyBufferedBeforeDisconnect(incoming);
		req[abortRequest](incoming.errored.toString());
	} else if (!outgoing.writableFinished || incoming instanceof Http2ServerRequest && incoming.aborted) {
		recordBodyBufferedBeforeDisconnect(incoming);
		req[abortRequest]("Client connection prematurely closed.");
	}
	if (needsBodyCleanup && !incoming.readableEnded) setTimeout(() => {
		if (!incoming.readableEnded) setTimeout(() => {
			drainIncoming(incoming);
		});
	});
};
const isImmediateCacheableResponse = (res) => {
	if (!(cacheKey in res)) return false;
	const body = res[cacheKey][1];
	return body === null || typeof body === "string" || body instanceof Uint8Array;
};
const handleRequestError = () => new Response(null, { status: 400 });
const handleFetchError = (e) => new Response(null, { status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500 });
const handleResponseError = (e, outgoing) => {
	const err = e instanceof Error ? e : new Error("unknown error", { cause: e });
	if (err.code === "ERR_STREAM_PREMATURE_CLOSE") console.info("The user aborted a request.");
	else {
		console.error(e);
		if (!outgoing.headersSent) {
			if (outgoing instanceof ServerResponse) outgoing._contentLength = null;
			outgoing.writeHead(500, { "Content-Type": "text/plain" });
		}
		outgoing.end(`Error: ${err.message}`);
		outgoing.destroy(err);
	}
};
const flushHeaders = (outgoing) => {
	if ("flushHeaders" in outgoing && outgoing.writable) outgoing.flushHeaders();
};
const trySetContentLength = (outgoing, status, length) => {
	const http1 = outgoing;
	if (http1._contentLength === null && http1._hasBody && http1.useChunkedEncodingByDefault && !http1._removedContLen && status >= 200 && status !== 204 && status !== 304 && !outgoing.hasHeader("content-length") && !outgoing.hasHeader("transfer-encoding") && !outgoing.hasHeader("trailer")) {
		http1._contentLength = length;
		return true;
	}
	return false;
};
const writeDefaultHeaders = (outgoing, status, length) => {
	if (trySetContentLength(outgoing, status, length)) outgoing.writeHead(status, { "Content-Type": defaultContentType });
	else outgoing.writeHead(status, {
		"Content-Type": defaultContentType,
		"Content-Length": length
	});
};
const responseViaCache = async (res, outgoing) => {
	let [status, body, header] = res[cacheKey];
	if (!header) {
		if (body === null) {
			outgoing.writeHead(status);
			outgoing.end();
		} else if (typeof body === "string") {
			writeDefaultHeaders(outgoing, status, Buffer.byteLength(body));
			outgoing.end(body);
		} else if (body instanceof Uint8Array) {
			writeDefaultHeaders(outgoing, status, body.byteLength);
			outgoing.end(body);
		} else if (body instanceof Blob) {
			writeDefaultHeaders(outgoing, status, body.size);
			outgoing.end(new Uint8Array(await body.arrayBuffer()));
		} else {
			outgoing.writeHead(status, { "Content-Type": defaultContentType });
			flushHeaders(outgoing);
			await writeFromReadableStream(body, outgoing)?.catch((e) => handleResponseError(e, outgoing));
		}
		outgoing[outgoingEnded]?.();
		return;
	}
	let hasContentLength = false;
	let plainHeaders = false;
	let canAutoLength = true;
	if (header instanceof Headers) {
		hasContentLength = header.has("content-length");
		header = buildOutgoingHttpHeaders(header, body === null ? void 0 : defaultContentType);
	} else if (Array.isArray(header)) {
		const headerObj = new Headers(header);
		hasContentLength = headerObj.has("content-length");
		header = buildOutgoingHttpHeaders(headerObj, body === null ? void 0 : defaultContentType);
	} else {
		plainHeaders = true;
		for (const key in header) {
			if (key.length === 14 && key.toLowerCase() === "content-length") {
				hasContentLength = true;
				break;
			}
			if (key.length === 17 && key.toLowerCase() === "transfer-encoding" || key.length === 7 && key.toLowerCase() === "trailer") canAutoLength = false;
		}
	}
	if (!hasContentLength) {
		let length;
		if (typeof body === "string") length = Buffer.byteLength(body);
		else if (body instanceof Uint8Array) length = body.byteLength;
		else if (body instanceof Blob) length = body.size;
		if (length !== void 0 && (!plainHeaders || !canAutoLength || !trySetContentLength(outgoing, status, length))) {
			if (plainHeaders) header = { ...header };
			header["Content-Length"] = length;
		}
	}
	outgoing.writeHead(status, header);
	if (body == null) outgoing.end();
	else if (typeof body === "string" || body instanceof Uint8Array) outgoing.end(body);
	else if (body instanceof Blob) outgoing.end(new Uint8Array(await body.arrayBuffer()));
	else {
		flushHeaders(outgoing);
		await writeFromReadableStream(body, outgoing)?.catch((e) => handleResponseError(e, outgoing));
	}
	outgoing[outgoingEnded]?.();
};
const isPromise = (res) => typeof res.then === "function";
const responseViaResponseObject = async (res, outgoing, options = {}) => {
	if (isPromise(res)) if (options.errorHandler) try {
		res = await res;
	} catch (err) {
		const errRes = await options.errorHandler(err);
		if (!errRes) return;
		res = errRes;
	}
	else res = await res.catch(handleFetchError);
	if (cacheKey in res) return responseViaCache(res, outgoing);
	const resHeaderRecord = buildOutgoingHttpHeaders(res.headers, res.body === null ? void 0 : defaultContentType);
	if (res.body) {
		const reader = res.body.getReader();
		const values = [];
		let done = false;
		let currentReadPromise = void 0;
		if (resHeaderRecord["transfer-encoding"] !== "chunked") {
			let maxReadCount = 2;
			for (let i = 0; i < maxReadCount; i++) {
				currentReadPromise ||= reader.read();
				const chunk = await readWithoutBlocking(currentReadPromise);
				if (!chunk) {
					if (i === 1) {
						await new Promise((resolve) => setTimeout(resolve));
						maxReadCount = 3;
						continue;
					}
					break;
				}
				currentReadPromise = void 0;
				if (chunk.value) values.push(chunk.value);
				if (chunk.done) {
					done = true;
					break;
				}
			}
			if (done && !("content-length" in resHeaderRecord)) resHeaderRecord["content-length"] = values.reduce((acc, value) => acc + value.length, 0);
		}
		outgoing.writeHead(res.status, resHeaderRecord);
		values.forEach((value) => {
			outgoing.write(value);
		});
		if (done) outgoing.end();
		else {
			if (values.length === 0) flushHeaders(outgoing);
			await writeFromReadableStreamDefaultReader(reader, outgoing, currentReadPromise);
		}
	} else if (resHeaderRecord["x-hono-already-sent"]) {} else {
		outgoing.writeHead(res.status, resHeaderRecord);
		outgoing.end();
	}
	outgoing[outgoingEnded]?.();
};
const getRequestListener = (fetchCallback, options = {}) => {
	const autoCleanupIncoming = options.autoCleanupIncoming ?? true;
	if (options.overrideGlobalObjects !== false && global.Request !== Request$1) {
		Object.defineProperty(global, "Request", { value: Request$1 });
		Object.defineProperty(global, "Response", { value: Response$1 });
	}
	return async (incoming, outgoing) => {
		let res, req;
		let needsBodyCleanup = false;
		let closeHandlerAttached = false;
		const ensureCloseHandler = () => {
			if (!req || closeHandlerAttached) return;
			closeHandlerAttached = true;
			outgoing.on("close", makeCloseHandler(req, incoming, outgoing, needsBodyCleanup));
		};
		try {
			req = newRequest(incoming, options.hostname);
			needsBodyCleanup = autoCleanupIncoming && !(incoming.method === "GET" || incoming.method === "HEAD");
			if (needsBodyCleanup) {
				incoming[wrapBodyStream] = true;
				if (incoming instanceof Http2ServerRequest) outgoing[outgoingEnded] = () => {
					if (!incoming.readableEnded) setTimeout(() => {
						if (!incoming.readableEnded) setTimeout(() => {
							incoming.destroy();
							outgoing.destroy();
						});
					});
				};
			}
			res = fetchCallback(req, {
				incoming,
				outgoing
			});
			if (!isPromise(res) && isImmediateCacheableResponse(res)) {
				if (needsBodyCleanup && !incoming.readableEnded) outgoing.once("finish", () => {
					if (!incoming.readableEnded) drainIncoming(incoming);
				});
				return responseViaCache(res, outgoing);
			}
			ensureCloseHandler();
		} catch (e) {
			if (!res) if (options.errorHandler) {
				ensureCloseHandler();
				res = await options.errorHandler(req ? e : toRequestError(e));
				if (!res) return;
			} else if (!req) res = handleRequestError();
			else res = handleFetchError(e);
			else return handleResponseError(e, outgoing);
		}
		try {
			return await responseViaResponseObject(res, outgoing, options);
		} catch (e) {
			return handleResponseError(e, outgoing);
		}
	};
};
globalThis.CloseEvent;
globalThis.ErrorEvent;
const CONNECTION_SYMBOL_KEY = Symbol("CONNECTION_SYMBOL_KEY");
const WAIT_FOR_WEBSOCKET_SYMBOL = Symbol("WAIT_FOR_WEBSOCKET_SYMBOL");
const responseHeadersToSkip = /* @__PURE__ */ new Set([
	"connection",
	"content-length",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"sec-websocket-accept",
	"sec-websocket-extensions",
	"sec-websocket-protocol"
]);
const appendResponseHeaders = (headers, responseHeaders) => {
	if (!responseHeaders) return;
	responseHeaders.forEach((value, key) => {
		if (responseHeadersToSkip.has(key.toLowerCase())) return;
		headers.push(`${key}: ${value}`);
	});
};
const rejectUpgradeRequest = (socket, status, responseHeaders) => {
	if (socket.destroyed) return;
	const responseLines = ["Connection: close", "Content-Length: 0"];
	appendResponseHeaders(responseLines, responseHeaders);
	socket.end(`HTTP/1.1 ${status.toString()} ${STATUS_CODES[status] ?? ""}\r\n${responseLines.join("\r\n")}\r\n\r
`);
};
const createUpgradeRequest = (request) => {
	const protocol = request.socket.encrypted ? "https" : "http";
	const incomingUrl = request.url ?? "/";
	let url;
	if (incomingUrl[0] !== "/" && (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
		validateRequestTarget(incomingUrl);
		url = new URL(incomingUrl).href;
	} else url = buildUrl(protocol, request.headers.host ?? "localhost", incomingUrl);
	const headers = new Headers();
	for (const key in request.headers) {
		const value = request.headers[key];
		if (!value) continue;
		headers.append(key, Array.isArray(value) ? value[0] : value);
	}
	return new Request(url, { headers });
};
const setupWebSocket = (options) => {
	const { server, fetchCallback, wss } = options;
	const waiterMap = /* @__PURE__ */ new Map();
	wss.on("connection", (ws, request) => {
		const waiter = waiterMap.get(request);
		if (waiter) {
			waiter.resolve(ws);
			waiterMap.delete(request);
		}
	});
	const rejectWaiter = (request) => {
		const waiter = waiterMap.get(request);
		if (waiter) {
			waiterMap.delete(request);
			waiter.reject(/* @__PURE__ */ new Error("WebSocket handshake aborted"));
		}
	};
	const waitForWebSocket = (request, connectionSymbol) => {
		return new Promise((resolve, reject) => {
			waiterMap.set(request, {
				resolve,
				reject,
				connectionSymbol
			});
		});
	};
	server.on("upgrade", async (request, socket, head) => {
		const ignoreSocketError = () => {};
		socket.on("error", ignoreSocketError);
		if (request.headers.upgrade?.toLowerCase() !== "websocket") {
			if (server.listenerCount("upgrade") === 1) rejectUpgradeRequest(socket, 400);
			return;
		}
		const reclaimWaiterOnClose = () => rejectWaiter(request);
		socket.once("close", reclaimWaiterOnClose);
		const env = {
			incoming: request,
			outgoing: void 0,
			wss,
			[WAIT_FOR_WEBSOCKET_SYMBOL]: waitForWebSocket
		};
		let status = 400;
		let responseHeaders;
		try {
			const response = await fetchCallback(createUpgradeRequest(request), env);
			if (response instanceof Response) {
				status = response.status;
				responseHeaders = response.headers;
			}
		} catch (error) {
			if (server.listenerCount("upgrade") === 1) rejectUpgradeRequest(socket, error instanceof RequestError ? 400 : 500);
			return;
		}
		if (socket.destroyed) {
			rejectWaiter(request);
			return;
		}
		const waiter = waiterMap.get(request);
		if (!waiter || waiter.connectionSymbol !== env[CONNECTION_SYMBOL_KEY]) {
			rejectWaiter(request);
			if (server.listenerCount("upgrade") === 1) rejectUpgradeRequest(socket, status, responseHeaders);
			return;
		}
		const addResponseHeaders = (headers) => {
			appendResponseHeaders(headers, responseHeaders);
		};
		wss.on("headers", addResponseHeaders);
		try {
			wss.handleUpgrade(request, socket, head, (ws) => {
				socket.off("close", reclaimWaiterOnClose);
				socket.off("error", ignoreSocketError);
				wss.emit("connection", ws, request);
			});
		} finally {
			wss.off("headers", addResponseHeaders);
		}
	});
	server.on("close", () => {
		wss.close();
	});
};
const createAdaptorServer = (options) => {
	const fetchCallback = options.fetch;
	const requestListener = getRequestListener(fetchCallback, {
		hostname: options.hostname,
		overrideGlobalObjects: options.overrideGlobalObjects,
		autoCleanupIncoming: options.autoCleanupIncoming
	});
	const server = (options.createServer || createServer)(options.serverOptions || {}, requestListener);
	if (options.websocket && options.websocket.server) {
		if (options.websocket.server.options.noServer !== true) throw new Error("WebSocket server must be created with { noServer: true } option");
		setupWebSocket({
			server,
			fetchCallback,
			wss: options.websocket.server
		});
	}
	return server;
};
const serve = (options, listeningListener) => {
	const server = createAdaptorServer(options);
	server.listen(options?.port ?? 3e3, options.hostname, () => {
		const serverInfo = server.address();
		listeningListener && listeningListener(serverInfo);
	});
	return server;
};
// node_modules/@hono/node-server/dist/utils/stream.mjs
const pr54206Applied = () => {
	const [major, minor] = versions.node.split(".").map((component) => parseInt(component));
	return major >= 23 || major === 22 && minor >= 7 || major === 20 && minor >= 18;
};
const useReadableToWeb = pr54206Applied();
const createStreamBody = (stream, useNativeReadableToWeb = useReadableToWeb) => {
	if (useNativeReadableToWeb) return Readable.toWeb(stream);
	let controller;
	let settled = false;
	const cleanup = () => {
		stream.off("data", onData);
		stream.off("error", onError);
		stream.off("end", onTerminate);
		stream.off("close", onTerminate);
	};
	const settle = (callback) => {
		if (settled) return;
		settled = true;
		cleanup();
		callback?.();
	};
	const onData = (chunk) => {
		if (settled || !controller) return;
		controller.enqueue(chunk);
		if ((controller.desiredSize ?? 0) <= 0) stream.pause();
	};
	const onError = (error) => {
		settle(() => {
			controller?.error(error);
		});
	};
	const onTerminate = () => {
		settle(() => {
			controller?.close();
		});
	};
	return new ReadableStream({
		start(streamController) {
			controller = streamController;
			stream.on("data", onData);
			stream.on("error", onError);
			stream.on("end", onTerminate);
			stream.on("close", onTerminate);
			stream.pause();
		},
		pull() {
			if (!settled) stream.resume();
		},
		cancel() {
			settle();
			const ignoreError = () => {};
			stream.on("error", ignoreError);
			stream.once("close", () => stream.off("error", ignoreError));
			stream.destroy();
		}
	});
};
// node_modules/hono/dist/utils/mime.js
/**
* @module
* MIME utility.
*/
const getMimeType = (filename, mimes = baseMimes) => {
	const match = filename.match(/\.([a-zA-Z0-9]+?)$/);
	if (!match) return;
	const mimeType = mimes[match[1].toLowerCase()];
	return typeof mimeType === "string" ? mimeType : void 0;
};
const baseMimes = {
	aac: "audio/aac",
	avi: "video/x-msvideo",
	avif: "image/avif",
	av1: "video/av1",
	bin: "application/octet-stream",
	bmp: "image/bmp",
	css: "text/css; charset=utf-8",
	csv: "text/csv; charset=utf-8",
	eot: "application/vnd.ms-fontobject",
	epub: "application/epub+zip",
	gif: "image/gif",
	gz: "application/gzip",
	htm: "text/html; charset=utf-8",
	html: "text/html; charset=utf-8",
	ico: "image/x-icon",
	ics: "text/calendar; charset=utf-8",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	js: "text/javascript; charset=utf-8",
	json: "application/json",
	jsonld: "application/ld+json",
	map: "application/json",
	mid: "audio/x-midi",
	midi: "audio/x-midi",
	mjs: "text/javascript; charset=utf-8",
	mp3: "audio/mpeg",
	mp4: "video/mp4",
	mpeg: "video/mpeg",
	oga: "audio/ogg",
	ogv: "video/ogg",
	ogx: "application/ogg",
	opus: "audio/opus",
	otf: "font/otf",
	pdf: "application/pdf",
	png: "image/png",
	rtf: "application/rtf",
	svg: "image/svg+xml; charset=utf-8",
	tif: "image/tiff",
	tiff: "image/tiff",
	ts: "video/mp2t",
	ttf: "font/ttf",
	txt: "text/plain; charset=utf-8",
	wasm: "application/wasm",
	webm: "video/webm",
	weba: "audio/webm",
	webmanifest: "application/manifest+json",
	webp: "image/webp",
	woff: "font/woff",
	woff2: "font/woff2",
	xhtml: "application/xhtml+xml; charset=utf-8",
	xml: "application/xml; charset=utf-8",
	zip: "application/zip",
	"3gp": "video/3gpp",
	"3g2": "video/3gpp2",
	gltf: "model/gltf+json",
	glb: "model/gltf-binary"
};
// node_modules/@hono/node-server/dist/serve-static.mjs
const COMPRESSIBLE_CONTENT_TYPE_REGEX = /^\s*(?:text\/[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;
const ENCODINGS = {
	br: ".br",
	zstd: ".zst",
	gzip: ".gz"
};
const ENCODINGS_ORDERED_KEYS = Object.keys(ENCODINGS);
const getStats = (path) => {
	let stats;
	try {
		stats = statSync(path);
	} catch {}
	return stats;
};
const BYTE_RANGE_PATTERN = /^(?:bytes=)?(?!-$)(\d*)-(\d*)$/;
const parseByteRange = (range) => {
	const match = range.match(BYTE_RANGE_PATTERN);
	if (!match) return;
	const [, start, end] = match;
	if (start === "") return {
		type: "suffix",
		length: Number(end)
	};
	if (end === "") return {
		type: "open-ended",
		start: Number(start)
	};
	return {
		type: "bounded",
		start: Number(start),
		end: Number(end)
	};
};
const resolveByteRange = (spec, size) => {
	if (size === 0) return;
	if (spec.type === "suffix") {
		if (spec.length === 0) return;
		return {
			start: Math.max(size - spec.length, 0),
			end: size - 1
		};
	}
	const end = spec.type === "bounded" ? Math.min(spec.end, size - 1) : size - 1;
	if (spec.start >= size || spec.start > end) return;
	return {
		start: spec.start,
		end
	};
};
const tryDecode$1 = (str, decoder) => {
	try {
		return decoder(str);
	} catch {
		return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
			try {
				return decoder(match);
			} catch {
				return match;
			}
		});
	}
};
const tryDecodeURI = (str) => tryDecode$1(str, decodeURI);
const serveStatic = (options = { root: "" }) => {
	const root = options.root || "";
	const optionPath = options.path;
	if (root !== "" && !existsSync(root)) console.error(`serveStatic: root path '${root}' is not found, are you sure it's correct?`);
	return async (c, next) => {
		if (c.finalized) return next();
		if (c.req.method !== "GET" && c.req.method !== "HEAD") return next();
		let filename;
		if (optionPath) filename = optionPath;
		else try {
			filename = tryDecodeURI(c.req.path);
			if (c.req.path.includes("%") && (!options.allowPercentInPath || filename !== c.req.path.replace(/%25/g, "%"))) throw new Error();
			if (/(?:^|[\/\\])\.{1,2}(?:$|[\/\\])|[\/\\]{2,}|\\/.test(filename)) throw new Error();
		} catch {
			await options.onNotFound?.(c.req.path, c);
			return next();
		}
		let path = join(root, !optionPath && options.rewriteRequestPath ? options.rewriteRequestPath(filename, c) : filename);
		let stats = getStats(path);
		if (stats && stats.isDirectory()) {
			const indexFile = options.index ?? "index.html";
			path = join(path, indexFile);
			stats = getStats(path);
		}
		if (!stats) {
			await options.onNotFound?.(path, c);
			return next();
		}
		const mimeType = getMimeType(path);
		c.header("Content-Type", mimeType || "application/octet-stream");
		if (options.precompressed && (!mimeType || mimeType === "application/octet-stream" || COMPRESSIBLE_CONTENT_TYPE_REGEX.test(mimeType))) {
			const acceptEncodingSet = new Set(c.req.header("Accept-Encoding")?.split(",").map((encoding) => encoding.trim()));
			for (const encoding of ENCODINGS_ORDERED_KEYS) {
				if (!acceptEncodingSet.has(encoding)) continue;
				const precompressedStats = getStats(path + ENCODINGS[encoding]);
				if (precompressedStats) {
					c.header("Content-Encoding", encoding);
					c.header("Vary", "Accept-Encoding", { append: true });
					stats = precompressedStats;
					path = path + ENCODINGS[encoding];
					break;
				}
			}
		}
		let result;
		const size = stats.size;
		const range = c.req.header("range") || "";
		c.header("Last-Modified", stats.mtime.toUTCString());
		if (c.req.method === "HEAD") {
			c.header("Content-Length", size.toString());
			c.status(200);
			result = c.body(null);
		} else if (!range) {
			c.header("Content-Length", size.toString());
			result = c.body(createStreamBody(createReadStream(path)), 200);
		} else {
			c.header("Accept-Ranges", "bytes");
			const resolvedRange = resolveByteRange(parseByteRange(range) ?? {
				type: "open-ended",
				start: 0
			}, size);
			if (!resolvedRange) {
				c.header("Content-Range", `bytes */${size}`);
				result = c.body(null, 416);
			} else {
				const { start, end } = resolvedRange;
				const chunkSize = end - start + 1;
				const stream = createReadStream(path, {
					start,
					end
				});
				c.header("Content-Length", chunkSize.toString());
				c.header("Content-Range", `bytes ${start}-${end}/${size}`);
				result = c.body(createStreamBody(stream), 206);
			}
		}
		await options.onFound?.(path, c);
		return result;
	};
};
// node_modules/hono/dist/http-exception.js
/**
* `HTTPException` must be used when a fatal error such as authentication failure occurs.
*
* @see {@link https://hono.dev/docs/api/exception}
*
* @param {StatusCode} status - status code of HTTPException
* @param {HTTPExceptionOptions} options - options of HTTPException
* @param {HTTPExceptionOptions["res"]} options.res - response of options of HTTPException
* @param {HTTPExceptionOptions["message"]} options.message - message of options of HTTPException
* @param {HTTPExceptionOptions["cause"]} options.cause - cause of options of HTTPException
*
* @example
* ```ts
* import { HTTPException } from 'hono/http-exception'
*
* // ...
*
* app.post('/auth', async (c, next) => {
*   // authentication
*   if (authorized === false) {
*     throw new HTTPException(401, { message: 'Custom error message' })
*   }
*   await next()
* })
* ```
*/
var HTTPException = class extends Error {
	res;
	status;
	/**
	* Creates an instance of `HTTPException`.
	* @param status - HTTP status code for the exception. Defaults to 500.
	* @param options - Additional options for the exception.
	*/
	constructor(status = 500, options) {
		super(options?.message, { cause: options?.cause });
		this.res = options?.res;
		this.status = status;
	}
	/**
	* Returns the response object associated with the exception.
	* If a response object is not provided, a new response is created with the error message and status code.
	* @returns The response object.
	*/
	getResponse() {
		if (this.res) return new Response(this.res.body, {
			status: this.status,
			headers: this.res.headers
		});
		return new Response(this.message, { status: this.status });
	}
};
// node_modules/hono/dist/request/constants.js
const GET_MATCH_RESULT = Symbol();
// node_modules/hono/dist/utils/buffer.js
const bufferToFormData = (arrayBuffer, contentType) => {
	return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};
// node_modules/hono/dist/utils/body.js
const MAX_NESTED_OBJECTS = 1e4;
const isRawRequest = (request) => "headers" in request;
const parseBody = async (request, options = Object.create(null)) => {
	const { all = false, dot = false } = options;
	const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
	if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
		all,
		dot
	});
	return {};
};
/**
* Parses form data from a request.
*
* @template T - The type of the parsed body data.
* @param {HonoRequest | Request} request - The request object containing form data.
* @param {ParseBodyOptions} options - Options for parsing the form data.
* @returns {Promise<T>} The parsed body data.
*/
async function parseFormData(request, options) {
	if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
	const headers = isRawRequest(request) ? request.headers : request.raw.headers;
	const arrayBuffer = await request.arrayBuffer();
	const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
	if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
	const formData = await formDataPromise;
	if (formData) return convertFormDataToBodyData(formData, options);
	return {};
}
/**
* Converts form data to body data based on the provided options.
*
* @template T - The type of the parsed body data.
* @param {FormData} formData - The form data to convert.
* @param {ParseBodyOptions} options - Options for parsing the form data.
* @returns {T} The converted body data.
*/
function convertFormDataToBodyData(formData, options) {
	const form = Object.create(null);
	const nestingState = { count: 0 };
	formData.forEach((value, key) => {
		if (!(options.all || key.endsWith("[]"))) form[key] = value;
		else handleParsingAllValues(form, key, value);
	});
	if (options.dot) Object.entries(form).forEach(([key, value]) => {
		if (key.includes(".")) {
			handleParsingNestedValues(form, key, value, nestingState);
			delete form[key];
		}
	});
	return form;
}
/**
* Handles parsing all values for a given key, supporting multiple values as arrays.
*
* @param {BodyData} form - The form data object.
* @param {string} key - The key to parse.
* @param {FormDataEntryValue} value - The value to assign.
*/
const handleParsingAllValues = (form, key, value) => {
	if (form[key] !== void 0) {
		if (Array.isArray(form[key])) form[key].push(value);
		else form[key] = [form[key], value];
	} else if (!key.endsWith("[]")) form[key] = value;
	else form[key] = [value];
};
/**
* Handles parsing nested values using dot notation keys.
*
* @param {BodyData} form - The form data object.
* @param {string} key - The dot notation key.
* @param {BodyDataValue} value - The value to assign.
* @param {{ count: number }} state - The state object tracking nesting depth.
*/
const handleParsingNestedValues = (form, key, value, state) => {
	if (/(?:^|\.)(?:__proto__|constructor\.prototype)\./.test(key)) return;
	let nestedForm = form;
	const keys = key.split(".", 34);
	if (keys.length > 33) throwNestingLimitExceeded();
	keys.forEach((key, index) => {
		if (index === keys.length - 1) nestedForm[key] = value;
		else {
			if (!nestedForm[key] || typeof nestedForm[key] !== "object" || Array.isArray(nestedForm[key]) || nestedForm[key] instanceof File) {
				if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
				nestedForm[key] = Object.create(null);
			}
			nestedForm = nestedForm[key];
		}
	});
};
const throwNestingLimitExceeded = () => {
	throw new Error("Nesting limit exceeded");
};
// node_modules/hono/dist/utils/url.js
const splitPath = (path) => {
	const paths = path.split("/");
	if (paths[0] === "") paths.shift();
	return paths;
};
const splitRoutingPath = (routePath) => {
	const { groups, path } = extractGroupsFromPath(routePath);
	const paths = splitPath(path);
	return replaceGroupMarks(paths, groups);
};
const extractGroupsFromPath = (path) => {
	const groups = [];
	path = path.replace(/\{[^}]+\}/g, (match, index) => {
		const mark = `@${index}`;
		groups.push([mark, match]);
		return mark;
	});
	return {
		groups,
		path
	};
};
const replaceGroupMarks = (paths, groups) => {
	for (let i = groups.length - 1; i >= 0; i--) {
		const [mark] = groups[i];
		for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
			paths[j] = paths[j].replace(mark, groups[i][1]);
			break;
		}
	}
	return paths;
};
const patternCache = {};
const getPattern = (label, next) => {
	if (label === "*") return "*";
	const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
	if (match) {
		const cacheKey = `${label}#${next}`;
		if (!patternCache[cacheKey]) {
			if (match[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
				cacheKey,
				match[1],
				new RegExp(`^${match[2]}(?=/${next})`)
			] : [
				label,
				match[1],
				new RegExp(`^${match[2]}$`)
			];
			else patternCache[cacheKey] = [
				label,
				match[1],
				true
			];
		}
		return patternCache[cacheKey];
	}
	return null;
};
const tryDecode = (str, decoder) => {
	try {
		return decoder(str);
	} catch {
		return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
			try {
				return decoder(match);
			} catch {
				return match;
			}
		});
	}
};
const decodeURIWithPreservedPercent = (value) => decodeURI(value.includes("%25") ? value.replace(/%25/g, "%2525") : value);
const getPath = (request) => {
	const url = request.url;
	const start = url.indexOf("/", url.indexOf(":") + 4);
	let i = start;
	for (; i < url.length; i++) {
		const charCode = url.charCodeAt(i);
		if (charCode === 37) {
			const queryIndex = url.indexOf("?", i);
			const hashIndex = url.indexOf("#", i);
			const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
			const path = url.slice(start, end);
			const decoded = tryDecode(path, decodeURIWithPreservedPercent);
			if (/%(?![0-9A-Fa-f]{2})/.test(path)) {
				const rewritten = new URL("http://localhost");
				rewritten.pathname = decoded.replace(/[\\\t\n\r]/g, encodeURIComponent);
				if (tryDecode(rewritten.pathname, decodeURIWithPreservedPercent) !== decoded) return tryDecode(path.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"), decodeURIWithPreservedPercent);
			}
			return decoded;
		} else if (charCode === 63 || charCode === 35) break;
	}
	return url.slice(start, i);
};
const getPathNoStrict = (request) => {
	const result = getPath(request);
	return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
/**
* Merge paths.
* @param {string[]} ...paths - The paths to merge.
* @returns {string} The merged path.
* @example
* mergePath('/api', '/users') // '/api/users'
* mergePath('/api/', '/users') // '/api/users'
* mergePath('/api', '/') // '/api'
* mergePath('/api/', '/') // '/api/'
*/
const mergePath = (base, sub, ...rest) => {
	if (rest.length) sub = mergePath(sub, ...rest);
	return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
const checkOptionalParameter = (path) => {
	if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
	const segments = path.split("/");
	const results = [];
	let basePath = "";
	segments.forEach((segment) => {
		if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
		else if (/\:/.test(segment)) {
			if (segment.charCodeAt(segment.length - 1) === 63) {
				if (results.length === 0 && basePath === "") results.push("/");
				else results.push(basePath);
				const optionalSegment = segment.slice(0, -1);
				basePath += "/" + optionalSegment;
				results.push(basePath);
			} else basePath += "/" + segment;
		}
	});
	return results.filter((v, i, a) => a.indexOf(v) === i);
};
const tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
const _decodeURI = (value) => {
	if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
	return tryDecodeURIComponent(value);
};
const _getQueryParam = (url, key, multiple) => {
	const hashIndex = url.indexOf("#", 8);
	if (hashIndex !== -1) url = url.slice(0, hashIndex);
	let encoded;
	if (!multiple && key && !/[%+&=]/.test(key)) {
		const queryIndex = url.indexOf("?", 8);
		let keyIndex = queryIndex;
		if (keyIndex === -1) return;
		if (!url.startsWith(key, keyIndex + 1)) keyIndex = url.indexOf(`&${key}`, keyIndex + 1);
		while (keyIndex !== -1) {
			const trailingKeyCode = url.charCodeAt(keyIndex + key.length + 1);
			if (trailingKeyCode === 61 || trailingKeyCode === 38 || isNaN(trailingKeyCode)) {
				if (keyIndex > queryIndex && /(?:^|&)[^=&]*[%+]/.test(url.slice(queryIndex + 1, keyIndex))) break;
				if (trailingKeyCode === 61) {
					const valueIndex = keyIndex + key.length + 2;
					const endIndex = url.indexOf("&", valueIndex);
					return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
				}
				return "";
			}
			keyIndex = url.indexOf(`&${key}`, keyIndex + 1);
		}
		encoded = /[%+]/.test(url);
		if (!encoded) return;
	}
	const results = Object.create(null);
	encoded ??= /[%+]/.test(url);
	let keyIndex = url.indexOf("?", 8);
	while (keyIndex !== -1) {
		const nextKeyIndex = url.indexOf("&", keyIndex + 1);
		let valueIndex = url.indexOf("=", keyIndex);
		if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
		let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
		if (encoded) name = _decodeURI(name);
		keyIndex = nextKeyIndex;
		if (name === "") continue;
		let value;
		if (valueIndex === -1) value = "";
		else {
			value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
			if (encoded) value = _decodeURI(value);
		}
		if (multiple) {
			if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
			results[name].push(value);
		} else results[name] ??= value;
	}
	return key ? results[key] : results;
};
const getQueryParam = _getQueryParam;
const getQueryParams = (url, key) => {
	return _getQueryParam(url, key, true);
};
const decodeURIComponent_ = decodeURIComponent;
// node_modules/hono/dist/request.js
var HonoRequest = class {
	/**
	* `.raw` can get the raw Request object.
	*
	* @see {@link https://hono.dev/docs/api/request#raw}
	*
	* @example
	* ```ts
	* // For Cloudflare Workers
	* app.post('/', async (c) => {
	*   const metadata = c.req.raw.cf?.hostMetadata?
	*   ...
	* })
	* ```
	*/
	raw;
	#validatedData;
	#matchResult;
	routeIndex = 0;
	/**
	* `.path` can get the pathname of the request.
	*
	* @see {@link https://hono.dev/docs/api/request#path}
	*
	* @example
	* ```ts
	* app.get('/about/me', (c) => {
	*   const pathname = c.req.path // `/about/me`
	* })
	* ```
	*/
	path;
	bodyCache = {};
	constructor(request, path = "/", matchResult = [[]]) {
		this.raw = request;
		this.path = path;
		this.#matchResult = matchResult;
	}
	param(key) {
		return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
	}
	#getDecodedParam(key) {
		const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
		const param = this.#getParamValue(paramKey);
		return param && tryDecodeURIComponent(param);
	}
	#getAllDecodedParams() {
		const decoded = {};
		const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
		for (const key of keys) {
			const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
			if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
		}
		return decoded;
	}
	#getParamValue(paramKey) {
		return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
	}
	query(key) {
		return getQueryParam(this.url, key);
	}
	queries(key) {
		return getQueryParams(this.url, key);
	}
	header(name) {
		if (name) return this.raw.headers.get(name) ?? void 0;
		const headerData = Object.create(null);
		this.raw.headers.forEach((value, key) => {
			headerData[key] = value;
		});
		return headerData;
	}
	async parseBody(options) {
		return parseBody(this, options);
	}
	#cachedBody = (key) => {
		const { bodyCache, raw } = this;
		const cachedBody = bodyCache[key];
		if (cachedBody) return cachedBody;
		for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
			if (anyCachedKey === "json") body = JSON.stringify(body);
			const contentType = anyCachedKey === "formData" ? void 0 : raw.headers.get("content-type");
			return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
		});
		return bodyCache[key] = raw[key]();
	};
	/**
	* `.json()` can parse Request body of type `application/json`
	*
	* @see {@link https://hono.dev/docs/api/request#json}
	*
	* @example
	* ```ts
	* app.post('/entry', async (c) => {
	*   const body = await c.req.json()
	* })
	* ```
	*/
	json() {
		return this.#cachedBody("text").then((text) => JSON.parse(text));
	}
	/**
	* `.text()` can parse Request body of type `text/plain`
	*
	* @see {@link https://hono.dev/docs/api/request#text}
	*
	* @example
	* ```ts
	* app.post('/entry', async (c) => {
	*   const body = await c.req.text()
	* })
	* ```
	*/
	text() {
		return this.#cachedBody("text");
	}
	/**
	* `.arrayBuffer()` parse Request body as an `ArrayBuffer`
	*
	* @see {@link https://hono.dev/docs/api/request#arraybuffer}
	*
	* @example
	* ```ts
	* app.post('/entry', async (c) => {
	*   const body = await c.req.arrayBuffer()
	* })
	* ```
	*/
	arrayBuffer() {
		return this.#cachedBody("arrayBuffer");
	}
	/**
	* `.bytes()` parses the request body as a `Uint8Array`.
	*
	* @see {@link https://hono.dev/docs/api/request#bytes}
	*
	* @example
	* ```ts
	* app.post('/entry', async (c) => {
	*   const body = await c.req.bytes()
	* })
	* ```
	*/
	bytes() {
		return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
	}
	/**
	* Parses the request body as a `Blob`.
	* @example
	* ```ts
	* app.post('/entry', async (c) => {
	*   const body = await c.req.blob();
	* });
	* ```
	* @see https://hono.dev/docs/api/request#blob
	*/
	blob() {
		return this.#cachedBody("blob");
	}
	/**
	* Parses the request body as `FormData`.
	* @example
	* ```ts
	* app.post('/entry', async (c) => {
	*   const body = await c.req.formData();
	* });
	* ```
	* @see https://hono.dev/docs/api/request#formdata
	*/
	formData() {
		return this.#cachedBody("formData");
	}
	/**
	* Adds validated data to the request.
	*
	* @param target - The target of the validation.
	* @param data - The validated data to add.
	*/
	addValidatedData(target, data) {
		(this.#validatedData ??= {})[target] = data;
	}
	valid(target) {
		return this.#validatedData?.[target];
	}
	/**
	* `.url` can get the request url strings.
	*
	* @see {@link https://hono.dev/docs/api/request#url}
	*
	* @example
	* ```ts
	* app.get('/about/me', (c) => {
	*   const url = c.req.url // `http://localhost:8787/about/me`
	*   ...
	* })
	* ```
	*/
	get url() {
		return this.raw.url;
	}
	/**
	* `.method` can get the method name of the request.
	*
	* @see {@link https://hono.dev/docs/api/request#method}
	*
	* @example
	* ```ts
	* app.get('/about/me', (c) => {
	*   const method = c.req.method // `GET`
	* })
	* ```
	*/
	get method() {
		return this.raw.method;
	}
	get [GET_MATCH_RESULT]() {
		return this.#matchResult;
	}
	/**
	* `.matchedRoutes` can return a matched route in the handler
	*
	* @deprecated
	*
	* Use matchedRoutes helper defined in "hono/route" instead.
	*
	* @see {@link https://hono.dev/docs/api/request#matchedroutes}
	*
	* @example
	* ```ts
	* app.use('*', async function logger(c, next) {
	*   await next()
	*   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
	*     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
	*     console.log(
	*       method,
	*       ' ',
	*       path,
	*       ' '.repeat(Math.max(10 - path.length, 0)),
	*       name,
	*       i === c.req.routeIndex ? '<- respond from here' : ''
	*     )
	*   })
	* })
	* ```
	*/
	get matchedRoutes() {
		return this.#matchResult[0].map(([[, route]]) => route);
	}
	/**
	* `.routePath` can retrieve the path registered within the handler
	*
	* @deprecated
	*
	* Use routePath helper defined in "hono/route" instead.
	*
	* @see {@link https://hono.dev/docs/api/request#routepath}
	*
	* @example
	* ```ts
	* app.get('/posts/:id', (c) => {
	*   return c.json({ path: c.req.routePath })
	* })
	* ```
	*/
	get routePath() {
		return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
	}
};
// node_modules/hono/dist/utils/html.js
/**
* @module
* HTML utility.
*/
const HtmlEscapedCallbackPhase = {
	Stringify: 1,
	BeforeStream: 2,
	Stream: 3
};
const raw = (value, callbacks) => {
	const escapedString = new String(value);
	escapedString.isEscaped = true;
	escapedString.callbacks = callbacks;
	return escapedString;
};
const resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
	if (typeof str === "object" && !(str instanceof String)) {
		if (!(str instanceof Promise)) str = str.toString();
		if (str instanceof Promise) str = await str;
	}
	const callbacks = str.callbacks;
	if (!callbacks?.length) return Promise.resolve(str);
	if (buffer) buffer[0] += str;
	else buffer = [str];
	const resStr = Promise.all(callbacks.map((c) => c({
		phase,
		buffer,
		context
	}))).then((res) => Promise.all(res.filter(Boolean).map((str) => resolveCallback(str, phase, false, context, buffer))).then(() => buffer[0]));
	if (preserveCallbacks) return raw(await resStr, callbacks);
	else return resStr;
};
// node_modules/hono/dist/context.js
const TEXT_PLAIN = "text/plain; charset=UTF-8";
const setDefaultContentType = (contentType, headers) => {
	return {
		"Content-Type": contentType,
		...headers
	};
};
const createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
	#rawRequest;
	#req;
	/**
	* `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
	*
	* @see {@link https://hono.dev/docs/api/context#env}
	*
	* @example
	* ```ts
	* // Environment object for Cloudflare Workers
	* app.get('*', async c => {
	*   const counter = c.env.COUNTER
	* })
	* ```
	*/
	env = {};
	#var;
	finalized = false;
	/**
	* `.error` can get the error object from the middleware if the Handler throws an error.
	*
	* @see {@link https://hono.dev/docs/api/context#error}
	*
	* @example
	* ```ts
	* app.use('*', async (c, next) => {
	*   await next()
	*   if (c.error) {
	*     // do something...
	*   }
	* })
	* ```
	*/
	error;
	#status;
	#executionCtx;
	#res;
	#layout;
	#renderer;
	#notFoundHandler;
	#preparedHeaders;
	#matchResult;
	#path;
	/**
	* Creates an instance of the Context class.
	*
	* @param req - The Request object.
	* @param options - Optional configuration options for the context.
	*/
	constructor(req, options) {
		this.#rawRequest = req;
		if (options) {
			this.#executionCtx = options.executionCtx;
			this.env = options.env;
			this.#notFoundHandler = options.notFoundHandler;
			this.#path = options.path;
			this.#matchResult = options.matchResult;
		}
	}
	/**
	* `.req` is the instance of {@link HonoRequest}.
	*/
	get req() {
		this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
		return this.#req;
	}
	/**
	* @see {@link https://hono.dev/docs/api/context#event}
	* The FetchEvent associated with the current request.
	*
	* @throws Will throw an error if the context does not have a FetchEvent.
	*/
	get event() {
		if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
		else throw Error("This context has no FetchEvent");
	}
	/**
	* @see {@link https://hono.dev/docs/api/context#executionctx}
	* The ExecutionContext associated with the current request.
	*
	* @throws Will throw an error if the context does not have an ExecutionContext.
	*/
	get executionCtx() {
		if (this.#executionCtx) return this.#executionCtx;
		else throw Error("This context has no ExecutionContext");
	}
	/**
	* @see {@link https://hono.dev/docs/api/context#res}
	* The Response object for the current request.
	*/
	get res() {
		return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
	}
	/**
	* Sets the Response object for the current request.
	*
	* @param _res - The Response object to set.
	*/
	set res(_res) {
		if (this.#res && _res) {
			_res = createResponseInstance(_res.body, _res);
			for (const [k, v] of this.#res.headers.entries()) {
				if (k === "content-type") continue;
				if (k === "set-cookie") {
					const cookies = this.#res.headers.getSetCookie();
					_res.headers.delete("set-cookie");
					for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
				} else _res.headers.set(k, v);
			}
		}
		this.#res = _res;
		this.finalized = true;
	}
	/**
	* `.render()` can create a response within a layout.
	*
	* @see {@link https://hono.dev/docs/api/context#render-setrenderer}
	*
	* @example
	* ```ts
	* app.get('/', (c) => {
	*   return c.render('Hello!')
	* })
	* ```
	*/
	render = (...args) => {
		this.#renderer ??= (content) => this.html(content);
		return this.#renderer(...args);
	};
	/**
	* Sets the layout for the response.
	*
	* @param layout - The layout to set.
	* @returns The layout function.
	*/
	setLayout = (layout) => this.#layout = layout;
	/**
	* Gets the current layout for the response.
	*
	* @returns The current layout function.
	*/
	getLayout = () => this.#layout;
	/**
	* `.setRenderer()` can set the layout in the custom middleware.
	*
	* @see {@link https://hono.dev/docs/api/context#render-setrenderer}
	*
	* @example
	* ```tsx
	* app.use('*', async (c, next) => {
	*   c.setRenderer((content) => {
	*     return c.html(
	*       <html>
	*         <body>
	*           <p>{content}</p>
	*         </body>
	*       </html>
	*     )
	*   })
	*   await next()
	* })
	* ```
	*/
	setRenderer = (renderer) => {
		this.#renderer = renderer;
	};
	/**
	* `.header()` can set headers.
	*
	* @see {@link https://hono.dev/docs/api/context#header}
	*
	* @example
	* ```ts
	* app.get('/welcome', (c) => {
	*   // Set headers
	*   c.header('X-Message', 'Hello!')
	*   c.header('Content-Type', 'text/plain')
	*
	*   // Append multiple headers using the append option (e.g. Vary)
	*   c.header('Vary', 'Accept-Encoding', { append: true })
	*   c.header('Vary', 'User-Agent', { append: true })
	*
	*   return c.body('Thank you for coming')
	* })
	* ```
	*/
	header = (name, value, options) => {
		if (this.finalized && !this.#res.bodyUsed) this.#res = createResponseInstance(this.#res.body, this.#res);
		const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
		if (value === void 0) headers.delete(name);
		else if (options?.append) headers.append(name, value);
		else headers.set(name, value);
	};
	status = (status) => {
		this.#status = status;
	};
	/**
	* `.set()` can set the value specified by the key.
	*
	* @see {@link https://hono.dev/docs/api/context#set-get}
	*
	* @example
	* ```ts
	* app.use('*', async (c, next) => {
	*   c.set('message', 'Hono is hot!!')
	*   await next()
	* })
	* ```
	*/
	set = (key, value) => {
		this.#var ??= /* @__PURE__ */ new Map();
		this.#var.set(key, value);
	};
	/**
	* `.get()` can use the value specified by the key.
	*
	* @see {@link https://hono.dev/docs/api/context#set-get}
	*
	* @example
	* ```ts
	* app.get('/', (c) => {
	*   const message = c.get('message')
	*   return c.text(`The message is "${message}"`)
	* })
	* ```
	*/
	get = (key) => {
		return this.#var ? this.#var.get(key) : void 0;
	};
	/**
	* `.var` can access the value of a variable.
	*
	* @see {@link https://hono.dev/docs/api/context#var}
	*
	* @example
	* ```ts
	* const result = c.var.client.oneMethod()
	* ```
	*/
	get var() {
		if (!this.#var) return {};
		return Object.fromEntries(this.#var);
	}
	#newResponse(data, arg, headers) {
		let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
		if (typeof arg === "object" && arg.headers) {
			responseHeaders ??= new Headers();
			for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
			else responseHeaders.set(key, value);
		}
		if (headers) {
			if (!responseHeaders) {
				let count = 0;
				for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
					responseHeaders = new Headers();
					break;
				}
			}
			if (responseHeaders) for (const k in headers) {
				const v = headers[k];
				if (typeof v === "string") responseHeaders.set(k, v);
				else {
					responseHeaders.delete(k);
					for (const v2 of v) responseHeaders.append(k, v2);
				}
			}
		}
		const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
		return createResponseInstance(data, {
			status,
			headers: responseHeaders ?? headers
		});
	}
	newResponse = (...args) => this.#newResponse(...args);
	/**
	* `.body()` can return the HTTP response.
	* You can set headers with `.header()` and set HTTP status code with `.status`.
	* This can also be set in `.text()`, `.json()` and so on.
	*
	* @see {@link https://hono.dev/docs/api/context#body}
	*
	* @example
	* ```ts
	* app.get('/welcome', (c) => {
	*   // Set headers
	*   c.header('X-Message', 'Hello!')
	*   c.header('Content-Type', 'text/plain')
	*   // Set HTTP status code
	*   c.status(201)
	*
	*   // Return the response body
	*   return c.body('Thank you for coming')
	* })
	* ```
	*/
	body = (data, arg, headers) => this.#newResponse(data, arg, headers);
	/**
	* `.text()` can render text as `Content-Type:text/plain`.
	*
	* @see {@link https://hono.dev/docs/api/context#text}
	*
	* @example
	* ```ts
	* app.get('/say', (c) => {
	*   return c.text('Hello!')
	* })
	* ```
	*/
	text = (text, arg, headers) => {
		return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
	};
	/**
	* `.json()` can render JSON as `Content-Type:application/json`.
	*
	* @see {@link https://hono.dev/docs/api/context#json}
	*
	* @example
	* ```ts
	* app.get('/api', (c) => {
	*   return c.json({ message: 'Hello!' })
	* })
	* ```
	*/
	json = (object, arg, headers) => {
		return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
	};
	html = (html, arg, headers) => {
		const res = (html) => this.#newResponse(html, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
		return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
	};
	/**
	* `.redirect()` can Redirect, default status code is 302.
	*
	* @see {@link https://hono.dev/docs/api/context#redirect}
	*
	* @example
	* ```ts
	* app.get('/redirect', (c) => {
	*   return c.redirect('/')
	* })
	* app.get('/redirect-permanently', (c) => {
	*   return c.redirect('/', 301)
	* })
	* ```
	*/
	redirect = (location, status) => {
		const locationString = String(location);
		this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
		return this.newResponse(null, status ?? 302);
	};
	/**
	* `.notFound()` can return the Not Found Response.
	*
	* @see {@link https://hono.dev/docs/api/context#notfound}
	*
	* @example
	* ```ts
	* app.get('/notfound', (c) => {
	*   return c.notFound()
	* })
	* ```
	*/
	notFound = () => {
		this.#notFoundHandler ??= () => createResponseInstance();
		return this.#notFoundHandler(this);
	};
};
// node_modules/hono/dist/compose.js
/**
* Compose middleware functions into a single function based on `koa-compose` package.
*
* @template E - The environment type.
*
* @param {[[Function, unknown], unknown][] | [[Function]][]} middleware - An array of middleware functions and their corresponding parameters.
* @param {ErrorHandler<E>} [onError] - An optional error handler function.
* @param {NotFoundHandler<E>} [onNotFound] - An optional not-found handler function.
*
* @returns {(context: Context, next?: Next) => Promise<Context>} - A composed middleware function.
*/
const compose = (middleware, onError, onNotFound) => {
	return (context, next) => {
		let index = -1;
		return dispatch(0);
		/**
		* Dispatch the middleware functions.
		*
		* @param {number} i - The current index in the middleware array.
		*
		* @returns {Promise<Context>} - A promise that resolves to the context.
		*/
		async function dispatch(i) {
			if (i <= index) throw new Error("next() called multiple times");
			index = i;
			let res;
			let isError = false;
			let handler;
			if (middleware[i]) {
				handler = middleware[i][0][0];
				context.req.routeIndex = i;
			} else handler = i === middleware.length && next || void 0;
			if (handler) try {
				res = await handler(context, () => dispatch(i + 1));
			} catch (err) {
				if (err instanceof Error && onError) {
					context.error = err;
					res = await onError(err, context);
					isError = true;
				} else throw err;
			}
			else if (context.finalized === false && onNotFound) res = await onNotFound(context);
			if (res && (context.finalized === false || isError)) context.res = res;
			return context;
		}
	};
};
// node_modules/hono/dist/helper/route/index.js
/**
* Get matched routes in the handler
*
* @param {Context} c - The context object
* @returns An array of matched routes
*
* @example
* ```ts
* import { matchedRoutes } from 'hono/route'
*
* app.use('*', async function logger(c, next) {
*   await next()
*   matchedRoutes(c).forEach(({ handler, method, path }, i) => {
*     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
*     console.log(
*       method,
*       ' ',
*       path,
*       ' '.repeat(Math.max(10 - path.length, 0)),
*       name,
*       i === c.req.routeIndex ? '<- respond from here' : ''
*     )
*   })
* })
* ```
*/
const matchedRoutes = (c) => c.req[GET_MATCH_RESULT][0].map(([[, route]]) => route);
/**
* Get the route path registered within the handler
*
* @param {Context} c - The context object
* @param {number} index - The index of the route from which to retrieve the path, similar to Array.prototype.at(), where a negative number is the index counted from the end of the matching route. Defaults to the current route index.
* @returns The route path registered within the handler
*
* @example
* ```ts
* import { routePath } from 'hono/route'
*
* app.use('*', (c, next) => {
*   console.log(routePath(c)) // '*'
*   console.log(routePath(c, -1)) // '/posts/:id'
*   return next()
* })
*
* app.get('/posts/:id', (c) => {
*   return c.text(routePath(c)) // '/posts/:id'
* })
* ```
*/
const routePath = (c, index) => matchedRoutes(c).at(index ?? c.req.routeIndex)?.path ?? "";
// node_modules/hono/dist/router.js
/**
* Array of supported HTTP methods.
*/
const METHODS = [
	"get",
	"post",
	"put",
	"delete",
	"options",
	"patch",
	"query"
];
/**
* Error message indicating that a route cannot be added because the matcher is already built.
*/
const MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
/**
* Error class representing an unsupported path error.
*/
var UnsupportedPathError = class extends Error {};
// node_modules/hono/dist/utils/constants.js
/**
* Constant used to mark a composed handler.
*/
const COMPOSED_HANDLER = "__COMPOSED_HANDLER";
// node_modules/hono/dist/utils/mount.js
const countTrailingSlashes = (path) => {
	let index = path.length;
	while (index > 0 && path.charCodeAt(index - 1) === 47) index--;
	return path.length - index;
};
const getPathPrefixLength = (c, pathPrefix, routePath) => {
	if (!/[:*]/.test(pathPrefix)) return pathPrefix.length;
	const path = c.req.path;
	const matchResult = c.req[GET_MATCH_RESULT];
	const paramNames = /* @__PURE__ */ new Set();
	let length = 0;
	for (const part of splitRoutingPath(pathPrefix)) {
		if (part[0] === ":" && part.endsWith("}?")) throw new Error(`mount(): Optional regular expression parameters are not supported in "${routePath}".`);
		const pattern = getPattern(part);
		if (pattern && pattern !== "*") {
			const name = pattern[1];
			if (paramNames.has(name)) throw new Error(`mount(): Duplicate path parameter "${name}" in "${routePath}".`);
			paramNames.add(name);
		}
		if (pattern && pattern !== "*" && pattern[2] !== true) {
			const value = matchResult.length === 2 ? matchResult[1][matchResult[0][c.req.routeIndex][1][pattern[1]]] : matchResult[0][c.req.routeIndex][1][pattern[1]];
			length += value.length + 1;
		} else if (pattern || part.endsWith("*")) {
			const end = path.indexOf("/", length + 1);
			length = end === -1 ? path.length : end;
		} else length += part.length + 1;
	}
	return length;
};
const createMountedRequest = (c, pathPrefix, routePath) => {
	if (/[^/]\*$/.test(routePath)) throw new Error(`mount(): Wildcard must follow "/" in "${routePath}".`);
	const prefixLength = getPathPrefixLength(c, pathPrefix, routePath);
	const path = c.req.path.slice(prefixLength) || "/";
	if (prefixLength > c.req.path.length || path[0] !== "/" || /\/(?:\.|%2e){1,2}(?:\/|$)/i.test(path)) throw new HTTPException(400, { message: "Invalid mounted path" });
	const rawUrl = c.req.raw.url;
	if (/^[^/?#]*\/\/[^/?#\\]*[?#\\]/.test(rawUrl)) throw new HTTPException(400, { message: "Invalid mounted path" });
	const rawPathEnd = rawUrl.search(/[?#]/);
	const rawTrailingSlashes = countTrailingSlashes(rawPathEnd === -1 ? rawUrl : rawUrl.slice(0, rawPathEnd));
	if (rawTrailingSlashes > 1 && countTrailingSlashes(c.req.path) === rawTrailingSlashes - 1) throw new HTTPException(400, { message: "Invalid mounted path" });
	const url = new URL(rawUrl);
	url.pathname = path.replace(/[\\\t\n\r]/g, encodeURIComponent);
	if (path.includes("%")) {
		let decoded;
		try {
			decoded = decodeURI(path);
		} catch {}
		if (decoded === void 0) {
			if (tryDecode(url.pathname, (value) => decodeURI(value.replace(/%25/g, "%2525"))) !== path) throw new HTTPException(400, { message: "Invalid mounted path" });
		}
	}
	return new Request(url, c.req.raw);
};
// node_modules/hono/dist/hono-base.js
/**
* @module
* This module is the base module for the Hono object.
*/
const notFoundHandler = (c) => {
	return c.text("404 Not Found", 404);
};
const errorHandler = (err, c) => {
	if ("getResponse" in err) {
		const res = err.getResponse();
		return c.newResponse(res.body, res);
	}
	console.error(err);
	return c.text("Internal Server Error", 500);
};
var Hono$1 = class Hono {
	get;
	post;
	put;
	delete;
	options;
	patch;
	query;
	all;
	on;
	use;
	router;
	getPath;
	_basePath = "/";
	#path = "/";
	routes = [];
	constructor(options = {}) {
		[...METHODS, "all"].forEach((method) => {
			this[method] = (args1, ...args) => {
				const methodName = method.toUpperCase();
				if (typeof args1 === "string") this.#path = args1;
				else this.#addRoute(methodName, this.#path, args1);
				args.forEach((handler) => {
					this.#addRoute(methodName, this.#path, handler);
				});
				return this;
			};
		});
		this.on = (method, path, ...handlers) => {
			for (const p of [path].flat()) {
				this.#path = p;
				for (const m of [method].flat()) {
					const methodName = m.toUpperCase();
					for (const handler of handlers) this.#addRoute(methodName, this.#path, handler);
				}
			}
			return this;
		};
		this.use = (arg1, ...handlers) => {
			if (typeof arg1 === "string") this.#path = arg1;
			else {
				this.#path = "*";
				handlers.unshift(arg1);
			}
			handlers.forEach((handler) => {
				this.#addRoute("ALL", this.#path, handler);
			});
			return this;
		};
		const { strict, ...optionsWithoutStrict } = options;
		Object.assign(this, optionsWithoutStrict);
		this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
	}
	#clone() {
		const clone = new Hono({
			router: this.router,
			getPath: this.getPath
		});
		clone.errorHandler = this.errorHandler;
		clone.#notFoundHandler = this.#notFoundHandler;
		clone.routes = this.routes;
		return clone;
	}
	#notFoundHandler = notFoundHandler;
	errorHandler = errorHandler;
	/**
	* `.route()` allows grouping other Hono instance in routes.
	*
	* @see {@link https://hono.dev/docs/api/routing#grouping}
	*
	* @param {string} path - base Path
	* @param {Hono} app - other Hono instance
	* @returns {Hono} routed Hono instance
	*
	* @example
	* ```ts
	* const app = new Hono()
	* const app2 = new Hono()
	*
	* app2.get("/user", (c) => c.text("user"))
	* app.route("/api", app2) // GET /api/user
	* ```
	*/
	route(path, app) {
		const subApp = this.basePath(path);
		app.routes.map((r) => {
			let handler;
			if (app.errorHandler === errorHandler) handler = r.handler;
			else {
				handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
				handler[COMPOSED_HANDLER] = r.handler;
			}
			subApp.#addRoute(r.method, r.path, handler, r.basePath);
		});
		return this;
	}
	/**
	* `.basePath()` allows base paths to be specified.
	*
	* @see {@link https://hono.dev/docs/api/routing#base-path}
	*
	* @param {string} path - base Path
	* @returns {Hono} changed Hono instance
	*
	* @example
	* ```ts
	* const api = new Hono().basePath('/api')
	* ```
	*/
	basePath(path) {
		const subApp = this.#clone();
		subApp._basePath = mergePath(this._basePath, path);
		return subApp;
	}
	/**
	* `.onError()` handles an error and returns a customized Response.
	*
	* @see {@link https://hono.dev/docs/api/hono#error-handling}
	*
	* @param {ErrorHandler} handler - request Handler for error
	* @returns {Hono} changed Hono instance
	*
	* @example
	* ```ts
	* app.onError((err, c) => {
	*   console.error(`${err}`)
	*   return c.text('Custom Error Message', 500)
	* })
	* ```
	*/
	onError = (handler) => {
		this.errorHandler = handler;
		return this;
	};
	/**
	* `.notFound()` allows you to customize a Not Found Response.
	*
	* @see {@link https://hono.dev/docs/api/hono#not-found}
	*
	* @param {NotFoundHandler} handler - request handler for not-found
	* @returns {Hono} changed Hono instance
	*
	* @example
	* ```ts
	* app.notFound((c) => {
	*   return c.text('Custom 404 Message', 404)
	* })
	* ```
	*/
	notFound = (handler) => {
		this.#notFoundHandler = handler;
		return this;
	};
	/**
	* `.mount()` allows you to mount applications built with other frameworks into your Hono application.
	*
	* @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
	*
	* @see {@link https://hono.dev/docs/api/hono#mount}
	*
	* @param {string} path - base Path
	* @param {Function} applicationHandler - other Request Handler
	* @param {MountOptions} [options] - options of `.mount()`
	* @returns {Hono} mounted Hono instance
	* @throws {Error} If automatic request rewriting encounters duplicate path parameter names or an optional regular expression parameter.
	* @throws {HTTPException} With status 400 if automatic request rewriting cannot safely preserve the routed path.
	*
	* @example
	* ```ts
	* import { Router as IttyRouter } from 'itty-router'
	* import { Hono } from 'hono'
	* // Create itty-router application
	* const ittyRouter = IttyRouter()
	* // GET /itty-router/hello
	* ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
	*
	* const app = new Hono()
	* app.mount('/itty-router', ittyRouter.handle)
	* ```
	*
	* @example
	* ```ts
	* const app = new Hono()
	* // Send the request to another application without modification.
	* app.mount('/app', anotherApp, {
	*   replaceRequest: (req) => req,
	* })
	* ```
	*/
	mount(path, applicationHandler, options) {
		let replaceRequest;
		let optionHandler;
		if (options) {
			if (typeof options === "function") optionHandler = options;
			else {
				optionHandler = options.optionHandler;
				if (options.replaceRequest === false) replaceRequest = (request) => request;
				else replaceRequest = options.replaceRequest;
			}
		}
		const getOptions = optionHandler ? (c) => {
			const options = optionHandler(c);
			return Array.isArray(options) ? options : [options];
		} : (c) => {
			let executionContext = void 0;
			try {
				executionContext = c.executionCtx;
			} catch {}
			return [c.env, executionContext];
		};
		const defaultReplaceRequest = (c) => {
			const mountedRoutePath = routePath(c);
			return createMountedRequest(c, mountedRoutePath.replace(/\/?\*$/, ""), mountedRoutePath);
		};
		const handler = async (c, next) => {
			const res = await applicationHandler(replaceRequest ? replaceRequest(c.req.raw) : defaultReplaceRequest(c), ...getOptions(c));
			if (res) return res;
			await next();
		};
		this.#addRoute("ALL", mergePath(path, "*"), handler);
		return this;
	}
	#addRoute(method, path, handler, baseRoutePath) {
		path = mergePath(this._basePath, path);
		const r = {
			basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
			path,
			method,
			handler
		};
		this.router.add(method, path, [handler, r]);
		this.routes.push(r);
	}
	#handleError(err, c) {
		if (err instanceof Error) return this.errorHandler(err, c);
		throw err;
	}
	#dispatch(request, executionCtx, env, method) {
		if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
		const path = this.getPath(request, { env });
		const matchResult = this.router.match(method, path);
		const c = new Context(request, {
			path,
			matchResult,
			env,
			executionCtx,
			notFoundHandler: this.#notFoundHandler
		});
		if (matchResult[0].length === 1) {
			let res;
			try {
				res = matchResult[0][0][0][0](c, async () => {
					c.res = await this.#notFoundHandler(c);
				});
			} catch (err) {
				return this.#handleError(err, c);
			}
			return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
		}
		const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
		return (async () => {
			try {
				const context = await composed(c);
				if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
				return context.res;
			} catch (err) {
				return this.#handleError(err, c);
			}
		})();
	}
	/**
	* `.fetch()` will be entry point of your app.
	*
	* @see {@link https://hono.dev/docs/api/hono#fetch}
	*
	* @param {Request} request - request Object of request
	* @param {Env} env - env Object
	* @param {ExecutionContext} executionCtx - context of execution
	* @returns {Response | Promise<Response>} response of request
	*
	*/
	fetch = (request, ...rest) => {
		return this.#dispatch(request, rest[1], rest[0], request.method);
	};
	/**
	* `.request()` is a useful method for testing.
	* You can pass a URL or pathname to send a GET request.
	* app will return a Response object.
	* ```ts
	* test('GET /hello is ok', async () => {
	*   const res = await app.request('/hello')
	*   expect(res.status).toBe(200)
	* })
	* ```
	* @see https://hono.dev/docs/api/hono#request
	*/
	request = (input, requestInit, Env, executionCtx) => {
		if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
		input = input.toString();
		return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
	};
	/**
	* `.fire()` automatically adds a global fetch event listener.
	* This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
	* @deprecated
	* Use `fire` from `hono/service-worker` instead.
	* ```ts
	* import { Hono } from 'hono'
	* import { fire } from 'hono/service-worker'
	*
	* const app = new Hono()
	* // ...
	* fire(app)
	* ```
	* @see https://hono.dev/docs/api/hono#fire
	* @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
	* @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
	*/
	fire = () => {
		addEventListener("fetch", (event) => {
			event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
		});
	};
};
// node_modules/hono/dist/router/utils.js
const createNullObject = () => Object.create(null);
// node_modules/hono/dist/router/reg-exp-router/matcher.js
const emptyParam = [];
function match(method, path) {
	const matchers = this.buildAllMatchers();
	const match = ((method, path) => {
		const matcher = matchers[method] || matchers["ALL"];
		const staticMatch = matcher[2][path];
		if (staticMatch) return staticMatch;
		const match = path.match(matcher[0]);
		if (!match) return [[], emptyParam];
		const index = match.indexOf("", 1);
		return [matcher[1][index], match];
	});
	this.match = match;
	return match(method, path);
}
// node_modules/hono/dist/router/reg-exp-router/node.js
const LABEL_REG_EXP_STR = "[^/]+";
const ONLY_WILDCARD_REG_EXP_STR = "[^]*";
const TAIL_WILDCARD_REG_EXP_STR = "(?:|/[^]*)";
const PATH_ERROR = Symbol();
const regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
/**
* Sort order:
* 1. literal
* 2. special pattern (e.g. :label{[0-9]+})
* 3. common label pattern (e.g. :label)
* 4. wildcard
*/
function compareKey(a, b) {
	if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
	if (b.length === 1) return 1;
	if (a === "[^]*" || a === "(?:|/[^]*)") return b === "[^]*" ? -1 : 1;
	else if (b === "[^]*" || b === "(?:|/[^]*)") return -1;
	if (a === "[^/]+") return 1;
	else if (b === "[^/]+") return -1;
	return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node$1 = class Node {
	#index;
	#varIndex;
	#children = createNullObject();
	insert(tokens, index, paramMap, context, keys) {
		let node = this;
		for (let i = 0, len = tokens.length; i < len; i++) {
			const token = tokens[i];
			const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
				"",
				"",
				ONLY_WILDCARD_REG_EXP_STR
			] : [
				"",
				"",
				LABEL_REG_EXP_STR
			] : null : token === "/*" ? [
				"",
				"",
				TAIL_WILDCARD_REG_EXP_STR
			] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
			let nextNode;
			if (pattern) {
				const name = pattern[1];
				let regexpStr = pattern[2] || "[^/]+";
				if (name && pattern[2]) {
					if (new RegExp(regexpStr).test("")) throw PATH_ERROR;
					regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
					if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
					if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
				}
				keys.push(regexpStr);
				nextNode = node.#children[regexpStr];
				if (!nextNode) {
					if (regexpStr !== "[^]*" && regexpStr !== "(?:|/[^]*)") {
						for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
					}
					nextNode = node.#children[regexpStr] = new Node();
				}
				if (name !== "") {
					nextNode.#varIndex ??= context.varIndex++;
					paramMap.push([name, nextNode.#varIndex]);
				}
			} else {
				keys.push(token);
				nextNode = node.#children[token];
				if (!nextNode) {
					for (const k in node.#children) if (k.length > 1 && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
					nextNode = node.#children[token] = new Node();
				}
			}
			node = nextNode;
		}
		if (node.#index !== void 0) throw PATH_ERROR;
		node.#index = index;
	}
	buildRegExpStr() {
		const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
			const c = this.#children[k];
			const childStr = c.buildRegExpStr();
			return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
		}).filter(Boolean);
		if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
		if (strList.length === 0) return "";
		if (strList.length === 1) return strList[0];
		return "(?:" + strList.join("|") + ")";
	}
};
// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
	#context = { varIndex: 0 };
	#root = new Node$1();
	#index = 0;
	paths = createNullObject();
	insert(path, isStatic) {
		const keys = [];
		if (isStatic) {
			this.#root.insert(path.split(""), -1, [], this.#context, keys);
			this.paths[path] = [
				-1,
				[],
				keys
			];
			return;
		}
		const paramAssoc = [];
		const groups = [];
		let markedPath = path;
		for (let i = 0;;) {
			let replaced = false;
			markedPath = markedPath.replace(/\{(?:\{[\d,]+\}|[^}])+\}/g, (m) => {
				const mark = `@\\${i}`;
				groups[i] = [mark, m];
				i++;
				replaced = true;
				return mark;
			});
			if (!replaced) break;
		}
		/**
		*  - pattern (:label, :label{0-9]+}, ...)
		*  - /* wildcard
		*  - character
		*/
		const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./gs) || [];
		for (let i = groups.length - 1; i >= 0; i--) {
			const [mark] = groups[i];
			for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
				tokens[j] = tokens[j].replace(mark, groups[i][1]);
				break;
			}
		}
		this.#root.insert(tokens, this.#index, paramAssoc, this.#context, keys);
		this.paths[path] = [
			this.#index++,
			paramAssoc,
			keys
		];
	}
	buildRegExp() {
		let regexp = this.#root.buildRegExpStr();
		if (regexp === "") return [
			/^$/,
			[],
			[]
		];
		let captureIndex = 0;
		const indexReplacementMap = [];
		const paramReplacementMap = [];
		regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
			if (handlerIndex !== void 0) {
				indexReplacementMap[++captureIndex] = Number(handlerIndex);
				return "$()";
			}
			if (paramIndex !== void 0) {
				paramReplacementMap[Number(paramIndex)] = ++captureIndex;
				return "";
			}
			return "";
		});
		return [
			new RegExp(`^${regexp}`),
			indexReplacementMap,
			paramReplacementMap
		];
	}
};
// node_modules/hono/dist/router/reg-exp-router/router.js
function endsWithWildcard(keys) {
	const tail = keys[keys.length - 1];
	return tail === "[^]*" || tail === "(?:|/[^]*)";
}
function covers(wildcard, target) {
	const last = wildcard.length - 1;
	for (let i = 0; i < last; i++) if (wildcard[i] !== target[i]) return false;
	return wildcard[last] === "[^]*" || target.length === last || target[last] === "/";
}
var RegExpRouter = class {
	name = "RegExpRouter";
	#handlers;
	#tries;
	constructor() {
		this.#handlers = { ["ALL"]: [] };
		this.#tries = { ["ALL"]: new Trie() };
	}
	#insertPath(method, path) {
		try {
			this.#tries[method].insert(path, !/\*|\/:/.test(path));
		} catch (e) {
			throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
		}
	}
	add(method, path, handler) {
		const handlers = this.#handlers;
		if (!handlers) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
		const tries = this.#tries;
		if (!handlers[method]) {
			tries[method] = new Trie();
			handlers[method] = [...handlers["ALL"]];
			for (const p in tries["ALL"].paths) this.#insertPath(method, p);
		}
		if (path === "/*") path = "*";
		const methods = method === "ALL" ? Object.keys(handlers) : [method];
		const paths = checkOptionalParameter(path) || [path];
		for (const path of paths) for (const m of methods) {
			if (!tries[m].paths[path]) this.#insertPath(m, path);
			handlers[m].push([handler, path]);
		}
	}
	match = match;
	buildAllMatchers() {
		const matchers = createNullObject();
		for (const method of Object.keys(this.#handlers)) matchers[method] = this.#buildMatcher(method);
		this.#handlers = this.#tries = void 0;
		return matchers;
	}
	#buildMatcher(method) {
		const handlers = this.#handlers[method];
		const trie = this.#tries[method];
		const staticMap = createNullObject();
		const handlerData = [];
		const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
		const own = createNullObject();
		const entries = handlers.map(([h, p], i) => {
			(own[p] ??= []).push(i);
			return [h, trie.paths[p][1].reduceRight((map, [key, varIndex]) => {
				map[key] = paramReplacementMap[varIndex];
				return map;
			}, createNullObject())];
		});
		const wildcards = Object.keys(own).filter((p) => endsWithWildcard(trie.paths[p][2]));
		for (const path in trie.paths) {
			const [index, , keys] = trie.paths[path];
			const indexes = [...own[path]];
			for (const p of wildcards) if (p !== path && covers(trie.paths[p][2], keys)) indexes.push(...own[p]);
			const data = indexes.sort((a, b) => a - b).map((i) => entries[i]);
			if (index === -1) {
				const last = Math.max(-1, ...data.flatMap(([, map]) => Object.values(map)));
				staticMap[path] = [data, last === -1 ? emptyParam : path.match(regexp).slice(0, last + 1)];
			} else handlerData[index] = data;
		}
		return [
			regexp,
			indexReplacementMap.map((i) => handlerData[i]),
			staticMap
		];
	}
};
// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
	name = "SmartRouter";
	#routers = [];
	#routes = [];
	constructor(init) {
		this.#routers = init.routers;
	}
	add(method, path, handler) {
		if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
		this.#routes.push([
			method,
			path,
			handler
		]);
	}
	match(method, path) {
		if (!this.#routes) throw new Error("Fatal error");
		const routers = this.#routers;
		const routes = this.#routes;
		const len = routers.length;
		let i = 0;
		let res;
		for (; i < len; i++) {
			const router = routers[i];
			try {
				for (let i = 0, len = routes.length; i < len; i++) router.add(...routes[i]);
				res = router.match(method, path);
			} catch (e) {
				if (e instanceof UnsupportedPathError) continue;
				throw e;
			}
			this.match = router.match.bind(router);
			this.#routers = [router];
			this.#routes = void 0;
			break;
		}
		if (i === len) throw new Error("Fatal error");
		this.name = `SmartRouter + ${this.activeRouter.name}`;
		return res;
	}
	get activeRouter() {
		if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
		return this.#routers[0];
	}
};
// node_modules/hono/dist/router/trie-router/node.js
const emptyParams = createNullObject();
let order = 0;
var Node = class Node {
	#methods = [];
	#children = createNullObject();
	#patterns = [];
	#pattern;
	#params = emptyParams;
	insert(method, path, handler) {
		let curNode = this;
		const parts = splitRoutingPath(path);
		const possibleKeys = /* @__PURE__ */ new Set();
		let i = 0;
		for (const p of parts) {
			const nextP = parts[++i];
			const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
			const isParam = Array.isArray(pattern);
			const key = isParam ? pattern[0] : pattern || p;
			const child = curNode.#children[key] ||= new Node();
			if (pattern && !child.#pattern) {
				child.#pattern = pattern;
				curNode.#patterns.push(child);
			}
			curNode = child;
			if (isParam) possibleKeys.add(pattern[1]);
		}
		curNode.#methods.push({ [method]: {
			handler,
			possibleKeys: [...possibleKeys],
			score: ++order
		} });
	}
	#pushHandlerSets(handlerSets, node, method, nodeParams, params) {
		for (let i = 0, len = node.#methods.length; i < len; i++) {
			const m = node.#methods[i];
			const handlerSet = m[method] || m["ALL"];
			if (handlerSet) {
				handlerSet.params = createNullObject();
				handlerSets.push(handlerSet);
				for (let i = 0, len = handlerSet.possibleKeys.length; i < len; i++) {
					const key = handlerSet.possibleKeys[i];
					handlerSet.params[key] = params?.[key] && !i ? params[key] : nodeParams[key] ?? params?.[key];
				}
			}
		}
	}
	search(method, path) {
		const handlerSets = [];
		this.#params = emptyParams;
		let curNodes = [this];
		const parts = splitPath(path);
		const curNodesQueue = [];
		const len = parts.length;
		let partOffsets = null;
		for (let i = 0; i < len; i++) {
			const part = parts[i];
			const isLast = i === len - 1;
			const tempNodes = [];
			for (let j = 0, len2 = curNodes.length; j < len2; j++) {
				const node = curNodes[j];
				const nextNode = node.#children[part];
				if (nextNode) {
					nextNode.#params = node.#params;
					if (isLast) {
						if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
						this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
					} else tempNodes.push(nextNode);
				}
				for (const child of node.#patterns) {
					const pattern = child.#pattern;
					const params = node.#params === emptyParams ? {} : { ...node.#params };
					if (typeof pattern === "string") {
						if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
							this.#pushHandlerSets(handlerSets, child, method, node.#params);
							if (pattern === "*") {
								child.#params = params;
								tempNodes.push(child);
							}
						}
						continue;
					}
					const [, name, matcher] = pattern;
					if (!part && matcher === true) continue;
					if (matcher !== true) {
						if (!partOffsets) {
							partOffsets = [];
							let offset = path[0] === "/" ? 1 : 0;
							for (let p = 0; p < len; p++) {
								partOffsets[p] = offset;
								offset += parts[p].length + 1;
							}
						}
						const restPathString = path.slice(partOffsets[i]);
						const m = matcher.exec(restPathString);
						if (m) {
							if (!Object.hasOwn(params, name)) params[name] = m[0];
							this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
							if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
							for (const _ in child.#children) {
								child.#params = params;
								const componentCount = m[0].match(/\//g)?.length ?? 0;
								(curNodesQueue[componentCount] ||= []).push(child);
								break;
							}
							continue;
						}
					}
					if (matcher === true || matcher.test(part)) {
						if (!Object.hasOwn(params, name)) params[name] = part;
						if (isLast) {
							this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
							if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
						} else {
							child.#params = params;
							tempNodes.push(child);
						}
					}
				}
			}
			const shifted = curNodesQueue.shift();
			curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
		}
		if (handlerSets[1]) handlerSets.sort((a, b) => {
			return a.score - b.score;
		});
		return [handlerSets.map(({ handler, params }) => [handler, params])];
	}
};
// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
	name = "TrieRouter";
	#node = new Node();
	add(method, path, handler) {
		for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler);
	}
	match(method, path) {
		return this.#node.search(method, path);
	}
};
// node_modules/hono/dist/hono.js
/**
* The Hono class extends the functionality of the HonoBase class.
* It sets up routing and allows for custom options to be passed.
*
* @template E - The environment type.
* @template S - The schema type.
* @template BasePath - The base path type.
*/
var Hono = class extends Hono$1 {
	/**
	* Creates an instance of the Hono class.
	*
	* @param options - Optional configuration options for the Hono instance.
	*/
	constructor(options = {}) {
		super(options);
		this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
	}
};
// node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
var Cached = class {
	constructor(getter) {
		this._getter = getter;
		this._value = void 0;
	}
	get value() {
		const getter = this._getter;
		if (getter !== void 0) {
			this._value = getter();
			this._getter = void 0;
		}
		return this._value;
	}
};
function cached(getter) {
	return new Cached(getter);
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
/**
* Whichever object a def's `shape` currently answers from: the one the caller passed until the first read, the frozen copy after it.
*
* Its keys and descriptors read without invoking anything, which is what lets a discriminated union check its discriminator, and the cycle walk read a shape, without resolving a getter that references the schema being constructed. A def that answers `shape` from an accessor of its own has none.
*/
function rawShape(def) {
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
	return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
	Object.defineProperty(target, key, {
		get() {
			const value = getter();
			assignProp(this, key, value);
			return value;
		},
		enumerable: true,
		configurable: true
	});
}
function putProp(target, key, value) {
	if (key in target) assignProp(target, key, value);
	else target[key] = value;
}
/**
* Copies `keys` of `source`'s shape onto `target`, each value passed through `wrap`.
*
* A key the source has resolved is copied through now, so the derived shape states it outright and nothing has to resolve it to learn what it holds. A key the source still defers stays deferred, and reads back through the source's own `shape`, so it resolves once and both shapes get that one schema.
*/
function mirrorShape(target, source, keys, wrap) {
	const raw = sourceShape(source);
	for (const key of keys) {
		const desc = Object.getOwnPropertyDescriptor(raw, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => {
			const value = source._zod.def.shape[key];
			return wrap ? wrap(value, key) : value;
		});
		else putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
	}
}
function mirrorProps(target, source) {
	for (const key of Reflect.ownKeys(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key);
		if (!desc.enumerable) continue;
		if (desc.get) deferProp(target, key, () => source[key]);
		else putProp(target, key, desc.value);
	}
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc$1(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__*/ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
const propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
const BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__*/ BigInt("-9223372036854775808"), /* @__PURE__*/ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__*/ BigInt(0), /* @__PURE__*/ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	const newShape = {};
	mirrorShape(newShape, schema, maskedKeys(schema, mask));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function maskedKeys(schema, mask) {
	const raw = sourceShape(schema);
	const keys = [];
	for (const key of Reflect.ownKeys(mask)) {
		if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
		if (mask[key]) keys.push(key);
	}
	return keys;
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	const omitted = new Set(maskedKeys(schema, mask));
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
	return clone(schema, mergeDefs(currDef, {
		shape: newShape,
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = sourceShape(schema);
		for (const key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
	mirrorProps(newShape, shape);
	return newShape;
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
	if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	const newShape = {};
	mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
	mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
	return clone(a, mergeDefs(a._zod.def, {
		shape: newShape,
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask, name = "partial") {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({
		type: "optional",
		innerType: value
	})));
	return clone(schema, mergeDefs(schema._zod.def, {
		shape: newShape,
		checks: []
	}));
}
function required(Class, schema, mask) {
	const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
	const newShape = {};
	mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({
		type: "nonoptional",
		innerType: value
	}));
	return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
/** The leading size checks of `defChecks` that set an upper bound, each paired with it. */
function sizeCaps(defChecks) {
	const caps = [];
	for (const ch of defChecks ?? []) {
		const d = ch._zod.def;
		if (!/_(length|size)$|_equals$/.test(d.check)) break;
		const max = d.maximum ?? d.length ?? d.size;
		if (max >= 0) caps.push([max, ch]);
	}
	return caps;
}
function attachSchema(issues, start, inst) {
	var _a;
	for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
	var _a;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) {
		if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
		else iss.schema = iss.inst;
	}
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const full = {};
	for (const k of Object.keys(iss)) {
		if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
		full[k] = iss[k];
	}
	full.path ?? (full.path = []);
	full.message = message;
	if (ctx?.reportInput) full.input = iss.input;
	return full;
}
const highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
	const units = str.length;
	if (!highSurrogate.test(str)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
/**
* Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
*
* Call this from a `proto` initializer, which runs once per prototype — never per instance.
*/
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
/** Adds members a table derives from the instance: each builds on first read and shadows as own data, and assignment shadows the same way, as when these were own properties. */
/* @__NO_SIDE_EFFECTS__ */
function derived(computes, table) {
	for (const key in computes) {
		const compute = computes[key];
		Object.defineProperty(table, key, {
			configurable: true,
			enumerable: true,
			get() {
				return own(this, key, compute(this));
			},
			set(value) {
				own(this, key, value);
			}
		});
	}
	return table;
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
let installing;
let broke = false;
const breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
/**
* Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
* constructor, computed from the internals object itself and cached there on
* first read. One accessor per constructor rather than one per instance.
*/
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
/**
* Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
* data property. One accessor per constructor rather than one per instance, because an own accessor
* puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
*/
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
/** Marks the thunk `_catch` synthesises for a constant catch value. `Function.length` cannot tell that thunk from a user callback — rest and defaulted parameters both report arity 0 — and a user callback reads `ctx.error`, whose issues only finalize correctly against the caller's per-parse error map. Provenance can say what arity cannot. A plain string key rather than `Symbol.for`, whose call at module scope no bundler can prove pure — the same shape that anchored `urlCanParse` into every build. */
const CONSTANT_CATCH = "~constantCatch";
/** Wraps a constant catch value in a thunk tagged with {@link CONSTANT_CATCH}. */
function constantCatch(value) {
	const fn = () => value;
	fn[CONSTANT_CATCH] = true;
	return fn;
}
// node_modules/zod/v4/core/core.js
var _a$1;
const _zodDesc = {
	value: void 0,
	enumerable: false
};
let _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
/* @__NO_SIDE_EFFECTS__ */
function $constructor(name, initializer, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc);
			} finally {
				_zodDesc.value = void 0;
			}
		} else if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		if (initialized) {
			const own = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto = _.prototype;
		for (const k in proto) {
			if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
// node_modules/zod/v4/core/errors.js
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
const _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
const _issuesDesc = {
	value: void 0,
	enumerable: false
};
const _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
const initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
const $ZodError = /* @__PURE__ */ $constructor("$ZodError", initializer$1);
/** Get-or-create `obj[key]` as an own data property. A path segment naming an inherited member
* ("toString", "constructor") would otherwise read through to the prototype, and assigning
* "__proto__" would hit the setter instead of creating a key. */
function node(obj, key, make) {
	if (!Object.prototype.hasOwnProperty.call(obj, key)) {
		if (key === "__proto__") Object.defineProperty(obj, key, {
			value: make(),
			writable: true,
			enumerable: true,
			configurable: true
		});
		else obj[key] = make();
	}
	return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
	else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error, path = []) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					const terminal = i === fullpath.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
						value: { _errors: [] },
						enumerable: true,
						writable: true,
						configurable: true
					});
					const node = curr[el];
					if (terminal) node._errors.push(mapper(issue));
					curr = node;
					i++;
				}
			}
		}
	};
	processError(error);
	return fieldErrors;
}
// node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
	return {
		callee: params?.callee ?? callee,
		Err: params?.Err
	};
}
const _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
function failure(Err, issues, ctx) {
	let error;
	return {
		success: false,
		get error() {
			if (!error) {
				error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
				issues = void 0;
				ctx = void 0;
			}
			return error;
		},
		set error(e) {
			error = e;
			issues = void 0;
			ctx = void 0;
		}
	};
}
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
const COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
const COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
const validate = ((schema, value, _ctx) => {
	const validator = schema._zod.bag.validator;
	if (validator !== void 0) {
		if (validator(value) !== COMPILE_INVALID) return true;
		if (validator.definite === true && _ctx === void 0) return false;
	}
	return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
	const ctx = _ctx ? {
		..._ctx,
		async: false,
		abortEarly: true
	} : {
		async: false,
		abortEarly: true
	};
	const fallbackRun = schema._zod.bag.fallbackRun;
	let result;
	if (fallbackRun) {
		ctx[COMPILE_FALLBACK] = true;
		result = fallbackRun({
			value,
			issues: []
		}, ctx);
	} else result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length === 0;
}
const validateAsync$1 = async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true,
		abortEarly: true
	} : {
		async: true,
		abortEarly: true
	};
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length === 0;
};
const _encode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return parse(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decode = (_Err) => {
	const parse = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _encodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" };
		return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _decodeAsync = (_Err) => {
	const parseAsync = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
const _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
// node_modules/zod/v4/core/regexes.js
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
	return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
/** Practical email validation */
const email$1 = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
const _emoji$1 = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
/** Anchors a pattern source. The interpolation lives here rather than at the call site because
* esbuild will not drop a `@__PURE__` call whose own argument interpolates a variable, but it
* will drop `anchor(dateSource)`. Keeping it inline pinned `date` into every bundle. */
function anchor(source) {
	return new RegExp(`^${source}$`);
}
const date = /*@__PURE__*/ anchor(dateSource);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
	const opts = ["Z"];
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const qualified = `${timeSource({
		precision: args.precision,
		seconds: true
	})}(?:${opts.join("|")})`;
	const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const anyString = /^[\s\S]{0,}$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const boolean$1 = /^(?:true|false)$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
// node_modules/zod/v4/core/checks.js
const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
const _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
const numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	def.pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
// node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = [], closed = {}) {
		this.content = [];
		this.indent = 0;
		this.args = args;
		this.closed = closed;
	}
	indented(fn) {
		this.indent += 1;
		try {
			fn(this);
		} finally {
			this.indent -= 1;
		}
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const content = this?.content ?? [``];
		return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`)(...Object.values(this.closed));
	}
};
// node_modules/zod/v4/core/versions.js
const version$1 = {
	major: 4,
	minor: 6,
	patch: 7
};
// node_modules/zod/v4/core/schemas.js
const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version$1;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
const toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
	const ctx = { async: true };
	return toStandardResult(await inst._zod.run({
		value,
		issues: []
	}, ctx), ctx);
}
function standardProps(inst) {
	return {
		validate: (value) => {
			const ctx = { async: false };
			try {
				const r = inst._zod.run({
					value,
					issues: []
				}, ctx);
				if (!(r instanceof Promise)) return toStandardResult(r, ctx);
			} catch (_) {}
			return validateAsync(inst, value);
		},
		vendor: "zod",
		version: 1
	};
}
const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = def.pattern ?? anyString;
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email$1);
	$ZodStringFormat.init(inst, def);
});
function canParseURL(input) {
	try {
		if (typeof URL !== "undefined" && typeof URL.canParse === "function") return URL.canParse(input);
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
function validateURL(trimmed, def) {
	if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) return canParseURL(trimmed) || 2;
	return parseURLObject(trimmed, def);
}
/** Parses a URL while preserving the non-normalizing HTTP guard. */
function parseURLObject(trimmed, def) {
	if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return 1;
	try {
		if (typeof URL !== "undefined") {
			const URLStatic = URL;
			if (typeof URLStatic.parse === "function") return URLStatic.parse(trimmed) ?? 2;
		}
		return new URL(trimmed);
	} catch {
		return 2;
	}
}
const asciiTabOrNewline = /[\t\n\r]/g;
/** The URL parser deletes every ASCII tab, LF and CR from its input before it parses, so `new URL("https://exa\nmple.com")` reports on `example.com`. Applying the same deletion to the returned value closes the half of that divergence which can move the host; the parser's other rewrite, stripping C0 controls at the edges, cannot. */
function stripTabAndNewline(value) {
	return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
	hostname.lastIndex = 0;
	return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
	protocol.lastIndex = 0;
	return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = validateURL(trimmed, def);
			if (url === 1) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === 2) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === true) {
				payload.value = stripTabAndNewline(trimmed);
				return;
			}
			if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: def.hostname.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: def.protocol.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
	if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
	def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
	$ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
});
/** An IPv6 address is written with hex digits, colons and dots, and nothing else. The guard is what makes the check below an IPv6 check: `new URL("http://[...]")` parses an authority, not an address, so `@` and `\` re-delimit it and `"::@1\\"` validates against the host `0.0.0.1`. The URL parser also deletes ASCII tab, LF and CR rather than failing, which is how `"::1\n"` validated as `::1`. */
const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
	if (!ipv6Alphabet.test(value)) return false;
	return canParseURL(`http://[${value}]`);
}
const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidIPv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
	const parts = value.split("/");
	if (parts.length !== 2) return false;
	const [address, prefix] = parts;
	if (!prefix) return false;
	const prefixNum = Number(prefix);
	if (`${prefixNum}` !== prefix) return false;
	if (prefixNum < 0 || prefixNum > 128) return false;
	return isValidIPv6(address);
}
const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidCIDRv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64Charset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
	if (!base64urlCharset.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64urlCharset);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function capSize(inst, size) {
	const caps = sizeCaps(inst._zod.def.checks);
	if (!caps.length) return;
	const cap = Math.min(...caps.map((c) => c[0]));
	const parse = inst._zod.parse;
	inst._zod.parse = (payload, ctx) => {
		const n = size(payload.value);
		if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
			for (const [max, ch] of sizeCaps(inst._zod.def.checks)) if (n > max && ch._zod.def.when(payload)) {
				const start = payload.issues.length;
				ch._zod.check(payload);
				payload.issues[start].continue = false;
				attachSchema(payload.issues, start, inst);
				return payload;
			}
		}
		return parse(payload, ctx);
	};
}
const arraySize = (input) => Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		const abortEarly = ctx?.abortEarly;
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else {
				handleArrayResult(result, payload, i);
				if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
	capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
const NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	let seen = 0;
	for (const key in input) {
		if (abortEarly && payload.issues.length !== seen) {
			if (aborted(payload, seen)) break;
			seen = payload.issues.length;
		}
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	const sh = desc?.get ? desc.get.raw : def.shape ?? {};
	if (sh) {
		const get = () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			get.raw = newSh;
			return newSh;
		};
		get.raw = sh;
		Object.defineProperty(def, "shape", { get });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		const abortEarly = ctx?.abortEarly;
		let seen = payload.issues.length;
		for (const key of value.allKeys) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
	};
});
const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const memo = globalConfig.memoizer;
	const generateFastpass = (shape) => {
		const normalized = _normalized.value;
		const syms = normalized.symbolKeys;
		const doc = new Doc(["payload", "ctx"], {
			shape,
			inst,
			memo,
			syms
		});
		const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.allKeys) ids[key] = `key_${counter++}`;
		doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
		for (const key of normalized.allKeys) {
			if (key === "__proto__") continue;
			const id = ids[key];
			const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc$1(key);
			const isPresent = `${k} in input`;
			const schema = shape[key];
			const optin = schema?._zod?.optin;
			const isOptionalIn = optin !== void 0;
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(k)};`);
			if (isOptionalIn && isOptionalOut) {
				const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
				doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			} else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
			else {
				doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
				if (optin === "defaulted") doc.write(`newResult[${k}] = ${id}.value;`);
				else doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
			}
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		return doc.compile();
	};
	let fastpass;
	const isObject$2 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
	defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazyInternal(inst, "values", (zod) => {
		if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		if (zod.def.options.every((o) => o._zod.pattern)) {
			const patterns = zod.def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	const keyIssues = /* @__PURE__ */ new Map();
	const collect = (iss, side) => {
		let keys;
		if (iss.code === "unrecognized_keys" && !iss.path?.length) {
			unrecIssue ?? (unrecIssue = iss);
			keys = iss.keys;
		} else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
			const k = String(iss.path[0]);
			if (!keyIssues.has(k)) keyIssues.set(k, iss);
			keys = [k];
		} else return false;
		for (const k of keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k)[side] = true;
		}
		return true;
	};
	for (const iss of left.issues) if (!collect(iss, "l")) result.issues.push(iss);
	for (const iss of right.issues) if (!collect(iss, "r")) result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length) {
		const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
		if (aggregated.length) result.issues.push({
			...unrecIssue,
			keys: aggregated
		});
		for (const k of bothKeys) if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
	}
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) {
		if (aborted(result)) return result;
		throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	}
	result.value = merged.data;
	return result;
}
const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	defineLazyInternal(inst, "pattern", (zod) => {
		const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
		return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	const values = new Set(def.values);
	inst._zod.values = values;
	defineLazyInternal(inst, "pattern", (zod) => {
		const vals = zod.def.values;
		return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	globalConfig.memoizer?.guard(inst);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => {
		const v = zod.def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
function handleCatchResult(payload, result, def, ctx) {
	if (!result.issues.length) {
		payload.value = result.value;
		if (result.memo) payload.memo = true;
		return payload;
	}
	payload.value = def.catchValue({
		...result,
		value: payload.value,
		error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
		input: payload.value
	});
	return payload;
}
const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run({
			value: payload.value,
			issues: []
		}, ctx);
		if (result instanceof Promise) return result.then((result) => handleCatchResult(payload, result, def, ctx));
		return handleCatchResult(payload, result, def, ctx);
	};
});
const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	if (!payload.memo) payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
// node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
	constructor() {
		super(`Cannot parse a reference cycle that closes through a transform`);
		this.name = "ZodCyclicError";
	}
};
/** Keyed off the context object every schema in one parse call already shares. */
const STATE = "~memo";
const NO_ISSUES = [];
function isRef(value) {
	return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
	return issues.map((iss) => iss.path ? {
		...iss,
		path: iss.path.slice()
	} : { ...iss });
}
const recursive = /*@__PURE__*/ new WeakMap();
/** What the walk established, in order of certainty: ordered so the strongest answer among children wins. */
const NONE = 0;
const ASSUMED = 1;
const PROVEN = 2;
/** Whether this schema's subtree contains a cycle, so one parse can re-enter it. */
function isRecursive(inst, stack, resolve) {
	const cached = recursive.get(inst);
	if (cached !== void 0) return cached ? PROVEN : NONE;
	if (stack.has(inst)) return PROVEN;
	stack.add(inst);
	let result = NONE;
	const check = (child) => {
		if (result !== PROVEN && child?._zod) {
			const answer = isRecursive(child, stack, resolve);
			if (answer > result) result = answer;
		}
	};
	const shape = (sh, spread) => {
		let answer = NONE;
		for (const key of Reflect.ownKeys(sh)) {
			const desc = Object.getOwnPropertyDescriptor(sh, key);
			if (spread && !desc.enumerable) continue;
			const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
			if (child > answer) answer = child;
		}
		return answer;
	};
	const merge = (answer) => {
		if (answer > result) result = answer;
	};
	const def = inst._zod.def;
	switch (def.type) {
		case "object": {
			const raw = rawShape(def);
			merge(raw ? shape(raw, true) : ASSUMED);
			check(def.catchall);
			break;
		}
		case "array":
			check(def.element);
			break;
		case "tuple":
			for (const el of def.items) check(el);
			check(def.rest);
			break;
		case "record":
		case "map":
			check(def.keyType);
			check(def.valueType);
			break;
		case "set":
			check(def.valueType);
			break;
		case "union":
			for (const el of def.options) check(el);
			break;
		case "intersection":
			check(def.left);
			check(def.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			check(def.innerType);
			break;
		case "pipe":
			check(def.in);
			check(def.out);
			break;
		case "function":
			check(def.input);
			check(def.output);
			break;
		case "lazy": {
			const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
			merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
			break;
		}
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (const key in def) {
			const desc = Object.getOwnPropertyDescriptor(def, key);
			if (!desc || desc.get) continue;
			const value = desc.value;
			if (!value || typeof value !== "object") continue;
			if (value._zod) check(value);
			else if (Array.isArray(value)) for (const el of value) check(el);
		}
	}
	stack.delete(inst);
	return settle(inst, result);
}
/** An assumed answer must not outlive the resolution that settles it, so only a certain one is cached. */
function settle(inst, answer) {
	if (answer !== ASSUMED) recursive.set(inst, answer === PROVEN);
	return answer;
}
function bucketFor(state, inst) {
	let bucket = state.buckets.get(inst);
	if (!bucket) {
		bucket = /* @__PURE__ */ new WeakMap();
		state.buckets.set(inst, bucket);
	}
	return bucket;
}
let handoff;
const open = [];
const memo = {
	alloc(_inst, payload, empty) {
		const bucket = handoff;
		if (!bucket) return empty;
		handoff = void 0;
		const entry = {
			value: empty,
			issues: null
		};
		bucket.set(payload.value, entry);
		open.push(entry);
		return empty;
	},
	guard(inst) {
		var _a;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
				return base(payload, ctx);
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	},
	attach(inst) {
		var _a;
		let isRecursiveInst;
		let rechecked = false;
		let lastCtx;
		let lastBucket;
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (isRecursiveInst === void 0) {
					const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
					if (walked === NONE) {
						inst._zod.parse = base;
						if (inst._zod.run === wrapped) inst._zod.run = base;
						return base(payload, ctx);
					}
					if (walked === PROVEN || rechecked) isRecursiveInst = true;
					else rechecked = true;
				}
				const input = payload.value;
				if (!isRef(input)) return base(payload, ctx);
				let state = ctx[STATE];
				if (!state) {
					state = {
						buckets: /* @__PURE__ */ new WeakMap(),
						backEdges: void 0
					};
					ctx[STATE] = state;
				}
				let bucket;
				if (lastCtx === ctx) bucket = lastBucket;
				else {
					bucket = bucketFor(state, inst);
					lastCtx = ctx;
					lastBucket = bucket;
				}
				const hit = bucket.get(input);
				if (hit) {
					payload.value = hit.value;
					if (hit.issues) {
						if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
					} else {
						payload.memo = true;
						state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
						state.backEdges.add(hit.value);
					}
					return payload;
				}
				handoff = bucket;
				const depth = open.length;
				const result = base(payload, ctx);
				handoff = void 0;
				const entry = open.length > depth ? open.pop() : void 0;
				if (result instanceof Promise) return result.then((r) => {
					if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
					return r;
				});
				if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
				return result;
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	}
};
/** The memoizer that gives containers cycle support. `zod` installs it by default; `zod/mini` opts in with `config({ memoizer: memoizer() })`. */
function memoizer() {
	return memo;
}
/** Whether this value is a node a back-edge resolved to before it finished. */
function isBackEdge(ctx, value) {
	const backEdges = ctx[STATE]?.backEdges;
	return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}
// node_modules/zod/v4/locales/en.js
const error$1 = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	function getTypeName(type, input) {
		if (type === "number" && typeof input === "number" && !Number.isFinite(input)) return String(input);
		return TypeDictionary[type] ?? type;
	}
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": return `Invalid input: expected ${getTypeName(issue.expected)}, received ${getTypeName(parsedType(issue.input), issue.input)}`;
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union":
				if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) return `Invalid discriminator value. Expected ${issue.options.map((o) => `'${o}'`).join(" | ")}`;
				if (issue.inclusive === false) return "Invalid input: more than one option matched";
				return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error$1() };
}
// node_modules/zod/v4/core/registries.js
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;
// node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
	if (def.checks) def.checks = [...def.checks];
	return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class(snapshotChecks({
		type: "string",
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link _cuid2} instead.
* See https://github.com/paralleldrive/cuid.
*/
// @__NO_SIDE_EFFECTS__
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class(snapshotChecks({
		type: "number",
		checks: [],
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
// node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
	for (const source of sources) for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProp(target, key, source[key]);
	return target;
}
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: params?.external ?? void 0
	};
}
/**
* Applies the `unrepresentable` setting at a site that has no JSON Schema equivalent. Throws
* `message` unless the setting (or the handler's return value) says otherwise. Returns `true` if a
* custom JSON Schema was written into `json`, in which case the caller must not write its own.
*/
function handleUnrepresentable(schema, ctx, json, params, message) {
	const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({
		zodSchema: schema,
		path: params.path,
		message
	}) : ctx.unrepresentable;
	if (result === "any") return false;
	if (result === void 0 || result === "throw") throw new Error(message);
	Object.assign(json, result);
	return true;
}
function processSchema(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	ctx.sharedDefsExtractedFor = void 0;
	ctx.sharedEmitDoneFor = void 0;
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			processSchema(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) assignProps(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function encodeJSONPointerSegment(segment) {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
			};
		}
		const uriPrefix = `#`;
		const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
		if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + encodeJSONPointerSegment(defId)
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") extractToDef(entry);
		}
	}
	if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
/** Rewrites `anyOf: [{type: "a"}, {type: "b"}]` to `type: ["a", "b"]`, which every JSON Schema draft treats as equivalent and most consumers render far better for the nullable case. Only branches that are a bare type assertion qualify — anything carrying a constraint, `$ref`, `const` or metadata is left alone. Runs after `flattenRef`, so a branch an override decorated or `$defs` extraction turned into a `$ref` is no longer bare and correctly stays in `anyOf`. `oneOf` is excluded: `integer` and `number` overlap, so "exactly one" and "at least one" are not the same there. OpenAPI 3.0 is excluded: its `type` must be a single string. */
function compactTypeUnion(schema) {
	const options = schema.anyOf;
	if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
	const types = [];
	for (const option of options) {
		if (!option || typeof option !== "object") return;
		compactTypeUnion(option);
		const keys = Object.keys(option);
		if (keys.length !== 1 || keys[0] !== "type") return;
		const type = option.type;
		for (const member of Array.isArray(type) ? type : [type]) {
			if (typeof member !== "string") return;
			if (!types.includes(member)) types.push(member);
		}
	}
	delete schema.anyOf;
	schema.type = types.length === 1 ? types[0] : types;
}
/** Keywords `foldIntersection` knows how to combine. Anything else — `$ref`, `patternProperties`,
* an annotation like `description` — makes a member unfoldable, so a constraint this does not
* understand leaves the `allOf` alone instead of being silently dropped or misattributed. */
const FOLDABLE_KEYS = /* @__PURE__ */ new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]);
const UNION_KEYS = ["oneOf", "anyOf"];
/** A member's constraint on a key it does not declare itself. A `catchall` states one; `false`, an absent `additionalProperties`, and the empty schema a loose object emits state nothing. */
function undeclaredConstraint(member) {
	const extra = member.additionalProperties;
	if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null) return null;
	return Object.keys(extra).length ? extra : null;
}
/** Combines object members into the single object they describe together, or returns `null` if any of them carries a keyword outside {@link FOLDABLE_KEYS}. */
function foldObjects(members) {
	const objects = [];
	for (const member of members) {
		if (typeof member !== "object" || member.type !== "object") return null;
		for (const key in member) if (!FOLDABLE_KEYS.has(key)) return null;
		objects.push(member);
	}
	const properties = {};
	const required = /* @__PURE__ */ new Set();
	for (const object of objects) {
		for (const key in object.properties) {
			if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
			const parts = [];
			for (const other of objects) {
				const part = other.properties?.[key] ?? undeclaredConstraint(other);
				if (part === null || part === void 0) continue;
				if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
			}
			assignProp(properties, key, parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts });
		}
		for (const key of object.required ?? []) required.add(key);
	}
	const folded = {
		type: "object",
		properties
	};
	if (required.size) folded.required = [...required];
	if (objects.every((object) => object.additionalProperties === false)) folded.additionalProperties = false;
	else {
		const constraints = [];
		for (const object of objects) {
			const constraint = undeclaredConstraint(object);
			if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
		}
		if (constraints.length === 1) folded.additionalProperties = constraints[0];
		else if (constraints.length > 1) folded.additionalProperties = { allOf: constraints };
	}
	return folded;
}
/** `additionalProperties` in an `allOf` member sees only that member's own `properties`, so two
* closed object members reject each other's keys and the schema validates nothing. Zod's parser
* pools the key sets instead — `handleIntersectionResults` reports a key as unrecognized only when
* *every* side rejects it — so the emitted schema has to pool them too, and folding the members
* into one object is the encoding that says so on every target.
*
* This runs from `finalize`, after `extractDefs`, which is what keeps it clear of the `$ref`
* machinery: a member extracted into `$defs` is already a `$ref` by now and declines to fold, so it
* keeps its reference and its own closedness rather than being inlined as a stale copy. */
function foldIntersection(json) {
	const allOf = json.allOf;
	if (!Array.isArray(allOf) || allOf.length < 2) return;
	for (const key of FOLDABLE_KEYS) if (key in json) return;
	const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
	let folded = null;
	if (!unions.length) folded = foldObjects(allOf);
	else {
		const union = unions[0];
		const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
		if (Object.keys(union).length !== 1) return;
		const rest = allOf.filter((m) => m !== union);
		const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
		if (branches.some((b) => !b)) return;
		folded = { [keyword]: branches };
	}
	if (!folded) return;
	delete json.allOf;
	assignProps(json, folded);
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else assignProps(schema, refSchema);
			assignProps(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
		for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
		if (ctx.target !== "openapi-3.0") for (const entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
		for (const rewrite of ctx.deferred) rewrite();
		if (ctx.intersections.length) {
			const carriers = /* @__PURE__ */ new Map();
			for (const seen of ctx.seen.values()) for (const json of [seen.schema, seen.def]) {
				const allOf = json?.allOf;
				if (!Array.isArray(allOf)) continue;
				const existing = carriers.get(allOf);
				if (existing) existing.push(json);
				else carriers.set(allOf, [json]);
			}
			for (const allOf of ctx.intersections) for (const json of carriers.get(allOf) ?? []) foldIntersection(json);
		}
	}
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			assignProp(defs, seen.defId, seen.def);
		}
	}
	if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
	if (ctx.external) {} else if (Object.keys(defs).length > 0) {
		if (ctx.target === "draft-2020-12") result.$defs = defs;
		else result.definitions = defs;
	}
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	processSchema(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
// node_modules/zod/v4/core/json-schema-processors.js
const narrowMin = (agg, key, value) => {
	if (agg[key] === void 0 || value > agg[key]) agg[key] = value;
};
const narrowMax = (agg, key, value) => {
	if (agg[key] === void 0 || value < agg[key]) agg[key] = value;
};
const narrowBoth = (agg, value) => {
	narrowMin(agg, "minimum", value);
	narrowMax(agg, "maximum", value);
};
const addDivisor = (agg, value) => {
	agg.multipleOf ?? (agg.multipleOf = []);
	if (!agg.multipleOf.includes(value)) agg.multipleOf.push(value);
};
const addPattern = (agg, pattern) => {
	agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
	agg.patterns.add(pattern);
};
const intersectMime = (agg, mime) => {
	agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
const setFormat = (agg, format) => {
	agg.format = format;
	if (format.includes("int")) agg.isInt = true;
};
const minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
const maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
const formatContributor = (ranges) => (agg, def) => {
	setFormat(agg, def.format);
	const [minimum, maximum] = ranges[def.format];
	narrowMin(agg, "minimum", minimum);
	narrowMax(agg, "maximum", maximum);
};
const contributors = {
	greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
	less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
	multiple_of: (agg, def) => addDivisor(agg, def.value),
	number_format: formatContributor(NUMBER_FORMAT_RANGES),
	bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
	min_length: minContributor,
	max_length: maxContributor,
	length_equals: (agg, def) => narrowBoth(agg, def.length),
	min_size: minContributor,
	max_size: maxContributor,
	size_equals: (agg, def) => narrowBoth(agg, def.size),
	string_format: (agg, def) => {
		setFormat(agg, def.format);
		if (def.pattern) addPattern(agg, def.pattern);
		if (def.format === "base64" || def.format === "base64url") agg.contentEncoding = def.format;
		if (def.local || def.precision === -1) agg.laxFormat = true;
	},
	mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
	const agg = {};
	const def = schema._zod.def;
	const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
	for (const ch of list) contributors[ch._zod.def.check]?.(agg, ch._zod.def);
	const bag = schema._zod.bag;
	if (bag.minimum !== void 0) narrowMin(agg, "minimum", bag.minimum);
	if (bag.exclusiveMinimum !== void 0) narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
	if (bag.maximum !== void 0) narrowMax(agg, "maximum", bag.maximum);
	if (bag.exclusiveMaximum !== void 0) narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
	if (bag.multipleOf !== void 0) addDivisor(agg, bag.multipleOf);
	if (bag.format !== void 0) {
		agg.format ?? (agg.format = bag.format);
		if (bag.format.includes("int")) agg.isInt = true;
	}
	if (bag.mime) intersectMime(agg, bag.mime);
	for (const pattern of bag.patterns ?? []) addPattern(agg, pattern);
	return agg;
}
const formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
const exactPatterns = /* @__PURE__ */ new Map([[base64Charset, base64], [base64urlCharset, base64url]]);
const exactPattern = (p) => exactPatterns.get(p) ?? p;
const stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time" || laxFormat) delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const patternList = [...patterns].map(exactPattern);
		if (patternList.length === 1) json.pattern = patternList[0].source;
		else if (patternList.length > 1) json.allOf = [...patternList.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
const numberProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
	json.type = isInt ? "integer" : "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) {
		if (legacy) {
			json.minimum = exclusiveMinimum;
			json.exclusiveMinimum = true;
		} else json.exclusiveMinimum = exclusiveMinimum;
	} else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) {
		if (legacy) {
			json.maximum = exclusiveMaximum;
			json.exclusiveMaximum = true;
		} else json.exclusiveMaximum = exclusiveMaximum;
	} else if (typeof maximum === "number") json.maximum = maximum;
	if (multipleOf) {
		const divisors = /* @__PURE__ */ new Set();
		for (const divisor of multipleOf) if (Number.isFinite(divisor) && divisor !== 0) divisors.add(Math.abs(divisor));
		else handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
		const [first, ...rest] = divisors;
		if (first !== void 0) json.multipleOf = first;
		if (rest.length) json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
	}
};
const booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
const neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
const enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.length === 0) {
		json.not = {};
		return;
	}
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
const literalProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	if (def.values.length === 0) {
		json.not = {};
		return;
	}
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
	} else if (typeof val === "bigint") {
		if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
		vals.push(Number(val));
	} else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
const customProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = aggregateChecks(schema);
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = processSchema(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
function inputOptin(schema) {
	const def = schema._zod.def;
	if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
	if (def.type === "catch") return inputOptin(def.innerType);
	return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const shape = def.shape;
	if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
	json.type = "object";
	json.properties = {};
	for (const key in shape) assignProp(json.properties, key, processSchema(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	}));
	const requiredKeys = [];
	for (const key of Object.keys(shape)) {
		const field = def.shape[key];
		if (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) requiredKeys.push(key);
	}
	if (requiredKeys.length > 0) json.required = requiredKeys;
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = processSchema(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
const unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => processSchema(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = processSchema(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = processSchema(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	const allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
	json.allOf = allOf;
	ctx.intersections.push(allOf);
};
const nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
/** Round-trips a default value through JSON so the emitted schema is guaranteed to be valid JSON.
* A BigInt has no reliable encoding, so it goes through `unrepresentable` like any other
* unrepresentable value. Returns a sentinel when the caller must not write a default of its own. */
const UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
	let unrepresentable = false;
	const serialized = JSON.stringify(value, (_, val) => {
		if (typeof val !== "bigint") return val;
		unrepresentable = true;
		return null;
	});
	if (!unrepresentable) return JSON.parse(serialized);
	handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
	return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io !== "input") return;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	processSchema(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	processSchema(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
// node_modules/zod/v4/classic/errors.js
const _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
	Object.defineProperty(proto, key, {
		configurable: true,
		enumerable: false,
		get() {
			const value = make(this);
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
			return value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
		}
	});
}
const initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	const proto = Object.getPrototypeOf(inst);
	if (_installedErrorProtos.has(proto)) return;
	_installedErrorProtos.add(proto);
	_lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
	_lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
	_lazyMethod(proto, "addIssue", (self) => (issue) => {
		self.issues.push(issue);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	_lazyMethod(proto, "addIssues", (self) => (issues) => {
		self.issues.push(...issues);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	Object.defineProperty(proto, "isEmpty", {
		configurable: true,
		enumerable: false,
		get() {
			return this.issues.length === 0;
		}
	});
};
const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, void 0, { Parent: Error });
// node_modules/zod/v4/classic/parse.js
const parse$1 = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode$3 = /* @__PURE__ */ _encode(ZodRealError);
const decode$1 = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode$1 = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
// node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
	if (!globalConfig.localeError) config(en_default());
}
function _ensureDefaultMemoizer() {
	if (!globalConfig.memoizer) config({ memoizer: memoizer() });
}
const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
	_ensureDefaultLocale();
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
	return inst;
}, {
	check(...chks) {
		const def = this.def;
		return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	},
	with(...chks) {
		return this.check(...chks);
	},
	clone(def, params) {
		return clone(this, def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta) {
		reg.add(this, meta);
		return this;
	},
	refine(check, params) {
		return this.check(refine(check, params));
	},
	superRefine(refinement, params) {
		return this.check(superRefine(refinement, params));
	},
	overwrite(fn) {
		return this.check(/* @__PURE__ */ _overwrite(fn));
	},
	optional() {
		return optional(this);
	},
	exactOptional() {
		return exactOptional(this);
	},
	nullable() {
		return nullable(this);
	},
	nullish() {
		return optional(nullable(this));
	},
	nonoptional(params) {
		return nonoptional(this, params);
	},
	array() {
		return array(this);
	},
	or(arg) {
		return union([this, arg]);
	},
	and(arg) {
		return intersection(this, arg);
	},
	transform(tx) {
		return pipe(this, transform(tx));
	},
	default(d) {
		return _default(this, d);
	},
	prefault(d) {
		return prefault(this, d);
	},
	catch(params) {
		return _catch(this, params);
	},
	pipe(target) {
		return pipe(this, target);
	},
	readonly() {
		return readonly(this);
	},
	describe(description) {
		const cl = this.clone();
		globalRegistry.add(cl, { description });
		return cl;
	},
	meta(...args) {
		if (args.length === 0) return globalRegistry.get(this);
		const cl = this.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	},
	get "~standard"() {
		return hide(this, "~standard", {
			...standardProps(this),
			jsonSchema: {
				input: createStandardJSONSchemaMethod(this, "input"),
				output: createStandardJSONSchemaMethod(this, "output")
			}
		});
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	},
	parse: function _parse(data, params) {
		return parse$1(this, data, params, { callee: _parse });
	},
	parseAsync: async function _parseAsync(data, params) {
		return await parseAsync(this, data, params, { callee: _parseAsync });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	async safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(value) {
		own(this, "spa", value);
	},
	validate(data, params) {
		return validate(this, data, params);
	},
	validateAsync(data, params) {
		return validateAsync$1(this, data, params);
	},
	encode: function _encode(data, params) {
		return encode$3(this, data, params, { callee: _encode });
	},
	decode: function _decode(data, params) {
		return decode$1(this, data, params, { callee: _decode });
	},
	encodeAsync: async function _encodeAsync(data, params) {
		return await encodeAsync(this, data, params, { callee: _encodeAsync });
	},
	decodeAsync: async function _decodeAsync(data, params) {
		return await decodeAsync(this, data, params, { callee: _decodeAsync });
	},
	safeEncode(data, params) {
		return safeEncode(this, data, params);
	},
	safeDecode(data, params) {
		return safeDecode$1(this, data, params);
	},
	async safeEncodeAsync(data, params) {
		return safeEncodeAsync(this, data, params);
	},
	async safeDecodeAsync(data, params) {
		return safeDecodeAsync(this, data, params);
	},
	toJSONSchema(params) {
		return createToJSONSchemaMethod(this, {})(params);
	},
	get description() {
		return globalRegistry.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
});
/** @internal */
const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /*@__PURE__*/ derived({
	format: (inst) => aggregateChecks(inst).format ?? null,
	minLength: (inst) => aggregateChecks(inst).minimum ?? null,
	maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
	regex(...args) {
		return this.check(/* @__PURE__ */ _regex(...args));
	},
	includes(...args) {
		return this.check(/* @__PURE__ */ _includes(...args));
	},
	startsWith(...args) {
		return this.check(/* @__PURE__ */ _startsWith(...args));
	},
	endsWith(...args) {
		return this.check(/* @__PURE__ */ _endsWith(...args));
	},
	min(...args) {
		return this.check(/* @__PURE__ */ _minLength(...args));
	},
	max(...args) {
		return this.check(/* @__PURE__ */ _maxLength(...args));
	},
	length(...args) {
		return this.check(/* @__PURE__ */ _length(...args));
	},
	nonempty(...args) {
		return this.check(/* @__PURE__ */ _minLength(1, ...args));
	},
	lowercase(params) {
		return this.check(/* @__PURE__ */ _lowercase(params));
	},
	uppercase(params) {
		return this.check(/* @__PURE__ */ _uppercase(params));
	},
	trim() {
		return this.check(/* @__PURE__ */ _trim());
	},
	normalize(...args) {
		return this.check(/* @__PURE__ */ _normalize(...args));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ _toLowerCase());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ _toUpperCase());
	},
	slugify() {
		return this.check(/* @__PURE__ */ _slugify());
	}
}));
const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
}, {
	email(params) {
		return this.check(/* @__PURE__ */ _email(ZodEmail, params));
	},
	url(params) {
		return this.check(/* @__PURE__ */ _url(ZodURL, params));
	},
	jwt(params) {
		return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	},
	emoji(params) {
		return this.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	},
	guid(params) {
		return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
	},
	uuid(params) {
		return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	},
	uuidv4(params) {
		return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	},
	uuidv6(params) {
		return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	},
	uuidv7(params) {
		return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	},
	nanoid(params) {
		return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	},
	cuid(params) {
		return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	},
	cuid2(params) {
		return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	},
	ulid(params) {
		return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
	},
	base64(params) {
		return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
	},
	base64url(params) {
		return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	},
	xid(params) {
		return this.check(/* @__PURE__ */ _xid(ZodXID, params));
	},
	ksuid(params) {
		return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	},
	ipv4(params) {
		return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	},
	ipv6(params) {
		return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	},
	cidrv4(params) {
		return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	},
	cidrv6(params) {
		return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	},
	e164(params) {
		return this.check(/* @__PURE__ */ _e164(ZodE164, params));
	},
	datetime(params) {
		return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
	},
	date(params) {
		return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
	},
	time(params) {
		return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
	},
	duration(params) {
		return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
	}
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function email(params) {
	return /* @__PURE__ */ _email(ZodEmail, params);
}
const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function url(params) {
	return /* @__PURE__ */ _url(ZodURL, params);
}
const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
/**
* @deprecated CUID v1 is deprecated by its authors due to information leakage
* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
* See https://github.com/paralleldrive/cuid.
*/
const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.isFinite = true;
}, /*@__PURE__*/ derived({
	minValue: (inst) => {
		const { minimum, exclusiveMinimum } = aggregateChecks(inst);
		return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
	},
	maxValue: (inst) => {
		const { maximum, exclusiveMaximum } = aggregateChecks(inst);
		return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
	},
	isInt: (inst) => {
		const { isInt, multipleOf } = aggregateChecks(inst);
		return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
	},
	format: (inst) => aggregateChecks(inst).format ?? null
}, {
	gt(value, params) {
		return this.check(/* @__PURE__ */ _gt(value, params));
	},
	gte(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	min(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	lt(value, params) {
		return this.check(/* @__PURE__ */ _lt(value, params));
	},
	lte(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	max(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	int(params) {
		return this.check(int(params));
	},
	safe(params) {
		return this.check(int(params));
	},
	positive(params) {
		return this.check(/* @__PURE__ */ _gt(0, params));
	},
	nonnegative(params) {
		return this.check(/* @__PURE__ */ _gte(0, params));
	},
	negative(params) {
		return this.check(/* @__PURE__ */ _lt(0, params));
	},
	nonpositive(params) {
		return this.check(/* @__PURE__ */ _lte(0, params));
	},
	multipleOf(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	step(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	finite() {
		return this;
	}
}));
function number(params) {
	return /* @__PURE__ */ _number(ZodNumber, params);
}
const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodBoolean, params);
}
const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => void 0;
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
}, {
	min(n, params) {
		return this.check(/* @__PURE__ */ _minLength(n, params));
	},
	nonempty(params) {
		return this.check(/* @__PURE__ */ _minLength(1, params));
	},
	max(n, params) {
		return this.check(/* @__PURE__ */ _maxLength(n, params));
	},
	length(n, params) {
		return this.check(/* @__PURE__ */ _length(n, params));
	},
	unwrap() {
		return this.element;
	}
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
	keyof() {
		return _enum(Object.keys(this._zod.def.shape));
	},
	catchall(catchall) {
		return this.clone(mergeDefs(this._zod.def, { catchall }));
	},
	passthrough() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	loose() {
		return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
	},
	strict() {
		return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
	},
	strip() {
		return this.clone(mergeDefs(this._zod.def, { catchall: void 0 }));
	},
	extend(incoming) {
		return extend(this, incoming);
	},
	safeExtend(incoming) {
		return safeExtend(this, incoming);
	},
	merge(other) {
		return merge(this, other);
	},
	pick(mask) {
		return pick(this, mask);
	},
	omit(mask) {
		return omit(this, mask);
	},
	partial(...args) {
		return partial(ZodOptional, this, args[0]);
	},
	exactPartial(...args) {
		return partial(ZodExactOptional, this, args[0], "exactPartial");
	},
	required(...args) {
		return required(ZodNonOptional, this, args[0]);
	}
});
function object(shape, params) {
	const def = {
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	};
	return new ZodObject(def);
}
const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = [...inst._zod.values];
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
	return new ZodEnum({
		type: "enum",
		entries,
		...normalizeParams(params)
	});
}
const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
	});
}
const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
// server/auth.ts
const SESSION_HOURS = 12;
const hashPassword = (password, salt) => scryptSync(password, salt, 64).toString("hex");
/**
* First run only: set the admin password from ADMIN_PASSWORD, or generate one and log it.
* After that the password is managed in /admin → Settings (env changes are ignored),
* unless ADMIN_PASSWORD_RESET=1 is set, which forces the env password again.
*/
async function initAuth(store) {
	const rec = await store.getKV("auth", null);
	const envPw = process$1.env.ADMIN_PASSWORD;
	if (rec && !(envPw && process$1.env.ADMIN_PASSWORD_RESET === "1")) return;
	const salt = randomBytes(16).toString("hex");
	const password = envPw || randomBytes(9).toString("base64url");
	await store.setKV("auth", {
		salt,
		hash: hashPassword(password, salt),
		secret: randomBytes(32).toString("hex")
	});
	if (!envPw) {
		console.log("\n  ┌──────────────────────────────────────────────────────────┐");
		console.log(`  │  Admin password (first run): ${password.padEnd(28)}│`);
		console.log("  │  Change it in /admin → Settings.                         │");
		console.log("  └──────────────────────────────────────────────────────────┘\n");
	}
}
async function checkPassword(store, password) {
	const rec = await store.getKV("auth", null);
	if (!rec) return false;
	const a = Buffer$1.from(hashPassword(password, rec.salt), "hex");
	const b = Buffer$1.from(rec.hash, "hex");
	return a.length === b.length && timingSafeEqual(a, b);
}
async function setPassword(store, password) {
	const salt = randomBytes(16).toString("hex");
	await store.setKV("auth", {
		salt,
		hash: hashPassword(password, salt),
		secret: randomBytes(32).toString("hex")
	});
}
const sign$1 = (payload, secret) => createHmac("sha256", secret).update(payload).digest("base64url");
async function issueToken(store) {
	const rec = await store.getKV("auth", null);
	if (!rec) throw new Error("Auth not initialised");
	const payload = Buffer$1.from(JSON.stringify({ exp: Date.now() + SESSION_HOURS * 36e5 })).toString("base64url");
	return `${payload}.${sign$1(payload, rec.secret)}`;
}
async function verifyToken(store, token) {
	if (!token) return false;
	const [payload, sig] = token.split(".");
	if (!payload || !sig) return false;
	const rec = await store.getKV("auth", null);
	if (!rec) return false;
	const expected = sign$1(payload, rec.secret);
	if (expected.length !== sig.length || !timingSafeEqual(Buffer$1.from(expected), Buffer$1.from(sig))) return false;
	try {
		const { exp } = JSON.parse(Buffer$1.from(payload, "base64url").toString());
		return Date.now() < exp;
	} catch {
		return false;
	}
}
// node_modules/nodemailer/dist/esm/punycode/index.js
/** Highest positive signed 32-bit float value */
const maxInt = 2147483647;
/** Bootstring parameters */
const base = 36;
const tMin = 1;
const tMax = 26;
const skew = 38;
const damp = 700;
const initialBias = 72;
const initialN = 128;
const delimiter = "-";
/** Regular expressions */
const regexPunycode = /^xn--/;
const regexNonASCII = /[^\0-\x7F]/;
const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
/** Error messages */
const errors = {
	overflow: "Overflow: input needs wider integers to process",
	"not-basic": "Illegal input >= 0x80 (not a basic code point)",
	"invalid-input": "Invalid input"
};
/** Convenience shortcuts */
const baseMinusTMin = 35;
const floor = Math.floor;
const stringFromCharCode = String.fromCharCode;
/**
* A generic error utility function.
* @private
* @param type The error type.
* @returns Throws a `RangeError` with the applicable error message.
*/
function error(type) {
	throw new RangeError(errors[type]);
}
/**
* A generic `Array#map` utility function.
* @private
* @param array The array to iterate over.
* @param callback The function that gets called for every array
* item.
* @returns A new array of values returned by the callback function.
*/
function map(array, callback) {
	const result = [];
	let length = array.length;
	while (length--) result[length] = callback(array[length]);
	return result;
}
/**
* A simple `Array#map`-like wrapper to work with domain name strings or email
* addresses.
* @private
* @param domain The domain name or email address.
* @param callback The function that gets called for every
* character.
* @returns A new string of characters returned by the callback
* function.
*/
function mapDomain(domain, callback) {
	const parts = domain.split("@");
	let result = "";
	if (parts.length > 1) {
		result = parts[0] + "@";
		domain = parts[1];
	}
	domain = domain.replace(regexSeparators, ".");
	const encoded = map(domain.split("."), callback).join(".");
	return result + encoded;
}
/**
* Creates an array containing the numeric code points of each Unicode
* character in the string. While JavaScript uses UCS-2 internally,
* this function will convert a pair of surrogate halves (each of which
* UCS-2 exposes as separate characters) into a single code point,
* matching UTF-16.
* @see `punycode.ucs2.encode`
* @see <https://mathiasbynens.be/notes/javascript-encoding>
* @memberOf punycode.ucs2
* @name decode
* @param string The Unicode input string (UCS-2).
* @returns The new array of code points.
*/
function ucs2decode(string) {
	const output = [];
	let counter = 0;
	const length = string.length;
	while (counter < length) {
		const value = string.charCodeAt(counter++);
		if (value >= 55296 && value <= 56319 && counter < length) {
			const extra = string.charCodeAt(counter++);
			if ((extra & 64512) == 56320) output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
			else {
				output.push(value);
				counter--;
			}
		} else output.push(value);
	}
	return output;
}
/**
* Converts a basic code point into a digit/integer.
* @see `digitToBasic()`
* @private
* @param codePoint The basic numeric code point value.
* @returns The numeric value of a basic code point (for use in
* representing integers) in the range `0` to `base - 1`, or `base` if
* the code point does not represent a value.
*/
const basicToDigit = function(codePoint) {
	if (codePoint >= 48 && codePoint < 58) return 26 + (codePoint - 48);
	if (codePoint >= 65 && codePoint < 91) return codePoint - 65;
	if (codePoint >= 97 && codePoint < 123) return codePoint - 97;
	return base;
};
/**
* Converts a digit/integer into a basic code point.
* @see `basicToDigit()`
* @private
* @param digit The numeric value of a basic code point.
* @param flag Non-zero to use the uppercase form of the code point.
* @returns The basic code point whose value (when used for
* representing integers) is `digit`, which needs to be in the range
* `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
* used; else, the lowercase form is used. The behavior is undefined
* if `flag` is non-zero and `digit` has no uppercase form.
*/
const digitToBasic = function(digit, flag) {
	return digit + 22 + 75 * Number(digit < 26) - (Number(flag != 0) << 5);
};
/**
* Bias adaptation function as per section 3.4 of RFC 3492.
* https://tools.ietf.org/html/rfc3492#section-3.4
* @private
*/
const adapt = function(delta, numPoints, firstTime) {
	let k = 0;
	delta = firstTime ? floor(delta / damp) : delta >> 1;
	delta += floor(delta / numPoints);
	for (; delta > 455; k += base) delta = floor(delta / baseMinusTMin);
	return floor(k + 36 * delta / (delta + skew));
};
/**
* Converts a Punycode string of ASCII-only symbols to a string of Unicode
* symbols.
* @memberOf punycode
* @param input The Punycode string of ASCII-only symbols.
* @returns The resulting string of Unicode symbols.
*/
const decode = function(input) {
	const output = [];
	const inputLength = input.length;
	let i = 0;
	let n = initialN;
	let bias = initialBias;
	let basic = input.lastIndexOf(delimiter);
	if (basic < 0) basic = 0;
	for (let j = 0; j < basic; ++j) {
		if (input.charCodeAt(j) >= 128) error("not-basic");
		output.push(input.charCodeAt(j));
	}
	for (let index = basic > 0 ? basic + 1 : 0; index < inputLength;) {
		const oldi = i;
		for (let w = 1, k = base;; k += base) {
			if (index >= inputLength) error("invalid-input");
			const digit = basicToDigit(input.charCodeAt(index++));
			if (digit >= base) error("invalid-input");
			if (digit > floor((maxInt - i) / w)) error("overflow");
			i += digit * w;
			const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
			if (digit < t) break;
			const baseMinusT = base - t;
			if (w > floor(maxInt / baseMinusT)) error("overflow");
			w *= baseMinusT;
		}
		const out = output.length + 1;
		bias = adapt(i - oldi, out, oldi == 0);
		if (floor(i / out) > maxInt - n) error("overflow");
		n += floor(i / out);
		i %= out;
		output.splice(i++, 0, n);
	}
	return String.fromCodePoint(...output);
};
/**
* Converts a string of Unicode symbols (e.g. a domain name label) to a
* Punycode string of ASCII-only symbols.
* @memberOf punycode
* @param input The string of Unicode symbols.
* @returns The resulting Punycode string of ASCII-only symbols.
*/
const encode$2 = function(input) {
	const output = [];
	const codePoints = ucs2decode(input);
	const inputLength = codePoints.length;
	let n = initialN;
	let delta = 0;
	let bias = initialBias;
	for (const currentValue of codePoints) if (currentValue < 128) output.push(stringFromCharCode(currentValue));
	const basicLength = output.length;
	let handledCPCount = basicLength;
	if (basicLength) output.push(delimiter);
	while (handledCPCount < inputLength) {
		let m = maxInt;
		for (const currentValue of codePoints) if (currentValue >= n && currentValue < m) m = currentValue;
		const handledCPCountPlusOne = handledCPCount + 1;
		if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) error("overflow");
		delta += (m - n) * handledCPCountPlusOne;
		n = m;
		for (const currentValue of codePoints) {
			if (currentValue < n && ++delta > maxInt) error("overflow");
			if (currentValue === n) {
				let q = delta;
				for (let k = base;; k += base) {
					const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
					if (q < t) break;
					const qMinusT = q - t;
					const baseMinusT = base - t;
					output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
					q = floor(qMinusT / baseMinusT);
				}
				output.push(stringFromCharCode(digitToBasic(q, 0)));
				bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
				delta = 0;
				++handledCPCount;
			}
		}
		++delta;
		++n;
	}
	return output.join("");
};
/**
* Converts a Punycode string representing a domain name or an email address
* to Unicode. Only the Punycoded parts of the input will be converted, i.e.
* it doesn't matter if you call it on a string that has already been
* converted to Unicode.
* @memberOf punycode
* @param input The Punycoded domain name or email address to
* convert to Unicode.
* @returns The Unicode representation of the given Punycode
* string.
*/
const toUnicode = function(input) {
	return mapDomain(input, function(string) {
		return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
	});
};
/**
* Converts a Unicode string representing a domain name or an email address to
* Punycode. Only the non-ASCII parts of the domain name will be converted,
* i.e. it doesn't matter if you call it with a domain that's already in
* ASCII.
* @memberOf punycode
* @param input The domain name or email address to convert, as a
* Unicode string.
* @returns The Punycode representation of the given domain name or
* email address.
*/
const toASCII = function(input) {
	return mapDomain(input, function(string) {
		return regexNonASCII.test(string) ? "xn--" + encode$2(string) : string;
	});
};
// node_modules/nodemailer/dist/esm/shared/url.js
const SLASHLESS_AUTHORITY = /^([a-zA-Z][a-zA-Z0-9+.-]*:)(?!\/\/)([\s\S]+)$/;
/**
* Drops the leading and trailing C0 controls and spaces, which the WHATWG parser strips
* before it looks at the input. Stripped up front so that the slash-less form is recognized
* in a value read from a file with a trailing newline as well. An index scan, the regex
* /^[\x00-\x20]+|[\x00-\x20]+$/g retried a run of spaces inside the value from every
* position in it
*
* @param input URL string
* @returns The string without the surrounding controls and spaces
*/
function stripSurroundingWhitespace(input) {
	let start = 0;
	let end = input.length;
	while (start < end && input.charCodeAt(start) <= 32) start++;
	while (end > start && input.charCodeAt(end - 1) <= 32) end--;
	return input.slice(start, end);
}
const LEGACY_TRIM = /^[\x00-\x20\u00a0\ufeff]+/;
const AUTHORITY = /^([a-zA-Z0-9+.-]+:)?[\\/]{2}([^\\/?#]*)/;
const FORBIDDEN_HOST_CHARS = /[\x00-\x20#/:<>?@[\\\]^|\x7f]/;
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;
function invalidUrl(input) {
	const err = /* @__PURE__ */ new TypeError("Invalid URL");
	err.code = "ERR_INVALID_URL";
	err.input = input;
	return err;
}
function legacyParse(input, parseQueryString, whatwgError, slashesDenoteHost) {
	const parsed = urllib.parse(input, parseQueryString, slashesDenoteHost);
	const authority = AUTHORITY.exec(input.replace(LEGACY_TRIM, ""));
	if (authority && (authority[1] || parsed.hostname !== null)) {
		const written = authority[2].slice(authority[2].lastIndexOf("@") + 1);
		if (!written || CONTROL_CHARS.test(written) || (parsed.host || "").toLowerCase() !== toASCII(written.toLowerCase())) throw whatwgError;
		if (written.charAt(0) === "[" && !net.isIPv6(written.slice(1, written.indexOf("]")))) throw whatwgError;
	} else if (parsed.hostname !== null) throw whatwgError;
	const legacyAuth = parsed.auth === null || parsed.auth === void 0 ? null : parsed.auth.split(":");
	const result = parsed;
	result.username = legacyAuth ? legacyAuth.shift() : null;
	result.password = legacyAuth && legacyAuth.length ? legacyAuth.join(":") : null;
	return result;
}
function safeDecode(str) {
	try {
		return decodeURIComponent(str);
	} catch (_err) {
		return str;
	}
}
function normalizeHostname(raw, href) {
	const hostname = raw || "";
	if (!hostname) return "";
	if (hostname.charAt(0) === "[" && hostname.charAt(hostname.length - 1) === "]") return hostname.slice(1, -1);
	const decoded = safeDecode(hostname);
	const mapped = FORBIDDEN_HOST_CHARS.test(decoded) ? "" : urllib.domainToASCII(decoded);
	if (!mapped) throw invalidUrl(href);
	return mapped;
}
const parse = (input, parseQueryString) => {
	input = stripSurroundingWhitespace(input || "");
	const slashless = SLASHLESS_AUTHORITY.exec(input);
	const normalized = slashless ? slashless[1] + "//" + slashless[2] : input;
	let u;
	try {
		u = new URL(normalized);
	} catch (err) {
		return legacyParse(normalized, parseQueryString, err);
	}
	const hostname = normalizeHostname(u.hostname, u.href);
	const port = u.port || null;
	const pathname = u.pathname || null;
	const search = u.search || null;
	let auth = null;
	let username = null;
	let password = null;
	if (u.username || u.password) {
		username = safeDecode(u.username);
		password = u.password ? safeDecode(u.password) : null;
		auth = username + (password !== null ? ":" + password : "");
	}
	let query;
	if (parseQueryString) {
		const parsed = Object.create(null);
		u.searchParams.forEach((value, key) => {
			if (Object.prototype.hasOwnProperty.call(parsed, key)) {
				const existing = parsed[key];
				if (Array.isArray(existing)) existing.push(value);
				else parsed[key] = [existing, value];
			} else parsed[key] = value;
		});
		query = parsed;
	} else query = search ? search.slice(1) : null;
	return {
		protocol: u.protocol || null,
		host: u.host || null,
		hostname,
		port,
		pathname,
		search,
		path: (pathname || "") + (search || "") || null,
		href: u.href,
		auth,
		username,
		password,
		query
	};
};
const resolve$2 = (from, to) => {
	try {
		return new URL(to, from).href;
	} catch (err) {
		legacyParse(from, false, err, true);
		legacyParse(to, false, err, true);
		return urllib.resolve(from, to);
	}
};
// node_modules/nodemailer/dist/esm/fetch/cookies.js
const SESSION_TIMEOUT = 1800;
/**
* Creates a biskviit cookie jar for managing cookie values in memory
*
* @constructor
* @param [options] Optional options object
*/
var Cookies = class {
	constructor(options) {
		this.options = options || {};
		this.cookies = [];
	}
	/**
	* Stores a cookie string to the cookie storage
	*
	* @param cookieStr Value from the 'Set-Cookie:' header
	* @param url Current URL
	*/
	set(cookieStr, url) {
		const urlparts = parse(url || "");
		const cookie = this.parse(cookieStr);
		let domain;
		if (cookie.domain) {
			domain = cookie.domain.replace(/^\./, "");
			if (urlparts.hostname.length < domain.length || domain.indexOf(".") < 0 || domain.endsWith(".") || net.isIP(urlparts.hostname) || !("." + urlparts.hostname).endsWith("." + domain)) cookie.domain = urlparts.hostname;
		} else cookie.domain = urlparts.hostname;
		if (!cookie.path) cookie.path = this.getPath(urlparts.pathname);
		if (!cookie.expires) cookie.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || SESSION_TIMEOUT) || SESSION_TIMEOUT) * 1e3);
		if (urlparts.protocol !== "https:" && (cookie.secure || this.cookies.some((stored) => stored.secure && this.compare(stored, cookie)))) return false;
		return this.add(cookie);
	}
	/**
	* Returns cookie string for the 'Cookie:' header.
	*
	* @param url URL to check for
	* @returns Cookie header or empty string if no matches were found
	*/
	get(url) {
		return this.list(url).map((cookie) => cookie.name + "=" + cookie.value).join("; ");
	}
	/**
	* Lists all valied cookie objects for the specified URL
	*
	* @param url URL to check for
	* @returns An array of cookie objects
	*/
	list(url) {
		const result = [];
		for (let i = this.cookies.length - 1; i >= 0; i--) {
			const cookie = this.cookies[i];
			if (this.isExpired(cookie)) {
				this.cookies.splice(i, 1);
				continue;
			}
			if (this.match(cookie, url)) result.unshift(cookie);
		}
		return result;
	}
	/**
	* Parses cookie string from the 'Set-Cookie:' header
	*
	* @param cookieStr String from the 'Set-Cookie:' header
	* @returns Cookie object
	*/
	parse(cookieStr) {
		const cookie = {};
		let hasNameValue = false;
		let hasMaxAge = false;
		(cookieStr || "").toString().split(";").forEach((cookiePart) => {
			if (!cookiePart.trim()) return;
			const valueParts = cookiePart.split("=");
			const name = valueParts.shift().trim();
			let value = valueParts.join("=").trim();
			let domain;
			if (!hasNameValue) {
				hasNameValue = true;
				if (name) {
					cookie.name = name;
					cookie.value = value;
				}
				return;
			}
			switch (name.toLowerCase()) {
				case "expires": {
					const expires = new Date(value);
					if (expires.toString() !== "Invalid Date" && !hasMaxAge) cookie.expires = expires;
					break;
				}
				case "path":
					cookie.path = value;
					break;
				case "domain":
					domain = value.toLowerCase();
					if (domain.length && domain.charAt(0) !== ".") domain = "." + domain;
					cookie.domain = domain;
					break;
				case "max-age":
					cookie.expires = new Date(Date.now() + (Number(value) || 0) * 1e3);
					hasMaxAge = true;
					break;
				case "secure":
					cookie.secure = true;
					break;
				case "httponly": cookie.httponly = true;
			}
		});
		return cookie;
	}
	/**
	* Checks if a cookie object is valid for a specified URL
	*
	* @param cookie Cookie object
	* @param url URL to check for
	* @returns true if cookie is valid for specifiec URL
	*/
	match(cookie, url) {
		const urlparts = parse(url || "");
		if (urlparts.hostname !== cookie.domain && (cookie.domain.charAt(0) !== "." || ("." + urlparts.hostname).substr(-cookie.domain.length) !== cookie.domain)) return false;
		const pathname = urlparts.pathname || "/";
		const cookiePath = cookie.path;
		if (!(pathname === cookiePath || pathname.startsWith(cookiePath) && (cookiePath.endsWith("/") || pathname.charAt(cookiePath.length) === "/"))) return false;
		if (cookie.secure && urlparts.protocol !== "https:") return false;
		return true;
	}
	/**
	* Adds (or updates/removes if needed) a cookie object to the cookie storage
	*
	* @param cookie Cookie value to be stored
	*/
	add(cookie) {
		if (!cookie || !cookie.name) return false;
		for (let i = 0, len = this.cookies.length; i < len; i++) if (this.compare(this.cookies[i], cookie)) {
			if (this.isExpired(cookie)) {
				this.cookies.splice(i, 1);
				return false;
			}
			this.cookies[i] = cookie;
			return true;
		}
		if (!this.isExpired(cookie)) this.cookies.push(cookie);
		return true;
	}
	/**
	* Checks if two cookie objects are the same cookie. A cookie is identified by its
	* name, domain and path (RFC 6265 section 5.3), the Secure and HttpOnly flags are
	* attributes of the stored cookie that an update replaces
	*
	* @param a Cookie to check against
	* @param b Cookie to check against
	* @returns True, if the cookies are the same
	*/
	compare(a, b) {
		return a.name === b.name && a.path === b.path && a.domain === b.domain;
	}
	/**
	* Checks if a cookie is expired
	*
	* @param cookie Cookie object to check against
	* @returns True, if the cookie is expired
	*/
	isExpired(cookie) {
		return cookie.expires && cookie.expires < /* @__PURE__ */ new Date() || !cookie.value;
	}
	/**
	* Returns the default path for an URL path argument, the default-path of
	* RFC 6265 section 5.1.4. A cookie that carries no Path attribute is scoped
	* to the directory of the URL it was set from
	*
	* @param pathname
	* @returns Default path
	*/
	getPath(pathname) {
		const pathParts = (pathname || "/").split("/");
		pathParts.pop();
		const path = pathParts.join("/").trim();
		if (path.charAt(0) !== "/") return "/";
		return path;
	}
};
// node_modules/nodemailer/dist/esm/package-info.js
const name = "nodemailer";
const version = "10.6.1";
const homepage = "https://nodemailer.com/";
// node_modules/nodemailer/dist/esm/errors.js
const ECONNECTION = "ECONNECTION";
const ETIMEDOUT = "ETIMEDOUT";
const EOTP = "EOTP";
const ESTREAM = "ESTREAM";
const EABORT = "EABORT";
const ENOAUTH = "ENOAUTH";
const EOAUTH2 = "EOAUTH2";
const EMAXLIMIT = "EMAXLIMIT";
const EMAXRECIPIENTS = "EMAXRECIPIENTS";
const ESENDMAIL = "ESENDMAIL";
const ESES = "ESES";
const ECONFIG = "ECONFIG";
const EPROXY = "EPROXY";
const EFILEACCESS = "EFILEACCESS";
const EURLACCESS = "EURLACCESS";
const EFETCH = "EFETCH";
/** Creates the error reported when a caller cancels an individual send. @internal */
const createAbortError = (signal) => {
	const err = new Error("Message sending aborted", { cause: signal.reason });
	err.name = "AbortError";
	err.code = EABORT;
	return err;
};
/**
* Tells whether the error ended the connection rather than rejected what was sent over it
*/
const isTransientError = (err) => err.responseCode === 421 || err.code === "ECONNECTION" || err.code === "ESOCKET" || err.code === "ETIMEDOUT";
/**
* Tells whether an SMTP reply code is a permanent rejection, one that retrying the same
* message would get again. RFC 5321 makes every 5yz reply a permanent negative completion
* and every 4yz reply a transient one. 503 (bad sequence of commands) is the exception: it
* says the session was in the wrong state for the command rather than that the message was
* refused, so the same message can go through on a new connection. 2yz and 3yz replies are
* only an error when the client expected something else, and are not permanent either.
*
* @param responseCode SMTP reply code
* @returns true for a permanent rejection
*/
const isPermanentResponseCode = (responseCode) => responseCode >= 500 && responseCode < 600 && responseCode !== 503;
// node_modules/nodemailer/dist/esm/shared/objects.js
/**
* Detects a key that can not be copied onto a plain object with `target[key] = value`.
*
* "__proto__" is the only one: assigning it runs the inherited setter and replaces the
* prototype of the target instead of adding a property to it, so a caller can smuggle
* values past validation that only inspects own keys. JSON.parse produces such a key
* where an object literal can not. "constructor" and "prototype" have no such setter and
* become ordinary own properties, so dropping them would only discard legitimate values.
*
* @param key Key to check
* @returns true if the key must not be copied
*/
const isProtoKey = (key) => key === "__proto__";
/**
* Copies own enumerable keys from a source object to a target object. Every copy that
* walks the keys of user supplied data goes through here, see isProtoKey.
*
* @param target Object to copy the keys to
* @param source Object to copy the keys from
* @param [skip] Optional predicate, return true to leave a key out
* @returns The target object
*/
const copyOwnKeys = (target, source, skip) => {
	Object.keys(source || {}).forEach((key) => {
		if (isProtoKey(key) || skip && skip(key)) return;
		target[key] = source[key];
	});
	return target;
};
// node_modules/nodemailer/dist/esm/fetch/index.js
const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT = 6e4;
const DEFAULT_MAX_TIME = 12e4;
const DEFAULT_MAX_BYTES = 67108864;
const TLS_OPTION_KEYS = [
	"ALPNProtocols",
	"ca",
	"cert",
	"checkServerIdentity",
	"ciphers",
	"crl",
	"dhparam",
	"ecdhCurve",
	"honorCipherOrder",
	"key",
	"maxVersion",
	"minVersion",
	"passphrase",
	"pfx",
	"rejectUnauthorized",
	"secureContext",
	"secureOptions",
	"secureProtocol",
	"servername",
	"sessionIdContext",
	"sigalgs"
];
/**
* Marks an error of the request as a fetch error, unless it is a permission model
* denial, which keeps its own code (see ERR_ACCESS_DENIED)
*
* @param err Error to mark
*/
function setFetchCode(err) {
	if (err.code !== "ERR_ACCESS_DENIED") err.code = EFETCH;
}
/**
* Resolves a URL only if it is one this module is willing to request.
*
* urllib.parse throws for a host that contains forbidden bytes, and it is called for
* every URL that reaches nmfetch, including ones that arrive from a message attachment
* or from a redirect Location header. An uncaught throw here takes the process down,
* so a URL that does not parse is reported the same way as one with a scheme we refuse.
*
* @param url URL to parse
* @returns Parsed URL, or false if it is not a usable http(s) URL
*/
function parseFetchUrl(url) {
	let parsed;
	try {
		parsed = parse(url);
	} catch (_err) {
		return false;
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
	return parsed;
}
function fetchPort(parsed) {
	return parsed.port ? Number(parsed.port) : parsed.protocol === "https:" ? 443 : 80;
}
function nmfetch(url, options) {
	options = options || {};
	options.fetchRes = options.fetchRes || new PassThrough();
	options.cookies = options.cookies || new Cookies();
	options.redirects = options.redirects || 0;
	options.maxRedirects = isNaN(options.maxRedirects) ? MAX_REDIRECTS : options.maxRedirects;
	if (!options.deadline) {
		options.maxTime = typeof options.maxTime === "number" && options.maxTime >= 0 ? options.maxTime : DEFAULT_MAX_TIME;
		options.deadline = options.maxTime ? Date.now() + options.maxTime : 0;
	}
	const fetchRes = options.fetchRes;
	const parsed = parseFetchUrl(url);
	if (!parsed) {
		if (options.body && typeof options.body.destroy === "function") {
			options.body.on("error", () => false);
			options.body.destroy();
		}
		setImmediate(() => {
			const err = /* @__PURE__ */ new Error("Unsupported protocol for URL " + url);
			err.code = EFETCH;
			err.sourceUrl = url;
			fetchRes.emit("error", err);
		});
		return fetchRes;
	}
	if (options.cookie) {
		[].concat(options.cookie || []).forEach((cookie) => {
			options.cookies.set(cookie, url);
		});
		options.cookie = false;
	}
	let method = (options.method || "").toString().trim().toUpperCase() || "GET";
	let finished = false;
	let cookies;
	let body;
	const handler = parsed.protocol === "https:" ? https : http;
	const headers = {
		"accept-encoding": "gzip,deflate",
		"user-agent": "nodemailer/10.6.1"
	};
	Object.keys(options.headers || {}).forEach((key) => {
		if (isProtoKey(key.toLowerCase().trim())) return;
		headers[key.toLowerCase().trim()] = options.headers[key];
	});
	if (options.userAgent) headers["user-agent"] = options.userAgent;
	if (parsed.auth) headers.Authorization = "Basic " + Buffer.from(parsed.auth).toString("base64");
	if (cookies = options.cookies.get(url)) headers.cookie = cookies;
	if (options.body) {
		if (options.contentType !== false) headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
		if (typeof options.body.pipe === "function") {
			headers["Transfer-Encoding"] = "chunked";
			body = options.body;
			body.on("error", (err) => {
				if (finished) return;
				finished = true;
				setFetchCode(err);
				err.sourceUrl = url;
				fetchRes.emit("error", err);
			});
		} else {
			if (options.body instanceof Buffer) body = options.body;
			else if (typeof options.body === "object") try {
				body = Buffer.from(Object.keys(options.body).map((key) => {
					const value = options.body[key].toString().trim();
					return encodeURIComponent(key) + "=" + encodeURIComponent(value);
				}).join("&"));
			} catch (E) {
				finished = true;
				E.code = EFETCH;
				E.sourceUrl = url;
				setImmediate(() => fetchRes.emit("error", E));
				return fetchRes;
			}
			else body = Buffer.from(options.body.toString().trim());
			headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
			headers["Content-Length"] = body.length;
		}
		method = (options.method || "").toString().trim().toUpperCase() || "POST";
	}
	let req;
	const reqOptions = {
		method,
		host: parsed.hostname,
		path: parsed.path,
		port: fetchPort(parsed),
		headers,
		rejectUnauthorized: true,
		agent: false
	};
	if (options.tls) Object.keys(options.tls).forEach((key) => {
		if (TLS_OPTION_KEYS.includes(key)) reqOptions[key] = options.tls[key];
	});
	if (parsed.protocol === "https:" && parsed.hostname && parsed.hostname !== reqOptions.host && !net.isIP(parsed.hostname) && !reqOptions.servername) reqOptions.servername = parsed.hostname;
	try {
		req = handler.request(reqOptions);
	} catch (E) {
		finished = true;
		setImmediate(() => {
			setFetchCode(E);
			E.sourceUrl = url;
			fetchRes.emit("error", E);
		});
		return fetchRes;
	}
	let deadlineTimer;
	const clearDeadline = () => {
		if (deadlineTimer) {
			clearTimeout(deadlineTimer);
			deadlineTimer = void 0;
		}
	};
	const fail = (err, sourceUrl = url) => {
		if (finished) return;
		finished = true;
		clearDeadline();
		setFetchCode(err);
		err.sourceUrl = sourceUrl;
		fetchRes.emit("error", err);
		req.abort();
	};
	const timeout = typeof options.timeout === "number" && options.timeout >= 0 ? options.timeout : DEFAULT_TIMEOUT;
	if (timeout) req.setTimeout(timeout, () => fail(/* @__PURE__ */ new Error("Request Timeout")));
	if (options.deadline) {
		deadlineTimer = setTimeout(() => fail(/* @__PURE__ */ new Error("Request exceeded the allowed " + options.maxTime + " ms")), Math.max(options.deadline - Date.now(), 1));
		deadlineTimer.unref();
	}
	req.on("error", (err) => fail(err));
	fetchRes.once("close", () => {
		clearDeadline();
		if (finished || fetchRes.readableEnded) return;
		finished = true;
		req.destroy();
	});
	req.on("response", (res) => {
		let inflate;
		if (finished) return;
		switch (res.headers["content-encoding"]) {
			case "gzip":
			case "deflate": inflate = zlib.createUnzip();
		}
		if (res.headers["set-cookie"]) [].concat(res.headers["set-cookie"] || []).forEach((cookie) => {
			options.cookies.set(cookie, url);
		});
		if ([
			301,
			302,
			303,
			307,
			308
		].includes(res.statusCode) && res.headers.location) {
			options.redirects++;
			if (options.redirects > options.maxRedirects) return fail(/* @__PURE__ */ new Error("Maximum redirect count exceeded"));
			options.method = "GET";
			options.body = false;
			let redirectUrl;
			try {
				redirectUrl = resolve$2(url, res.headers.location);
			} catch (_err) {
				redirectUrl = res.headers.location;
			}
			const redirectParsed = parseFetchUrl(redirectUrl);
			if (!redirectParsed) return fail(/* @__PURE__ */ new Error("Unsupported protocol for URL " + redirectUrl), redirectUrl);
			const crossOrigin = redirectParsed.protocol !== parsed.protocol || redirectParsed.hostname !== parsed.hostname || fetchPort(redirectParsed) !== fetchPort(parsed);
			if (options.headers && crossOrigin) {
				const sensitive = [
					"authorization",
					"cookie",
					"proxy-authorization"
				];
				Object.keys(options.headers).forEach((key) => {
					if (sensitive.includes(key.toLowerCase().trim())) delete options.headers[key];
				});
			}
			finished = true;
			clearDeadline();
			res.resume();
			req.abort();
			return nmfetch(redirectUrl, options);
		}
		fetchRes.statusCode = res.statusCode;
		fetchRes.headers = res.headers;
		if (res.statusCode >= 300 && !options.allowErrorResponse) return fail(/* @__PURE__ */ new Error("Invalid status code " + res.statusCode));
		res.on("error", (err) => fail(err));
		res.once("end", () => clearDeadline());
		const maxBytes = typeof options.maxBytes === "number" && options.maxBytes > 0 ? options.maxBytes : DEFAULT_MAX_BYTES;
		const source = inflate || res;
		let received = 0;
		source.on("data", (chunk) => {
			received += chunk.length;
			if (received <= maxBytes || finished) return;
			source.unpipe(fetchRes);
			fail(/* @__PURE__ */ new Error("Response size exceeds the allowed " + maxBytes + " bytes"));
		});
		if (inflate) {
			res.pipe(inflate).pipe(fetchRes);
			inflate.on("error", (err) => fail(err));
		} else res.pipe(fetchRes);
	});
	setImmediate(() => {
		if (body) try {
			if (typeof body.pipe === "function") return body.pipe(req);
			req.write(body);
		} catch (err) {
			return fail(err);
		}
		req.end();
	});
	return fetchRes;
}
nmfetch.Cookies = Cookies;
nmfetch.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;
nmfetch.DEFAULT_MAX_TIME = DEFAULT_MAX_TIME;
// node_modules/nodemailer/dist/esm/shared/index.js
const DNS_TTL = 3e5;
const CACHE_CLEANUP_INTERVAL = 3e4;
const MAX_CACHE_SIZE = 1e3;
let lastCacheCleanup = 0;
let networkInterfaces;
let networkInterfacesRead = false;
/** @internal */
const _readNetworkInterfaces = () => {
	if (!networkInterfacesRead) {
		networkInterfacesRead = true;
		try {
			networkInterfaces = os.networkInterfaces();
		} catch (_err) {}
	}
	return networkInterfaces;
};
const isFamilySupported = (family, allowInternal) => {
	const addresses = Object.values(_readNetworkInterfaces() || {}).flat();
	if (!addresses.length) return true;
	return addresses.filter((i) => !i.internal || allowInternal).some((i) => i.family === "IPv" + family || i.family === family);
};
const resolve$1 = (family, hostname, options, callback) => {
	options = options || {};
	if (!isFamilySupported(family, options.allowInternalNetworkInterfaces)) {
		callback(null, []);
		return null;
	}
	const dnsResolver = dns.Resolver ? new dns.Resolver(options) : dns;
	dnsResolver["resolve" + family](hostname, (err, addresses) => {
		if (err) {
			switch (err.code) {
				case dns.NODATA:
				case dns.NOTFOUND:
				case dns.NOTIMP:
				case dns.SERVFAIL:
				case dns.CONNREFUSED:
				case dns.REFUSED:
				case "EAI_AGAIN": return callback(null, []);
			}
			return callback(err);
		}
		return callback(null, Array.isArray(addresses) ? addresses : [].concat(addresses || []));
	});
	return dns.Resolver ? dnsResolver : null;
};
const dnsCache = /* @__PURE__ */ new Map();
const formatDNSValue = (value, extra) => {
	if (!value) return Object.assign({}, extra || {});
	const addresses = value.addresses || [];
	const host = addresses.length > 0 ? addresses[Math.floor(Math.random() * addresses.length)] : null;
	return Object.assign({
		host,
		_addresses: addresses
	}, extra || {});
};
const resolveHostname = (options, callback) => {
	options = options || {};
	if (!options.host && options.servername) options.host = options.servername;
	if (!options.host || net.isIP(options.host)) {
		const value = { addresses: [options.host] };
		return callback(null, formatDNSValue(value, {
			servername: options.servername || false,
			cached: false
		}));
	}
	const host = options.host;
	const servername = options.servername || host;
	let cached;
	if (dnsCache.has(options.host)) {
		cached = dnsCache.get(options.host);
		const now = Date.now();
		if (now - lastCacheCleanup > CACHE_CLEANUP_INTERVAL) {
			lastCacheCleanup = now;
			for (const [host, entry] of dnsCache.entries()) if (entry.expires && entry.expires < now) dnsCache.delete(host);
			if (dnsCache.size > MAX_CACHE_SIZE) {
				const toDelete = Math.floor(MAX_CACHE_SIZE * .1);
				Array.from(dnsCache.keys()).slice(0, toDelete).forEach((key) => dnsCache.delete(key));
			}
		}
		if (!cached.expires || cached.expires >= now) return callback(null, formatDNSValue(cached.value, {
			servername,
			cached: true
		}));
	}
	let responded = false;
	let deadline;
	const respond = (err, result) => {
		if (responded) return;
		responded = true;
		clearTimeout(deadline);
		callback(err, result);
	};
	const respondCached = (error) => {
		if (!cached) return false;
		dnsCache.set(host, {
			value: cached.value,
			expires: Date.now() + (options.dnsTtl || DNS_TTL)
		});
		respond(null, formatDNSValue(cached.value, {
			servername,
			cached: true,
			error
		}));
		return true;
	};
	const resolvers = [];
	const timeout = Number(options.timeout) || 0;
	if (timeout > 0) deadline = setTimeout(() => {
		for (const resolver of resolvers) if (typeof resolver.cancel === "function") resolver.cancel();
		const err = /* @__PURE__ */ new Error("DNS lookup for " + host + " timed out");
		err.code = dns.TIMEOUT;
		if (!respondCached(err)) respond(err);
	}, timeout);
	let ipv4Addresses = [];
	let ipv6Addresses = [];
	let ipv4Error = null;
	let ipv6Error = null;
	let pending = 2;
	const onResolved = () => {
		if (--pending || responded) return;
		const allAddresses = ipv4Addresses.concat(ipv6Addresses);
		if (allAddresses.length) {
			const value = { addresses: allAddresses };
			dnsCache.set(host, {
				value,
				expires: Date.now() + (options.dnsTtl || DNS_TTL)
			});
			return respond(null, formatDNSValue(value, {
				servername,
				cached: false
			}));
		}
		if (ipv4Error && ipv6Error && respondCached(ipv4Error)) return;
		try {
			dns.lookup(host, { all: true }, (err, addresses) => {
				if (err) {
					if (respondCached(err)) return;
					return respond(err);
				}
				const supportedAddresses = addresses ? addresses.filter((addr) => isFamilySupported(addr.family)).map((addr) => addr.address) : [];
				if (addresses && addresses.length && !supportedAddresses.length) console.warn(`Failed to resolve IPv${addresses[0].family} addresses with current network`);
				if (!supportedAddresses.length && cached) return respond(null, formatDNSValue(cached.value, {
					servername,
					cached: true
				}));
				const value = { addresses: supportedAddresses.length ? supportedAddresses : [host] };
				dnsCache.set(host, {
					value,
					expires: Date.now() + (options.dnsTtl || DNS_TTL)
				});
				return respond(null, formatDNSValue(value, {
					servername,
					cached: false
				}));
			});
		} catch (lookupErr) {
			if (respondCached(lookupErr)) return;
			return respond(ipv4Error || ipv6Error || lookupErr);
		}
	};
	for (const family of [4, 6]) {
		const resolver = resolve$1(family, host, options, (err, addresses) => {
			if (family === 4) {
				ipv4Error = err;
				ipv4Addresses = addresses || [];
			} else {
				ipv6Error = err;
				ipv6Addresses = addresses || [];
			}
			onResolved();
		});
		if (resolver) resolvers.push(resolver);
	}
};
/**
* Parses connection url to a structured configuration object
*
* @param str Connection url
* @return Configuration object
*/
const parseConnectionUrl = (str) => {
	str = str || "";
	const options = {};
	const url = parse(str, true);
	switch (url.protocol) {
		case "smtp:":
			options.secure = false;
			break;
		case "smtps:":
			options.secure = true;
			break;
		case "direct:": options.direct = true;
	}
	if (!isNaN(url.port) && Number(url.port)) options.port = Number(url.port);
	if (url.hostname) options.host = url.hostname;
	if (url.username || url.password) options.auth = {
		user: url.username || "",
		pass: url.password || ""
	};
	Object.keys(url.query || {}).forEach((key) => {
		let obj = options;
		let lKey = key;
		let value = url.query[key];
		if (!isNaN(value)) value = Number(value);
		switch (value) {
			case "true":
				value = true;
				break;
			case "false": value = false;
		}
		if (key.indexOf("tls.") === 0) {
			lKey = key.substr(4);
			if (!options.tls) options.tls = {};
			obj = options.tls;
		} else if (key.indexOf(".") >= 0) return;
		if (!isProtoKey(lKey) && !(lKey in obj)) obj[lKey] = value;
	});
	return options;
};
/** @internal */
const _logFunc = (logger, level, defaults, data, message, ...args) => {
	const entry = Object.assign({}, defaults || {}, data || {});
	delete entry.level;
	let logLevel = level;
	if (typeof logger[logLevel] !== "function") logLevel = [
		"info",
		"debug",
		"log",
		"trace",
		"warn",
		"error"
	].find((name) => typeof logger[name] === "function");
	if (logLevel) logger[logLevel](entry, message, ...args);
};
/**
* Returns a bunyan-compatible logger interface. Uses either provided logger or
* creates a default console logger
*
* @param [options] Options object that might include 'logger' value
* @param [defaults] Fields merged into every log entry, overridden by the fields of the entry itself
* @return bunyan compatible logger
*/
const getLogger = (options, defaults) => {
	options = options || {};
	const response = {};
	const levels = [
		"trace",
		"debug",
		"info",
		"warn",
		"error",
		"fatal"
	];
	if (!options.logger) {
		levels.forEach((level) => {
			response[level] = () => false;
		});
		return response;
	}
	const logger = options.logger === true ? createDefaultLogger(levels) : options.logger;
	levels.forEach((level) => {
		response[level] = (...args) => {
			const data = typeof args[0] === "string" ? void 0 : args.shift();
			_logFunc(logger, level, defaults, data, ...args);
		};
	});
	return response;
};
/**
* Wrapper for creating a callback that either resolves or rejects a promise
* based on input
*
* @param resolve Function to run if callback is called
* @param reject Function to run if callback ends with an error
*/
const callbackPromise = (resolve, reject) => function(...args) {
	const err = args.shift();
	if (err) reject(err);
	else resolve(...args);
};
const parseDataURI = (uri) => {
	if (typeof uri !== "string") return null;
	if (!uri.startsWith("data:")) return null;
	const commaPos = uri.indexOf(",");
	if (commaPos === -1) return null;
	const data = uri.substring(commaPos + 1);
	const metaStr = uri.substring(5, commaPos);
	let encoding;
	const metaEntries = metaStr.split(";");
	if (metaEntries.length > 0) {
		const lastEntry = metaEntries[metaEntries.length - 1].toLowerCase().trim();
		if ([
			"base64",
			"utf8",
			"utf-8"
		].includes(lastEntry) && lastEntry.indexOf("=") === -1) {
			encoding = lastEntry;
			metaEntries.pop();
		}
	}
	const contentType = metaEntries.length > 0 ? metaEntries.shift() : "application/octet-stream";
	const params = {};
	for (let i = 0; i < metaEntries.length; i++) {
		const entry = metaEntries[i];
		const sepPos = entry.indexOf("=");
		if (sepPos > 0) {
			const key = entry.substring(0, sepPos).trim();
			const value = entry.substring(sepPos + 1).trim();
			if (key && !isProtoKey(key)) params[key] = value;
		}
	}
	let bufferData;
	try {
		if (encoding === "base64") bufferData = Buffer.from(data, "base64");
		else try {
			bufferData = Buffer.from(decodeURIComponent(data));
		} catch (_decodeError) {
			bufferData = Buffer.from(data);
		}
	} catch (_bufferError) {
		bufferData = Buffer.alloc(0);
	}
	return {
		data: bufferData,
		encoding: encoding || null,
		contentType: contentType || "application/octet-stream",
		params
	};
};
function resolveContent(data, key, options, callback) {
	if (!callback && typeof options === "function") {
		callback = options;
		options = false;
	}
	options = options || {};
	let promise;
	if (!callback) promise = new Promise((resolve, reject) => {
		callback = callbackPromise(resolve, reject);
	});
	resolveContentValue(data, key, options, callback);
	return promise;
}
function resolveContentValue(data, key, options, callback) {
	let content = data && data[key] && data[key].content || data[key];
	const encoding = (typeof data[key] === "object" && data[key].encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
	if (!content) return callback(null, content);
	if (typeof content === "object") {
		if (typeof content.pipe === "function") return resolveStream(content, (err, value) => {
			if (err) return callback(err);
			if (data[key].content) data[key].content = value;
			else data[key] = value;
			callback(null, value);
		});
		else if (/^data:/i.test(content.path || content.href)) {
			const parsedDataUri = parseDataURI(content.path || content.href);
			return callback(null, parsedDataUri && parsedDataUri.data ? parsedDataUri.data : Buffer.alloc(0));
		} else if (content.href || /^https?:\/\//i.test(content.path)) {
			const url = content.href || content.path;
			if (options.disableUrlAccess) {
				setImmediate(() => {
					const err = /* @__PURE__ */ new Error("Url access rejected for " + url);
					err.code = EURLACCESS;
					callback(err);
				});
				return;
			}
			return resolveStream(nmfetch(url, {
				headers: content.httpHeaders,
				tls: content.tls
			}), callback);
		} else if (content.path) {
			if (options.disableFileAccess) {
				setImmediate(() => {
					const err = /* @__PURE__ */ new Error("File access rejected for " + content.path);
					err.code = EFILEACCESS;
					callback(err);
				});
				return;
			}
			return resolveStream(fs.createReadStream(content.path), callback);
		}
	}
	if (typeof data[key].content === "string" && ![
		"utf8",
		"usascii",
		"ascii"
	].includes(encoding)) content = Buffer.from(data[key].content, encoding);
	setImmediate(() => callback(null, content));
}
/**
* Copies properties from source objects to target objects
*/
const assign = function(...args) {
	const target = args.shift() || {};
	args.forEach((source) => {
		Object.keys(source || {}).forEach((key) => {
			if (isProtoKey(key)) return;
			if (["tls", "auth"].includes(key) && source[key] && typeof source[key] === "object") target[key] = copyOwnKeys(target[key] || {}, source[key]);
			else target[key] = source[key];
		});
	});
	return target;
};
const encodeXText = (str) => {
	if (!/[^\x21-\x2A\x2C-\x3C\x3E-\x7E]/.test(str)) return str;
	const buf = Buffer.from(str);
	let result = "";
	for (let i = 0, len = buf.length; i < len; i++) {
		const c = buf[i];
		if (c < 33 || c > 126 || c === 43 || c === 61) result += "+" + (c < 16 ? "0" : "") + c.toString(16).toUpperCase();
		else result += String.fromCharCode(c);
	}
	return result;
};
const streamErrors = /* @__PURE__ */ new WeakMap();
/**
* Keeps the first error a content stream emits before it is read, so the error is reported
* when the stream is read instead of being thrown as unhandled. The listener stays attached
* for good, a stream that emits 'error' more than once never throws the later ones either
*
* @param stream Readable stream
*/
function recordStreamErrors(stream) {
	stream.on("error", (err) => {
		if (!streamErrors.has(stream)) streamErrors.set(stream, err);
	});
}
/**
* Destroys a value if it is a readable stream that was not destroyed yet
*
* @param value Any content value
*/
function destroyStream(value) {
	const stream = value;
	if (stream && typeof stream.pipe === "function" && typeof stream.destroy === "function" && !stream.destroyed) stream.destroy();
}
/**
* Tells why a stream can not be read from start to end anymore. A stream that ended or was
* destroyed before anyone read it would never emit 'end' to a new reader, or, when piped, would
* end the destination right away and turn into an empty value without any error
*
* @param stream Readable stream
* @returns The error the stream failed with, an ESTREAM error, or null when it can be read
*/
function unreadableStreamError(stream) {
	const err = streamErrors.get(stream) || stream.errored;
	if (err) return err;
	if (stream.readableEnded || stream.destroyed) {
		const unreadable = /* @__PURE__ */ new Error("Content stream was already read or destroyed");
		unreadable.code = ESTREAM;
		return unreadable;
	}
	return null;
}
/**
* Streams a stream value into a Buffer
*
* @param stream Readable stream
* @param callback Callback function with (err, value)
*/
function resolveStream(stream, callback) {
	let responded = false;
	const respond = (err, value) => {
		if (responded) return;
		responded = true;
		callback(err, value);
	};
	const unreadable = unreadableStreamError(stream);
	if (unreadable) {
		stream.on("error", () => false);
		setImmediate(() => respond(unreadable));
		return;
	}
	const chunks = [];
	let chunklen = 0;
	stream.on("data", (chunk) => {
		if (typeof chunk === "string") chunk = Buffer.from(chunk);
		chunks.push(chunk);
		chunklen += chunk.length;
	});
	finished(stream, { writable: false }, (err) => {
		if (err) return respond(err);
		let value;
		try {
			value = Buffer.concat(chunks, chunklen);
		} catch (E) {
			return respond(E);
		}
		respond(null, value);
	});
}
/**
* Generates a bunyan-like logger that prints to console
*
* @returns Bunyan logger instance
*/
function createDefaultLogger(levels) {
	const levelMaxLen = levels.reduce((max, level) => Math.max(max, level.length), 0);
	const levelNames = /* @__PURE__ */ new Map();
	levels.forEach((level) => {
		let levelName = level.toUpperCase();
		if (levelName.length < levelMaxLen) levelName += " ".repeat(levelMaxLen - levelName.length);
		levelNames.set(level, levelName);
	});
	const print = (level, entry, message, ...args) => {
		let prefix = "";
		if (entry) {
			if (entry.tnx === "server") prefix = "S: ";
			else if (entry.tnx === "client") prefix = "C: ";
			if (entry.sid) prefix = "[" + entry.sid + "] " + prefix;
			if (entry.cid) prefix = "[#" + entry.cid + "] " + prefix;
		}
		message = util.format(message, ...args);
		message.split(/\r?\n/).forEach((line) => {
			console.log("[%s] %s %s", (/* @__PURE__ */ new Date()).toISOString().substr(0, 19).replace(/T/, " "), levelNames.get(level), prefix + line);
		});
	};
	const logger = {};
	levels.forEach((level) => {
		logger[level] = print.bind(null, level);
	});
	return logger;
}
const URL_PARSER_UNSAFE = /[/\\?#%\x00-\x20\x7F]/;
const MAX_DOMAIN_LENGTH = 253;
const MAX_LABEL_LENGTH = 63;
/**
* Checks a domain against the DNS length limits, counted in code points per label and in
* total. The label separators are the ones the bundled codec splits on.
*
* @param domain Domain to check
* @return true if a label or the domain as a whole is too long to be a valid domain
*/
function exceedsDomainLimits(domain) {
	let total = 0;
	let label = 0;
	for (const char of domain) {
		total++;
		if (char === "." || char === "。" || char === "．" || char === "｡") label = 0;
		else if (++label > MAX_LABEL_LENGTH) return true;
	}
	return total > MAX_DOMAIN_LENGTH;
}
/**
* Encodes a domain the way browsers, the WHATWG URL Standard and DNS facing resolvers do,
* which is with UTS-46 mapping applied before the Punycode step.
*
* The bundled codec is plain RFC 3492 and maps nothing, so it disagrees with every
* conformant parser on any domain holding a mapped or ignored code point. An invisible
* U+00AD in 'compa\u00ADny.com' encoded to 'xn--company-pka.com' where a validator reads
* 'company.com', which let an allow-listed domain be checked and a different one mailed.
*
* Anything the URL parser does not accept as a hostname, an address literal such as
* '[127.0.0.1]' included, comes back empty and falls through to the bundled codec, which
* leaves those as they were supplied apart from lowercasing them.
*
* The mapper gets the domain as supplied, since UTS-46 does its own case mapping and
* toLowerCase() differs from it: it turns U+1E9E into U+00DF where Node 20 and 22 map it
* to 'ss', and a word-final U+03A3 into U+03C2 where UTS-46 gives U+03C3. Lowercasing
* first sent 'user@stra\u1E9Ee.de', which a validator reads as strasse.de, to xn--strae-oqa.de.
*
* @param domain Domain to encode
* @param toUnicode Return the U-label form instead of the A-label form
* @return Encoded domain
*/
function normalizeDomain(domain, toUnicode$1) {
	if (typeof urllib.domainToASCII === "function" && typeof urllib.domainToUnicode === "function" && !URL_PARSER_UNSAFE.test(domain)) {
		const ascii = urllib.domainToASCII(domain);
		const mapped = ascii && toUnicode$1 ? urllib.domainToUnicode(ascii) : ascii;
		if (mapped) return mapped;
	}
	domain = domain.toLowerCase();
	if (exceedsDomainLimits(domain)) return domain;
	return toUnicode$1 ? toUnicode(domain) : toASCII(domain);
}
// node_modules/nodemailer/dist/esm/mime-funcs/mime-types.js
const defaultMimeType = "application/octet-stream";
const defaultExtension = "bin";
const mimeTypes = /* @__PURE__ */ new Map([
	["application/acad", "dwg"],
	["application/applixware", "aw"],
	["application/arj", "arj"],
	["application/atom+xml", "xml"],
	["application/atomcat+xml", "atomcat"],
	["application/atomsvc+xml", "atomsvc"],
	["application/base64", ["mm", "mme"]],
	["application/binhex", "hqx"],
	["application/binhex4", "hqx"],
	["application/book", ["book", "boo"]],
	["application/ccxml+xml,", "ccxml"],
	["application/cdf", "cdf"],
	["application/cdmi-capability", "cdmia"],
	["application/cdmi-container", "cdmic"],
	["application/cdmi-domain", "cdmid"],
	["application/cdmi-object", "cdmio"],
	["application/cdmi-queue", "cdmiq"],
	["application/clariscad", "ccad"],
	["application/commonground", "dp"],
	["application/cu-seeme", "cu"],
	["application/davmount+xml", "davmount"],
	["application/drafting", "drw"],
	["application/dsptype", "tsp"],
	["application/dssc+der", "dssc"],
	["application/dssc+xml", "xdssc"],
	["application/dxf", "dxf"],
	["application/ecmascript", ["js", "es"]],
	["application/emma+xml", "emma"],
	["application/envoy", "evy"],
	["application/epub+zip", "epub"],
	["application/excel", [
		"xls",
		"xl",
		"xla",
		"xlb",
		"xlc",
		"xld",
		"xlk",
		"xll",
		"xlm",
		"xlt",
		"xlv",
		"xlw"
	]],
	["application/exi", "exi"],
	["application/font-tdpfr", "pfr"],
	["application/fractals", "fif"],
	["application/freeloader", "frl"],
	["application/futuresplash", "spl"],
	["application/geo+json", "geojson"],
	["application/gnutar", "tgz"],
	["application/groupwise", "vew"],
	["application/hlp", "hlp"],
	["application/hta", "hta"],
	["application/hyperstudio", "stk"],
	["application/i-deas", "unv"],
	["application/iges", ["iges", "igs"]],
	["application/inf", "inf"],
	["application/internet-property-stream", "acx"],
	["application/ipfix", "ipfix"],
	["application/java", "class"],
	["application/java-archive", "jar"],
	["application/java-byte-code", "class"],
	["application/java-serialized-object", "ser"],
	["application/java-vm", "class"],
	["application/javascript", "js"],
	["application/json", "json"],
	["application/lha", "lha"],
	["application/lzx", "lzx"],
	["application/mac-binary", "bin"],
	["application/mac-binhex", "hqx"],
	["application/mac-binhex40", "hqx"],
	["application/mac-compactpro", "cpt"],
	["application/macbinary", "bin"],
	["application/mads+xml", "mads"],
	["application/marc", "mrc"],
	["application/marcxml+xml", "mrcx"],
	["application/mathematica", "ma"],
	["application/mathml+xml", "mathml"],
	["application/mbedlet", "mbd"],
	["application/mbox", "mbox"],
	["application/mcad", "mcd"],
	["application/mediaservercontrol+xml", "mscml"],
	["application/metalink4+xml", "meta4"],
	["application/mets+xml", "mets"],
	["application/mime", "aps"],
	["application/mods+xml", "mods"],
	["application/mp21", "m21"],
	["application/mp4", "mp4"],
	["application/mspowerpoint", [
		"ppt",
		"pot",
		"pps",
		"ppz"
	]],
	["application/msword", [
		"doc",
		"dot",
		"w6w",
		"wiz",
		"word"
	]],
	["application/mswrite", "wri"],
	["application/mxf", "mxf"],
	["application/netmc", "mcp"],
	["application/octet-stream", ["*"]],
	["application/oda", "oda"],
	["application/oebps-package+xml", "opf"],
	["application/ogg", "ogx"],
	["application/olescript", "axs"],
	["application/onenote", "onetoc"],
	["application/patch-ops-error+xml", "xer"],
	["application/pdf", "pdf"],
	["application/pgp-encrypted", "asc"],
	["application/pgp-signature", "pgp"],
	["application/pics-rules", "prf"],
	["application/pkcs-12", "p12"],
	["application/pkcs-crl", "crl"],
	["application/pkcs10", "p10"],
	["application/pkcs7-mime", ["p7c", "p7m"]],
	["application/pkcs7-signature", "p7s"],
	["application/pkcs8", "p8"],
	["application/pkix-attr-cert", "ac"],
	["application/pkix-cert", ["cer", "crt"]],
	["application/pkix-crl", "crl"],
	["application/pkix-pkipath", "pkipath"],
	["application/pkixcmp", "pki"],
	["application/plain", "text"],
	["application/pls+xml", "pls"],
	["application/postscript", [
		"ps",
		"ai",
		"eps"
	]],
	["application/powerpoint", "ppt"],
	["application/pro_eng", ["part", "prt"]],
	["application/prs.cww", "cww"],
	["application/pskc+xml", "pskcxml"],
	["application/rdf+xml", "rdf"],
	["application/reginfo+xml", "rif"],
	["application/relax-ng-compact-syntax", "rnc"],
	["application/resource-lists+xml", "rl"],
	["application/resource-lists-diff+xml", "rld"],
	["application/ringing-tones", "rng"],
	["application/rls-services+xml", "rs"],
	["application/rsd+xml", "rsd"],
	["application/rss+xml", "xml"],
	["application/rtf", ["rtf", "rtx"]],
	["application/sbml+xml", "sbml"],
	["application/scvp-cv-request", "scq"],
	["application/scvp-cv-response", "scs"],
	["application/scvp-vp-request", "spq"],
	["application/scvp-vp-response", "spp"],
	["application/sdp", "sdp"],
	["application/sea", "sea"],
	["application/set", "set"],
	["application/set-payment-initiation", "setpay"],
	["application/set-registration-initiation", "setreg"],
	["application/shf+xml", "shf"],
	["application/sla", "stl"],
	["application/smil", ["smi", "smil"]],
	["application/smil+xml", "smi"],
	["application/solids", "sol"],
	["application/sounder", "sdr"],
	["application/sparql-query", "rq"],
	["application/sparql-results+xml", "srx"],
	["application/srgs", "gram"],
	["application/srgs+xml", "grxml"],
	["application/sru+xml", "sru"],
	["application/ssml+xml", "ssml"],
	["application/step", ["step", "stp"]],
	["application/streamingmedia", "ssm"],
	["application/tei+xml", "tei"],
	["application/thraud+xml", "tfi"],
	["application/timestamped-data", "tsd"],
	["application/toolbook", "tbk"],
	["application/vda", "vda"],
	["application/vnd.3gpp.pic-bw-large", "plb"],
	["application/vnd.3gpp.pic-bw-small", "psb"],
	["application/vnd.3gpp.pic-bw-var", "pvb"],
	["application/vnd.3gpp2.tcap", "tcap"],
	["application/vnd.3m.post-it-notes", "pwn"],
	["application/vnd.accpac.simply.aso", "aso"],
	["application/vnd.accpac.simply.imp", "imp"],
	["application/vnd.acucobol", "acu"],
	["application/vnd.acucorp", "atc"],
	["application/vnd.adobe.air-application-installer-package+zip", "air"],
	["application/vnd.adobe.fxp", "fxp"],
	["application/vnd.adobe.xdp+xml", "xdp"],
	["application/vnd.adobe.xfdf", "xfdf"],
	["application/vnd.ahead.space", "ahead"],
	["application/vnd.airzip.filesecure.azf", "azf"],
	["application/vnd.airzip.filesecure.azs", "azs"],
	["application/vnd.amazon.ebook", "azw"],
	["application/vnd.americandynamics.acc", "acc"],
	["application/vnd.amiga.ami", "ami"],
	["application/vnd.android.package-archive", "apk"],
	["application/vnd.anser-web-certificate-issue-initiation", "cii"],
	["application/vnd.anser-web-funds-transfer-initiation", "fti"],
	["application/vnd.antix.game-component", "atx"],
	["application/vnd.apple.installer+xml", "mpkg"],
	["application/vnd.apple.mpegurl", "m3u8"],
	["application/vnd.aristanetworks.swi", "swi"],
	["application/vnd.audiograph", "aep"],
	["application/vnd.blueice.multipass", "mpm"],
	["application/vnd.bmi", "bmi"],
	["application/vnd.businessobjects", "rep"],
	["application/vnd.chemdraw+xml", "cdxml"],
	["application/vnd.chipnuts.karaoke-mmd", "mmd"],
	["application/vnd.cinderella", "cdy"],
	["application/vnd.claymore", "cla"],
	["application/vnd.cloanto.rp9", "rp9"],
	["application/vnd.clonk.c4group", "c4g"],
	["application/vnd.cluetrust.cartomobile-config", "c11amc"],
	["application/vnd.cluetrust.cartomobile-config-pkg", "c11amz"],
	["application/vnd.commonspace", "csp"],
	["application/vnd.contact.cmsg", "cdbcmsg"],
	["application/vnd.cosmocaller", "cmc"],
	["application/vnd.crick.clicker", "clkx"],
	["application/vnd.crick.clicker.keyboard", "clkk"],
	["application/vnd.crick.clicker.palette", "clkp"],
	["application/vnd.crick.clicker.template", "clkt"],
	["application/vnd.crick.clicker.wordbank", "clkw"],
	["application/vnd.criticaltools.wbs+xml", "wbs"],
	["application/vnd.ctc-posml", "pml"],
	["application/vnd.cups-ppd", "ppd"],
	["application/vnd.curl.car", "car"],
	["application/vnd.curl.pcurl", "pcurl"],
	["application/vnd.data-vision.rdz", "rdz"],
	["application/vnd.denovo.fcselayout-link", "fe_launch"],
	["application/vnd.dna", "dna"],
	["application/vnd.dolby.mlp", "mlp"],
	["application/vnd.dpgraph", "dpg"],
	["application/vnd.dreamfactory", "dfac"],
	["application/vnd.dvb.ait", "ait"],
	["application/vnd.dvb.service", "svc"],
	["application/vnd.dynageo", "geo"],
	["application/vnd.ecowin.chart", "mag"],
	["application/vnd.enliven", "nml"],
	["application/vnd.epson.esf", "esf"],
	["application/vnd.epson.msf", "msf"],
	["application/vnd.epson.quickanime", "qam"],
	["application/vnd.epson.salt", "slt"],
	["application/vnd.epson.ssf", "ssf"],
	["application/vnd.eszigno3+xml", "es3"],
	["application/vnd.ezpix-album", "ez2"],
	["application/vnd.ezpix-package", "ez3"],
	["application/vnd.fdf", "fdf"],
	["application/vnd.fdsn.seed", "seed"],
	["application/vnd.flographit", "gph"],
	["application/vnd.fluxtime.clip", "ftc"],
	["application/vnd.framemaker", "fm"],
	["application/vnd.frogans.fnc", "fnc"],
	["application/vnd.frogans.ltf", "ltf"],
	["application/vnd.fsc.weblaunch", "fsc"],
	["application/vnd.fujitsu.oasys", "oas"],
	["application/vnd.fujitsu.oasys2", "oa2"],
	["application/vnd.fujitsu.oasys3", "oa3"],
	["application/vnd.fujitsu.oasysgp", "fg5"],
	["application/vnd.fujitsu.oasysprs", "bh2"],
	["application/vnd.fujixerox.ddd", "ddd"],
	["application/vnd.fujixerox.docuworks", "xdw"],
	["application/vnd.fujixerox.docuworks.binder", "xbd"],
	["application/vnd.fuzzysheet", "fzs"],
	["application/vnd.genomatix.tuxedo", "txd"],
	["application/vnd.geogebra.file", "ggb"],
	["application/vnd.geogebra.tool", "ggt"],
	["application/vnd.geometry-explorer", "gex"],
	["application/vnd.geonext", "gxt"],
	["application/vnd.geoplan", "g2w"],
	["application/vnd.geospace", "g3w"],
	["application/vnd.gmx", "gmx"],
	["application/vnd.google-earth.kml+xml", "kml"],
	["application/vnd.google-earth.kmz", "kmz"],
	["application/vnd.grafeq", "gqf"],
	["application/vnd.groove-account", "gac"],
	["application/vnd.groove-help", "ghf"],
	["application/vnd.groove-identity-message", "gim"],
	["application/vnd.groove-injector", "grv"],
	["application/vnd.groove-tool-message", "gtm"],
	["application/vnd.groove-tool-template", "tpl"],
	["application/vnd.groove-vcard", "vcg"],
	["application/vnd.hal+xml", "hal"],
	["application/vnd.handheld-entertainment+xml", "zmm"],
	["application/vnd.hbci", "hbci"],
	["application/vnd.hhe.lesson-player", "les"],
	["application/vnd.hp-hpgl", [
		"hgl",
		"hpg",
		"hpgl"
	]],
	["application/vnd.hp-hpid", "hpid"],
	["application/vnd.hp-hps", "hps"],
	["application/vnd.hp-jlyt", "jlt"],
	["application/vnd.hp-pcl", "pcl"],
	["application/vnd.hp-pclxl", "pclxl"],
	["application/vnd.hydrostatix.sof-data", "sfd-hdstx"],
	["application/vnd.hzn-3d-crossword", "x3d"],
	["application/vnd.ibm.minipay", "mpy"],
	["application/vnd.ibm.modcap", "afp"],
	["application/vnd.ibm.rights-management", "irm"],
	["application/vnd.ibm.secure-container", "sc"],
	["application/vnd.iccprofile", "icc"],
	["application/vnd.igloader", "igl"],
	["application/vnd.immervision-ivp", "ivp"],
	["application/vnd.immervision-ivu", "ivu"],
	["application/vnd.insors.igm", "igm"],
	["application/vnd.intercon.formnet", "xpw"],
	["application/vnd.intergeo", "i2g"],
	["application/vnd.intu.qbo", "qbo"],
	["application/vnd.intu.qfx", "qfx"],
	["application/vnd.ipunplugged.rcprofile", "rcprofile"],
	["application/vnd.irepository.package+xml", "irp"],
	["application/vnd.is-xpr", "xpr"],
	["application/vnd.isac.fcs", "fcs"],
	["application/vnd.jam", "jam"],
	["application/vnd.jcp.javame.midlet-rms", "rms"],
	["application/vnd.jisp", "jisp"],
	["application/vnd.joost.joda-archive", "joda"],
	["application/vnd.kahootz", "ktz"],
	["application/vnd.kde.karbon", "karbon"],
	["application/vnd.kde.kchart", "chrt"],
	["application/vnd.kde.kformula", "kfo"],
	["application/vnd.kde.kivio", "flw"],
	["application/vnd.kde.kontour", "kon"],
	["application/vnd.kde.kpresenter", "kpr"],
	["application/vnd.kde.kspread", "ksp"],
	["application/vnd.kde.kword", "kwd"],
	["application/vnd.kenameaapp", "htke"],
	["application/vnd.kidspiration", "kia"],
	["application/vnd.kinar", "kne"],
	["application/vnd.koan", "skp"],
	["application/vnd.kodak-descriptor", "sse"],
	["application/vnd.las.las+xml", "lasxml"],
	["application/vnd.llamagraphics.life-balance.desktop", "lbd"],
	["application/vnd.llamagraphics.life-balance.exchange+xml", "lbe"],
	["application/vnd.lotus-1-2-3", "123"],
	["application/vnd.lotus-approach", "apr"],
	["application/vnd.lotus-freelance", "pre"],
	["application/vnd.lotus-notes", "nsf"],
	["application/vnd.lotus-organizer", "org"],
	["application/vnd.lotus-screencam", "scm"],
	["application/vnd.lotus-wordpro", "lwp"],
	["application/vnd.macports.portpkg", "portpkg"],
	["application/vnd.mcd", "mcd"],
	["application/vnd.medcalcdata", "mc1"],
	["application/vnd.mediastation.cdkey", "cdkey"],
	["application/vnd.mfer", "mwf"],
	["application/vnd.mfmp", "mfm"],
	["application/vnd.micrografx.flo", "flo"],
	["application/vnd.micrografx.igx", "igx"],
	["application/vnd.mif", "mif"],
	["application/vnd.mobius.daf", "daf"],
	["application/vnd.mobius.dis", "dis"],
	["application/vnd.mobius.mbk", "mbk"],
	["application/vnd.mobius.mqy", "mqy"],
	["application/vnd.mobius.msl", "msl"],
	["application/vnd.mobius.plc", "plc"],
	["application/vnd.mobius.txf", "txf"],
	["application/vnd.mophun.application", "mpn"],
	["application/vnd.mophun.certificate", "mpc"],
	["application/vnd.mozilla.xul+xml", "xul"],
	["application/vnd.ms-artgalry", "cil"],
	["application/vnd.ms-cab-compressed", "cab"],
	["application/vnd.ms-excel", [
		"xls",
		"xla",
		"xlc",
		"xlm",
		"xlt",
		"xlw",
		"xlb",
		"xll"
	]],
	["application/vnd.ms-excel.addin.macroenabled.12", "xlam"],
	["application/vnd.ms-excel.sheet.binary.macroenabled.12", "xlsb"],
	["application/vnd.ms-excel.sheet.macroenabled.12", "xlsm"],
	["application/vnd.ms-excel.template.macroenabled.12", "xltm"],
	["application/vnd.ms-fontobject", "eot"],
	["application/vnd.ms-htmlhelp", "chm"],
	["application/vnd.ms-ims", "ims"],
	["application/vnd.ms-lrm", "lrm"],
	["application/vnd.ms-officetheme", "thmx"],
	["application/vnd.ms-outlook", "msg"],
	["application/vnd.ms-pki.certstore", "sst"],
	["application/vnd.ms-pki.pko", "pko"],
	["application/vnd.ms-pki.seccat", "cat"],
	["application/vnd.ms-pki.stl", "stl"],
	["application/vnd.ms-pkicertstore", "sst"],
	["application/vnd.ms-pkiseccat", "cat"],
	["application/vnd.ms-pkistl", "stl"],
	["application/vnd.ms-powerpoint", [
		"ppt",
		"pot",
		"pps",
		"ppa",
		"pwz"
	]],
	["application/vnd.ms-powerpoint.addin.macroenabled.12", "ppam"],
	["application/vnd.ms-powerpoint.presentation.macroenabled.12", "pptm"],
	["application/vnd.ms-powerpoint.slide.macroenabled.12", "sldm"],
	["application/vnd.ms-powerpoint.slideshow.macroenabled.12", "ppsm"],
	["application/vnd.ms-powerpoint.template.macroenabled.12", "potm"],
	["application/vnd.ms-project", "mpp"],
	["application/vnd.ms-word.document.macroenabled.12", "docm"],
	["application/vnd.ms-word.template.macroenabled.12", "dotm"],
	["application/vnd.ms-works", [
		"wks",
		"wcm",
		"wdb",
		"wps"
	]],
	["application/vnd.ms-wpl", "wpl"],
	["application/vnd.ms-xpsdocument", "xps"],
	["application/vnd.mseq", "mseq"],
	["application/vnd.musician", "mus"],
	["application/vnd.muvee.style", "msty"],
	["application/vnd.neurolanguage.nlu", "nlu"],
	["application/vnd.noblenet-directory", "nnd"],
	["application/vnd.noblenet-sealer", "nns"],
	["application/vnd.noblenet-web", "nnw"],
	["application/vnd.nokia.configuration-message", "ncm"],
	["application/vnd.nokia.n-gage.data", "ngdat"],
	["application/vnd.nokia.n-gage.symbian.install", "n-gage"],
	["application/vnd.nokia.radio-preset", "rpst"],
	["application/vnd.nokia.radio-presets", "rpss"],
	["application/vnd.nokia.ringing-tone", "rng"],
	["application/vnd.novadigm.edm", "edm"],
	["application/vnd.novadigm.edx", "edx"],
	["application/vnd.novadigm.ext", "ext"],
	["application/vnd.oasis.opendocument.chart", "odc"],
	["application/vnd.oasis.opendocument.chart-template", "otc"],
	["application/vnd.oasis.opendocument.database", "odb"],
	["application/vnd.oasis.opendocument.formula", "odf"],
	["application/vnd.oasis.opendocument.formula-template", "odft"],
	["application/vnd.oasis.opendocument.graphics", "odg"],
	["application/vnd.oasis.opendocument.graphics-template", "otg"],
	["application/vnd.oasis.opendocument.image", "odi"],
	["application/vnd.oasis.opendocument.image-template", "oti"],
	["application/vnd.oasis.opendocument.presentation", "odp"],
	["application/vnd.oasis.opendocument.presentation-template", "otp"],
	["application/vnd.oasis.opendocument.spreadsheet", "ods"],
	["application/vnd.oasis.opendocument.spreadsheet-template", "ots"],
	["application/vnd.oasis.opendocument.text", "odt"],
	["application/vnd.oasis.opendocument.text-master", "odm"],
	["application/vnd.oasis.opendocument.text-template", "ott"],
	["application/vnd.oasis.opendocument.text-web", "oth"],
	["application/vnd.olpc-sugar", "xo"],
	["application/vnd.oma.dd2+xml", "dd2"],
	["application/vnd.openofficeorg.extension", "oxt"],
	["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
	["application/vnd.openxmlformats-officedocument.presentationml.slide", "sldx"],
	["application/vnd.openxmlformats-officedocument.presentationml.slideshow", "ppsx"],
	["application/vnd.openxmlformats-officedocument.presentationml.template", "potx"],
	["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
	["application/vnd.openxmlformats-officedocument.spreadsheetml.template", "xltx"],
	["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
	["application/vnd.openxmlformats-officedocument.wordprocessingml.template", "dotx"],
	["application/vnd.osgeo.mapguide.package", "mgp"],
	["application/vnd.osgi.dp", "dp"],
	["application/vnd.palm", "pdb"],
	["application/vnd.pawaafile", "paw"],
	["application/vnd.pg.format", "str"],
	["application/vnd.pg.osasli", "ei6"],
	["application/vnd.picsel", "efif"],
	["application/vnd.pmi.widget", "wg"],
	["application/vnd.pocketlearn", "plf"],
	["application/vnd.powerbuilder6", "pbd"],
	["application/vnd.previewsystems.box", "box"],
	["application/vnd.proteus.magazine", "mgz"],
	["application/vnd.publishare-delta-tree", "qps"],
	["application/vnd.pvi.ptid1", "ptid"],
	["application/vnd.quark.quarkxpress", "qxd"],
	["application/vnd.realvnc.bed", "bed"],
	["application/vnd.recordare.musicxml", "mxl"],
	["application/vnd.recordare.musicxml+xml", "musicxml"],
	["application/vnd.rig.cryptonote", "cryptonote"],
	["application/vnd.rim.cod", "cod"],
	["application/vnd.rn-realmedia", "rm"],
	["application/vnd.rn-realplayer", "rnx"],
	["application/vnd.route66.link66+xml", "link66"],
	["application/vnd.sailingtracker.track", "st"],
	["application/vnd.seemail", "see"],
	["application/vnd.sema", "sema"],
	["application/vnd.semd", "semd"],
	["application/vnd.semf", "semf"],
	["application/vnd.shana.informed.formdata", "ifm"],
	["application/vnd.shana.informed.formtemplate", "itp"],
	["application/vnd.shana.informed.interchange", "iif"],
	["application/vnd.shana.informed.package", "ipk"],
	["application/vnd.simtech-mindmapper", "twd"],
	["application/vnd.smaf", "mmf"],
	["application/vnd.smart.teacher", "teacher"],
	["application/vnd.solent.sdkm+xml", "sdkm"],
	["application/vnd.spotfire.dxp", "dxp"],
	["application/vnd.spotfire.sfs", "sfs"],
	["application/vnd.stardivision.calc", "sdc"],
	["application/vnd.stardivision.draw", "sda"],
	["application/vnd.stardivision.impress", "sdd"],
	["application/vnd.stardivision.math", "smf"],
	["application/vnd.stardivision.writer", "sdw"],
	["application/vnd.stardivision.writer-global", "sgl"],
	["application/vnd.stepmania.stepchart", "sm"],
	["application/vnd.sun.xml.calc", "sxc"],
	["application/vnd.sun.xml.calc.template", "stc"],
	["application/vnd.sun.xml.draw", "sxd"],
	["application/vnd.sun.xml.draw.template", "std"],
	["application/vnd.sun.xml.impress", "sxi"],
	["application/vnd.sun.xml.impress.template", "sti"],
	["application/vnd.sun.xml.math", "sxm"],
	["application/vnd.sun.xml.writer", "sxw"],
	["application/vnd.sun.xml.writer.global", "sxg"],
	["application/vnd.sun.xml.writer.template", "stw"],
	["application/vnd.sus-calendar", "sus"],
	["application/vnd.svd", "svd"],
	["application/vnd.symbian.install", "sis"],
	["application/vnd.syncml+xml", "xsm"],
	["application/vnd.syncml.dm+wbxml", "bdm"],
	["application/vnd.syncml.dm+xml", "xdm"],
	["application/vnd.tao.intent-module-archive", "tao"],
	["application/vnd.tmobile-livetv", "tmo"],
	["application/vnd.trid.tpt", "tpt"],
	["application/vnd.triscape.mxs", "mxs"],
	["application/vnd.trueapp", "tra"],
	["application/vnd.ufdl", "ufd"],
	["application/vnd.uiq.theme", "utz"],
	["application/vnd.umajin", "umj"],
	["application/vnd.unity", "unityweb"],
	["application/vnd.uoml+xml", "uoml"],
	["application/vnd.vcx", "vcx"],
	["application/vnd.visio", "vsd"],
	["application/vnd.visionary", "vis"],
	["application/vnd.vsf", "vsf"],
	["application/vnd.wap.wbxml", "wbxml"],
	["application/vnd.wap.wmlc", "wmlc"],
	["application/vnd.wap.wmlscriptc", "wmlsc"],
	["application/vnd.webturbo", "wtb"],
	["application/vnd.wolfram.player", "nbp"],
	["application/vnd.wordperfect", "wpd"],
	["application/vnd.wqd", "wqd"],
	["application/vnd.wt.stf", "stf"],
	["application/vnd.xara", ["web", "xar"]],
	["application/vnd.xfdl", "xfdl"],
	["application/vnd.yamaha.hv-dic", "hvd"],
	["application/vnd.yamaha.hv-script", "hvs"],
	["application/vnd.yamaha.hv-voice", "hvp"],
	["application/vnd.yamaha.openscoreformat", "osf"],
	["application/vnd.yamaha.openscoreformat.osfpvg+xml", "osfpvg"],
	["application/vnd.yamaha.smaf-audio", "saf"],
	["application/vnd.yamaha.smaf-phrase", "spf"],
	["application/vnd.yellowriver-custom-menu", "cmp"],
	["application/vnd.zul", "zir"],
	["application/vnd.zzazz.deck+xml", "zaz"],
	["application/vocaltec-media-desc", "vmd"],
	["application/vocaltec-media-file", "vmf"],
	["application/voicexml+xml", "vxml"],
	["application/widget", "wgt"],
	["application/winhlp", "hlp"],
	["application/wordperfect", [
		"wp",
		"wp5",
		"wp6",
		"wpd"
	]],
	["application/wordperfect6.0", ["w60", "wp5"]],
	["application/wordperfect6.1", "w61"],
	["application/wsdl+xml", "wsdl"],
	["application/wspolicy+xml", "wspolicy"],
	["application/x-123", "wk1"],
	["application/x-7z-compressed", "7z"],
	["application/x-abiword", "abw"],
	["application/x-ace-compressed", "ace"],
	["application/x-aim", "aim"],
	["application/x-authorware-bin", "aab"],
	["application/x-authorware-map", "aam"],
	["application/x-authorware-seg", "aas"],
	["application/x-bcpio", "bcpio"],
	["application/x-binary", "bin"],
	["application/x-binhex40", "hqx"],
	["application/x-bittorrent", "torrent"],
	["application/x-bsh", [
		"bsh",
		"sh",
		"shar"
	]],
	["application/x-bytecode.elisp", "elc"],
	["application/x-bytecode.python", "pyc"],
	["application/x-bzip", "bz"],
	["application/x-bzip2", ["boz", "bz2"]],
	["application/x-cdf", "cdf"],
	["application/x-cdlink", "vcd"],
	["application/x-chat", ["cha", "chat"]],
	["application/x-chess-pgn", "pgn"],
	["application/x-cmu-raster", "ras"],
	["application/x-cocoa", "cco"],
	["application/x-compactpro", "cpt"],
	["application/x-compress", "z"],
	["application/x-compressed", [
		"tgz",
		"gz",
		"z",
		"zip"
	]],
	["application/x-conference", "nsc"],
	["application/x-cpio", "cpio"],
	["application/x-cpt", "cpt"],
	["application/x-csh", "csh"],
	["application/x-debian-package", "deb"],
	["application/x-deepv", "deepv"],
	["application/x-director", [
		"dir",
		"dcr",
		"dxr"
	]],
	["application/x-doom", "wad"],
	["application/x-dtbncx+xml", "ncx"],
	["application/x-dtbook+xml", "dtb"],
	["application/x-dtbresource+xml", "res"],
	["application/x-dvi", "dvi"],
	["application/x-elc", "elc"],
	["application/x-envoy", ["env", "evy"]],
	["application/x-esrehber", "es"],
	["application/x-excel", [
		"xls",
		"xla",
		"xlb",
		"xlc",
		"xld",
		"xlk",
		"xll",
		"xlm",
		"xlt",
		"xlv",
		"xlw"
	]],
	["application/x-font-bdf", "bdf"],
	["application/x-font-ghostscript", "gsf"],
	["application/x-font-linux-psf", "psf"],
	["application/x-font-otf", "otf"],
	["application/x-font-pcf", "pcf"],
	["application/x-font-snf", "snf"],
	["application/x-font-ttf", "ttf"],
	["application/x-font-type1", "pfa"],
	["application/x-font-woff", "woff"],
	["application/x-frame", "mif"],
	["application/x-freelance", "pre"],
	["application/x-futuresplash", "spl"],
	["application/x-gnumeric", "gnumeric"],
	["application/x-gsp", "gsp"],
	["application/x-gss", "gss"],
	["application/x-gtar", "gtar"],
	["application/x-gzip", ["gz", "gzip"]],
	["application/x-hdf", "hdf"],
	["application/x-helpfile", ["help", "hlp"]],
	["application/x-httpd-imap", "imap"],
	["application/x-ima", "ima"],
	["application/x-internet-signup", ["ins", "isp"]],
	["application/x-internett-signup", "ins"],
	["application/x-inventor", "iv"],
	["application/x-ip2", "ip"],
	["application/x-iphone", "iii"],
	["application/x-java-class", "class"],
	["application/x-java-commerce", "jcm"],
	["application/x-java-jnlp-file", "jnlp"],
	["application/x-javascript", "js"],
	["application/x-koan", [
		"skd",
		"skm",
		"skp",
		"skt"
	]],
	["application/x-ksh", "ksh"],
	["application/x-latex", ["latex", "ltx"]],
	["application/x-lha", "lha"],
	["application/x-lisp", "lsp"],
	["application/x-livescreen", "ivy"],
	["application/x-lotus", "wq1"],
	["application/x-lotusscreencam", "scm"],
	["application/x-lzh", "lzh"],
	["application/x-lzx", "lzx"],
	["application/x-mac-binhex40", "hqx"],
	["application/x-macbinary", "bin"],
	["application/x-magic-cap-package-1.0", "mc$"],
	["application/x-mathcad", "mcd"],
	["application/x-meme", "mm"],
	["application/x-midi", ["mid", "midi"]],
	["application/x-mif", "mif"],
	["application/x-mix-transfer", "nix"],
	["application/x-mobipocket-ebook", "prc"],
	["application/x-mplayer2", "asx"],
	["application/x-ms-application", "application"],
	["application/x-ms-wmd", "wmd"],
	["application/x-ms-wmz", "wmz"],
	["application/x-ms-xbap", "xbap"],
	["application/x-msaccess", "mdb"],
	["application/x-msbinder", "obd"],
	["application/x-mscardfile", "crd"],
	["application/x-msclip", "clp"],
	["application/x-msdownload", ["exe", "dll"]],
	["application/x-msexcel", [
		"xls",
		"xla",
		"xlw"
	]],
	["application/x-msmediaview", [
		"mvb",
		"m13",
		"m14"
	]],
	["application/x-msmetafile", "wmf"],
	["application/x-msmoney", "mny"],
	["application/x-mspowerpoint", "ppt"],
	["application/x-mspublisher", "pub"],
	["application/x-msschedule", "scd"],
	["application/x-msterminal", "trm"],
	["application/x-mswrite", "wri"],
	["application/x-navi-animation", "ani"],
	["application/x-navidoc", "nvd"],
	["application/x-navimap", "map"],
	["application/x-navistyle", "stl"],
	["application/x-netcdf", ["cdf", "nc"]],
	["application/x-newton-compatible-pkg", "pkg"],
	["application/x-nokia-9000-communicator-add-on-software", "aos"],
	["application/x-omc", "omc"],
	["application/x-omcdatamaker", "omcd"],
	["application/x-omcregerator", "omcr"],
	["application/x-pagemaker", ["pm4", "pm5"]],
	["application/x-pcl", "pcl"],
	["application/x-perfmon", [
		"pma",
		"pmc",
		"pml",
		"pmr",
		"pmw"
	]],
	["application/x-pixclscript", "plx"],
	["application/x-pkcs10", "p10"],
	["application/x-pkcs12", ["p12", "pfx"]],
	["application/x-pkcs7-certificates", ["p7b", "spc"]],
	["application/x-pkcs7-certreqresp", "p7r"],
	["application/x-pkcs7-mime", ["p7m", "p7c"]],
	["application/x-pkcs7-signature", ["p7s", "p7a"]],
	["application/x-pointplus", "css"],
	["application/x-portable-anymap", "pnm"],
	["application/x-project", [
		"mpc",
		"mpt",
		"mpv",
		"mpx"
	]],
	["application/x-qpro", "wb1"],
	["application/x-rar-compressed", "rar"],
	["application/x-rtf", "rtf"],
	["application/x-sdp", "sdp"],
	["application/x-sea", "sea"],
	["application/x-seelogo", "sl"],
	["application/x-sh", "sh"],
	["application/x-shar", ["shar", "sh"]],
	["application/x-shockwave-flash", "swf"],
	["application/x-silverlight-app", "xap"],
	["application/x-sit", "sit"],
	["application/x-sprite", ["spr", "sprite"]],
	["application/x-stuffit", "sit"],
	["application/x-stuffitx", "sitx"],
	["application/x-sv4cpio", "sv4cpio"],
	["application/x-sv4crc", "sv4crc"],
	["application/x-tar", "tar"],
	["application/x-tbook", ["sbk", "tbk"]],
	["application/x-tcl", "tcl"],
	["application/x-tex", "tex"],
	["application/x-tex-tfm", "tfm"],
	["application/x-texinfo", ["texi", "texinfo"]],
	["application/x-troff", [
		"roff",
		"t",
		"tr"
	]],
	["application/x-troff-man", "man"],
	["application/x-troff-me", "me"],
	["application/x-troff-ms", "ms"],
	["application/x-troff-msvideo", "avi"],
	["application/x-ustar", "ustar"],
	["application/x-visio", [
		"vsd",
		"vst",
		"vsw"
	]],
	["application/x-vnd.audioexplosion.mzz", "mzz"],
	["application/x-vnd.ls-xpix", "xpix"],
	["application/x-vrml", "vrml"],
	["application/x-wais-source", ["src", "wsrc"]],
	["application/x-winhelp", "hlp"],
	["application/x-wintalk", "wtk"],
	["application/x-world", ["wrl", "svr"]],
	["application/x-wpwin", "wpd"],
	["application/x-wri", "wri"],
	["application/x-x509-ca-cert", [
		"cer",
		"crt",
		"der"
	]],
	["application/x-x509-user-cert", "crt"],
	["application/x-xfig", "fig"],
	["application/x-xpinstall", "xpi"],
	["application/x-zip-compressed", "zip"],
	["application/xcap-diff+xml", "xdf"],
	["application/xenc+xml", "xenc"],
	["application/xhtml+xml", "xhtml"],
	["application/xml", "xml"],
	["application/xml-dtd", "dtd"],
	["application/xop+xml", "xop"],
	["application/xslt+xml", "xslt"],
	["application/xspf+xml", "xspf"],
	["application/xv+xml", "mxml"],
	["application/yang", "yang"],
	["application/yin+xml", "yin"],
	["application/ynd.ms-pkipko", "pko"],
	["application/zip", "zip"],
	["audio/adpcm", "adp"],
	["audio/aiff", [
		"aiff",
		"aif",
		"aifc"
	]],
	["audio/basic", ["snd", "au"]],
	["audio/it", "it"],
	["audio/make", [
		"funk",
		"my",
		"pfunk"
	]],
	["audio/make.my.funk", "pfunk"],
	["audio/mid", ["mid", "rmi"]],
	["audio/midi", [
		"midi",
		"kar",
		"mid"
	]],
	["audio/mod", "mod"],
	["audio/mp4", "mp4a"],
	["audio/mpeg", [
		"mpga",
		"mp3",
		"m2a",
		"mp2",
		"mpa",
		"mpg"
	]],
	["audio/mpeg3", "mp3"],
	["audio/nspaudio", ["la", "lma"]],
	["audio/ogg", "oga"],
	["audio/s3m", "s3m"],
	["audio/tsp-audio", "tsi"],
	["audio/tsplayer", "tsp"],
	["audio/vnd.dece.audio", "uva"],
	["audio/vnd.digital-winds", "eol"],
	["audio/vnd.dra", "dra"],
	["audio/vnd.dts", "dts"],
	["audio/vnd.dts.hd", "dtshd"],
	["audio/vnd.lucent.voice", "lvp"],
	["audio/vnd.ms-playready.media.pya", "pya"],
	["audio/vnd.nuera.ecelp4800", "ecelp4800"],
	["audio/vnd.nuera.ecelp7470", "ecelp7470"],
	["audio/vnd.nuera.ecelp9600", "ecelp9600"],
	["audio/vnd.qcelp", "qcp"],
	["audio/vnd.rip", "rip"],
	["audio/voc", "voc"],
	["audio/voxware", "vox"],
	["audio/wav", "wav"],
	["audio/webm", "weba"],
	["audio/x-aac", "aac"],
	["audio/x-adpcm", "snd"],
	["audio/x-aiff", [
		"aiff",
		"aif",
		"aifc"
	]],
	["audio/x-au", "au"],
	["audio/x-gsm", ["gsd", "gsm"]],
	["audio/x-jam", "jam"],
	["audio/x-liveaudio", "lam"],
	["audio/x-mid", ["mid", "midi"]],
	["audio/x-midi", ["midi", "mid"]],
	["audio/x-mod", "mod"],
	["audio/x-mpeg", "mp2"],
	["audio/x-mpeg-3", "mp3"],
	["audio/x-mpegurl", "m3u"],
	["audio/x-mpequrl", "m3u"],
	["audio/x-ms-wax", "wax"],
	["audio/x-ms-wma", "wma"],
	["audio/x-nspaudio", ["la", "lma"]],
	["audio/x-pn-realaudio", [
		"ra",
		"ram",
		"rm",
		"rmm",
		"rmp"
	]],
	["audio/x-pn-realaudio-plugin", [
		"ra",
		"rmp",
		"rpm"
	]],
	["audio/x-psid", "sid"],
	["audio/x-realaudio", "ra"],
	["audio/x-twinvq", "vqf"],
	["audio/x-twinvq-plugin", ["vqe", "vql"]],
	["audio/x-vnd.audioexplosion.mjuicemediafile", "mjf"],
	["audio/x-voc", "voc"],
	["audio/x-wav", "wav"],
	["audio/xm", "xm"],
	["chemical/x-cdx", "cdx"],
	["chemical/x-cif", "cif"],
	["chemical/x-cmdf", "cmdf"],
	["chemical/x-cml", "cml"],
	["chemical/x-csml", "csml"],
	["chemical/x-pdb", ["pdb", "xyz"]],
	["chemical/x-xyz", "xyz"],
	["drawing/x-dwf", "dwf"],
	["i-world/i-vrml", "ivr"],
	["image/bmp", ["bmp", "bm"]],
	["image/cgm", "cgm"],
	["image/cis-cod", "cod"],
	["image/cmu-raster", ["ras", "rast"]],
	["image/fif", "fif"],
	["image/florian", ["flo", "turbot"]],
	["image/g3fax", "g3"],
	["image/gif", "gif"],
	["image/ief", ["ief", "iefs"]],
	["image/jpeg", [
		"jpeg",
		"jpe",
		"jpg",
		"jfif",
		"jfif-tbnl"
	]],
	["image/jutvision", "jut"],
	["image/ktx", "ktx"],
	["image/naplps", ["nap", "naplps"]],
	["image/pict", ["pic", "pict"]],
	["image/pipeg", "jfif"],
	["image/pjpeg", [
		"jfif",
		"jpe",
		"jpeg",
		"jpg"
	]],
	["image/png", ["png", "x-png"]],
	["image/prs.btif", "btif"],
	["image/svg+xml", "svg"],
	["image/tiff", ["tif", "tiff"]],
	["image/vasa", "mcf"],
	["image/vnd.adobe.photoshop", "psd"],
	["image/vnd.dece.graphic", "uvi"],
	["image/vnd.djvu", "djvu"],
	["image/vnd.dvb.subtitle", "sub"],
	["image/vnd.dwg", [
		"dwg",
		"dxf",
		"svf"
	]],
	["image/vnd.dxf", "dxf"],
	["image/vnd.fastbidsheet", "fbs"],
	["image/vnd.fpx", "fpx"],
	["image/vnd.fst", "fst"],
	["image/vnd.fujixerox.edmics-mmr", "mmr"],
	["image/vnd.fujixerox.edmics-rlc", "rlc"],
	["image/vnd.ms-modi", "mdi"],
	["image/vnd.net-fpx", ["fpx", "npx"]],
	["image/vnd.rn-realflash", "rf"],
	["image/vnd.rn-realpix", "rp"],
	["image/vnd.wap.wbmp", "wbmp"],
	["image/vnd.xiff", "xif"],
	["image/webp", "webp"],
	["image/x-cmu-raster", "ras"],
	["image/x-cmx", "cmx"],
	["image/x-dwg", [
		"dwg",
		"dxf",
		"svf"
	]],
	["image/x-freehand", "fh"],
	["image/x-icon", "ico"],
	["image/x-jg", "art"],
	["image/x-jps", "jps"],
	["image/x-niff", ["niff", "nif"]],
	["image/x-pcx", "pcx"],
	["image/x-pict", ["pct", "pic"]],
	["image/x-portable-anymap", "pnm"],
	["image/x-portable-bitmap", "pbm"],
	["image/x-portable-graymap", "pgm"],
	["image/x-portable-greymap", "pgm"],
	["image/x-portable-pixmap", "ppm"],
	["image/x-quicktime", [
		"qif",
		"qti",
		"qtif"
	]],
	["image/x-rgb", "rgb"],
	["image/x-tiff", ["tif", "tiff"]],
	["image/x-windows-bmp", "bmp"],
	["image/x-xbitmap", "xbm"],
	["image/x-xbm", "xbm"],
	["image/x-xpixmap", ["xpm", "pm"]],
	["image/x-xwd", "xwd"],
	["image/x-xwindowdump", "xwd"],
	["image/xbm", "xbm"],
	["image/xpm", "xpm"],
	["message/rfc822", [
		"eml",
		"mht",
		"mhtml",
		"nws",
		"mime"
	]],
	["model/iges", ["iges", "igs"]],
	["model/mesh", "msh"],
	["model/vnd.collada+xml", "dae"],
	["model/vnd.dwf", "dwf"],
	["model/vnd.gdl", "gdl"],
	["model/vnd.gtw", "gtw"],
	["model/vnd.mts", "mts"],
	["model/vnd.vtu", "vtu"],
	["model/vrml", [
		"vrml",
		"wrl",
		"wrz"
	]],
	["model/x-pov", "pov"],
	["multipart/x-gzip", "gzip"],
	["multipart/x-ustar", "ustar"],
	["multipart/x-zip", "zip"],
	["music/crescendo", ["mid", "midi"]],
	["music/x-karaoke", "kar"],
	["paleovu/x-pv", "pvu"],
	["text/asp", "asp"],
	["text/calendar", "ics"],
	["text/css", "css"],
	["text/csv", "csv"],
	["text/ecmascript", "js"],
	["text/h323", "323"],
	["text/html", [
		"html",
		"htm",
		"stm",
		"acgi",
		"htmls",
		"htx",
		"shtml"
	]],
	["text/iuls", "uls"],
	["text/javascript", "js"],
	["text/mcf", "mcf"],
	["text/n3", "n3"],
	["text/pascal", "pas"],
	["text/plain", [
		"txt",
		"bas",
		"c",
		"h",
		"c++",
		"cc",
		"com",
		"conf",
		"cxx",
		"def",
		"f",
		"f90",
		"for",
		"g",
		"hh",
		"idc",
		"jav",
		"java",
		"list",
		"log",
		"lst",
		"m",
		"mar",
		"pl",
		"sdml",
		"text"
	]],
	["text/plain-bas", "par"],
	["text/prs.lines.tag", "dsc"],
	["text/richtext", [
		"rtx",
		"rt",
		"rtf"
	]],
	["text/scriplet", "wsc"],
	["text/scriptlet", "sct"],
	["text/sgml", ["sgm", "sgml"]],
	["text/tab-separated-values", "tsv"],
	["text/troff", "t"],
	["text/turtle", "ttl"],
	["text/uri-list", [
		"uni",
		"unis",
		"uri",
		"uris"
	]],
	["text/vnd.abc", "abc"],
	["text/vnd.curl", "curl"],
	["text/vnd.curl.dcurl", "dcurl"],
	["text/vnd.curl.mcurl", "mcurl"],
	["text/vnd.curl.scurl", "scurl"],
	["text/vnd.fly", "fly"],
	["text/vnd.fmi.flexstor", "flx"],
	["text/vnd.graphviz", "gv"],
	["text/vnd.in3d.3dml", "3dml"],
	["text/vnd.in3d.spot", "spot"],
	["text/vnd.rn-realtext", "rt"],
	["text/vnd.sun.j2me.app-descriptor", "jad"],
	["text/vnd.wap.wml", "wml"],
	["text/vnd.wap.wmlscript", "wmls"],
	["text/webviewhtml", "htt"],
	["text/x-asm", ["asm", "s"]],
	["text/x-audiosoft-intra", "aip"],
	["text/x-c", [
		"c",
		"cc",
		"cpp"
	]],
	["text/x-component", "htc"],
	["text/x-fortran", [
		"for",
		"f",
		"f77",
		"f90"
	]],
	["text/x-h", ["h", "hh"]],
	["text/x-java-source", ["java", "jav"]],
	["text/x-java-source,java", "java"],
	["text/x-la-asf", "lsx"],
	["text/x-m", "m"],
	["text/x-pascal", "p"],
	["text/x-script", "hlb"],
	["text/x-script.csh", "csh"],
	["text/x-script.elisp", "el"],
	["text/x-script.guile", "scm"],
	["text/x-script.ksh", "ksh"],
	["text/x-script.lisp", "lsp"],
	["text/x-script.perl", "pl"],
	["text/x-script.perl-module", "pm"],
	["text/x-script.phyton", "py"],
	["text/x-script.rexx", "rexx"],
	["text/x-script.scheme", "scm"],
	["text/x-script.sh", "sh"],
	["text/x-script.tcl", "tcl"],
	["text/x-script.tcsh", "tcsh"],
	["text/x-script.zsh", "zsh"],
	["text/x-server-parsed-html", ["shtml", "ssi"]],
	["text/x-setext", "etx"],
	["text/x-sgml", ["sgm", "sgml"]],
	["text/x-speech", ["spc", "talk"]],
	["text/x-uil", "uil"],
	["text/x-uuencode", ["uu", "uue"]],
	["text/x-vcalendar", "vcs"],
	["text/x-vcard", "vcf"],
	["text/xml", "xml"],
	["video/3gpp", "3gp"],
	["video/3gpp2", "3g2"],
	["video/animaflex", "afl"],
	["video/avi", "avi"],
	["video/avs-video", "avs"],
	["video/dl", "dl"],
	["video/fli", "fli"],
	["video/gl", "gl"],
	["video/h261", "h261"],
	["video/h263", "h263"],
	["video/h264", "h264"],
	["video/jpeg", "jpgv"],
	["video/jpm", "jpm"],
	["video/mj2", "mj2"],
	["video/mp4", "mp4"],
	["video/mpeg", [
		"mpeg",
		"mp2",
		"mpa",
		"mpe",
		"mpg",
		"mpv2",
		"m1v",
		"m2v",
		"mp3"
	]],
	["video/msvideo", "avi"],
	["video/ogg", "ogv"],
	["video/quicktime", [
		"mov",
		"qt",
		"moov"
	]],
	["video/vdo", "vdo"],
	["video/vivo", ["viv", "vivo"]],
	["video/vnd.dece.hd", "uvh"],
	["video/vnd.dece.mobile", "uvm"],
	["video/vnd.dece.pd", "uvp"],
	["video/vnd.dece.sd", "uvs"],
	["video/vnd.dece.video", "uvv"],
	["video/vnd.fvt", "fvt"],
	["video/vnd.mpegurl", "mxu"],
	["video/vnd.ms-playready.media.pyv", "pyv"],
	["video/vnd.rn-realvideo", "rv"],
	["video/vnd.uvvu.mp4", "uvu"],
	["video/vnd.vivo", ["viv", "vivo"]],
	["video/vosaic", "vos"],
	["video/webm", "webm"],
	["video/x-amt-demorun", "xdr"],
	["video/x-amt-showrun", "xsr"],
	["video/x-atomic3d-feature", "fmf"],
	["video/x-dl", "dl"],
	["video/x-dv", ["dif", "dv"]],
	["video/x-f4v", "f4v"],
	["video/x-fli", "fli"],
	["video/x-flv", "flv"],
	["video/x-gl", "gl"],
	["video/x-isvideo", "isu"],
	["video/x-la-asf", ["lsf", "lsx"]],
	["video/x-m4v", "m4v"],
	["video/x-motion-jpeg", "mjpg"],
	["video/x-mpeg", ["mp3", "mp2"]],
	["video/x-mpeq2a", "mp2"],
	["video/x-ms-asf", [
		"asf",
		"asr",
		"asx"
	]],
	["video/x-ms-asf-plugin", "asx"],
	["video/x-ms-wm", "wm"],
	["video/x-ms-wmv", "wmv"],
	["video/x-ms-wmx", "wmx"],
	["video/x-ms-wvx", "wvx"],
	["video/x-msvideo", "avi"],
	["video/x-qtc", "qtc"],
	["video/x-scm", "scm"],
	["video/x-sgi-movie", ["movie", "mv"]],
	["windows/metafile", "wmf"],
	["www/mime", "mime"],
	["x-conference/x-cooltalk", "ice"],
	["x-music/x-midi", ["mid", "midi"]],
	["x-world/x-3dmf", [
		"3dm",
		"3dmf",
		"qd3",
		"qd3d"
	]],
	["x-world/x-svr", "svr"],
	["x-world/x-vrml", [
		"flr",
		"vrml",
		"wrl",
		"wrz",
		"xaf",
		"xof"
	]],
	["x-world/x-vrt", "vrt"],
	["xgl/drawing", "xgz"],
	["xgl/movie", "xmz"]
]);
const extensions = /* @__PURE__ */ new Map([
	["123", "application/vnd.lotus-1-2-3"],
	["323", "text/h323"],
	["*", "application/octet-stream"],
	["3dm", "x-world/x-3dmf"],
	["3dmf", "x-world/x-3dmf"],
	["3dml", "text/vnd.in3d.3dml"],
	["3g2", "video/3gpp2"],
	["3gp", "video/3gpp"],
	["7z", "application/x-7z-compressed"],
	["a", "application/octet-stream"],
	["aab", "application/x-authorware-bin"],
	["aac", "audio/x-aac"],
	["aam", "application/x-authorware-map"],
	["aas", "application/x-authorware-seg"],
	["abc", "text/vnd.abc"],
	["abw", "application/x-abiword"],
	["ac", "application/pkix-attr-cert"],
	["acc", "application/vnd.americandynamics.acc"],
	["ace", "application/x-ace-compressed"],
	["acgi", "text/html"],
	["acu", "application/vnd.acucobol"],
	["acx", "application/internet-property-stream"],
	["adp", "audio/adpcm"],
	["aep", "application/vnd.audiograph"],
	["afl", "video/animaflex"],
	["afp", "application/vnd.ibm.modcap"],
	["ahead", "application/vnd.ahead.space"],
	["ai", "application/postscript"],
	["aif", ["audio/aiff", "audio/x-aiff"]],
	["aifc", ["audio/aiff", "audio/x-aiff"]],
	["aiff", ["audio/aiff", "audio/x-aiff"]],
	["aim", "application/x-aim"],
	["aip", "text/x-audiosoft-intra"],
	["air", "application/vnd.adobe.air-application-installer-package+zip"],
	["ait", "application/vnd.dvb.ait"],
	["ami", "application/vnd.amiga.ami"],
	["ani", "application/x-navi-animation"],
	["aos", "application/x-nokia-9000-communicator-add-on-software"],
	["apk", "application/vnd.android.package-archive"],
	["application", "application/x-ms-application"],
	["apr", "application/vnd.lotus-approach"],
	["aps", "application/mime"],
	["arc", "application/octet-stream"],
	["arj", ["application/arj", "application/octet-stream"]],
	["art", "image/x-jg"],
	["asf", "video/x-ms-asf"],
	["asm", "text/x-asm"],
	["aso", "application/vnd.accpac.simply.aso"],
	["asp", "text/asp"],
	["asr", "video/x-ms-asf"],
	["asx", [
		"video/x-ms-asf",
		"application/x-mplayer2",
		"video/x-ms-asf-plugin"
	]],
	["atc", "application/vnd.acucorp"],
	["atomcat", "application/atomcat+xml"],
	["atomsvc", "application/atomsvc+xml"],
	["atx", "application/vnd.antix.game-component"],
	["au", ["audio/basic", "audio/x-au"]],
	["avi", [
		"video/avi",
		"video/msvideo",
		"application/x-troff-msvideo",
		"video/x-msvideo"
	]],
	["avs", "video/avs-video"],
	["aw", "application/applixware"],
	["axs", "application/olescript"],
	["azf", "application/vnd.airzip.filesecure.azf"],
	["azs", "application/vnd.airzip.filesecure.azs"],
	["azw", "application/vnd.amazon.ebook"],
	["bas", "text/plain"],
	["bcpio", "application/x-bcpio"],
	["bdf", "application/x-font-bdf"],
	["bdm", "application/vnd.syncml.dm+wbxml"],
	["bed", "application/vnd.realvnc.bed"],
	["bh2", "application/vnd.fujitsu.oasysprs"],
	["bin", [
		"application/octet-stream",
		"application/mac-binary",
		"application/macbinary",
		"application/x-macbinary",
		"application/x-binary"
	]],
	["bm", "image/bmp"],
	["bmi", "application/vnd.bmi"],
	["bmp", ["image/bmp", "image/x-windows-bmp"]],
	["boo", "application/book"],
	["book", "application/book"],
	["box", "application/vnd.previewsystems.box"],
	["boz", "application/x-bzip2"],
	["bsh", "application/x-bsh"],
	["btif", "image/prs.btif"],
	["bz", "application/x-bzip"],
	["bz2", "application/x-bzip2"],
	["c", ["text/plain", "text/x-c"]],
	["c++", "text/plain"],
	["c11amc", "application/vnd.cluetrust.cartomobile-config"],
	["c11amz", "application/vnd.cluetrust.cartomobile-config-pkg"],
	["c4g", "application/vnd.clonk.c4group"],
	["cab", "application/vnd.ms-cab-compressed"],
	["car", "application/vnd.curl.car"],
	["cat", ["application/vnd.ms-pkiseccat", "application/vnd.ms-pki.seccat"]],
	["cc", ["text/plain", "text/x-c"]],
	["ccad", "application/clariscad"],
	["cco", "application/x-cocoa"],
	["ccxml", "application/ccxml+xml,"],
	["cdbcmsg", "application/vnd.contact.cmsg"],
	["cdf", [
		"application/cdf",
		"application/x-cdf",
		"application/x-netcdf"
	]],
	["cdkey", "application/vnd.mediastation.cdkey"],
	["cdmia", "application/cdmi-capability"],
	["cdmic", "application/cdmi-container"],
	["cdmid", "application/cdmi-domain"],
	["cdmio", "application/cdmi-object"],
	["cdmiq", "application/cdmi-queue"],
	["cdx", "chemical/x-cdx"],
	["cdxml", "application/vnd.chemdraw+xml"],
	["cdy", "application/vnd.cinderella"],
	["cer", ["application/pkix-cert", "application/x-x509-ca-cert"]],
	["cgm", "image/cgm"],
	["cha", "application/x-chat"],
	["chat", "application/x-chat"],
	["chm", "application/vnd.ms-htmlhelp"],
	["chrt", "application/vnd.kde.kchart"],
	["cif", "chemical/x-cif"],
	["cii", "application/vnd.anser-web-certificate-issue-initiation"],
	["cil", "application/vnd.ms-artgalry"],
	["cla", "application/vnd.claymore"],
	["class", [
		"application/octet-stream",
		"application/java",
		"application/java-byte-code",
		"application/java-vm",
		"application/x-java-class"
	]],
	["clkk", "application/vnd.crick.clicker.keyboard"],
	["clkp", "application/vnd.crick.clicker.palette"],
	["clkt", "application/vnd.crick.clicker.template"],
	["clkw", "application/vnd.crick.clicker.wordbank"],
	["clkx", "application/vnd.crick.clicker"],
	["clp", "application/x-msclip"],
	["cmc", "application/vnd.cosmocaller"],
	["cmdf", "chemical/x-cmdf"],
	["cml", "chemical/x-cml"],
	["cmp", "application/vnd.yellowriver-custom-menu"],
	["cmx", "image/x-cmx"],
	["cod", ["image/cis-cod", "application/vnd.rim.cod"]],
	["com", ["application/octet-stream", "text/plain"]],
	["conf", "text/plain"],
	["cpio", "application/x-cpio"],
	["cpp", "text/x-c"],
	["cpt", [
		"application/mac-compactpro",
		"application/x-compactpro",
		"application/x-cpt"
	]],
	["crd", "application/x-mscardfile"],
	["crl", ["application/pkix-crl", "application/pkcs-crl"]],
	["crt", [
		"application/pkix-cert",
		"application/x-x509-user-cert",
		"application/x-x509-ca-cert"
	]],
	["cryptonote", "application/vnd.rig.cryptonote"],
	["csh", ["text/x-script.csh", "application/x-csh"]],
	["csml", "chemical/x-csml"],
	["csp", "application/vnd.commonspace"],
	["css", ["text/css", "application/x-pointplus"]],
	["csv", "text/csv"],
	["cu", "application/cu-seeme"],
	["curl", "text/vnd.curl"],
	["cww", "application/prs.cww"],
	["cxx", "text/plain"],
	["dae", "model/vnd.collada+xml"],
	["daf", "application/vnd.mobius.daf"],
	["davmount", "application/davmount+xml"],
	["dcr", "application/x-director"],
	["dcurl", "text/vnd.curl.dcurl"],
	["dd2", "application/vnd.oma.dd2+xml"],
	["ddd", "application/vnd.fujixerox.ddd"],
	["deb", "application/x-debian-package"],
	["deepv", "application/x-deepv"],
	["def", "text/plain"],
	["der", "application/x-x509-ca-cert"],
	["dfac", "application/vnd.dreamfactory"],
	["dif", "video/x-dv"],
	["dir", "application/x-director"],
	["dis", "application/vnd.mobius.dis"],
	["djvu", "image/vnd.djvu"],
	["dl", ["video/dl", "video/x-dl"]],
	["dll", "application/x-msdownload"],
	["dms", "application/octet-stream"],
	["dna", "application/vnd.dna"],
	["doc", "application/msword"],
	["docm", "application/vnd.ms-word.document.macroenabled.12"],
	["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
	["dot", "application/msword"],
	["dotm", "application/vnd.ms-word.template.macroenabled.12"],
	["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
	["dp", ["application/commonground", "application/vnd.osgi.dp"]],
	["dpg", "application/vnd.dpgraph"],
	["dra", "audio/vnd.dra"],
	["drw", "application/drafting"],
	["dsc", "text/prs.lines.tag"],
	["dssc", "application/dssc+der"],
	["dtb", "application/x-dtbook+xml"],
	["dtd", "application/xml-dtd"],
	["dts", "audio/vnd.dts"],
	["dtshd", "audio/vnd.dts.hd"],
	["dump", "application/octet-stream"],
	["dv", "video/x-dv"],
	["dvi", "application/x-dvi"],
	["dwf", ["model/vnd.dwf", "drawing/x-dwf"]],
	["dwg", [
		"application/acad",
		"image/vnd.dwg",
		"image/x-dwg"
	]],
	["dxf", [
		"application/dxf",
		"image/vnd.dwg",
		"image/vnd.dxf",
		"image/x-dwg"
	]],
	["dxp", "application/vnd.spotfire.dxp"],
	["dxr", "application/x-director"],
	["ecelp4800", "audio/vnd.nuera.ecelp4800"],
	["ecelp7470", "audio/vnd.nuera.ecelp7470"],
	["ecelp9600", "audio/vnd.nuera.ecelp9600"],
	["edm", "application/vnd.novadigm.edm"],
	["edx", "application/vnd.novadigm.edx"],
	["efif", "application/vnd.picsel"],
	["ei6", "application/vnd.pg.osasli"],
	["el", "text/x-script.elisp"],
	["elc", ["application/x-elc", "application/x-bytecode.elisp"]],
	["eml", "message/rfc822"],
	["emma", "application/emma+xml"],
	["env", "application/x-envoy"],
	["eol", "audio/vnd.digital-winds"],
	["eot", "application/vnd.ms-fontobject"],
	["eps", "application/postscript"],
	["epub", "application/epub+zip"],
	["es", ["application/ecmascript", "application/x-esrehber"]],
	["es3", "application/vnd.eszigno3+xml"],
	["esf", "application/vnd.epson.esf"],
	["etx", "text/x-setext"],
	["evy", ["application/envoy", "application/x-envoy"]],
	["exe", ["application/octet-stream", "application/x-msdownload"]],
	["exi", "application/exi"],
	["ext", "application/vnd.novadigm.ext"],
	["ez2", "application/vnd.ezpix-album"],
	["ez3", "application/vnd.ezpix-package"],
	["f", ["text/plain", "text/x-fortran"]],
	["f4v", "video/x-f4v"],
	["f77", "text/x-fortran"],
	["f90", ["text/plain", "text/x-fortran"]],
	["fbs", "image/vnd.fastbidsheet"],
	["fcs", "application/vnd.isac.fcs"],
	["fdf", "application/vnd.fdf"],
	["fe_launch", "application/vnd.denovo.fcselayout-link"],
	["fg5", "application/vnd.fujitsu.oasysgp"],
	["fh", "image/x-freehand"],
	["fif", ["application/fractals", "image/fif"]],
	["fig", "application/x-xfig"],
	["fli", ["video/fli", "video/x-fli"]],
	["flo", ["image/florian", "application/vnd.micrografx.flo"]],
	["flr", "x-world/x-vrml"],
	["flv", "video/x-flv"],
	["flw", "application/vnd.kde.kivio"],
	["flx", "text/vnd.fmi.flexstor"],
	["fly", "text/vnd.fly"],
	["fm", "application/vnd.framemaker"],
	["fmf", "video/x-atomic3d-feature"],
	["fnc", "application/vnd.frogans.fnc"],
	["for", ["text/plain", "text/x-fortran"]],
	["fpx", ["image/vnd.fpx", "image/vnd.net-fpx"]],
	["frl", "application/freeloader"],
	["fsc", "application/vnd.fsc.weblaunch"],
	["fst", "image/vnd.fst"],
	["ftc", "application/vnd.fluxtime.clip"],
	["fti", "application/vnd.anser-web-funds-transfer-initiation"],
	["funk", "audio/make"],
	["fvt", "video/vnd.fvt"],
	["fxp", "application/vnd.adobe.fxp"],
	["fzs", "application/vnd.fuzzysheet"],
	["g", "text/plain"],
	["g2w", "application/vnd.geoplan"],
	["g3", "image/g3fax"],
	["g3w", "application/vnd.geospace"],
	["gac", "application/vnd.groove-account"],
	["gdl", "model/vnd.gdl"],
	["geo", "application/vnd.dynageo"],
	["geojson", "application/geo+json"],
	["gex", "application/vnd.geometry-explorer"],
	["ggb", "application/vnd.geogebra.file"],
	["ggt", "application/vnd.geogebra.tool"],
	["ghf", "application/vnd.groove-help"],
	["gif", "image/gif"],
	["gim", "application/vnd.groove-identity-message"],
	["gl", ["video/gl", "video/x-gl"]],
	["gmx", "application/vnd.gmx"],
	["gnumeric", "application/x-gnumeric"],
	["gph", "application/vnd.flographit"],
	["gqf", "application/vnd.grafeq"],
	["gram", "application/srgs"],
	["grv", "application/vnd.groove-injector"],
	["grxml", "application/srgs+xml"],
	["gsd", "audio/x-gsm"],
	["gsf", "application/x-font-ghostscript"],
	["gsm", "audio/x-gsm"],
	["gsp", "application/x-gsp"],
	["gss", "application/x-gss"],
	["gtar", "application/x-gtar"],
	["gtm", "application/vnd.groove-tool-message"],
	["gtw", "model/vnd.gtw"],
	["gv", "text/vnd.graphviz"],
	["gxt", "application/vnd.geonext"],
	["gz", ["application/x-gzip", "application/x-compressed"]],
	["gzip", ["multipart/x-gzip", "application/x-gzip"]],
	["h", ["text/plain", "text/x-h"]],
	["h261", "video/h261"],
	["h263", "video/h263"],
	["h264", "video/h264"],
	["hal", "application/vnd.hal+xml"],
	["hbci", "application/vnd.hbci"],
	["hdf", "application/x-hdf"],
	["help", "application/x-helpfile"],
	["hgl", "application/vnd.hp-hpgl"],
	["hh", ["text/plain", "text/x-h"]],
	["hlb", "text/x-script"],
	["hlp", [
		"application/winhlp",
		"application/hlp",
		"application/x-helpfile",
		"application/x-winhelp"
	]],
	["hpg", "application/vnd.hp-hpgl"],
	["hpgl", "application/vnd.hp-hpgl"],
	["hpid", "application/vnd.hp-hpid"],
	["hps", "application/vnd.hp-hps"],
	["hqx", [
		"application/mac-binhex40",
		"application/binhex",
		"application/binhex4",
		"application/mac-binhex",
		"application/x-binhex40",
		"application/x-mac-binhex40"
	]],
	["hta", "application/hta"],
	["htc", "text/x-component"],
	["htke", "application/vnd.kenameaapp"],
	["htm", "text/html"],
	["html", "text/html"],
	["htmls", "text/html"],
	["htt", "text/webviewhtml"],
	["htx", "text/html"],
	["hvd", "application/vnd.yamaha.hv-dic"],
	["hvp", "application/vnd.yamaha.hv-voice"],
	["hvs", "application/vnd.yamaha.hv-script"],
	["i2g", "application/vnd.intergeo"],
	["icc", "application/vnd.iccprofile"],
	["ice", "x-conference/x-cooltalk"],
	["ico", "image/x-icon"],
	["ics", "text/calendar"],
	["idc", "text/plain"],
	["ief", "image/ief"],
	["iefs", "image/ief"],
	["ifm", "application/vnd.shana.informed.formdata"],
	["iges", ["application/iges", "model/iges"]],
	["igl", "application/vnd.igloader"],
	["igm", "application/vnd.insors.igm"],
	["igs", ["application/iges", "model/iges"]],
	["igx", "application/vnd.micrografx.igx"],
	["iif", "application/vnd.shana.informed.interchange"],
	["iii", "application/x-iphone"],
	["ima", "application/x-ima"],
	["imap", "application/x-httpd-imap"],
	["imp", "application/vnd.accpac.simply.imp"],
	["ims", "application/vnd.ms-ims"],
	["inf", "application/inf"],
	["ins", ["application/x-internet-signup", "application/x-internett-signup"]],
	["ip", "application/x-ip2"],
	["ipfix", "application/ipfix"],
	["ipk", "application/vnd.shana.informed.package"],
	["irm", "application/vnd.ibm.rights-management"],
	["irp", "application/vnd.irepository.package+xml"],
	["isp", "application/x-internet-signup"],
	["isu", "video/x-isvideo"],
	["it", "audio/it"],
	["itp", "application/vnd.shana.informed.formtemplate"],
	["iv", "application/x-inventor"],
	["ivp", "application/vnd.immervision-ivp"],
	["ivr", "i-world/i-vrml"],
	["ivu", "application/vnd.immervision-ivu"],
	["ivy", "application/x-livescreen"],
	["jad", "text/vnd.sun.j2me.app-descriptor"],
	["jam", ["application/vnd.jam", "audio/x-jam"]],
	["jar", "application/java-archive"],
	["jav", ["text/plain", "text/x-java-source"]],
	["java", [
		"text/plain",
		"text/x-java-source,java",
		"text/x-java-source"
	]],
	["jcm", "application/x-java-commerce"],
	["jfif", [
		"image/pipeg",
		"image/jpeg",
		"image/pjpeg"
	]],
	["jfif-tbnl", "image/jpeg"],
	["jisp", "application/vnd.jisp"],
	["jlt", "application/vnd.hp-jlyt"],
	["jnlp", "application/x-java-jnlp-file"],
	["joda", "application/vnd.joost.joda-archive"],
	["jpe", ["image/jpeg", "image/pjpeg"]],
	["jpeg", ["image/jpeg", "image/pjpeg"]],
	["jpg", ["image/jpeg", "image/pjpeg"]],
	["jpgv", "video/jpeg"],
	["jpm", "video/jpm"],
	["jps", "image/x-jps"],
	["js", [
		"application/javascript",
		"application/ecmascript",
		"text/javascript",
		"text/ecmascript",
		"application/x-javascript"
	]],
	["json", "application/json"],
	["jut", "image/jutvision"],
	["kar", ["audio/midi", "music/x-karaoke"]],
	["karbon", "application/vnd.kde.karbon"],
	["kfo", "application/vnd.kde.kformula"],
	["kia", "application/vnd.kidspiration"],
	["kml", "application/vnd.google-earth.kml+xml"],
	["kmz", "application/vnd.google-earth.kmz"],
	["kne", "application/vnd.kinar"],
	["kon", "application/vnd.kde.kontour"],
	["kpr", "application/vnd.kde.kpresenter"],
	["ksh", ["application/x-ksh", "text/x-script.ksh"]],
	["ksp", "application/vnd.kde.kspread"],
	["ktx", "image/ktx"],
	["ktz", "application/vnd.kahootz"],
	["kwd", "application/vnd.kde.kword"],
	["la", ["audio/nspaudio", "audio/x-nspaudio"]],
	["lam", "audio/x-liveaudio"],
	["lasxml", "application/vnd.las.las+xml"],
	["latex", "application/x-latex"],
	["lbd", "application/vnd.llamagraphics.life-balance.desktop"],
	["lbe", "application/vnd.llamagraphics.life-balance.exchange+xml"],
	["les", "application/vnd.hhe.lesson-player"],
	["lha", [
		"application/octet-stream",
		"application/lha",
		"application/x-lha"
	]],
	["lhx", "application/octet-stream"],
	["link66", "application/vnd.route66.link66+xml"],
	["list", "text/plain"],
	["lma", ["audio/nspaudio", "audio/x-nspaudio"]],
	["log", "text/plain"],
	["lrm", "application/vnd.ms-lrm"],
	["lsf", "video/x-la-asf"],
	["lsp", ["application/x-lisp", "text/x-script.lisp"]],
	["lst", "text/plain"],
	["lsx", ["video/x-la-asf", "text/x-la-asf"]],
	["ltf", "application/vnd.frogans.ltf"],
	["ltx", "application/x-latex"],
	["lvp", "audio/vnd.lucent.voice"],
	["lwp", "application/vnd.lotus-wordpro"],
	["lzh", ["application/octet-stream", "application/x-lzh"]],
	["lzx", [
		"application/lzx",
		"application/octet-stream",
		"application/x-lzx"
	]],
	["m", ["text/plain", "text/x-m"]],
	["m13", "application/x-msmediaview"],
	["m14", "application/x-msmediaview"],
	["m1v", "video/mpeg"],
	["m21", "application/mp21"],
	["m2a", "audio/mpeg"],
	["m2v", "video/mpeg"],
	["m3u", ["audio/x-mpegurl", "audio/x-mpequrl"]],
	["m3u8", "application/vnd.apple.mpegurl"],
	["m4v", "video/x-m4v"],
	["ma", "application/mathematica"],
	["mads", "application/mads+xml"],
	["mag", "application/vnd.ecowin.chart"],
	["man", "application/x-troff-man"],
	["map", "application/x-navimap"],
	["mar", "text/plain"],
	["mathml", "application/mathml+xml"],
	["mbd", "application/mbedlet"],
	["mbk", "application/vnd.mobius.mbk"],
	["mbox", "application/mbox"],
	["mc$", "application/x-magic-cap-package-1.0"],
	["mc1", "application/vnd.medcalcdata"],
	["mcd", [
		"application/mcad",
		"application/vnd.mcd",
		"application/x-mathcad"
	]],
	["mcf", ["image/vasa", "text/mcf"]],
	["mcp", "application/netmc"],
	["mcurl", "text/vnd.curl.mcurl"],
	["mdb", "application/x-msaccess"],
	["mdi", "image/vnd.ms-modi"],
	["me", "application/x-troff-me"],
	["meta4", "application/metalink4+xml"],
	["mets", "application/mets+xml"],
	["mfm", "application/vnd.mfmp"],
	["mgp", "application/vnd.osgeo.mapguide.package"],
	["mgz", "application/vnd.proteus.magazine"],
	["mht", "message/rfc822"],
	["mhtml", "message/rfc822"],
	["mid", [
		"audio/mid",
		"audio/midi",
		"music/crescendo",
		"x-music/x-midi",
		"audio/x-midi",
		"application/x-midi",
		"audio/x-mid"
	]],
	["midi", [
		"audio/midi",
		"music/crescendo",
		"x-music/x-midi",
		"audio/x-midi",
		"application/x-midi",
		"audio/x-mid"
	]],
	["mif", [
		"application/vnd.mif",
		"application/x-mif",
		"application/x-frame"
	]],
	["mime", ["message/rfc822", "www/mime"]],
	["mj2", "video/mj2"],
	["mjf", "audio/x-vnd.audioexplosion.mjuicemediafile"],
	["mjpg", "video/x-motion-jpeg"],
	["mlp", "application/vnd.dolby.mlp"],
	["mm", ["application/base64", "application/x-meme"]],
	["mmd", "application/vnd.chipnuts.karaoke-mmd"],
	["mme", "application/base64"],
	["mmf", "application/vnd.smaf"],
	["mmr", "image/vnd.fujixerox.edmics-mmr"],
	["mny", "application/x-msmoney"],
	["mod", ["audio/mod", "audio/x-mod"]],
	["mods", "application/mods+xml"],
	["moov", "video/quicktime"],
	["mov", "video/quicktime"],
	["movie", "video/x-sgi-movie"],
	["mp2", [
		"video/mpeg",
		"audio/mpeg",
		"video/x-mpeg",
		"audio/x-mpeg",
		"video/x-mpeq2a"
	]],
	["mp3", [
		"audio/mpeg",
		"audio/mpeg3",
		"video/mpeg",
		"audio/x-mpeg-3",
		"video/x-mpeg"
	]],
	["mp4", ["video/mp4", "application/mp4"]],
	["mp4a", "audio/mp4"],
	["mpa", ["video/mpeg", "audio/mpeg"]],
	["mpc", ["application/vnd.mophun.certificate", "application/x-project"]],
	["mpe", "video/mpeg"],
	["mpeg", "video/mpeg"],
	["mpg", ["video/mpeg", "audio/mpeg"]],
	["mpga", "audio/mpeg"],
	["mpkg", "application/vnd.apple.installer+xml"],
	["mpm", "application/vnd.blueice.multipass"],
	["mpn", "application/vnd.mophun.application"],
	["mpp", "application/vnd.ms-project"],
	["mpt", "application/x-project"],
	["mpv", "application/x-project"],
	["mpv2", "video/mpeg"],
	["mpx", "application/x-project"],
	["mpy", "application/vnd.ibm.minipay"],
	["mqy", "application/vnd.mobius.mqy"],
	["mrc", "application/marc"],
	["mrcx", "application/marcxml+xml"],
	["ms", "application/x-troff-ms"],
	["mscml", "application/mediaservercontrol+xml"],
	["mseq", "application/vnd.mseq"],
	["msf", "application/vnd.epson.msf"],
	["msg", "application/vnd.ms-outlook"],
	["msh", "model/mesh"],
	["msl", "application/vnd.mobius.msl"],
	["msty", "application/vnd.muvee.style"],
	["mts", "model/vnd.mts"],
	["mus", "application/vnd.musician"],
	["musicxml", "application/vnd.recordare.musicxml+xml"],
	["mv", "video/x-sgi-movie"],
	["mvb", "application/x-msmediaview"],
	["mwf", "application/vnd.mfer"],
	["mxf", "application/mxf"],
	["mxl", "application/vnd.recordare.musicxml"],
	["mxml", "application/xv+xml"],
	["mxs", "application/vnd.triscape.mxs"],
	["mxu", "video/vnd.mpegurl"],
	["my", "audio/make"],
	["mzz", "application/x-vnd.audioexplosion.mzz"],
	["n-gage", "application/vnd.nokia.n-gage.symbian.install"],
	["n3", "text/n3"],
	["nap", "image/naplps"],
	["naplps", "image/naplps"],
	["nbp", "application/vnd.wolfram.player"],
	["nc", "application/x-netcdf"],
	["ncm", "application/vnd.nokia.configuration-message"],
	["ncx", "application/x-dtbncx+xml"],
	["ngdat", "application/vnd.nokia.n-gage.data"],
	["nif", "image/x-niff"],
	["niff", "image/x-niff"],
	["nix", "application/x-mix-transfer"],
	["nlu", "application/vnd.neurolanguage.nlu"],
	["nml", "application/vnd.enliven"],
	["nnd", "application/vnd.noblenet-directory"],
	["nns", "application/vnd.noblenet-sealer"],
	["nnw", "application/vnd.noblenet-web"],
	["npx", "image/vnd.net-fpx"],
	["nsc", "application/x-conference"],
	["nsf", "application/vnd.lotus-notes"],
	["nvd", "application/x-navidoc"],
	["nws", "message/rfc822"],
	["o", "application/octet-stream"],
	["oa2", "application/vnd.fujitsu.oasys2"],
	["oa3", "application/vnd.fujitsu.oasys3"],
	["oas", "application/vnd.fujitsu.oasys"],
	["obd", "application/x-msbinder"],
	["oda", "application/oda"],
	["odb", "application/vnd.oasis.opendocument.database"],
	["odc", "application/vnd.oasis.opendocument.chart"],
	["odf", "application/vnd.oasis.opendocument.formula"],
	["odft", "application/vnd.oasis.opendocument.formula-template"],
	["odg", "application/vnd.oasis.opendocument.graphics"],
	["odi", "application/vnd.oasis.opendocument.image"],
	["odm", "application/vnd.oasis.opendocument.text-master"],
	["odp", "application/vnd.oasis.opendocument.presentation"],
	["ods", "application/vnd.oasis.opendocument.spreadsheet"],
	["odt", "application/vnd.oasis.opendocument.text"],
	["oga", "audio/ogg"],
	["ogv", "video/ogg"],
	["ogx", "application/ogg"],
	["omc", "application/x-omc"],
	["omcd", "application/x-omcdatamaker"],
	["omcr", "application/x-omcregerator"],
	["onetoc", "application/onenote"],
	["opf", "application/oebps-package+xml"],
	["org", "application/vnd.lotus-organizer"],
	["osf", "application/vnd.yamaha.openscoreformat"],
	["osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml"],
	["otc", "application/vnd.oasis.opendocument.chart-template"],
	["otf", "application/x-font-otf"],
	["otg", "application/vnd.oasis.opendocument.graphics-template"],
	["oth", "application/vnd.oasis.opendocument.text-web"],
	["oti", "application/vnd.oasis.opendocument.image-template"],
	["otp", "application/vnd.oasis.opendocument.presentation-template"],
	["ots", "application/vnd.oasis.opendocument.spreadsheet-template"],
	["ott", "application/vnd.oasis.opendocument.text-template"],
	["oxt", "application/vnd.openofficeorg.extension"],
	["p", "text/x-pascal"],
	["p10", ["application/pkcs10", "application/x-pkcs10"]],
	["p12", ["application/pkcs-12", "application/x-pkcs12"]],
	["p7a", "application/x-pkcs7-signature"],
	["p7b", "application/x-pkcs7-certificates"],
	["p7c", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
	["p7m", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
	["p7r", "application/x-pkcs7-certreqresp"],
	["p7s", ["application/pkcs7-signature", "application/x-pkcs7-signature"]],
	["p8", "application/pkcs8"],
	["par", "text/plain-bas"],
	["part", "application/pro_eng"],
	["pas", "text/pascal"],
	["paw", "application/vnd.pawaafile"],
	["pbd", "application/vnd.powerbuilder6"],
	["pbm", "image/x-portable-bitmap"],
	["pcf", "application/x-font-pcf"],
	["pcl", ["application/vnd.hp-pcl", "application/x-pcl"]],
	["pclxl", "application/vnd.hp-pclxl"],
	["pct", "image/x-pict"],
	["pcurl", "application/vnd.curl.pcurl"],
	["pcx", "image/x-pcx"],
	["pdb", ["application/vnd.palm", "chemical/x-pdb"]],
	["pdf", "application/pdf"],
	["pfa", "application/x-font-type1"],
	["pfr", "application/font-tdpfr"],
	["pfunk", ["audio/make", "audio/make.my.funk"]],
	["pfx", "application/x-pkcs12"],
	["pgm", ["image/x-portable-graymap", "image/x-portable-greymap"]],
	["pgn", "application/x-chess-pgn"],
	["pgp", "application/pgp-signature"],
	["pic", ["image/pict", "image/x-pict"]],
	["pict", "image/pict"],
	["pkg", "application/x-newton-compatible-pkg"],
	["pki", "application/pkixcmp"],
	["pkipath", "application/pkix-pkipath"],
	["pko", ["application/ynd.ms-pkipko", "application/vnd.ms-pki.pko"]],
	["pl", ["text/plain", "text/x-script.perl"]],
	["plb", "application/vnd.3gpp.pic-bw-large"],
	["plc", "application/vnd.mobius.plc"],
	["plf", "application/vnd.pocketlearn"],
	["pls", "application/pls+xml"],
	["plx", "application/x-pixclscript"],
	["pm", ["text/x-script.perl-module", "image/x-xpixmap"]],
	["pm4", "application/x-pagemaker"],
	["pm5", "application/x-pagemaker"],
	["pma", "application/x-perfmon"],
	["pmc", "application/x-perfmon"],
	["pml", ["application/vnd.ctc-posml", "application/x-perfmon"]],
	["pmr", "application/x-perfmon"],
	["pmw", "application/x-perfmon"],
	["png", "image/png"],
	["pnm", ["application/x-portable-anymap", "image/x-portable-anymap"]],
	["portpkg", "application/vnd.macports.portpkg"],
	["pot", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
	["potm", "application/vnd.ms-powerpoint.template.macroenabled.12"],
	["potx", "application/vnd.openxmlformats-officedocument.presentationml.template"],
	["pov", "model/x-pov"],
	["ppa", "application/vnd.ms-powerpoint"],
	["ppam", "application/vnd.ms-powerpoint.addin.macroenabled.12"],
	["ppd", "application/vnd.cups-ppd"],
	["ppm", "image/x-portable-pixmap"],
	["pps", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
	["ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12"],
	["ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"],
	["ppt", [
		"application/vnd.ms-powerpoint",
		"application/mspowerpoint",
		"application/powerpoint",
		"application/x-mspowerpoint"
	]],
	["pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12"],
	["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
	["ppz", "application/mspowerpoint"],
	["prc", "application/x-mobipocket-ebook"],
	["pre", ["application/vnd.lotus-freelance", "application/x-freelance"]],
	["prf", "application/pics-rules"],
	["prt", "application/pro_eng"],
	["ps", "application/postscript"],
	["psb", "application/vnd.3gpp.pic-bw-small"],
	["psd", ["application/octet-stream", "image/vnd.adobe.photoshop"]],
	["psf", "application/x-font-linux-psf"],
	["pskcxml", "application/pskc+xml"],
	["ptid", "application/vnd.pvi.ptid1"],
	["pub", "application/x-mspublisher"],
	["pvb", "application/vnd.3gpp.pic-bw-var"],
	["pvu", "paleovu/x-pv"],
	["pwn", "application/vnd.3m.post-it-notes"],
	["pwz", "application/vnd.ms-powerpoint"],
	["py", "text/x-script.phyton"],
	["pya", "audio/vnd.ms-playready.media.pya"],
	["pyc", "application/x-bytecode.python"],
	["pyv", "video/vnd.ms-playready.media.pyv"],
	["qam", "application/vnd.epson.quickanime"],
	["qbo", "application/vnd.intu.qbo"],
	["qcp", "audio/vnd.qcelp"],
	["qd3", "x-world/x-3dmf"],
	["qd3d", "x-world/x-3dmf"],
	["qfx", "application/vnd.intu.qfx"],
	["qif", "image/x-quicktime"],
	["qps", "application/vnd.publishare-delta-tree"],
	["qt", "video/quicktime"],
	["qtc", "video/x-qtc"],
	["qti", "image/x-quicktime"],
	["qtif", "image/x-quicktime"],
	["qxd", "application/vnd.quark.quarkxpress"],
	["ra", [
		"audio/x-realaudio",
		"audio/x-pn-realaudio",
		"audio/x-pn-realaudio-plugin"
	]],
	["ram", "audio/x-pn-realaudio"],
	["rar", "application/x-rar-compressed"],
	["ras", [
		"image/cmu-raster",
		"application/x-cmu-raster",
		"image/x-cmu-raster"
	]],
	["rast", "image/cmu-raster"],
	["rcprofile", "application/vnd.ipunplugged.rcprofile"],
	["rdf", "application/rdf+xml"],
	["rdz", "application/vnd.data-vision.rdz"],
	["rep", "application/vnd.businessobjects"],
	["res", "application/x-dtbresource+xml"],
	["rexx", "text/x-script.rexx"],
	["rf", "image/vnd.rn-realflash"],
	["rgb", "image/x-rgb"],
	["rif", "application/reginfo+xml"],
	["rip", "audio/vnd.rip"],
	["rl", "application/resource-lists+xml"],
	["rlc", "image/vnd.fujixerox.edmics-rlc"],
	["rld", "application/resource-lists-diff+xml"],
	["rm", ["application/vnd.rn-realmedia", "audio/x-pn-realaudio"]],
	["rmi", "audio/mid"],
	["rmm", "audio/x-pn-realaudio"],
	["rmp", ["audio/x-pn-realaudio-plugin", "audio/x-pn-realaudio"]],
	["rms", "application/vnd.jcp.javame.midlet-rms"],
	["rnc", "application/relax-ng-compact-syntax"],
	["rng", ["application/ringing-tones", "application/vnd.nokia.ringing-tone"]],
	["rnx", "application/vnd.rn-realplayer"],
	["roff", "application/x-troff"],
	["rp", "image/vnd.rn-realpix"],
	["rp9", "application/vnd.cloanto.rp9"],
	["rpm", "audio/x-pn-realaudio-plugin"],
	["rpss", "application/vnd.nokia.radio-presets"],
	["rpst", "application/vnd.nokia.radio-preset"],
	["rq", "application/sparql-query"],
	["rs", "application/rls-services+xml"],
	["rsd", "application/rsd+xml"],
	["rt", ["text/richtext", "text/vnd.rn-realtext"]],
	["rtf", [
		"application/rtf",
		"text/richtext",
		"application/x-rtf"
	]],
	["rtx", ["text/richtext", "application/rtf"]],
	["rv", "video/vnd.rn-realvideo"],
	["s", "text/x-asm"],
	["s3m", "audio/s3m"],
	["saf", "application/vnd.yamaha.smaf-audio"],
	["saveme", "application/octet-stream"],
	["sbk", "application/x-tbook"],
	["sbml", "application/sbml+xml"],
	["sc", "application/vnd.ibm.secure-container"],
	["scd", "application/x-msschedule"],
	["scm", [
		"application/vnd.lotus-screencam",
		"video/x-scm",
		"text/x-script.guile",
		"application/x-lotusscreencam",
		"text/x-script.scheme"
	]],
	["scq", "application/scvp-cv-request"],
	["scs", "application/scvp-cv-response"],
	["sct", "text/scriptlet"],
	["scurl", "text/vnd.curl.scurl"],
	["sda", "application/vnd.stardivision.draw"],
	["sdc", "application/vnd.stardivision.calc"],
	["sdd", "application/vnd.stardivision.impress"],
	["sdkm", "application/vnd.solent.sdkm+xml"],
	["sdml", "text/plain"],
	["sdp", ["application/sdp", "application/x-sdp"]],
	["sdr", "application/sounder"],
	["sdw", "application/vnd.stardivision.writer"],
	["sea", ["application/sea", "application/x-sea"]],
	["see", "application/vnd.seemail"],
	["seed", "application/vnd.fdsn.seed"],
	["sema", "application/vnd.sema"],
	["semd", "application/vnd.semd"],
	["semf", "application/vnd.semf"],
	["ser", "application/java-serialized-object"],
	["set", "application/set"],
	["setpay", "application/set-payment-initiation"],
	["setreg", "application/set-registration-initiation"],
	["sfd-hdstx", "application/vnd.hydrostatix.sof-data"],
	["sfs", "application/vnd.spotfire.sfs"],
	["sgl", "application/vnd.stardivision.writer-global"],
	["sgm", ["text/sgml", "text/x-sgml"]],
	["sgml", ["text/sgml", "text/x-sgml"]],
	["sh", [
		"application/x-shar",
		"application/x-bsh",
		"application/x-sh",
		"text/x-script.sh"
	]],
	["shar", ["application/x-bsh", "application/x-shar"]],
	["shf", "application/shf+xml"],
	["shtml", ["text/html", "text/x-server-parsed-html"]],
	["sid", "audio/x-psid"],
	["sis", "application/vnd.symbian.install"],
	["sit", ["application/x-stuffit", "application/x-sit"]],
	["sitx", "application/x-stuffitx"],
	["skd", "application/x-koan"],
	["skm", "application/x-koan"],
	["skp", ["application/vnd.koan", "application/x-koan"]],
	["skt", "application/x-koan"],
	["sl", "application/x-seelogo"],
	["sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12"],
	["sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"],
	["slt", "application/vnd.epson.salt"],
	["sm", "application/vnd.stepmania.stepchart"],
	["smf", "application/vnd.stardivision.math"],
	["smi", ["application/smil", "application/smil+xml"]],
	["smil", "application/smil"],
	["snd", ["audio/basic", "audio/x-adpcm"]],
	["snf", "application/x-font-snf"],
	["sol", "application/solids"],
	["spc", ["text/x-speech", "application/x-pkcs7-certificates"]],
	["spf", "application/vnd.yamaha.smaf-phrase"],
	["spl", ["application/futuresplash", "application/x-futuresplash"]],
	["spot", "text/vnd.in3d.spot"],
	["spp", "application/scvp-vp-response"],
	["spq", "application/scvp-vp-request"],
	["spr", "application/x-sprite"],
	["sprite", "application/x-sprite"],
	["src", "application/x-wais-source"],
	["sru", "application/sru+xml"],
	["srx", "application/sparql-results+xml"],
	["sse", "application/vnd.kodak-descriptor"],
	["ssf", "application/vnd.epson.ssf"],
	["ssi", "text/x-server-parsed-html"],
	["ssm", "application/streamingmedia"],
	["ssml", "application/ssml+xml"],
	["sst", ["application/vnd.ms-pkicertstore", "application/vnd.ms-pki.certstore"]],
	["st", "application/vnd.sailingtracker.track"],
	["stc", "application/vnd.sun.xml.calc.template"],
	["std", "application/vnd.sun.xml.draw.template"],
	["step", "application/step"],
	["stf", "application/vnd.wt.stf"],
	["sti", "application/vnd.sun.xml.impress.template"],
	["stk", "application/hyperstudio"],
	["stl", [
		"application/vnd.ms-pkistl",
		"application/sla",
		"application/vnd.ms-pki.stl",
		"application/x-navistyle"
	]],
	["stm", "text/html"],
	["stp", "application/step"],
	["str", "application/vnd.pg.format"],
	["stw", "application/vnd.sun.xml.writer.template"],
	["sub", "image/vnd.dvb.subtitle"],
	["sus", "application/vnd.sus-calendar"],
	["sv4cpio", "application/x-sv4cpio"],
	["sv4crc", "application/x-sv4crc"],
	["svc", "application/vnd.dvb.service"],
	["svd", "application/vnd.svd"],
	["svf", ["image/vnd.dwg", "image/x-dwg"]],
	["svg", "image/svg+xml"],
	["svr", ["x-world/x-svr", "application/x-world"]],
	["swf", "application/x-shockwave-flash"],
	["swi", "application/vnd.aristanetworks.swi"],
	["sxc", "application/vnd.sun.xml.calc"],
	["sxd", "application/vnd.sun.xml.draw"],
	["sxg", "application/vnd.sun.xml.writer.global"],
	["sxi", "application/vnd.sun.xml.impress"],
	["sxm", "application/vnd.sun.xml.math"],
	["sxw", "application/vnd.sun.xml.writer"],
	["t", ["text/troff", "application/x-troff"]],
	["talk", "text/x-speech"],
	["tao", "application/vnd.tao.intent-module-archive"],
	["tar", "application/x-tar"],
	["tbk", ["application/toolbook", "application/x-tbook"]],
	["tcap", "application/vnd.3gpp2.tcap"],
	["tcl", ["text/x-script.tcl", "application/x-tcl"]],
	["tcsh", "text/x-script.tcsh"],
	["teacher", "application/vnd.smart.teacher"],
	["tei", "application/tei+xml"],
	["tex", "application/x-tex"],
	["texi", "application/x-texinfo"],
	["texinfo", "application/x-texinfo"],
	["text", ["application/plain", "text/plain"]],
	["tfi", "application/thraud+xml"],
	["tfm", "application/x-tex-tfm"],
	["tgz", ["application/gnutar", "application/x-compressed"]],
	["thmx", "application/vnd.ms-officetheme"],
	["tif", ["image/tiff", "image/x-tiff"]],
	["tiff", ["image/tiff", "image/x-tiff"]],
	["tmo", "application/vnd.tmobile-livetv"],
	["torrent", "application/x-bittorrent"],
	["tpl", "application/vnd.groove-tool-template"],
	["tpt", "application/vnd.trid.tpt"],
	["tr", "application/x-troff"],
	["tra", "application/vnd.trueapp"],
	["trm", "application/x-msterminal"],
	["tsd", "application/timestamped-data"],
	["tsi", "audio/tsp-audio"],
	["tsp", ["application/dsptype", "audio/tsplayer"]],
	["tsv", "text/tab-separated-values"],
	["ttf", "application/x-font-ttf"],
	["ttl", "text/turtle"],
	["turbot", "image/florian"],
	["twd", "application/vnd.simtech-mindmapper"],
	["txd", "application/vnd.genomatix.tuxedo"],
	["txf", "application/vnd.mobius.txf"],
	["txt", "text/plain"],
	["ufd", "application/vnd.ufdl"],
	["uil", "text/x-uil"],
	["uls", "text/iuls"],
	["umj", "application/vnd.umajin"],
	["uni", "text/uri-list"],
	["unis", "text/uri-list"],
	["unityweb", "application/vnd.unity"],
	["unv", "application/i-deas"],
	["uoml", "application/vnd.uoml+xml"],
	["uri", "text/uri-list"],
	["uris", "text/uri-list"],
	["ustar", ["application/x-ustar", "multipart/x-ustar"]],
	["utz", "application/vnd.uiq.theme"],
	["uu", ["application/octet-stream", "text/x-uuencode"]],
	["uue", "text/x-uuencode"],
	["uva", "audio/vnd.dece.audio"],
	["uvh", "video/vnd.dece.hd"],
	["uvi", "image/vnd.dece.graphic"],
	["uvm", "video/vnd.dece.mobile"],
	["uvp", "video/vnd.dece.pd"],
	["uvs", "video/vnd.dece.sd"],
	["uvu", "video/vnd.uvvu.mp4"],
	["uvv", "video/vnd.dece.video"],
	["vcd", "application/x-cdlink"],
	["vcf", "text/x-vcard"],
	["vcg", "application/vnd.groove-vcard"],
	["vcs", "text/x-vcalendar"],
	["vcx", "application/vnd.vcx"],
	["vda", "application/vda"],
	["vdo", "video/vdo"],
	["vew", "application/groupwise"],
	["vis", "application/vnd.visionary"],
	["viv", ["video/vivo", "video/vnd.vivo"]],
	["vivo", ["video/vivo", "video/vnd.vivo"]],
	["vmd", "application/vocaltec-media-desc"],
	["vmf", "application/vocaltec-media-file"],
	["voc", ["audio/voc", "audio/x-voc"]],
	["vos", "video/vosaic"],
	["vox", "audio/voxware"],
	["vqe", "audio/x-twinvq-plugin"],
	["vqf", "audio/x-twinvq"],
	["vql", "audio/x-twinvq-plugin"],
	["vrml", [
		"model/vrml",
		"x-world/x-vrml",
		"application/x-vrml"
	]],
	["vrt", "x-world/x-vrt"],
	["vsd", ["application/vnd.visio", "application/x-visio"]],
	["vsf", "application/vnd.vsf"],
	["vst", "application/x-visio"],
	["vsw", "application/x-visio"],
	["vtu", "model/vnd.vtu"],
	["vxml", "application/voicexml+xml"],
	["w60", "application/wordperfect6.0"],
	["w61", "application/wordperfect6.1"],
	["w6w", "application/msword"],
	["wad", "application/x-doom"],
	["wav", ["audio/wav", "audio/x-wav"]],
	["wax", "audio/x-ms-wax"],
	["wb1", "application/x-qpro"],
	["wbmp", "image/vnd.wap.wbmp"],
	["wbs", "application/vnd.criticaltools.wbs+xml"],
	["wbxml", "application/vnd.wap.wbxml"],
	["wcm", "application/vnd.ms-works"],
	["wdb", "application/vnd.ms-works"],
	["web", "application/vnd.xara"],
	["weba", "audio/webm"],
	["webm", "video/webm"],
	["webp", "image/webp"],
	["wg", "application/vnd.pmi.widget"],
	["wgt", "application/widget"],
	["wiz", "application/msword"],
	["wk1", "application/x-123"],
	["wks", "application/vnd.ms-works"],
	["wm", "video/x-ms-wm"],
	["wma", "audio/x-ms-wma"],
	["wmd", "application/x-ms-wmd"],
	["wmf", ["windows/metafile", "application/x-msmetafile"]],
	["wml", "text/vnd.wap.wml"],
	["wmlc", "application/vnd.wap.wmlc"],
	["wmls", "text/vnd.wap.wmlscript"],
	["wmlsc", "application/vnd.wap.wmlscriptc"],
	["wmv", "video/x-ms-wmv"],
	["wmx", "video/x-ms-wmx"],
	["wmz", "application/x-ms-wmz"],
	["woff", "application/x-font-woff"],
	["word", "application/msword"],
	["wp", "application/wordperfect"],
	["wp5", ["application/wordperfect", "application/wordperfect6.0"]],
	["wp6", "application/wordperfect"],
	["wpd", [
		"application/wordperfect",
		"application/vnd.wordperfect",
		"application/x-wpwin"
	]],
	["wpl", "application/vnd.ms-wpl"],
	["wps", "application/vnd.ms-works"],
	["wq1", "application/x-lotus"],
	["wqd", "application/vnd.wqd"],
	["wri", [
		"application/mswrite",
		"application/x-wri",
		"application/x-mswrite"
	]],
	["wrl", [
		"model/vrml",
		"x-world/x-vrml",
		"application/x-world"
	]],
	["wrz", ["model/vrml", "x-world/x-vrml"]],
	["wsc", "text/scriplet"],
	["wsdl", "application/wsdl+xml"],
	["wspolicy", "application/wspolicy+xml"],
	["wsrc", "application/x-wais-source"],
	["wtb", "application/vnd.webturbo"],
	["wtk", "application/x-wintalk"],
	["wvx", "video/x-ms-wvx"],
	["x-png", "image/png"],
	["x3d", "application/vnd.hzn-3d-crossword"],
	["xaf", "x-world/x-vrml"],
	["xap", "application/x-silverlight-app"],
	["xar", "application/vnd.xara"],
	["xbap", "application/x-ms-xbap"],
	["xbd", "application/vnd.fujixerox.docuworks.binder"],
	["xbm", [
		"image/xbm",
		"image/x-xbm",
		"image/x-xbitmap"
	]],
	["xdf", "application/xcap-diff+xml"],
	["xdm", "application/vnd.syncml.dm+xml"],
	["xdp", "application/vnd.adobe.xdp+xml"],
	["xdr", "video/x-amt-demorun"],
	["xdssc", "application/dssc+xml"],
	["xdw", "application/vnd.fujixerox.docuworks"],
	["xenc", "application/xenc+xml"],
	["xer", "application/patch-ops-error+xml"],
	["xfdf", "application/vnd.adobe.xfdf"],
	["xfdl", "application/vnd.xfdl"],
	["xgz", "xgl/drawing"],
	["xhtml", "application/xhtml+xml"],
	["xif", "image/vnd.xiff"],
	["xl", "application/excel"],
	["xla", [
		"application/vnd.ms-excel",
		"application/excel",
		"application/x-msexcel",
		"application/x-excel"
	]],
	["xlam", "application/vnd.ms-excel.addin.macroenabled.12"],
	["xlb", [
		"application/excel",
		"application/vnd.ms-excel",
		"application/x-excel"
	]],
	["xlc", [
		"application/vnd.ms-excel",
		"application/excel",
		"application/x-excel"
	]],
	["xld", ["application/excel", "application/x-excel"]],
	["xlk", ["application/excel", "application/x-excel"]],
	["xll", [
		"application/excel",
		"application/vnd.ms-excel",
		"application/x-excel"
	]],
	["xlm", [
		"application/vnd.ms-excel",
		"application/excel",
		"application/x-excel"
	]],
	["xls", [
		"application/vnd.ms-excel",
		"application/excel",
		"application/x-msexcel",
		"application/x-excel"
	]],
	["xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12"],
	["xlsm", "application/vnd.ms-excel.sheet.macroenabled.12"],
	["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
	["xlt", [
		"application/vnd.ms-excel",
		"application/excel",
		"application/x-excel"
	]],
	["xltm", "application/vnd.ms-excel.template.macroenabled.12"],
	["xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
	["xlv", ["application/excel", "application/x-excel"]],
	["xlw", [
		"application/vnd.ms-excel",
		"application/excel",
		"application/x-msexcel",
		"application/x-excel"
	]],
	["xm", "audio/xm"],
	["xml", [
		"application/xml",
		"text/xml",
		"application/atom+xml",
		"application/rss+xml"
	]],
	["xmz", "xgl/movie"],
	["xo", "application/vnd.olpc-sugar"],
	["xof", "x-world/x-vrml"],
	["xop", "application/xop+xml"],
	["xpi", "application/x-xpinstall"],
	["xpix", "application/x-vnd.ls-xpix"],
	["xpm", ["image/xpm", "image/x-xpixmap"]],
	["xpr", "application/vnd.is-xpr"],
	["xps", "application/vnd.ms-xpsdocument"],
	["xpw", "application/vnd.intercon.formnet"],
	["xslt", "application/xslt+xml"],
	["xsm", "application/vnd.syncml+xml"],
	["xspf", "application/xspf+xml"],
	["xsr", "video/x-amt-showrun"],
	["xul", "application/vnd.mozilla.xul+xml"],
	["xwd", ["image/x-xwd", "image/x-xwindowdump"]],
	["xyz", ["chemical/x-xyz", "chemical/x-pdb"]],
	["yang", "application/yang"],
	["yin", "application/yin+xml"],
	["z", ["application/x-compressed", "application/x-compress"]],
	["zaz", "application/vnd.zzazz.deck+xml"],
	["zip", [
		"application/zip",
		"multipart/x-zip",
		"application/x-zip-compressed",
		"application/x-compressed"
	]],
	["zir", "application/vnd.zul"],
	["zmm", "application/vnd.handheld-entertainment+xml"],
	["zoo", "application/octet-stream"],
	["zsh", "text/x-script.zsh"]
]);
function detectMimeType$1(filename) {
	if (!filename) return defaultMimeType;
	const parsed = path.parse(filename);
	const extension = (parsed.ext.substr(1) || parsed.name || "").split("?").shift().trim().toLowerCase();
	const value = extensions.has(extension) ? extensions.get(extension) : defaultMimeType;
	if (Array.isArray(value)) return value[0];
	return value;
}
function detectExtension$1(mimeType) {
	if (!mimeType) return defaultExtension;
	const parts = mimeType.toLowerCase().trim().split("/");
	const rootType = parts.shift().trim();
	const subType = parts.join("/").trim();
	if (mimeTypes.has(rootType + "/" + subType)) {
		const value = mimeTypes.get(rootType + "/" + subType);
		if (Array.isArray(value)) return value[0];
		return value;
	}
	switch (rootType) {
		case "text": return "txt";
		default: return "bin";
	}
}
// node_modules/nodemailer/dist/esm/base64/index.js
/**
* Encodes a Buffer into a base64 encoded string
*
* @param buffer Buffer to convert
* @returns base64 encoded string
*/
function encode$1(buffer) {
	if (typeof buffer === "string") buffer = Buffer.from(buffer, "utf-8");
	return buffer.toString("base64");
}
/**
* Turns a line length option into a whole number of characters, the default for anything unusable
*/
function normalizeLineLength(lineLength) {
	const length = Math.floor(Number(lineLength));
	return Number.isFinite(length) && length >= 1 ? length : 76;
}
/**
* Splits the bytes of `src` into lines of `lineLength` bytes, each followed by a line break. With
* `final` set the last line, which may be shorter, gets no line break; otherwise only complete
* lines are taken and the rest is left for the caller
*
* @param src Bytes to wrap
* @param lineLength Line length
* @param final Whether `src` ends the output
* @returns The wrapped bytes and the number of trailing bytes not taken
*/
function wrapBuffer(src, lineLength, final) {
	const lines = Math.ceil(src.length / lineLength);
	const complete = Math.max(lines - 1, 0);
	let rest = src.length - complete * lineLength;
	const output = Buffer.allocUnsafe(complete * (lineLength + 2) + (final ? rest : 0));
	let to = 0;
	for (let from = 0; from < complete * lineLength; from += lineLength) {
		src.copy(output, to, from, from + lineLength);
		to += lineLength;
		output[to++] = 13;
		output[to++] = 10;
	}
	if (final) {
		to += src.copy(output, to, complete * lineLength);
		rest = 0;
	}
	if (to !== output.length) throw new Error("Unexpected wrapped length");
	return {
		output,
		rest
	};
}
/**
* Creates a transform stream for encoding data to base64 encoding
*
* The output is the same as `wrap(encode(input), lineLength)` no matter how the input is split
* into chunks: every line but the last one ends with a line break, the last one does not
*
* @constructor
* @param options Stream options
* @param [options.lineLength=76] Maximum length for lines, set to false to disable wrapping
*/
var Encoder$1 = class extends Transform {
	constructor(options) {
		super();
		this.options = options || {};
		if (this.options.lineLength !== false) this.options.lineLength = normalizeLineLength(this.options.lineLength);
		this._curLine = "";
		this._remainingBytes = false;
		this.inputBytes = 0;
		this.outputBytes = 0;
	}
	/**
	* Emits the encoded characters `b64` that follow the current line, keeping what can not be
	* emitted yet as the new current line
	*
	* @internal
	*/
	_emit(b64, final) {
		const src = Buffer.from(this._curLine + b64, "latin1");
		if (!src.length) return;
		let output = src;
		if (this.options.lineLength) {
			const wrapped = wrapBuffer(src, this.options.lineLength, final);
			output = wrapped.output;
			this._curLine = wrapped.rest ? src.toString("latin1", src.length - wrapped.rest) : "";
		} else this._curLine = "";
		if (output.length) {
			this.outputBytes += output.length;
			this.push(output);
		}
	}
	/** @internal */
	_transform(chunk, encoding, done) {
		let buf = encoding !== "buffer" ? Buffer.from(chunk, encoding) : chunk;
		if (!buf || !buf.length) return done();
		this.inputBytes += buf.length;
		if (this._remainingBytes) {
			buf = Buffer.concat([this._remainingBytes, buf], this._remainingBytes.length + buf.length);
			this._remainingBytes = false;
		}
		const extra = buf.length % 3;
		if (extra) {
			this._remainingBytes = buf.subarray(buf.length - extra);
			buf = buf.subarray(0, buf.length - extra);
		}
		this._emit(encode$1(buf), false);
		done();
	}
	/** @internal */
	_flush(done) {
		this._emit(this._remainingBytes ? encode$1(this._remainingBytes) : "", true);
		this._remainingBytes = false;
		done();
	}
};
// node_modules/nodemailer/dist/esm/qp/index.js
/**
* Encodes a Buffer into a Quoted-Printable encoded string
*
* @param buffer Buffer to convert
* @returns Quoted-Printable encoded string
*/
const MIN_LINE_LENGTH = 4;
const QP_RANGES = [
	[9],
	[10],
	[13],
	[32, 60],
	[62, 126]
];
const QP_LITERAL = /* @__PURE__ */ new Uint8Array(256);
for (let i = 0; i < 256; i++) QP_LITERAL[i] = checkRanges(i, QP_RANGES) ? 1 : 0;
const HEX_DIGITS = Buffer.from("0123456789ABCDEF", "latin1");
const isWhitespace = (c) => c === 32 || c === 9;
function encode(buffer) {
	return encodeBytes(typeof buffer === "string" ? Buffer.from(buffer, "utf-8") : buffer);
}
/**
* Encodes bytes that may be followed by more input
*
* @param buffer Bytes to encode
* @param [next] The byte that follows the buffer, whitespace before it is kept literal unless it
*        is a line break. Without it the buffer ends the input and its trailing whitespace is encoded
* @param [binary] Keep only CRLF pairs literal. A lone CR or LF is data, not a line break, and
*        anything that rewrites line endings on the way would change it
* @param [previous] The byte before the buffer, for a buffer that starts with LF
* @returns Quoted-Printable encoded string
*/
function encodeBytes(buffer, next, binary, previous) {
	const len = buffer.length;
	const output = Buffer.allocUnsafe(len * 3);
	let pos = 0;
	for (let i = 0; i < len; i++) {
		const ord = buffer[i];
		const following = i + 1 < len ? buffer[i + 1] : next;
		const lineBreakByte = binary && (ord === 13 || ord === 10) ? ord === 13 ? following === 10 : (i > 0 ? buffer[i - 1] : previous) === 13 : true;
		if (QP_LITERAL[ord] && lineBreakByte && !(isWhitespace(ord) && (following === void 0 || following === 10 || following === 13))) {
			output[pos++] = ord;
			continue;
		}
		output[pos++] = 61;
		output[pos++] = HEX_DIGITS[Math.floor(ord / 16)];
		output[pos++] = HEX_DIGITS[ord % 16];
	}
	return output.toString("latin1", 0, pos);
}
/**
* Adds soft line breaks to a Quoted-Printable string
*
* @param str Quoted-Printable encoded string that might need line wrapping
* @param [lineLength=76] Maximum allowed length for a line
* @returns Soft-wrapped Quoted-Printable encoded string
*/
function wrap(str, lineLength) {
	str = (str || "").toString();
	lineLength = Math.max(Number(lineLength) || 76, MIN_LINE_LENGTH);
	if (str.length <= lineLength) return str;
	let pos = 0;
	const len = str.length;
	let match, code, line;
	const lineMargin = Math.floor(lineLength / 3);
	let result = "";
	while (pos < len) {
		line = str.substr(pos, lineLength);
		if (match = line.match(/\r\n/)) {
			line = line.substr(0, match.index + match[0].length);
			result += line;
			pos += line.length;
			continue;
		}
		if (line.substr(-1) === "\n") {
			result += line;
			pos += line.length;
			continue;
		}
		if (match = line.substr(-lineMargin).match(/\n.*?$/)) {
			line = line.substr(0, line.length - (match[0].length - 1));
			result += line;
			pos += line.length;
			continue;
		}
		if (line.length > lineLength - lineMargin && (match = line.substr(-lineMargin).match(/[ \t.,!?][^ \t.,!?]*$/))) line = line.substr(0, line.length - (match[0].length - 1));
		else if (line.match(/[=][\da-f]{0,2}$/i)) {
			if (match = line.match(/[=][\da-f]{0,1}$/i)) line = line.substr(0, line.length - match[0].length);
			while (line.length > 3 && line.length < len - pos && !line.match(/^(?:=[\da-f]{2}){1,4}$/i) && (match = line.match(/[=][\da-f]{2}$/gi))) {
				code = parseInt(match[0].substr(1, 2), 16);
				if (code < 128) break;
				line = line.substr(0, line.length - 3);
				if (code >= 192) break;
			}
		}
		if (!line.length) line = str.substr(pos, lineLength);
		if (pos + line.length < len && line.substr(-1) !== "\n") {
			if (line.length === lineLength && line.match(/[=][\da-f]{2}$/i)) line = line.substr(0, line.length - 3);
			else if (line.length === lineLength) line = line.substr(0, line.length - 1);
			pos += line.length;
			line += "=\r\n";
		} else pos += line.length;
		result += line;
	}
	return result;
}
/**
* Helper function to check if a number is inside provided ranges
*
* @param nr Number to check for
* @param ranges An Array of allowed values
* @returns True if the value was found inside allowed ranges, false otherwise
*/
function checkRanges(nr, ranges) {
	for (let i = ranges.length - 1; i >= 0; i--) {
		const range = ranges[i];
		if (!range.length) continue;
		if (range.length === 1 && nr === range[0]) return true;
		if (range.length === 2 && nr >= range[0] && nr <= range[1]) return true;
	}
	return false;
}
const ENCODE_SLICE_SIZE = 65536;
/**
* Creates a transform stream for encoding data to Quoted-Printable encoding
*
* @constructor
* @param options Stream options
* @param [options.lineLength=76] Maximum length for lines, set to false to disable wrapping
*/
var Encoder = class extends Transform {
	constructor(options) {
		super();
		this.options = options || {};
		if (this.options.lineLength !== false) this.options.lineLength = this.options.lineLength || 76;
		this._curLine = "";
		this._remainingBytes = false;
		this._lastByte = void 0;
		this.inputBytes = 0;
		this.outputBytes = 0;
	}
	/** @internal */
	_transform(chunk, encoding, done) {
		let buf = encoding !== "buffer" ? Buffer.from(chunk, encoding) : chunk;
		if (!buf || !buf.length) return done();
		this.inputBytes += buf.length;
		if (this._remainingBytes) {
			buf = Buffer.concat([this._remainingBytes, buf], this._remainingBytes.length + buf.length);
			this._remainingBytes = false;
		}
		let end = buf.length;
		while (end > 0 && (isWhitespace(buf[end - 1]) || this.options.binary && buf[end - 1] === 13)) end--;
		if (buf.length - end <= ENCODE_SLICE_SIZE) {
			this._remainingBytes = end < buf.length ? Buffer.from(buf.subarray(end)) : false;
			buf = buf.subarray(0, end);
		}
		this._encodeSlices(buf);
		done();
	}
	/** @internal */
	_flush(done) {
		if (this._remainingBytes) {
			this._encodeSlices(this._remainingBytes);
			this._remainingBytes = false;
		}
		if (this._curLine) {
			this.outputBytes += this._curLine.length;
			this.push(this._curLine, "ascii");
			this._curLine = "";
		}
		done();
	}
	/**
	* Encodes the input in slices of ENCODE_SLICE_SIZE bytes. Each slice is told the byte that
	* follows it, so a slice that ends in whitespace is encoded as if it was not split
	*
	* @internal
	*/
	_encodeSlices(buf) {
		for (let start = 0; start < buf.length; start += ENCODE_SLICE_SIZE) {
			const end = Math.min(start + ENCODE_SLICE_SIZE, buf.length);
			this._encodeSlice(buf.subarray(start, end), end < buf.length ? buf[end] : void 0);
			this._lastByte = buf[end - 1];
		}
	}
	/** @internal */
	_encodeSlice(buf, next) {
		let qp;
		if (this.options.lineLength) {
			qp = wrap(this._curLine + encodeBytes(buf, next, this.options.binary, this._lastByte), this.options.lineLength);
			const lastLF = qp.lastIndexOf("\n");
			this._curLine = qp.substring(lastLF + 1);
			qp = qp.substring(0, lastLF + 1);
			if (qp) {
				this.outputBytes += qp.length;
				this.push(qp, "ascii");
			}
		} else {
			qp = encodeBytes(buf, next, this.options.binary, this._lastByte);
			this.outputBytes += qp.length;
			this.push(qp, "ascii");
		}
	}
};
// node_modules/nodemailer/dist/esm/mime-funcs/index.js
/**
* Checks if a value is plaintext string (uses only printable 7bit chars)
*
* When isParam is set the value is destined for a header parameter, so HT, CR and LF
* are not plaintext either: a header parameter has no way to carry them. HT is a valid
* fold point, so folding and unfolding a header would rewrite it as a space, and CR/LF
* cannot appear in a header value at all. DEL is neither a token character nor qtext,
* so it can not be carried bare or quoted. Such values have to go through the rfc2231
* parameter continuation encoding instead, the same way a quote already does.
*
* @param value String to be tested
* @param [isParam] Set to true if the value is a header parameter value
* @returns true if it is a plaintext string
*/
function isPlainText(value, isParam) {
	return typeof value === "string" && !(isParam ? /[\x00-\x1f\x7f"\u0080-\uFFFF]/ : /[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/).test(value);
}
function isPlainParamValue(value) {
	return isPlainText(value, true) && !value.includes("=?");
}
/**
* Wraps a value into a quoted-string. Inside one a quote would end the string early
* and a backslash would escape whatever follows it, so both go out as quoted-pairs.
*
* @param value String to be quoted
* @returns The value as a quoted-string, quotes included
*/
function quoteString(value) {
	return "\"" + (value || "").toString().replace(/["\\]/g, "\\$&") + "\"";
}
/**
* Checks if a multi line string containes lines longer than the selected value.
*
* Useful when detecting if a mail message needs any processing at all:
* if only plaintext characters are used and lines are short, then there is
* no need to encode the values in any way. If the value is plaintext but has
* longer lines then allowed, then use format=flowed
*
* @param str Multi line string to check
* @param lineLength Max line length to check for
* @returns Returns true if there is at least one line longer than lineLength chars
*/
function hasLongerLines(str, lineLength) {
	if (str.length > 131072) return true;
	return new RegExp("^.{" + (lineLength + 1) + ",}", "m").test(str);
}
/**
* Encodes a string or an Buffer to an UTF-8 MIME Word (rfc2047)
*
* @param data String to be encoded
* @param mimeWordEncoding='Q' Encoding for the mime word, either Q or B
* @param [maxLength=0] If set, split mime words into several chunks if needed
* @return Single or several mime words joined together
*/
function encodeWord(data, mimeWordEncoding, maxLength) {
	mimeWordEncoding = (mimeWordEncoding || "Q").toString().toUpperCase().trim().charAt(0);
	maxLength = maxLength || 0;
	let encodedStr;
	if (maxLength && maxLength > 12) maxLength -= 12;
	if (mimeWordEncoding === "Q") encodedStr = encode(data).replace(/[^a-z0-9!*+\-/=]/gi, (chr) => {
		const ord = chr.charCodeAt(0).toString(16).toUpperCase();
		if (chr === " ") return "_";
		return "=" + (ord.length === 1 ? "0" + ord : ord);
	});
	else if (mimeWordEncoding === "B") {
		encodedStr = typeof data === "string" ? data : data.toString("utf-8");
		maxLength = maxLength ? Math.max(3, (maxLength - maxLength % 4) / 4 * 3) : 0;
	}
	if (maxLength && (mimeWordEncoding !== "B" ? encodedStr : encode$1(data)).length > maxLength) {
		if (mimeWordEncoding === "Q") encodedStr = splitMimeEncodedString(encodedStr, maxLength).join("?= =?UTF-8?" + mimeWordEncoding + "?");
		else {
			const parts = [];
			let lpart = "";
			for (let i = 0, len = encodedStr.length; i < len; i++) {
				let chr = encodedStr.charAt(i);
				if (/[\ud800-\udbff]/.test(chr) && /[\udc00-\udfff]/.test(encodedStr.charAt(i + 1))) chr += encodedStr.charAt(++i);
				if (Buffer.byteLength(lpart + chr) <= maxLength || i === 0) lpart += chr;
				else {
					parts.push(encode$1(lpart));
					lpart = chr;
				}
			}
			if (lpart) parts.push(encode$1(lpart));
			if (parts.length > 1) encodedStr = parts.join("?= =?UTF-8?" + mimeWordEncoding + "?");
			else encodedStr = parts.join("");
		}
	} else if (mimeWordEncoding === "B") encodedStr = encode$1(data);
	return "=?UTF-8?" + mimeWordEncoding + "?" + encodedStr + (encodedStr.substr(-2) === "?=" ? "" : "?=");
}
const VALID_ENCODED_WORD = /^=\?[^\s()<>@,;:"/[\]?.=]+\?[BbQq]\?[^?\s]+\?=$/;
const LENIENT_ENCODED_WORD = /[=]\?[^?]*\?[BbQq]\?[^?]*\?=/y;
/**
* Marks the text a receiver would read as an encoded-word when it is not one valid encoded-word
* on its own. RFC 2047 section 7 requires that a word beginning with '=?' and ending with '?='
* is a valid encoded-word, and decoders also decode a look-alike that spans whitespace, so
* '=?utf-8?X?x?=' and 'see =?utf-8?Q?a b?= here' read differently on every receiver. A valid
* encoded-word is left alone, which is what lets a caller pass a value that is already encoded,
* as most other mail libraries do.
*
* The bounds of the word around each '=?' are found once per word and reused, walking back to
* the start of a long word from every '=?' it holds would be quadratic.
*
* @param value String to look in
* @param range The first and the last offset that needs encoding so far, -1 for none
* @return The range, widened to cover the words of every invalid look-alike
*/
function _markInvalidEncodedWords(value, range) {
	const len = value.length;
	const isSpace = (pos) => /\s/.test(value.charAt(pos));
	let wordStart = 0;
	let wordEnd = -1;
	const wordAt = (pos) => {
		if (pos < wordEnd) return;
		wordStart = pos;
		while (wordStart > 0 && !isSpace(wordStart - 1)) wordStart--;
		wordEnd = pos;
		while (wordEnd < len && !isSpace(wordEnd)) wordEnd++;
	};
	let pos = value.indexOf("=?");
	while (pos >= 0) {
		wordAt(pos);
		const start = wordStart;
		LENIENT_ENCODED_WORD.lastIndex = pos;
		const match = LENIENT_ENCODED_WORD.exec(value);
		const end = match ? pos + match[0].length : wordEnd;
		if (match && end > wordEnd) wordAt(end - 1);
		const word = value.substring(start, wordEnd);
		const looksLike = match ? true : start === pos && word.length >= 4 && word.endsWith("?=");
		const valid = start === pos && wordEnd === end && word.length <= 75 && VALID_ENCODED_WORD.test(word);
		if (looksLike && !valid) {
			range[0] = range[0] < 0 ? start : Math.min(range[0], start);
			range[1] = Math.max(range[1], wordEnd - 1);
		}
		pos = value.indexOf("=?", match ? end : pos + 2);
	}
	return range;
}
/**
* Finds word sequences with non ascii text, and words that look like an invalid encoded-word,
* and converts these to mime words. A valid encoded-word is passed through as it is.
*
* @param value String to be encoded
* @param mimeWordEncoding='Q' Encoding for the mime word, either Q or B
* @param [maxLength=0] If set, split mime words into several chunks if needed
* @param [encodeAll=false] If true and the value needs encoding then encodes entire string, not just the smallest match
* @return String with possible mime words
*/
function encodeWords(value, mimeWordEncoding, maxLength, encodeAll) {
	maxLength = maxLength || 0;
	let firstSpecial = -1;
	let lastSpecial = -1;
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		if (code === 34 || code >= 128) {
			if (firstSpecial < 0) firstSpecial = i;
			lastSpecial = i;
		}
	}
	if (value.indexOf("=?") >= 0) [firstSpecial, lastSpecial] = _markInvalidEncodedWords(value, [firstSpecial, lastSpecial]);
	if (firstSpecial < 0) return value;
	if (encodeAll) return encodeWord(value, mimeWordEncoding, maxLength);
	let startIndex = firstSpecial;
	while (startIndex > 0 && !/\s/.test(value.charAt(startIndex - 1))) startIndex--;
	let endIndex = lastSpecial + 1;
	while (endIndex < value.length && !/\s/.test(value.charAt(endIndex))) endIndex++;
	return (startIndex ? value.substr(0, startIndex) : "") + encodeWord(value.substring(startIndex, endIndex), mimeWordEncoding || "Q", maxLength) + (endIndex < value.length ? value.substr(endIndex) : "");
}
/**
* Joins parsed header value together as 'value; param1=value1; param2=value2'
* PS: We are following RFC 822 for the list of special characters that we need to keep in quotes.
*      Refer: https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
* @param structured Parsed header value
* @return joined header value
*/
function buildHeaderValue(structured) {
	const paramsArray = [];
	Object.keys(structured.params || {}).forEach((key) => {
		const value = structured.params[key];
		const param = key.replace(/[\x00-\x1f\x7f]/g, "");
		if (!isPlainParamValue(value) || value.length >= 75) buildHeaderParam(param, value, 50).forEach((encodedParam) => {
			if (!/[\s"\\;:/=(),<>@[\]?]|^[-']|'$/.test(encodedParam.value) || encodedParam.key.substr(-1) === "*") paramsArray.push(encodedParam.key + "=" + encodedParam.value);
			else paramsArray.push(encodedParam.key + "=" + JSON.stringify(encodedParam.value));
		});
		else if (!value.length || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(value)) paramsArray.push(param + "=" + JSON.stringify(value));
		else paramsArray.push(param + "=" + value);
	});
	return (typeof structured.value === "string" ? structured.value.replace(/[\x00-\x1f\x7f]/g, "") : structured.value) + (paramsArray.length ? "; " + paramsArray.join("; ") : "");
}
/**
* Encodes a string or an Buffer to an UTF-8 Parameter Value Continuation encoding (rfc2231)
* Useful for splitting long parameter values.
*
* For example
*      title="unicode string"
* becomes
*     title*0*=utf-8''unicode
*     title*1*=%20string
*
* @param key Parameter name the generated keys are built from, for example title
* @param data String to be encoded
* @param [maxLength=50] Max length for generated chunks
* @return A list of encoded keys and headers
*/
function buildHeaderParam(key, data, maxLength) {
	const list = [];
	let encodedStr = typeof data === "string" ? data : (data || "").toString();
	let chr;
	let line;
	let startPos = 0;
	let i, len;
	maxLength = maxLength || 50;
	if (isPlainParamValue(data)) {
		if (encodedStr.length <= maxLength) return [{
			key,
			value: encodedStr
		}];
		encodedStr = encodedStr.replace(new RegExp(".{" + maxLength + "}", "g"), (str) => {
			list.push({ line: str });
			return "";
		});
		if (encodedStr) list.push({ line: encodedStr });
	} else {
		if (/[\uD800-\uDBFF]/.test(encodedStr)) {
			const encodedStrArr = [];
			for (i = 0, len = encodedStr.length; i < len; i++) {
				chr = encodedStr.charAt(i);
				if (/[\ud800-\udbff]/.test(chr) && /[\udc00-\udfff]/.test(encodedStr.charAt(i + 1))) {
					chr += encodedStr.charAt(i + 1);
					encodedStrArr.push(chr);
					i++;
				} else encodedStrArr.push(chr);
			}
			encodedStr = encodedStrArr;
		}
		line = "utf-8''";
		let encoded = true;
		startPos = 0;
		for (i = 0, len = encodedStr.length; i < len; i++) {
			chr = encodedStr[i];
			if (encoded) chr = safeEncodeURIComponent(chr);
			else {
				chr = chr === " " ? chr : safeEncodeURIComponent(chr);
				if (chr !== encodedStr[i]) {
					if ((safeEncodeURIComponent(line) + chr).length >= maxLength) {
						list.push({
							line,
							encoded
						});
						line = "";
						encoded = true;
					} else {
						encoded = true;
						i = startPos;
						line = "";
						continue;
					}
				}
			}
			if ((line + chr).length >= maxLength) {
				list.push({
					line,
					encoded
				});
				line = chr = encodedStr[i] === " " ? " " : safeEncodeURIComponent(encodedStr[i]);
				if (chr === encodedStr[i]) {
					encoded = false;
					startPos = i - 1;
				} else encoded = true;
			} else line += chr;
		}
		if (line) list.push({
			line,
			encoded
		});
	}
	return list.map((item, i) => ({
		key: key + "*" + i + (item.encoded ? "*" : ""),
		value: item.line
	}));
}
/**
* An RFC 2045 token: printable ASCII without SPACE, the control characters, DEL and the
* tspecials. A charset name is one, and the name a continuation carries is written into
* the encoded word the parameter value becomes, so it is checked against this before it
* goes in. Whitespace used to come off it only because the value was trimmed first.
*/
const TOKEN = /^[^\x00-\x20\x7f()<>@,;:\\"/[\]?=]+$/;
/**
* Offset of the ')' that closes the RFC 822 comment opening at `start`, or -1 when the
* comment never closes. Comments nest, and a backslash escapes the character after it
*/
function _findCommentEnd(str, start) {
	let depth = 0;
	for (let i = start, len = str.length; i < len; i++) {
		const c = str.charAt(i);
		if (c === "\\") i++;
		else if (c === "(") depth++;
		else if (c === ")" && --depth === 0) return i;
	}
	return -1;
}
/**
* Whether a string can be a header parameter name.
*
* A parameter name is a token, so it is never empty. A "__proto__" name would target the
* prototype chain of the params object instead of an own property of it and read back as
* Object.prototype, so it is no name either.
*
* @param name Candidate parameter name, already lowercased
* @return true when the name can be used
*/
function _isParamName(name) {
	return !!name && !isProtoKey(name);
}
/**
* Parses a header value with key=value arguments into a structured
* object.
*
*   parseHeaderValue('content-type: text/plain; CHARSET='UTF-8'') ->
*   {
*     'value': 'text/plain',
*     'params': {
*       'charset': 'UTF-8'
*     }
*   }
*
* @param str Header value
* @param options Options, see ParseHeaderValueOptions
* @return Header value as a parsed structure
*/
function parseHeaderValue(str, options) {
	const response = {
		value: "",
		params: {}
	};
	let stripComments = !!options?.stripComments;
	const setParam = (name, value) => {
		name = name.toLowerCase();
		if (_isParamName(name) && !Object.prototype.hasOwnProperty.call(response.params, name)) response.params[name] = value;
	};
	let key = false;
	let value = "";
	let stage = "value";
	let quote = false;
	let escaped = false;
	let chr;
	let pendingSpace = "";
	let quoteClosed = false;
	const flushSpace = () => {
		if (value.length) value += pendingSpace;
		pendingSpace = "";
	};
	const addChr = (c) => {
		flushSpace();
		value += c;
	};
	const takeValue = () => {
		const taken = value;
		value = "";
		pendingSpace = "";
		quoteClosed = false;
		return taken;
	};
	const storeValue = () => {
		const taken = takeValue();
		if (key === false) response.value = taken;
		else setParam(key, taken);
	};
	const storeEmptyKey = () => {
		setParam(takeValue().trim(), "");
	};
	for (let i = 0, len = str.length; i < len; i++) {
		chr = str.charAt(i);
		if (stripComments && chr === "(" && !quote && !quoteClosed && !(stage === "value" && key !== false && !pendingSpace)) {
			let end = _findCommentEnd(str, i);
			if (end < 0 && str.indexOf(";", i) < 0) end = len - 1;
			if (end >= 0) {
				i = end;
				continue;
			}
			stripComments = false;
		}
		if (stage === "key") {
			if (chr === "=") {
				key = takeValue().trim();
				stage = "value";
				continue;
			}
			if (chr === ";") {
				storeEmptyKey();
				continue;
			}
			value += chr;
		} else {
			if (quoteClosed && chr !== ";") {
				escaped = false;
				continue;
			}
			if (escaped) addChr(chr);
			else if (quote && chr === "\\") {
				escaped = true;
				continue;
			} else if (quote && chr === quote) {
				quote = false;
				quoteClosed = true;
			} else if (!quote && chr === "\"") {
				quote = chr;
				flushSpace();
			} else if (!quote && chr === ";") {
				storeValue();
				stage = "key";
			} else if (!quote && (chr === " " || chr === "	")) pendingSpace += chr;
			else addChr(chr);
			escaped = false;
		}
	}
	if (stage === "value") storeValue();
	else storeEmptyKey();
	const continuations = /* @__PURE__ */ new Map();
	Object.keys(response.params).forEach((key) => {
		const match = key.match(/(\*(\d+)|\*(\d+)\*|\*)$/);
		if (!match) return;
		const actualKey = key.substr(0, match.index);
		const nr = Number(match[2] || match[3]) || 0;
		const encoded = match[0].substr(-1) === "*";
		let value = response.params[key];
		delete response.params[key];
		if (!_isParamName(actualKey)) return;
		let continuation = continuations.get(actualKey);
		if (!continuation) {
			continuation = {
				charset: false,
				sections: []
			};
			continuations.set(actualKey, continuation);
		}
		const charsetMatch = nr === 0 && encoded ? value.match(/^([^']*)'[^']*'(.*)$/) : null;
		if (charsetMatch) {
			continuation.charset = TOKEN.test(charsetMatch[1]) ? charsetMatch[1] : "iso-8859-1";
			value = charsetMatch[2];
		}
		continuation.sections.push({
			nr,
			value,
			encoded
		});
	});
	continuations.forEach((continuation, key) => {
		if (Object.prototype.hasOwnProperty.call(response.params, key)) return;
		continuation.sections.sort((a, b) => a.nr - b.nr);
		if (!continuation.charset) {
			response.params[key] = continuation.sections.map((section) => section.value).join("");
			return;
		}
		response.params[key] = "=?" + continuation.charset + "?Q?" + continuation.sections.map(_encodeContinuationSection).join("") + "?=";
	});
	return response;
}
/**
* Renders one parameter value continuation section as the payload of a Q encoded word.
*
* A section whose name ends in '*' is percent encoded and its escapes carry the bytes of
* the value, so they only have to be rewritten into the "=AB" spelling a Q encoded word
* uses. A section without the '*' is literal text (RFC 2231 section 4.1), so its '%' is a
* '%' and is escaped along with the characters a Q encoded word can not carry bare.
* Decoding a literal section invents bytes that never appeared on the wire: it is how the
* value 'filename*0*=utf-8''safe; filename*1=%2F..%2F..%2Fetc%2Fpasswd' was emitted as a
* filename every receiving client reads back as 'safe/../../etc/passwd'.
*
* @param section One collected continuation section
* @return The section as Q encoded word payload
*/
function _encodeContinuationSection(section) {
	const specials = section.encoded ? /[=?_\s]/g : /[=?_\s%]/g;
	return section.value.replace(specials, (s) => {
		const c = s.charCodeAt(0).toString(16);
		if (s === " ") return "_";
		return "%" + (c.length < 2 ? "0" : "") + c;
	}).replace(/%/g, "=");
}
/**
* Returns file extension for a content type string. If no suitable extensions
* are found, 'bin' is used as the default extension
*
* @param mimeType Content type to be checked for
* @return File extension
*/
function detectExtension(mimeType) {
	return detectExtension$1(mimeType);
}
/**
* Returns content type for a file extension. If no suitable content types
* are found, 'application/octet-stream' is used as the default content type
*
* @param extension Extension to be checked for
* @return File extension
*/
function detectMimeType(extension) {
	return detectMimeType$1(extension);
}
/**
* Folds long lines, useful for folding header lines (afterSpace=false) and
* flowed text (afterSpace=true)
*
* @param str String to be folded
* @param [lineLength=76] Maximum length of a line
* @param afterSpace If true, leave a space in th end of a line
* @return String with folded lines
*/
function foldLines(str, lineLength, afterSpace) {
	str = (str || "").toString();
	lineLength = lineLength || 76;
	let pos = 0;
	const len = str.length;
	let result = "";
	let line, match;
	while (pos < len) {
		line = str.substr(pos, lineLength);
		if (line.length < lineLength) {
			result += line;
			break;
		}
		if (match = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
			line = match[0];
			result += line;
			pos += line.length;
			continue;
		} else if ((match = line.match(/(\s+)[^\s]*$/)) && match[0].length - (afterSpace ? (match[1] || "").length : 0) < line.length) line = line.substr(0, line.length - (match[0].length - (afterSpace ? (match[1] || "").length : 0)));
		else if (match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) line = line + match[0].substr(0, match[0].length - (!afterSpace ? (match[1] || "").length : 0));
		result += line;
		pos += line.length;
		if (pos < len) result += "\r\n";
	}
	return result;
}
/**
* Splits a mime encoded string. Needed for dividing mime words into smaller chunks
*
* @param str Mime encoded string to be split up
* @param maxlen Maximum length of characters for one part (minimum 12)
* @return Split string
*/
function splitMimeEncodedString(str, maxlen) {
	const lines = [];
	let curLine, fallbackLine, match, chr, done;
	maxlen = Math.max(maxlen || 0, 12);
	while (str.length) {
		curLine = str.substr(0, maxlen);
		if (match = curLine.match(/[=][0-9A-F]?$/i)) curLine = curLine.substr(0, match.index);
		fallbackLine = curLine.length ? curLine : str.substr(0, maxlen);
		done = false;
		while (!done && curLine.length) {
			done = true;
			if (match = str.substr(curLine.length).match(/^[=]([0-9A-F]{2})/i)) {
				chr = parseInt(match[1], 16);
				if (chr < 194 && chr > 127) {
					curLine = curLine.substr(0, curLine.length - 3);
					done = false;
				}
			}
		}
		if (!curLine.length) curLine = fallbackLine;
		lines.push(curLine);
		str = str.substr(curLine.length);
	}
	return lines;
}
function encodeURICharComponent(chr) {
	let res = "";
	let ord = chr.charCodeAt(0).toString(16).toUpperCase();
	if (ord.length % 2) ord = "0" + ord;
	if (ord.length > 2) for (let i = 0, len = ord.length / 2; i < len; i++) res += "%" + ord.substr(i, 2);
	else res += "%" + ord;
	return res;
}
function safeEncodeURIComponent(str) {
	str = (str || "").toString();
	try {
		str = encodeURIComponent(str);
	} catch (_E) {
		str = encodeURIComponent(Buffer.from(str, "utf-8").toString("utf-8"));
	}
	return str.replace(/[\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]/g, (chr) => encodeURICharComponent(chr));
}
// node_modules/nodemailer/dist/esm/addressparser/index.js
/** The token is an operator, a text run otherwise */
const TOKEN_OPERATOR = 1;
/** The next character continues the same run without whitespace in between */
const TOKEN_NO_BREAK = 2;
/** The text run holds characters its value leaves out or changes, so it is no plain slice */
const TOKEN_DIRTY = 4;
/** A backslash escapes the next character in the text run, inside a quoted string or a comment */
const TOKEN_ESCAPES = 8;
/** The text run opens on a character an escaping backslash in front of it has escaped */
const TOKEN_STARTS_ESCAPED = 16;
/**
* The tokens of an address field, kept as offsets into it.
*
* Every token used to be an object of its own, an operator for every ',' and a value string
* for every run of text, and a list of one letter names, 'a,a,a,...', took some 65 times its
* size in tokens before any address was read. A token is now three numbers in one typed
* array, its kind and the range of the field it covers, and its value is sliced off the field
* when it is read. The few text runs whose value differs from their slice, as they hold an
* escaping backslash, a line break or a control character, are rebuilt once and kept aside.
*/
var TokenList = class {
	constructor(str) {
		this.str = str;
		this.slots = /* @__PURE__ */ new Int32Array(48);
		this.length = 0;
		this.cleaned = /* @__PURE__ */ new Map();
	}
	/**
	* Appends a token
	*
	* @param kind Kind and flags of the token
	* @param start Offset of its first character
	* @param end Offset just past its last character
	* @return Index of the token
	*/
	push(kind, start, end) {
		if ((this.length + 1) * 3 > this.slots.length) {
			const grown = new Int32Array(this.slots.length * 2);
			grown.set(this.slots);
			this.slots = grown;
		}
		const at = this.length * 3;
		this.slots[at] = kind;
		this.slots[at + 1] = start;
		this.slots[at + 2] = end;
		return this.length++;
	}
	/**
	* Offset of the first character of a token that is part of its value. A text run that is
	* no plain slice of the field still spans the whitespace and control characters its value
	* is trimmed of.
	*/
	contentStart(index) {
		let start = this.slots[index * 3 + 1];
		const end = this.slots[index * 3 + 2];
		while (start < end && _isDroppedCode(this.str.charCodeAt(start))) start++;
		return start;
	}
	/**
	* Offset just past the last character of a token that is part of its value
	*/
	contentEnd(index) {
		const start = this.slots[index * 3 + 1];
		let end = this.slots[index * 3 + 2];
		while (end > start && _isDroppedCode(this.str.charCodeAt(end - 1))) end--;
		return end;
	}
	/**
	* The character of an operator token, an empty string for a text run
	*/
	operatorAt(index) {
		const at = index * 3;
		return this.slots[at] & TOKEN_OPERATOR ? this.str.charAt(this.slots[at + 1]) : "";
	}
	/**
	* Whether a token is an operator
	*/
	isOperator(index) {
		return (this.slots[index * 3] & TOKEN_OPERATOR) !== 0;
	}
	/**
	* Whether the next character continues the run of a token without whitespace in between
	*/
	noBreak(index) {
		return (this.slots[index * 3] & TOKEN_NO_BREAK) !== 0;
	}
	/**
	* Value of a token
	*/
	value(index) {
		const cleaned = this.cleaned.get(index);
		if (cleaned !== void 0) return cleaned;
		return this.str.slice(this.slots[index * 3 + 1], this.slots[index * 3 + 2]);
	}
};
/**
* A domain literal that ends an address. dtext includes '@' (RFC 5322 3.4.1), so the '@'
* in front of the literal is the one that splits the domain off, not the last one: reading
* 'a@[x@evil.com]' at its last '@' made it an address at evil.com.
*/
const DOMAIN_LITERAL_TAIL$1 = /@(\[[^[\]\\]*\])$/;
/**
* Offset of the '@' that splits the domain off an address, or -1 when there is none
*
* @param address Address to split
* @return Offset of the '@'
*/
function _domainAt(address) {
	const literal = address.charAt(address.length - 1) === "]" ? DOMAIN_LITERAL_TAIL$1.exec(address) : null;
	return literal ? address.length - literal[1].length - 1 : address.lastIndexOf("@");
}
/**
* Restores the quoting of a local part that was read out of a quoted string.
*
* RFC 5321 allows '@' inside a quoted local part, so handing '"user@evil.com"@good.com'
* on as the bare 'user@evil.com@good.com' leaves it to the consumer which '@' splits the
* domain off. Getting that wrong is a misrouting vector, so the quotes go back on. The
* same holds for the other specials: a ',' or a ';' that loses its quotes reads as a
* recipient separator once the consumer puts the address back into a header.
*
* This module has no dependencies so that it can ship on its own, which is why the two
* grammar tests below are spelled out here instead of shared with src/mime-node. Keeping
* only what is ambiguous quoted is deliberate, mime-node applies the stricter RFC 5321
* dot-atom rule on top of this when it emits an address.
*
* @param address Address with an unquoted local part
* @return Address with the local part as a quoted-string
*/
function _quoteLocalPart(address) {
	const lastAt = _domainAt(address);
	if (lastAt < 0) return address;
	const user = address.substr(0, lastAt);
	if (/^[^\s"(),:;<>@[\\\]]+$/.test(user) || /^"(?:[^"\\]|\\[\s\S])*"$/.test(user)) return address;
	return "\"" + user.replace(/["\\]/g, "\\$&") + "\"@" + address.substr(lastAt + 1);
}
/**
* Reached for every parsed address, so it is built once rather than per call.
*/
const HAS_WHITESPACE = /\s/;
/**
* An addr-spec that carries its whitespace legally, inside a quoted local part. The
* optional tail is the malformed shape: a real mailbox with wreckage trailing it.
*/
const QUOTED_LOCAL_ADDR = /^("(?:[^"\\]|\\[\s\S])*"@\S+)(?:\s+([\s\S]+))?$/;
/**
* One run holding a single '@' and no whitespace, the shape an addr-spec has to have.
*/
const ADDR_SPEC = /^[^@\s]+@[^@\s]+$/;
/**
* The same with a domain literal for the domain, which may hold an '@' of its own.
*/
const LITERAL_ADDR_SPEC = /^[^@\s]+@\[[^[\]\\\s]*\]$/;
/**
* The '@' and domain that follow a quoted local part in the same run.
*/
const QUOTED_LOCAL_DOMAIN = /^@(?:[^@\s"]+|\[[^[\]\\\s]*\])$/;
/**
* Whether a whitespace free run reads as an addr-spec under the strict grammar
*
* @param value Run to check
* @return true when it does
*/
function _isAddrSpec(value) {
	return ADDR_SPEC.test(value) || LITERAL_ADDR_SPEC.test(value);
}
/**
* The looser reading applied once the strict one finds nothing, which tolerates the
* further '@' that a domain should not have but malformed headers carry anyway.
*/
const LOOSE_ADDR_SPEC = /^[^@\s]+@\S+$/;
/**
* An addr-spec sitting inside free text, together with the whitespace around it. Sticky
* on purpose: it is run at the one offset _looseAddressStart picks rather than being let
* loose to search, see there.
*/
const LOOSE_TEXT_ADDR = /\s*\b[^@\s]+@[^\s]+\b\s*/y;
/**
* The characters JS `\s` matches, which the scan below has to agree with to land on the
* same match the pattern would.
*/
function _isSpaceCode(code) {
	return code === 32 || code >= 9 && code <= 13 || code === 160 || code === 5760 || code >= 8192 && code <= 8202 || code === 8232 || code === 8233 || code === 8239 || code === 8287 || code === 12288 || code === 65279;
}
/**
* Checks for the whitespace RFC 5322 folding whitespace is made of: SP and HTAB, plus the
* line break a fold carries. The other characters _isSpaceCode accepts are atext under
* RFC 6532, and parsers disagree on them: mailauth keeps U+00A0 in a domain, so joining a
* domain across one names a domain that reader never sees
*
* @param code Character code
* @return true if the character is folding whitespace
*/
function _isFoldingSpaceCode(code) {
	return code === 32 || code === 9 || code === 13 || code === 10;
}
/**
* Checks if every character in a stretch of the field is folding whitespace
*
* @param str The field
* @param from Offset of the first character
* @param to Offset just past the last one
* @return true if the stretch holds nothing but folding whitespace
*/
function _isFoldingGap(str, from, to) {
	for (let i = from; i < to; i++) if (!_isFoldingSpaceCode(str.charCodeAt(i))) return false;
	return true;
}
/**
* Checks for a character the value of a text run is trimmed of, or leaves out: whitespace,
* C0 controls and DEL
*
* @param code Character code
* @return true if the character is not part of the value at the edge of a run
*/
function _isDroppedCode(code) {
	return code < 32 || code === 127 || _isSpaceCode(code);
}
/**
* The characters JS `\w` matches without the unicode flag, the set the `\b` in
* LOOSE_TEXT_ADDR is read against. charCodeAt off either end of the string gives NaN,
* which compares false throughout, so out of range reads as the non-word the pattern
* treats them as.
*/
function _isWordCode(code) {
	return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95;
}
/**
* Whether `\b` holds at an offset
*/
function _isBoundary(text, at) {
	return _isWordCode(text.charCodeAt(at - 1)) !== _isWordCode(text.charCodeAt(at));
}
/**
* Offset of the first '@' in `text` between `from` and `to`, or -1 when the range holds none.
*
* indexOf would scan on to the end of the value, and the value here is a whole header. The
* walk below steps one whitespace delimited run at a time and only ever uses a '@' that sits
* inside the run it is on, so an unbounded probe rescans everything behind that run once per
* run and grows with the square of the header: 400KB of free text carrying no '@' took a
* quarter of a second. GHSA-v53p-9fqp-m79j took the pattern search out of this walk and left
* the probe unbounded behind it.
*
* @param text Text to look in
* @param from Offset to start at
* @param to Offset to stop before
* @return Offset of the '@', or -1
*/
function _indexOfAt(text, from, to) {
	for (let i = from; i < to; i++) if (text.charCodeAt(i) === 64) return i;
	return -1;
}
/**
* A quoted-string a value opens with.
*/
const LEADING_QUOTED_STRING = /^"(?:[^"\\]|\\[\s\S])*"/;
/**
* Drops the whitespace on either side of the '@' at an offset.
*
* obs-local-part and obs-domain allow CFWS around the '@' (RFC 5322 4.4), so 'user @ good.com'
* names user@good.com. Kept, the whitespace went into the envelope as '"user "@ good.com'.
* The scan is by index, a pattern such as /\s+@/ backtracks over a long whitespace run that
* no '@' follows.
*
* The whitespace around the dots of the domain that follows is dropped as well, see
* _joinDomainDotSpacing.
*
* @param value Value holding the '@'
* @param at Offset of the '@', or -1
* @return The value with the whitespace beside that '@' removed
*/
function _joinAtSpacing(value, at) {
	if (at < 0) return value;
	let start = at;
	while (start > 0 && _isSpaceCode(value.charCodeAt(start - 1))) start--;
	let end = at + 1;
	while (end < value.length && _isSpaceCode(value.charCodeAt(end))) end++;
	return _joinDomainDotSpacing(start === at && end === at + 1 ? value : value.slice(0, start) + "@" + value.slice(end), start);
}
const ASCII_ATEXT = /* @__PURE__ */ new Uint8Array(128);
for (let code = 33; code < 127; code++) ASCII_ATEXT[code] = "()<>[]:;@\\,.\"".indexOf(String.fromCharCode(code)) < 0 ? 1 : 0;
/**
* Checks if a character can be part of an atom: anything but the specials, whitespace and
* the control characters (RFC 5322 3.2.3, with non-ASCII allowed as RFC 6532 does)
*
* @param code Character code
* @return true if the character is atext
*/
function _isAtextCode(code) {
	return code < 128 ? ASCII_ATEXT[code] === 1 : !_isSpaceCode(code);
}
/**
* Drops the whitespace around the dots of the domain behind the '@' at an offset.
*
* obs-domain is atoms with CFWS around the dots (RFC 5322 4.4), so 'user@victim.example
* .allowed.example' names user@victim.example.allowed.example. Read as two runs, the domain
* ended at the whitespace and the envelope went to victim.example, a different domain than
* the one an RFC 5322 parser, and an application validating the address with one, reads
* (GHSA-3q53-mvfw-q9v8). A comment around a dot reaches here as whitespace.
*
* Only SP, HTAB and a fold count as the whitespace, see _isFoldingSpaceCode.
*
* Only a dot with an atom on both sides joins, as for a conformant parser: whitespace that
* is not beside a dot ends the domain, and so does a dot that no atom follows, which keeps
* 'user@example.com .' from becoming a domain with a trailing dot. A domain literal is left
* alone. Everything from where the domain ends is kept as it is.
*
* @param value Value holding the '@'
* @param at Offset of the '@'
* @return The value with the whitespace around the dots of that domain removed
*/
function _joinDomainDotSpacing(value, at) {
	const len = value.length;
	let pos = at + 1;
	let spaced = false;
	for (;;) {
		const labelStart = pos;
		while (pos < len && _isAtextCode(value.charCodeAt(pos))) pos++;
		if (pos === labelStart) break;
		let next = pos;
		while (next < len && _isFoldingSpaceCode(value.charCodeAt(next))) next++;
		if (value.charCodeAt(next) !== 46) break;
		next++;
		while (next < len && _isFoldingSpaceCode(value.charCodeAt(next))) next++;
		if (next >= len || !_isAtextCode(value.charCodeAt(next))) break;
		spaced = spaced || next !== pos + 1;
		pos = next;
	}
	if (!spaced) return value;
	let domain = "";
	for (let k = at + 1; k < pos; k++) if (!_isFoldingSpaceCode(value.charCodeAt(k))) domain += value.charAt(k);
	return value.slice(0, at + 1) + domain + value.slice(pos);
}
/**
* Drops the whitespace beside the '@' that splits the domain off a value. That is the '@'
* right after a quoted local part the value opens with, or else the only '@' it holds outside
* any quoted string. With several it is not clear which one the whitespace belongs to, and
* '<x@evil.com @good.com>' is left to the addr-spec recovery to read as it always has.
*
* @param value Value to clean up
* @return The value with the whitespace beside that '@' removed
*/
function _collapseAtSpacing(value) {
	const quoted = LEADING_QUOTED_STRING.exec(value);
	if (quoted) {
		let at = quoted[0].length;
		while (at < value.length && _isSpaceCode(value.charCodeAt(at))) at++;
		if (value.charAt(at) === "@" && value.indexOf("@", at + 1) < 0) return _joinAtSpacing(value, at);
	}
	const at = value.indexOf("@");
	if (at < 0 || value.indexOf("@", at + 1) >= 0 || value.lastIndexOf("\"") > at) return value;
	return _joinAtSpacing(value, at);
}
/**
* Finds the offset LOOSE_TEXT_ADDR matches at, or -1 when it does not match at all.
*
* Letting the pattern search for itself is quadratic: '[^@\s]+' is retried from every
* offset and rescans the run to the next '@' each time, so 140KB of header holding no
* usable '@' blocks the event loop for about ten seconds (GHSA-v53p-9fqp-m79j). The search is also unnecessary.
* '[^@\s]+' crosses neither whitespace nor a '@', so a match can only begin at the head of
* a whitespace delimited run or just past a '@' inside one, and '[^\s]+\b' gives characters
* back until it lands on a boundary, so the only end it can take in that run is the last
* boundary in it. Both are found in one pass, and the pattern is then run at that single
* offset.
*
* @param text Free text to look in
* @return Offset to match at, or -1
*/
function _looseAddressStart(text) {
	const len = text.length;
	let pos = 0;
	while (pos < len) {
		while (pos < len && _isSpaceCode(text.charCodeAt(pos))) pos++;
		if (pos >= len) break;
		const runStart = pos;
		let runEnd = pos;
		while (runEnd < len && !_isSpaceCode(text.charCodeAt(runEnd))) runEnd++;
		let at = _indexOfAt(text, runStart, runEnd);
		if (at >= 0) {
			let lastBoundary = -1;
			for (let k = runEnd; k > runStart; k--) if (_isBoundary(text, k)) {
				lastBoundary = k;
				break;
			}
			let atomStart = runStart;
			while (lastBoundary >= 0 && at >= 0) {
				if (at > atomStart && runEnd > at + 1 && lastBoundary > at + 1) {
					for (let start = atomStart; start < at; start++) if (_isBoundary(text, start)) {
						if (start > runStart) return start;
						let padded = runStart;
						while (padded > 0 && _isSpaceCode(text.charCodeAt(padded - 1))) padded--;
						return padded;
					}
				}
				atomStart = at + 1;
				at = _indexOfAt(text, atomStart, runEnd);
			}
		}
		pos = runEnd;
	}
	return -1;
}
/**
* Recovers the addr-spec from an angle-addr that came back holding unquoted whitespace.
*
* A malformed header can put more than a mailbox between the angle brackets, most often
* because the generator wrote the recipient twice: '<user@example.com user@example.com>'
* or '<example.com user@example.com>'. Whitespace is not addr-spec, so the whole run can
* never be a mailbox anyone could deliver to, and passing it on as the address loses the
* recipient that is sitting right there in the header.
*
* The run that still reads as an addr-spec is kept and whatever is left over becomes
* display text rather than being dropped. Candidates are read strictly first and then
* under the looser grammar, the same two tiers the unquoted-text branch below applies to
* the same problem, so that '<a@b@c.com junk>' and a bare 'a@b@c.com junk' agree on the
* recipient. When several runs qualify the first wins, which is what that branch's looser
* tier does within a token.
*
* A quoted local part is left alone: RFC 5321 allows whitespace inside it, so
* '<"user name"@example.com>' is well formed and means exactly what it says.
*
* @param data Collected address parts, mutated in place
*/
function _recoverAddrSpec(data) {
	data.address = _collapseAtSpacing(data.address);
	if (!HAS_WHITESPACE.test(data.address)) return;
	let address;
	let rest;
	const quoted = data.address.match(QUOTED_LOCAL_ADDR);
	if (quoted) {
		if (!quoted[2]) return;
		address = quoted[1];
		rest = [quoted[2]];
	} else {
		if (data.address.indexOf("\"") >= 0) return;
		const parts = data.address.split(/\s+/);
		let addrIndex = parts.findIndex(_isAddrSpec);
		if (addrIndex < 0) addrIndex = parts.findIndex((part) => LOOSE_ADDR_SPEC.test(part));
		if (addrIndex < 0) return;
		address = parts.splice(addrIndex, 1)[0];
		rest = parts;
	}
	data.address = address;
	data.text = [data.text].concat(rest).filter((part) => part).join(" ");
}
/**
* Takes the RFC 5322 comments out of the contents of an angle-addr.
*
* The tokenizer tracks a single open operator, so once '<' is open a '(' is plain text and
* a comment inside the brackets reached the address verbatim: 'Name <user@example.com(x)evil.com>'
* put 'user@example.com(x)evil.com' into the envelope, a value that is no mailbox and that a
* receiver stripping the comment reads as 'user@example.comevil.com' (GHSA-g73g-hqqh-jr95).
* A comment is folding whitespace, so it is read as a space that splits two atoms and as
* nothing next to an '@', the same rule the token walk applies outside the brackets. Quoted
* strings and domain literals are copied through untouched, a '(' in there is not a comment.
* An unexpected '<' outside them drops everything in front of it, comments included.
*
* RFC 822 also let an angle-addr name the relays to go through in front of the mailbox,
* '<@relay1,@relay2:user@example.com>', which RFC 5322 still parses as obs-route. The route
* is not part of the mailbox, and folded into the local part it made
* '"@relay1,@relay2:user"@example.com' a recipient that does not exist. A local part can not
* start with '@', so contents that do, up to the first ':' outside a domain literal and in
* front of any quoted string, are a route and are dropped, as long as a mailbox with an '@'
* of its own follows.
*
* @param address Contents of the angle brackets
* @return The address with the comments removed, and the text of the comments
*/
function _stripAddressComments(address) {
	const comments = [];
	let result = "";
	let comment = "";
	let depth = 0;
	let closer = "";
	let lastChar = "";
	let pendingSpace = false;
	let firstChar = "";
	let quoteSeen = false;
	let routeEnd = -1;
	for (let i = 0, len = address.length; i < len; i++) {
		const chr = address.charAt(i);
		if (depth) {
			if (chr === "\\" && i < len - 1) comment += address.charAt(++i);
			else if (chr === "(") {
				depth++;
				comment += chr;
			} else if (chr === ")" && !--depth) {
				comments.push(comment.trim());
				comment = "";
				pendingSpace = lastChar !== "@";
			} else comment += chr;
			continue;
		}
		if (pendingSpace && chr !== "(") {
			pendingSpace = false;
			if (chr !== "@" && chr !== "<" && !_isSpaceCode(address.charCodeAt(i))) {
				result += " ";
				lastChar = " ";
			}
		}
		if (closer) {
			if (chr === "\\" && closer === "\"" && i < len - 1) {
				result += chr + address.charAt(++i);
				lastChar = address.charAt(i);
				continue;
			}
			if (chr === closer) closer = "";
		} else if (chr === "\"") {
			closer = "\"";
			quoteSeen = true;
		} else if (chr === ":" && routeEnd < 0 && firstChar === "@" && !quoteSeen) routeEnd = result.length + 1;
		else if (chr === "[") closer = "]";
		else if (chr === "(") {
			depth = 1;
			continue;
		} else if (chr === "<") {
			result = "";
			lastChar = "";
			comments.length = 0;
			firstChar = "";
			quoteSeen = false;
			routeEnd = -1;
			continue;
		}
		result += chr;
		lastChar = chr;
		if (!firstChar && !_isSpaceCode(address.charCodeAt(i))) firstChar = chr;
	}
	if (routeEnd >= 0 && result.indexOf("@", routeEnd) >= 0) result = result.slice(routeEnd);
	if (depth) comments.push(comment.trim());
	return {
		address: result.trim(),
		comments: comments.filter((text) => text)
	};
}
/**
* Walks the tokens of one entry of an address list and sorts them into the runs of display
* text, angle-addr and comment they belong to
*
* @param tokens Tokens of the whole address list
* @param from Index of the first token of the entry
* @param to Index just past the last token of the entry
* @return The collected runs, and whether the display text came out of a comment
*/
function _collectAddressParts(tokens, from, to) {
	let state = "text";
	const data = {
		address: [],
		comment: [],
		text: [],
		textWasQuoted: [],
		quotedLocalAt: []
	};
	let insideQuotes = false;
	let lastTextPureQuoted = false;
	let lastTextHasAt = false;
	let lastTextOpen = false;
	let gapFrom = 0;
	let gapsFolding = true;
	const lastChars = {
		address: "",
		comment: "",
		text: ""
	};
	for (let i = from; i < to; i++) {
		const value = tokens.value(i);
		const prevOperator = i > from ? tokens.operatorAt(i - 1) : "";
		const prevNoBreak = i > from && tokens.noBreak(i - 1);
		if (tokens.isOperator(i)) switch (value) {
			case "<":
				state = "address";
				insideQuotes = false;
				lastTextOpen = false;
				break;
			case "(":
				state = "comment";
				insideQuotes = false;
				gapsFolding = gapsFolding && _isFoldingGap(tokens.str, gapFrom, tokens.contentStart(i));
				break;
			case "\"":
				insideQuotes = !insideQuotes;
				state = "text";
				lastTextOpen = false;
				break;
			default:
				state = "text";
				insideQuotes = false;
				if (value !== ")") lastTextOpen = false;
				else gapFrom = tokens.contentEnd(i);
		}
		else {
			const opensAfterEmptyQuotedString = prevOperator === "\"" && prevNoBreak && i > from + 1 && tokens.operatorAt(i - 2) === "\"";
			const parts = data[state];
			const secondAt = lastTextHasAt && prevOperator === ")" && value.indexOf("@") >= 0;
			const joins = !secondAt && lastTextOpen && lastTextHasAt && prevOperator === ")" && (lastChars.text === "." || value.charAt(0) === ".") && gapsFolding && _isFoldingGap(tokens.str, gapFrom, tokens.contentStart(i)) || !secondAt && prevNoBreak && parts.length > 0 && (prevOperator !== ")" || lastChars[state] === "@" || value.charAt(0) === "@");
			if (joins) {
				const last = data[state].length - 1;
				if (state === "text" && !insideQuotes) {
					if (lastTextPureQuoted && value.charAt(0) === "@") data.quotedLocalAt[last] = data.text[last].length;
					lastTextPureQuoted = false;
				}
				data[state][last] += value;
				lastChars[state] = value.charAt(value.length - 1);
				if (state === "text" && insideQuotes) data.textWasQuoted[last] = true;
			} else {
				data[state].push(value);
				lastChars[state] = value.charAt(value.length - 1);
				if (state === "text") {
					data.textWasQuoted.push(insideQuotes || opensAfterEmptyQuotedString);
					data.quotedLocalAt.push(opensAfterEmptyQuotedString && value.charAt(0) === "@" ? 0 : -1);
					lastTextPureQuoted = insideQuotes;
				}
			}
			if (state === "text") {
				lastTextHasAt = joins && lastTextHasAt || !insideQuotes && value.indexOf("@") >= 0;
				lastTextOpen = true;
				gapFrom = tokens.contentEnd(i);
				gapsFolding = true;
			}
		}
	}
	let textFromComment = false;
	if (!data.text.length && data.comment.length) {
		data.text = data.comment;
		data.comment = [];
		textFromComment = true;
	}
	return {
		data,
		textFromComment
	};
}
/**
* Name of a group, from the tokens in front of its ':'. A comment names it when no text does,
* as it names a mailbox.
*
* @param tokens Tokens of the whole address list
* @param from Index of the first token in front of the ':'
* @param to Index of the ':'
* @return Name of the group
*/
function _groupName(tokens, from, to) {
	return _collectAddressParts(tokens, from, to).data.text.join(" ");
}
/**
* Converts tokens for a single address into an address object
*
* @param tokens Tokens of the whole address list
* @param from Index of the first token of this address
* @param to Index just past the last token of this address
* @return Address object
*/
function _handleAddress(tokens, from, to) {
	const collected = _collectAddressParts(tokens, from, to);
	const data = collected.data;
	let textFromComment = collected.textFromComment;
	const addressComments = [];
	const addressParts = [];
	for (const part of data.address) {
		const stripped = _stripAddressComments(part);
		for (const comment of stripped.comments) addressComments.push(comment);
		if (stripped.address) addressParts.push(stripped.address);
	}
	data.address = addressParts;
	if (!data.address.length && data.text.length && !textFromComment) {
		const candidates = data.text.map((part) => _collapseAtSpacing(part));
		for (let i = 0; i < data.text.length; i++) {
			const local = data.quotedLocalAt[i];
			const quotedLocal = data.textWasQuoted[i] && local >= 0 && QUOTED_LOCAL_DOMAIN.test(data.text[i].slice(local)) ? _quoteLocalPart(data.text[i]) : "";
			if (quotedLocal || !data.textWasQuoted[i] && _isAddrSpec(candidates[i])) {
				data.address = [quotedLocal || candidates[i]];
				data.text.splice(i, 1);
				data.textWasQuoted.splice(i, 1);
				data.quotedLocalAt.splice(i, 1);
				break;
			}
		}
		if (!data.address.length) {
			let extracted = false;
			for (let i = 0; i < data.text.length; i++) if (!data.textWasQuoted[i]) {
				const part = candidates[i];
				let remainder = data.text[i];
				const at = _looseAddressStart(part);
				if (at >= 0) {
					LOOSE_TEXT_ADDR.lastIndex = at;
					const match = LOOSE_TEXT_ADDR.exec(part);
					if (match) {
						data.address = [match[0].trim()];
						extracted = true;
						remainder = part.slice(0, at) + " " + part.slice(at + match[0].length);
					}
				}
				data.text[i] = remainder.trim();
				if (extracted) break;
			}
		}
	}
	if (!data.text.length && data.comment.length) {
		data.text = data.comment;
		data.comment = [];
	}
	if (data.address.length > 1) data.text = data.text.concat(data.address.splice(1));
	const addressFromQuotedText = !data.address.length && data.textWasQuoted.some((wasQuoted) => wasQuoted);
	data.text = data.text.join(" ");
	data.address = data.address.join(" ");
	if (addressFromQuotedText && data.text.indexOf("@") >= 0) {
		data.address = _quoteLocalPart(_joinAtSpacing(data.text, _domainAt(data.text)));
		data.text = "";
	}
	_recoverAddrSpec(data);
	if (!data.text && addressComments.length) {
		data.text = addressComments.join(" ");
		textFromComment = true;
	}
	const address = {
		address: data.address || (textFromComment ? "" : data.text) || "",
		name: data.text || data.address || ""
	};
	if (address.address === address.name) {
		if (/@/.test(address.address || "")) address.name = "";
		else address.address = "";
	}
	return address;
}
/**
* Creates a Tokenizer object for tokenizing address field strings
*
* @constructor
* @param str Address field string
*/
var Tokenizer = class {
	constructor(str) {
		this.str = (str || "").toString();
		this.operatorCurrent = "";
		this.operatorExpecting = "";
		this.node = -1;
		this.escaped = false;
		this.inDomainLiteral = false;
		this.afterAt = false;
		this.inGroup = false;
		this.innerQuoted = false;
		this.innerComment = 0;
		this.innerLiteral = false;
		this.innerEscaped = false;
		this.list = new TokenList(this.str);
		/**
		* Operator tokens and which tokens are expected to end the sequence
		*/
		this.operators = {
			"\"": "\"",
			"(": ")",
			"<": ">",
			",": "",
			":": "",
			";": ""
		};
	}
	/**
	* Tokenizes the original input string
	*
	* @return An array of operator|text tokens
	*/
	tokenize() {
		const str = this.str;
		const len = str.length;
		for (let i = 0; i < len; i++) this.checkChar(str.charAt(i), i);
		this._closeText(len);
		const list = this.list;
		const slots = list.slots;
		let kept = 0;
		for (let i = 0, count = list.length; i < count; i++) {
			const kind = slots[i * 3];
			let start = slots[i * 3 + 1];
			let end = slots[i * 3 + 2];
			if (kind & TOKEN_DIRTY) {
				const value = this._cleanValue(start, end, kind).trim();
				if (!value) continue;
				list.cleaned.set(kept, value);
			} else if (!(kind & TOKEN_OPERATOR)) {
				while (start < end && _isSpaceCode(str.charCodeAt(start))) start++;
				while (end > start && _isSpaceCode(str.charCodeAt(end - 1))) end--;
				if (start === end) continue;
			}
			slots[kept * 3] = kind;
			slots[kept * 3 + 1] = start;
			slots[kept * 3 + 2] = end;
			kept++;
		}
		list.length = kept;
		return list;
	}
	/**
	* Ends the text run being collected, if there is one
	*
	* @param end Offset just past its last character
	*/
	_closeText(end) {
		if (this.node >= 0) {
			this.list.slots[this.node * 3 + 2] = end;
			this.node = -1;
		}
	}
	/**
	* Rebuilds the value of a text run that is no plain slice of the field, applying the
	* rules checkChar collects characters by: an escaping backslash is dropped, a line break
	* reads as a space and any other control character is left out
	*
	* @param start Offset of the first character of the run
	* @param end Offset just past its last character
	* @param kind Kind and flags of the run
	* @return Value of the run
	*/
	_cleanValue(start, end, kind) {
		const str = this.str;
		const escapes = (kind & TOKEN_ESCAPES) !== 0;
		let escaped = (kind & TOKEN_STARTS_ESCAPED) !== 0;
		let value = "";
		for (let i = start; i < end; i++) {
			const chr = str.charAt(i);
			if (escapes && !escaped && chr === "\\") {
				escaped = true;
				continue;
			}
			escaped = false;
			if (chr === "\n") value += " ";
			else if (chr.charCodeAt(0) >= 33 || chr === " " || chr === "	") value += chr;
		}
		return value;
	}
	/**
	* Checks if a character is an operator or text and acts accordingly
	*
	* @param chr Character from the address field
	* @param i Offset of the character in the field
	*/
	checkChar(chr, i) {
		if (!this.escaped && !this.operatorExpecting) {
			if (!this.inDomainLiteral && chr === "[" && this.afterAt) this.inDomainLiteral = true;
			else if (this.inDomainLiteral && (chr === "]" || chr === "," || chr === ";")) this.inDomainLiteral = false;
		}
		let nested = false;
		if (this.operatorExpecting === ">") {
			nested = this._trackInner(chr);
			if (!nested && chr === ";" && this.inGroup) {
				this._closeText(i);
				this.operatorExpecting = "";
				this._resetInner();
			}
		} else if (this.operatorExpecting === ")" && !this.escaped) {
			if (chr === "(") this.innerComment++;
			else if (chr === ")" && this.innerComment) {
				this.innerComment--;
				nested = true;
			}
		}
		if (this.escaped) {} else if (chr === this.operatorExpecting && !nested) {
			const nextChr = this.str.charAt(i + 1);
			this._closeText(i);
			this.list.push(nextChr && ![
				" ",
				"	",
				"\r",
				"\n",
				",",
				";"
			].includes(nextChr) ? 3 : TOKEN_OPERATOR, i, i + 1);
			if (chr !== ")") this.afterAt = false;
			this.operatorExpecting = "";
			this.escaped = false;
			this._resetInner();
			return;
		} else if (!this.operatorExpecting && !(this.inDomainLiteral && chr === ":") && chr in this.operators) {
			this._closeText(i);
			this.list.push(TOKEN_OPERATOR, i, i + 1);
			if (chr === ":") this.inGroup = true;
			else if (chr === ";") this.inGroup = false;
			if (chr !== "(") this.afterAt = false;
			this.operatorExpecting = this.operators[chr];
			this.escaped = false;
			this._resetInner();
			return;
		} else if ([
			"\"",
			"'",
			")"
		].includes(this.operatorExpecting) && chr === "\\") {
			this.escaped = true;
			if (this.node >= 0) this.list.slots[this.node * 3] |= TOKEN_DIRTY;
			return;
		}
		if (this.node < 0) this.node = this.list.push((this.operatorExpecting === "\"" || this.operatorExpecting === ")" ? TOKEN_ESCAPES : 0) | (this.escaped ? TOKEN_STARTS_ESCAPED : 0), i, i);
		if (chr === "\n") {
			chr = " ";
			this.list.slots[this.node * 3] |= TOKEN_DIRTY;
		}
		if (chr.charCodeAt(0) >= 33 || chr === " " || chr === "	") {
			if (!this.operatorExpecting && chr !== " " && chr !== "	") this.afterAt = chr === "@";
		} else this.list.slots[this.node * 3] |= TOKEN_DIRTY;
		this.escaped = false;
	}
	/**
	* Tracks the quoted strings, comments and domain literals inside an angle-addr, which its
	* closer must not be read from. A backslash escapes the next character inside a quoted
	* string and a comment. A domain literal opens right after an "@" and ends at the "]".
	* dtext holds the list separators as well, and inside the brackets they never split the
	* list anyway.
	*
	* @param chr Character from the address field
	* @return true while the character sits inside one of them, the one that closes it included
	*/
	_trackInner(chr) {
		if (this.innerEscaped) {
			this.innerEscaped = false;
			return true;
		}
		if (this.innerQuoted) {
			if (chr === "\\") this.innerEscaped = true;
			else if (chr === "\"") this.innerQuoted = false;
			return true;
		}
		if (this.innerComment) {
			if (chr === "\\") this.innerEscaped = true;
			else if (chr === "(") this.innerComment++;
			else if (chr === ")") this.innerComment--;
			return true;
		}
		if (this.innerLiteral) {
			if (chr === "]") this.innerLiteral = false;
			return true;
		}
		if (chr === "\"") {
			this.innerQuoted = true;
			return true;
		}
		if (chr === "(") {
			this.innerComment = 1;
			return true;
		}
		if (chr === "[" && this.afterAt) {
			this.innerLiteral = true;
			return true;
		}
		if (!_isSpaceCode(chr.charCodeAt(0))) this.afterAt = chr === "@";
		return false;
	}
	/**
	* Forgets the nesting collected for the operator that just opened or ended
	*/
	_resetInner() {
		this.innerQuoted = false;
		this.innerComment = 0;
		this.innerLiteral = false;
		this.innerEscaped = false;
	}
};
/**
* Folds the fragments an unquoted display name holding a comma is split into back together.
*
* "Joe Foo, PhD <joe@example.com>" is split on the comma into
* [{name:"Joe Foo", address:""}, {name:"PhD", address:"joe@example.com"}]. A name-only entry
* followed by an entry with both name and address is recombined. Walked back to front so
* that a run of fragments folds into one entry in a single pass. Splicing each fragment out
* of the list instead would cost O(n^2).
*
* @param list Parsed entries, in order
* @return The entries with the fragments folded in
*/
function _mergeNameFragments(list) {
	const merged = [];
	for (let i = list.length - 1; i >= 0; i--) {
		const current = list[i];
		const next = merged.length ? merged[merged.length - 1] : null;
		if (next && current.address === "" && current.name && !current.group && next.address && next.name) next.name = current.name + ", " + next.name;
		else merged.push(current);
	}
	return merged.reverse();
}
/**
* Parses an address list, groups included, in a single pass over its tokens.
*
* A group used to be cut out of the field at the ';' that ends it and parsed again as an
* address list of its own, recursively, so every level of nesting parsed what was left of
* the field once more and the depth had to be capped. RFC 5322 does not nest groups at all,
* and the nested ones were flattened anyway. The tokens are now walked once: a ':' opens a
* group, its members are read as they come, a ';' closes it. A ':' inside an open group
* stands for a group nested in it, whose name is dropped and whose members belong to the
* outer one, which is how they were flattened before. The first ';' ends the group, nested
* or not, as it did.
*
* @param str Address field
* @return An array of address objects
*/
function _parseAddressList(str) {
	const tokens = new Tokenizer(str).tokenize();
	const parsedAddresses = [];
	let group = null;
	let members = [];
	let from = 0;
	for (let i = 0, len = tokens.length; i <= len; i++) {
		const operator = i < len ? tokens.operatorAt(i) : "";
		if (i < len && operator !== "," && operator !== ";" && operator !== ":") continue;
		if (operator === ":") {
			if (!group) {
				group = {
					name: _groupName(tokens, from, i),
					group: []
				};
				members = [];
			}
			from = i + 1;
			continue;
		}
		if (i > from) {
			const address = _handleAddress(tokens, from, i);
			if (group) members.push(address);
			else parsedAddresses.push(address);
		}
		from = i + 1;
		if (group && (operator === ";" || i === len)) {
			group.group = _mergeNameFragments(members);
			parsedAddresses.push(group);
			group = null;
		}
	}
	return _mergeNameFragments(parsedAddresses);
}
function addressparser(str, options) {
	const parsedAddresses = _parseAddressList(str);
	if (options?.flatten) {
		const flatAddresses = [];
		const walkAddressList = (list) => {
			list.forEach((entry) => {
				if (entry.group) return walkAddressList(entry.group);
				flatAddresses.push(entry);
			});
		};
		walkAddressList(parsedAddresses);
		return flatAddresses;
	}
	return parsedAddresses;
}
// node_modules/nodemailer/dist/esm/mime-node/last-newline.js
var LastNewline = class extends Transform {
	constructor() {
		super();
		this.lastByte = false;
	}
	/** @internal */
	_transform(chunk, encoding, done) {
		if (chunk.length) this.lastByte = chunk[chunk.length - 1];
		this.push(chunk);
		done();
	}
	/** @internal */
	_flush(done) {
		if (this.lastByte === 10) return done();
		if (this.lastByte === 13) {
			this.push(Buffer.from("\n"));
			return done();
		}
		this.push(Buffer.from("\r\n"));
		return done();
	}
};
// node_modules/nodemailer/dist/esm/mime-node/le-windows.js
/**
* Ensures that only <CR><LF> sequences are used for linebreaks
*
* @param options Stream options
*/
var LeWindows = class extends Transform {
	constructor(options) {
		super(options);
		this.lastByte = false;
	}
	/**
	* Escapes dots
	* @internal
	*/
	_transform(chunk, encoding, done) {
		let buf;
		let lastPos = 0;
		for (let i = 0, len = chunk.length; i < len; i++) if (chunk[i] === 10) {
			if (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) {
				if (i > lastPos) {
					buf = chunk.slice(lastPos, i);
					this.push(buf);
				}
				this.push(Buffer.from("\r\n"));
				lastPos = i + 1;
			}
		}
		if (lastPos && lastPos < chunk.length) {
			buf = chunk.slice(lastPos);
			this.push(buf);
		} else if (!lastPos) this.push(chunk);
		this.lastByte = chunk[chunk.length - 1];
		done();
	}
};
// node_modules/nodemailer/dist/esm/mime-node/le-unix.js
/**
* Ensures that only <LF> is used for linebreaks
*
* @param options Stream options
*/
var LeUnix = class extends Transform {
	constructor(options) {
		super(options);
	}
	/**
	* Escapes dots
	* @internal
	*/
	_transform(chunk, encoding, done) {
		let buf;
		let lastPos = 0;
		for (let i = 0, len = chunk.length; i < len; i++) if (chunk[i] === 13) {
			buf = chunk.slice(lastPos, i);
			lastPos = i + 1;
			this.push(buf);
		}
		if (lastPos && lastPos < chunk.length) {
			buf = chunk.slice(lastPos);
			this.push(buf);
		} else if (!lastPos) this.push(chunk);
		done();
	}
};
// node_modules/nodemailer/dist/esm/mime-node/index.js
const FORMATTED_HEADERS = [
	"From",
	"Sender",
	"To",
	"Cc",
	"Bcc",
	"Reply-To",
	"Date",
	"References"
];
const ATEXT = "[A-Za-z0-9!#$%&'*+\\-/=?^_`{|}~\\x80-\\uFFFF]";
const DOT_ATOM = new RegExp("^" + ATEXT + "+(?:\\." + ATEXT + "+)*$");
const QUOTED_STRING = /^"(?:[^"\\]|\\[\s\S])*"$/;
const PLAIN_ADDRESS = /^[^\s"(),:;<>@[\\\]]+@[^\s"(),:;<>@[\\\]]+$/;
/**
* A domain literal that ends an address, see _normalizeAddress
*/
const DOMAIN_LITERAL_TAIL = /@(\[[^[\]\\]*\])$/;
/**
* Removes the whitespace inside every <...> of a References value. A "<" with no ">" after
* it is left as it is. An index scan, the regex /<[^>]*>/g rescans the rest of the value
* from every such "<"
*
* @param value References header value
* @returns The value with the msg-ids closed up
*/
function stripWhitespaceInAngleBrackets(value) {
	let result = "";
	let pos = 0;
	for (;;) {
		const open = value.indexOf("<", pos);
		if (open < 0) break;
		const close = value.indexOf(">", open + 1);
		if (close < 0) break;
		result += value.slice(pos, open) + value.slice(open, close + 1).replace(/\s/g, "");
		pos = close + 1;
	}
	return result + value.slice(pos);
}
const PIPELINE_NOOP = () => false;
function abortedError() {
	const err = /* @__PURE__ */ new Error("Message stream was closed before the message was generated");
	err.code = ESTREAM;
	return err;
}
/**
* Removes the characters that must never reach a multipart delimiter line.
*
* A line break splits the delimiter, so the boundary declared in the header can never
* match it again and the parts go out as body lines instead. The other C0 controls and
* DEL do not split anything but must not be written either: RFC 5321 does not allow a
* NUL in DATA at all, and an MTA or a scanner that stops at one reads a different
* message than a client that does not, which is the same parser disagreement a split
* delimiter creates. Both sides are cleaned together, since the declared value and the
* delimiters come from this one result.
*
* @param value Value to clean
* @return Value with every control character removed
*/
function _stripBoundaryControls(value) {
	return value.replace(/[\x00-\x1f\x7f]+/g, "");
}
/**
* Creates a new mime tree node. Assumes 'multipart/*' as the content type
* if it is a branch, anything else counts as leaf. If rootNode is missing from
* the options, assumes this is the root.
*
* @param contentType Define the content type for the node. Can be left blank for attachments (derived from filename)
* @param [options] optional options
* @param [options.rootNode] root node for this tree
* @param [options.parentNode] immediate parent for this node
* @param [options.filename] filename for an attachment node
* @param [options.baseBoundary] shared part of the unique multipart boundary
* @param [options.keepBcc] If true, do not exclude Bcc from the generated headers
* @param [options.normalizeHeaderKey] method to normalize header keys for custom caseing
* @param [options.textEncoding] either 'Q' (the default) or 'B'
*/
var MimeNode = class MimeNode {
	constructor(contentType, options) {
		this.nodeCounter = 0;
		options = options || {};
		/**
		* shared part of the unique multipart boundary. Control characters are dropped
		* here rather than at the delimiter, see _stripBoundaryControls
		*/
		this.baseBoundary = _stripBoundaryControls(options.baseBoundary || crypto.randomBytes(8).toString("hex"));
		this.boundaryPrefix = _stripBoundaryControls(options.boundaryPrefix || "--_NmP");
		this.disableFileAccess = !!options.disableFileAccess;
		this.disableUrlAccess = !!options.disableUrlAccess;
		this.normalizeHeaderKey = options.normalizeHeaderKey;
		/**
		* If date headers is missing and current node is the root, this value is used instead
		*/
		this.date = options.parentNode ? null : /* @__PURE__ */ new Date();
		/**
		* Root node for current mime tree
		*/
		this.rootNode = options.rootNode || this;
		/**
		* If true include Bcc in generated headers (if available)
		*/
		this.keepBcc = !!options.keepBcc;
		/**
		* If filename is specified but contentType is not (probably an attachment)
		* detect the content type from filename extension
		*/
		if (options.filename) {
			/**
			* Filename for this node. Useful with attachments
			*/
			this.filename = options.filename;
			if (!contentType) contentType = detectMimeType(this.filename.split(".").pop());
		}
		/**
		* Indicates which encoding should be used for header strings: "Q" or "B"
		*/
		this.textEncoding = (options.textEncoding || "").toString().trim().charAt(0).toUpperCase();
		/**
		* Immediate parent for this node (or undefined if not set)
		*/
		this.parentNode = options.parentNode;
		/**
		* Hostname for default message-id values
		*/
		this.hostname = options.hostname;
		/**
		* If set to 'win' then uses \r\n, if 'linux' then \n. If not set (or `raw` is used) then newlines are kept as is.
		*/
		this.newline = options.newline;
		/**
		* An array for possible child nodes
		*/
		this.childNodes = [];
		/**
		* Used for generating unique boundaries (prepended to the shared base)
		*/
		this._nodeId = ++this.rootNode.nodeCounter;
		/**
		* A list of header values for this node in the form of [{key:'', value:''}]
		*/
		this._headers = [];
		/**
		* True if the content only uses ASCII printable characters
		* @type {Boolean}
		*/
		this._isPlainText = false;
		/**
		* True if the content is plain text but has longer lines than allowed
		* @type {Boolean}
		*/
		this._hasLongLines = false;
		/**
		* If set, use instead this value for envelopes instead of generating one
		* @type {Boolean}
		*/
		this._envelope = false;
		/**
		* If set then use this value as the stream content instead of building it
		* @type {String|Buffer|Stream}
		*/
		this._raw = false;
		/**
		* Additional transform streams that the message will be piped before
		* exposing by createReadStream
		* @type {Array}
		*/
		this._transforms = [];
		/**
		* Additional process functions that the message will be piped through before
		* exposing by createReadStream. These functions are run after transforms
		* @type {Array}
		*/
		this._processFuncs = [];
		/**
		* If content type is set (or derived from the filename) add it to headers
		*/
		if (contentType) this.setHeader("Content-Type", contentType);
	}
	/**
	* Creates and appends a child node.Arguments provided are passed to MimeNode constructor
	*
	* @param [contentType] Optional content type
	* @param [options] Optional options object
	* @return Created node object
	*/
	createChild(contentType, options) {
		if (!options && typeof contentType === "object") {
			options = contentType;
			contentType = void 0;
		}
		const node = new MimeNode(contentType, options);
		this.appendChild(node);
		return node;
	}
	/**
	* Appends an existing node to the mime tree. Removes the node from an existing
	* tree if needed
	*
	* @param childNode node to be appended
	* @return Appended node object
	*/
	appendChild(childNode) {
		if (childNode.parentNode && childNode.parentNode !== this) childNode.remove();
		if (childNode.rootNode !== this.rootNode) {
			childNode.rootNode = this.rootNode;
			childNode._nodeId = ++this.rootNode.nodeCounter;
		}
		childNode.parentNode = this;
		this.childNodes.push(childNode);
		return childNode;
	}
	/**
	* Replaces current node with another node
	*
	* @param node Replacement node
	* @return Replacement node
	*/
	replace(node) {
		if (node === this) return this;
		this.parentNode.childNodes.forEach((childNode, i) => {
			if (childNode === this) {
				node.rootNode = this.rootNode;
				node.parentNode = this.parentNode;
				node._nodeId = this._nodeId;
				this.rootNode = this;
				this.parentNode = void 0;
				node.parentNode.childNodes[i] = node;
			}
		});
		return node;
	}
	/**
	* Removes current node from the mime tree
	*
	* @return removed node
	*/
	remove() {
		if (!this.parentNode) return this;
		for (let i = this.parentNode.childNodes.length - 1; i >= 0; i--) if (this.parentNode.childNodes[i] === this) {
			this.parentNode.childNodes.splice(i, 1);
			this.parentNode = void 0;
			this.rootNode = this;
			return this;
		}
	}
	/**
	* Sets a header value. If the value for selected key exists, it is overwritten.
	* You can set multiple values as well by using [{key:'', value:''}] or
	* {key: 'value'} as the first argument.
	*
	* @param key Header key or a list of key value pairs
	* @param value Header value
	* @return current node
	*/
	setHeader(key, value) {
		let added = false;
		if (!value && key && typeof key === "object") {
			if (key.key && "value" in key) this.setHeader(key.key, key.value);
			else if (Array.isArray(key)) key.forEach((i) => {
				this.setHeader(i.key, i.value);
			});
			else Object.keys(key).forEach((i) => {
				this.setHeader(i, key[i]);
			});
			return this;
		}
		key = this._normalizeHeaderKey(key);
		const headerValue = {
			key,
			value
		};
		for (let i = 0, len = this._headers.length; i < len; i++) if (this._headers[i].key === key) {
			if (!added) {
				this._headers[i] = headerValue;
				added = true;
			} else {
				this._headers.splice(i, 1);
				i--;
				len--;
			}
		}
		if (!added) this._headers.push(headerValue);
		return this;
	}
	/**
	* Adds a header value. If the value for selected key exists, the value is appended
	* as a new field and old one is not touched.
	* You can set multiple values as well by using [{key:'', value:''}] or
	* {key: 'value'} as the first argument.
	*
	* @param key Header key or a list of key value pairs
	* @param value Header value
	* @return current node
	*/
	addHeader(key, value) {
		if (!value && key && typeof key === "object") {
			if (key.key && key.value) this.addHeader(key.key, key.value);
			else if (Array.isArray(key)) key.forEach((i) => {
				this.addHeader(i.key, i.value);
			});
			else Object.keys(key).forEach((i) => {
				this.addHeader(i, key[i]);
			});
			return this;
		} else if (Array.isArray(value)) {
			value.forEach((val) => {
				this.addHeader(key, val);
			});
			return this;
		}
		this._headers.push({
			key: this._normalizeHeaderKey(key),
			value
		});
		return this;
	}
	/**
	* Retrieves the first mathcing value of a selected key
	*
	* @param key Key to search for
	* @retun Value for the key
	*/
	getHeader(key) {
		key = this._normalizeHeaderKey(key);
		for (let i = 0, len = this._headers.length; i < len; i++) if (this._headers[i].key === key) return this._headers[i].value;
	}
	/**
	* Sets body content for current node. If the value is a string, charset is added automatically
	* to Content-Type (if it is text/*). If the value is a Buffer, you need to specify
	* the charset yourself
	*
	* @param content Body content
	* @return current node
	*/
	setContent(content) {
		this.content = content;
		if (typeof this.content.pipe === "function") recordStreamErrors(this.content);
		else if (typeof this.content === "string") {
			this._isPlainText = isPlainText(this.content);
			if (this._isPlainText && hasLongerLines(this.content, 76)) this._hasLongLines = true;
		}
		return this;
	}
	build(callback) {
		let promise;
		if (!callback) promise = new Promise((resolve, reject) => {
			callback = callbackPromise(resolve, reject);
		});
		const done = callback;
		const stream = this.createReadStream();
		const buf = [];
		let buflen = 0;
		let returned = false;
		stream.on("readable", () => {
			let chunk;
			while ((chunk = stream.read()) !== null) {
				buf.push(chunk);
				buflen += chunk.length;
			}
		});
		stream.once("error", (err) => {
			if (returned) return;
			returned = true;
			return done(err);
		});
		stream.once("end", (chunk) => {
			if (returned) return;
			returned = true;
			if (chunk && chunk.length) {
				buf.push(chunk);
				buflen += chunk.length;
			}
			return done(null, Buffer.concat(buf, buflen));
		});
		return promise;
	}
	getTransferEncoding() {
		let transferEncoding = false;
		const contentType = (this.getHeader("Content-Type") || "").toString().toLowerCase().trim();
		if (this.content) {
			transferEncoding = (this.getHeader("Content-Transfer-Encoding") || "").toString().toLowerCase().trim();
			if (!transferEncoding || !["base64", "quoted-printable"].includes(transferEncoding)) {
				if (/^text\//i.test(contentType)) {
					if (this._isPlainText && !this._hasLongLines) transferEncoding = "7bit";
					else if (typeof this.content === "string" || this.content instanceof Buffer) transferEncoding = this._getTextEncoding(this.content) === "Q" ? "quoted-printable" : "base64";
					else transferEncoding = this.textEncoding === "B" ? "base64" : "quoted-printable";
				} else if (!/^(multipart|message)\//i.test(contentType)) transferEncoding = transferEncoding || "base64";
			}
		}
		return transferEncoding;
	}
	/**
	* Builds the header block for the mime node. Append \r\n\r\n before writing the content
	*
	* @returns Headers
	*/
	buildHeaders() {
		const transferEncoding = this.getTransferEncoding();
		const headers = [];
		if (transferEncoding) this.setHeader("Content-Transfer-Encoding", transferEncoding);
		if (this.filename && !this.getHeader("Content-Disposition")) this.setHeader("Content-Disposition", "attachment");
		if (this.rootNode === this) {
			if (!this.getHeader("Date")) this.setHeader("Date", this.date.toUTCString().replace(/GMT/, "+0000"));
			this.messageId();
			if (!this.getHeader("MIME-Version")) this.setHeader("MIME-Version", "1.0");
			for (let i = this._headers.length - 2; i >= 0; i--) {
				const header = this._headers[i];
				if (header.key === "Content-Type") {
					this._headers.splice(i, 1);
					this._headers.push(header);
				}
			}
		}
		this._headers.forEach((header) => {
			let key = header.key;
			let value = header.value;
			let structured;
			let param;
			const options = {};
			if (value && typeof value === "object" && !FORMATTED_HEADERS.includes(key)) {
				copyOwnKeys(options, value, (optionKey) => optionKey === "value");
				value = (value.value || "").toString();
				if (!value.trim()) return;
			}
			if (options.prepared) {
				if (options.foldLines) headers.push(foldLines(key + ": " + value));
				else headers.push(key + ": " + value);
				return;
			}
			switch (header.key) {
				case "Content-Disposition":
					structured = parseHeaderValue(value, { stripComments: true });
					if (this.filename) structured.params.filename = this.filename;
					value = buildHeaderValue(structured);
					break;
				case "Content-Type":
					structured = parseHeaderValue(value, { stripComments: true });
					structured.value = (structured.value || "").toString().replace(/[\x00-\x1f\x7f]/g, "");
					this._handleContentType(structured);
					if (structured.value.match(/^text\/plain\b/) && typeof this.content === "string" && /[\u0080-\uFFFF]/.test(this.content)) structured.params.charset = "utf-8";
					if (this.filename) {
						for (const paramKey of Object.keys(structured.params)) if (/^name(\*|$)/i.test(paramKey)) delete structured.params[paramKey];
					}
					value = buildHeaderValue(structured);
					if (this.filename) {
						param = /[\x00-\x1f\x7f]/.test(this.filename) ? encodeWord(this.filename, this._getTextEncoding(this.filename), 52) : this._encodeWords(this.filename);
						if (param !== this.filename || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(param)) param = JSON.stringify(param);
						value += "; name=" + param;
					}
					break;
				case "Bcc": if (!this.keepBcc) return;
			}
			value = this.encodeHeaderValue(key, value);
			if (!(value || "").toString().trim()) return;
			if (typeof this.normalizeHeaderKey === "function") {
				const normalized = this.normalizeHeaderKey(key, value);
				const cleaned = typeof normalized === "string" ? normalized.replace(/[\x00-\x1f\x7f]/g, "") : "";
				if (cleaned) key = cleaned;
			}
			headers.push(foldLines(key + ": " + value, 76));
		});
		return headers.join("\r\n");
	}
	/**
	* Streams the rfc2822 message from the current node. If this is a root node,
	* mandatory header fields are set if missing (Date, Message-Id, MIME-Version)
	*
	* @return Compiled message
	*/
	createReadStream(options) {
		options = options || {};
		const stream = new PassThrough(options);
		this.stream(stream, options, (err) => {
			if (err) {
				stream.destroy(err);
				return;
			}
			stream.end();
		});
		stream.once("close", () => {
			if (!stream.writableFinished) this._destroyContentStreams();
		});
		const stages = [stream];
		for (const transform of this._transforms) stages.push(typeof transform === "function" ? transform() : transform);
		stages.push(new LastNewline());
		let outputStream = pipeline(stages, PIPELINE_NOOP);
		for (const processFunc of this._processFuncs) {
			const input = outputStream;
			outputStream = processFunc(input);
			if (outputStream !== input) finished(outputStream, (err) => {
				if (err) input.destroy();
			});
		}
		if (this.newline) {
			const winbreak = [
				"win",
				"windows",
				"dos",
				"\r\n"
			].includes(this.newline.toString().toLowerCase());
			outputStream = pipeline(outputStream, winbreak ? new LeWindows() : new LeUnix(), PIPELINE_NOOP);
		}
		return outputStream;
	}
	/**
	* Appends a transform stream object to the transforms list. Final output
	* is passed through this stream before exposing
	*
	* @param transform Read-Write stream
	*/
	transform(transform) {
		this._transforms.push(transform);
	}
	/**
	* Appends a post process function. The functon is run after transforms and
	* uses the following syntax
	*
	*   processFunc(input) -> outputStream
	*
	* @param processFunc Read-Write stream
	*/
	processFunc(processFunc) {
		this._processFuncs.push(processFunc);
	}
	stream(outputStream, options, done) {
		const transferEncoding = this.getTransferEncoding();
		let activeStreams = [];
		let returned = false;
		const callback = (err) => {
			if (returned) return;
			returned = true;
			outputStream.removeListener("close", onOutputClose);
			done(err);
		};
		function onOutputClose() {
			for (const stream of activeStreams) stream.destroy();
			return callback(abortedError());
		}
		const readInto = (...streams) => {
			if (!activeStreams.length) outputStream.once("close", onOutputClose);
			activeStreams = streams;
		};
		const aborted = () => {
			if (outputStream.destroyed) {
				callback(abortedError());
				return true;
			}
			return false;
		};
		const finalize = () => {
			let childId = 0;
			const processChildNode = () => {
				if (aborted()) return;
				if (childId >= this.childNodes.length) {
					outputStream.write("\r\n--" + this.boundary + "--\r\n");
					return callback();
				}
				const child = this.childNodes[childId++];
				outputStream.write((childId > 1 ? "\r\n" : "") + "--" + this.boundary + "\r\n");
				child.stream(outputStream, options, (err) => {
					if (err) return callback(err);
					setImmediate(processChildNode);
				});
			};
			if (this.multipart) setImmediate(processChildNode);
			else return callback();
		};
		const sendContent = () => {
			if (aborted()) return;
			if (!this.content) return setImmediate(finalize);
			const createStream = () => {
				if (aborted()) return;
				const contentError = this._takeStreamContent(this.content);
				if (contentError) return callback(contentError);
				const localStream = this._getStream(this.content);
				if (["quoted-printable", "base64"].includes(transferEncoding)) {
					const contentStream = transferEncoding === "base64" ? new Encoder$1(options) : new Encoder(Object.assign({}, options, { binary: !/^text\//i.test(this.contentType || "") }));
					readInto(localStream, contentStream);
					contentStream.pipe(outputStream, { end: false });
					pipeline(localStream, contentStream, (err) => err && callback(err));
					finished(contentStream, { writable: false }, (err) => err ? callback(err) : finalize());
				} else {
					readInto(localStream);
					localStream.pipe(outputStream, { end: false });
					finished(localStream, { writable: false }, (err) => err ? callback(err) : finalize());
				}
			};
			if (this.content._resolve) {
				const sourceStream = this._getStream(this.content);
				readInto(sourceStream);
				resolveStream(sourceStream, (err, value) => {
					if (err) return callback(err);
					if (returned) return;
					this.content._resolve = false;
					this.content._resolvedValue = value;
					setImmediate(createStream);
				});
			} else setImmediate(createStream);
		};
		if (this._raw) setImmediate(() => {
			if (aborted()) return;
			const rawError = this._takeStreamContent(this._raw);
			if (rawError) return callback(rawError);
			const raw = this._getStream(this._raw);
			readInto(raw);
			raw.pipe(outputStream, { end: false });
			finished(raw, { writable: false }, (err) => err ? callback(err) : finalize());
		});
		else {
			outputStream.write(this.buildHeaders() + "\r\n\r\n");
			setImmediate(sendContent);
		}
	}
	/**
	* Sets envelope to be used instead of the generated one
	*
	* @return SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
	*/
	setEnvelope(envelope) {
		let list;
		this._envelope = {
			from: false,
			to: []
		};
		if (envelope.from) {
			list = [];
			this._convertAddresses(this._parseEnvelopeAddresses(envelope.from), list);
			list = list.filter((address) => address && address.address);
			if (list.length && list[0]) this._envelope.from = list[0].address;
		}
		const seenRecipients = /* @__PURE__ */ new Set();
		const recipients = [];
		[
			"to",
			"cc",
			"bcc"
		].forEach((key) => {
			if (envelope[key]) this._convertAddresses(this._parseEnvelopeAddresses(envelope[key]), recipients, seenRecipients);
		});
		this._envelope.to = recipients.map((to) => to.address).filter((address) => address);
		const standardFields = [
			"to",
			"cc",
			"bcc",
			"from"
		];
		copyOwnKeys(this._envelope, envelope, (key) => standardFields.includes(key));
		return this;
	}
	/**
	* Generates and returns an object with parsed address fields
	*
	* @return Address object
	*/
	getAddresses() {
		const addresses = {};
		const seenByKey = /* @__PURE__ */ new Map();
		this._headers.forEach((header) => {
			const key = header.key.toLowerCase();
			if ([
				"from",
				"sender",
				"reply-to",
				"to",
				"cc",
				"bcc"
			].includes(key)) {
				if (!Array.isArray(addresses[key])) {
					addresses[key] = [];
					seenByKey.set(key, /* @__PURE__ */ new Set());
				}
				this._convertAddresses(this._parseAddresses(header.value), addresses[key], seenByKey.get(key));
			}
		});
		return addresses;
	}
	/**
	* Generates and returns SMTP envelope with the sender address and a list of recipients addresses
	*
	* @return SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
	*/
	getEnvelope() {
		if (this._envelope) return this._envelope;
		const envelope = {
			from: false,
			to: []
		};
		const seenRecipients = /* @__PURE__ */ new Set();
		const recipients = [];
		this._headers.forEach((header) => {
			const list = [];
			if (header.key === "From" || !envelope.from && ["Reply-To", "Sender"].includes(header.key)) {
				this._convertAddresses(this._parseAddresses(header.value), list);
				if (list.length && list[0]) envelope.from = list[0].address;
			} else if ([
				"To",
				"Cc",
				"Bcc"
			].includes(header.key)) this._convertAddresses(this._parseAddresses(header.value), recipients, seenRecipients);
		});
		envelope.to = recipients.map((to) => to.address);
		return envelope;
	}
	/**
	* Returns Message-Id value. If it does not exist, then creates one
	*
	* @return Message-Id value
	*/
	messageId() {
		let messageId = this.getHeader("Message-ID");
		if (!messageId) {
			messageId = this._generateMessageId();
			this.setHeader("Message-ID", messageId);
		}
		return messageId;
	}
	/**
	* Sets pregenerated content that will be used as the output of this node
	*
	* @param raw Raw MIME contents
	*/
	setRaw(raw) {
		this._raw = raw;
		if (this._raw && typeof this._raw.pipe === "function") recordStreamErrors(this._raw);
		return this;
	}
	/**
	* Checks an access policy flag for this node and every node above it. The flags are set
	* from the options the node was built with, and createChild only ever sees the options
	* the caller passed, so a child of a closed tree starts out open. Reading the answer off
	* the parent chain keeps it right whatever order the tree was assembled in.
	*
	* @param flag Either 'disableFileAccess' or 'disableUrlAccess'
	* @return true if this node or an ancestor closed that access
	* @internal
	*/
	_accessDisabled(flag) {
		let node = this;
		while (node) {
			if (node[flag]) return true;
			node = node.parentNode;
		}
		return false;
	}
	/**
	* Destroys the content streams of this node and of every node below it
	*
	* @internal
	*/
	_destroyContentStreams() {
		destroyStream(this.content);
		destroyStream(this._raw);
		for (const child of this.childNodes) child._destroyContentStreams();
	}
	/**
	* Checks that a content value can still be read before the node streams it. A stream is
	* refused once it errored, ended or was destroyed: piping it would either never finish or
	* produce an empty body without any error
	*
	* @param content Node content or raw value
	* @returns The error to stop with, or null when the content can be read
	* @internal
	*/
	_takeStreamContent(content) {
		if (Object.prototype.toString.call(content) === "[object Error]") return content;
		if (!content || typeof content.pipe !== "function" || content._resolvedValue) return null;
		return unreadableStreamError(content);
	}
	/**
	* Detects and returns handle to a stream related with the content.
	*
	* @param content Node content
	* @returns Stream object
	* @internal
	*/
	_getStream(content) {
		let contentStream;
		if (content._resolvedValue) {
			contentStream = new PassThrough();
			setImmediate(() => {
				try {
					contentStream.end(content._resolvedValue);
				} catch (_err) {
					contentStream.emit("error", _err);
				}
			});
			return contentStream;
		}
		if (typeof content.pipe === "function") return content;
		if (content && typeof content.path === "string" && !content.href) {
			if (this._accessDisabled("disableFileAccess")) {
				contentStream = new PassThrough();
				setImmediate(() => {
					const err = /* @__PURE__ */ new Error("File access rejected for " + content.path);
					err.code = EFILEACCESS;
					contentStream.emit("error", err);
				});
				return contentStream;
			}
			return fs.createReadStream(content.path);
		}
		if (content && typeof content.href === "string") {
			if (this._accessDisabled("disableUrlAccess")) {
				contentStream = new PassThrough();
				setImmediate(() => {
					const err = /* @__PURE__ */ new Error("Url access rejected for " + content.href);
					err.code = EURLACCESS;
					contentStream.emit("error", err);
				});
				return contentStream;
			}
			return nmfetch(content.href, {
				headers: content.httpHeaders,
				tls: content.tls
			});
		}
		contentStream = new PassThrough();
		setImmediate(() => {
			try {
				contentStream.end(content || "");
			} catch (_err) {
				contentStream.emit("error", _err);
			}
		});
		return contentStream;
	}
	/**
	* Parses addresses. Takes in a single address or an array or an
	* array of address arrays (eg. To: [[first group], [second group],...])
	*
	* @param addresses Addresses to be parsed
	* @return An array of address objects
	* @internal
	*/
	_parseAddresses(addresses) {
		const flattened = [];
		const seen = /* @__PURE__ */ new WeakSet();
		const stack = [];
		const enter = (list) => {
			if (!seen.has(list)) {
				seen.add(list);
				stack.push({
					list,
					pos: 0
				});
			}
		};
		enter(Array.isArray(addresses) ? addresses : [addresses]);
		while (stack.length) {
			const frame = stack[stack.length - 1];
			if (frame.pos >= frame.list.length) {
				stack.pop();
				continue;
			}
			const address = frame.list[frame.pos++];
			if (Array.isArray(address)) {
				enter(address);
				continue;
			}
			if (address && address.address) {
				const normalized = this._normalizeAddress(address.address);
				if (normalized === address.address && typeof address.name === "string") {
					flattened.push(address);
					continue;
				}
				const copy = copyOwnKeys({}, address);
				copy.address = normalized;
				copy.name = address.name || "";
				flattened.push(copy);
				continue;
			}
			const parsed = this._normalizeParsedAddresses(addressparser(address));
			for (let i = 0; i < parsed.length; i++) flattened.push(parsed[i]);
		}
		return flattened;
	}
	/**
	* Normalizes the addresses of a freshly parsed address list, groups included.
	*
	* Everything this method returns carries a normalized address, whether it arrived as an
	* object or was parsed out of a header value. Without this the two shapes disagree, and
	* a consumer reading the parsed form back is handed the ambiguous
	* 'user@evil.com@good.com' that the header and the envelope no longer carry.
	*
	* @param parsed An array of address objects, as returned by addressparser
	* @return The same array, with every address normalized
	* @internal
	*/
	_normalizeParsedAddresses(parsed) {
		parsed.forEach((entry) => {
			if (entry.address) entry.address = this._normalizeAddress(entry.address);
			else if (entry.group) this._normalizeParsedAddresses(entry.group);
		});
		return parsed;
	}
	/**
	* Parses the addresses of an explicitly set envelope.
	*
	* An envelope value is an addr-spec and never a display name, so a bare local username
	* such as 'root' is the address here. Header parsing has to read the same value as a
	* display name, as a value with no '@' in it can not be an addr-spec in a header.
	*
	* @param addresses Addresses to be parsed
	* @return An array of address objects
	* @internal
	*/
	_parseEnvelopeAddresses(addresses) {
		return this._parseAddresses(addresses).map((entry) => {
			if (entry.address || entry.group || !entry.name || /[\s@]/.test(entry.name)) return entry;
			return {
				address: this._normalizeAddress(entry.name),
				name: ""
			};
		});
	}
	/**
	* Normalizes a header key, uses Camel-Case form, except for uppercase MIME-
	*
	* @param key Key to be normalized
	* @return key in Camel-Case form
	* @internal
	*/
	_normalizeHeaderKey(key) {
		key = (key || "").toString().replace(/[\s\x00-\x20\x7f:]/g, "").toLowerCase().replace(/^X-SMTPAPI$|^(MIME|DKIM|ARC|BIMI)\b|^OTP(?=-Token$)|^[a-z]|-(SPF|FBL|ID|MD5)$|-[a-z]/gi, (c) => c.toUpperCase()).replace(/^Content-Features$/i, "Content-features");
		return key;
	}
	/**
	* Checks if the content type is multipart and defines boundary if needed.
	* Doesn't return anything, modifies object argument instead.
	*
	* @param structured Parsed header value for 'Content-Type' key
	* @internal
	*/
	_handleContentType(structured) {
		this.contentType = structured.value.trim().toLowerCase();
		this.multipart = /^multipart\//i.test(this.contentType) ? this.contentType.substr(this.contentType.indexOf("/") + 1) : false;
		if (this.multipart) {
			const declared = _stripBoundaryControls(structured.params.boundary || this.boundary || "");
			this.boundary = structured.params.boundary = declared || _stripBoundaryControls(this._generateBoundary());
		} else this.boundary = false;
	}
	/**
	* Generates a multipart boundary value
	*
	* @return boundary value
	* @internal
	*/
	_generateBoundary() {
		return _stripBoundaryControls(this.rootNode.boundaryPrefix + "-" + this.rootNode.baseBoundary) + "-Part_" + this._nodeId;
	}
	/**
	* Encodes a header value the way this node encodes it in the generated message:
	* address headers are punycoded and mime encoded, message id headers get their
	* angle brackets, a Date object is formatted and any other value is mime encoded
	* when it holds non-ascii or control characters (using the node's `textEncoding`).
	*
	* The result is a single unfolded line without the key. Fold it before writing it
	* into a message, `key + ': ' + value` folded at 76 characters is what the node does.
	*
	* @param key Header key, case insensitive
	* @param value Header value
	* @returns Encoded header value
	*/
	encodeHeaderValue(key, value) {
		key = this._normalizeHeaderKey(key);
		switch (key) {
			case "From":
			case "Sender":
			case "To":
			case "Cc":
			case "Bcc":
			case "Reply-To": return this._convertAddresses(this._parseAddresses(value));
			case "Message-ID":
			case "In-Reply-To":
			case "Content-ID":
				value = (value || "").toString().replace(/\r?\n|\r/g, " ").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
				if (value.charAt(0) !== "<") value = "<" + value;
				if (value.charAt(value.length - 1) !== ">") value = value + ">";
				return value;
			case "OTP-Token": return (value || "").toString().replace(/\r?\n|\r/g, " ").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
			case "References": {
				const ids = [];
				for (const entry of [].concat(value || "")) {
					const elm = (entry || "").toString().replace(/\r?\n|\r/g, " ").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim();
					for (let id of stripWhitespaceInAngleBrackets(elm).split(/\s+/)) {
						if (id.charAt(0) !== "<") id = "<" + id;
						if (id.charAt(id.length - 1) !== ">") id = id + ">";
						ids.push(id);
					}
				}
				return ids.join(" ").trim();
			}
			case "Date":
				if (Object.prototype.toString.call(value) === "[object Date]") return value.toUTCString().replace(/GMT/, "+0000");
				value = (value || "").toString().replace(/\r?\n|\r/g, " ");
				return this._encodeHeaderText(value);
			case "Content-Type":
			case "Content-Disposition": return (value || "").toString().replace(/\r?\n|\r/g, " ");
			default:
				value = (value || "").toString().replace(/\r?\n|\r/g, " ");
				return this._encodeHeaderText(value);
		}
	}
	/**
	* Encodes a header value without a node at hand. Same as the instance method of a
	* node created with the given options.
	*
	* @param key Header key, case insensitive
	* @param value Header value
	* @param [options] Encoding options
	* @param [options.textEncoding] either 'Q' (the default) or 'B'
	* @returns Encoded header value
	*/
	static encodeHeaderValue(key, value, options) {
		return new MimeNode(false, { textEncoding: options?.textEncoding }).encodeHeaderValue(key, value);
	}
	/**
	* Alias of encodeHeaderValue, kept for callers that used the method before it was public
	*
	* @internal
	*/
	_encodeHeaderValue(key, value) {
		return this.encodeHeaderValue(key, value);
	}
	/**
	* Rebuilds address object using punycode and other adjustments
	*
	* @param addresses An array of address objects
	* @param [uniqueList] An array to be populated with addresses
	* @param [seenAddresses] Addresses already added to uniqueList, shared with recursive calls to keep deduplication linear
	* @return address string
	* @internal
	*/
	_convertAddresses(addresses, uniqueList, seenAddresses) {
		const values = [];
		uniqueList = uniqueList || [];
		if (!seenAddresses) {
			seenAddresses = /* @__PURE__ */ new Set();
			for (let i = 0; i < uniqueList.length; i++) seenAddresses.add(uniqueList[i].address);
		}
		[].concat(addresses || []).forEach((address) => {
			if (address.address) {
				address.address = this._normalizeAddress(address.address);
				if (!address.name) values.push(PLAIN_ADDRESS.test(address.address) ? address.address : `<${address.address}>`);
				else values.push(`${this._encodeAddressName(address.name)} <${address.address}>`);
				if (!seenAddresses.has(address.address)) {
					seenAddresses.add(address.address);
					uniqueList.push(address);
				}
			} else if (address.group) {
				const groupListAddresses = (address.group.length ? this._convertAddresses(address.group, uniqueList, seenAddresses) : "").trim();
				values.push(`${this._encodeAddressName(address.name)}:${groupListAddresses};`);
			}
		});
		return values.join(", ");
	}
	/**
	* Normalizes an email address
	*
	* @param address An array of address objects
	* @return address string
	* @internal
	*/
	_normalizeAddress(address) {
		address = (address || "").toString().replace(/[\x00-\x1F\x7F<>]+/g, " ").trim();
		if (!address) return address;
		const literal = address.charAt(address.length - 1) === "]" ? DOMAIN_LITERAL_TAIL.exec(address) : null;
		const lastAt = literal ? address.length - literal[1].length - 1 : address.lastIndexOf("@");
		if (lastAt < 0) return this._normalizeLocalPart(address);
		const user = address.substr(0, lastAt);
		const domain = address.substr(lastAt + 1);
		let encodedDomain = domain;
		const smtputf8 = /[\x80-\uFFFF]/.test(user);
		try {
			encodedDomain = normalizeDomain(domain, smtputf8);
		} catch (_err) {}
		return `${this._normalizeLocalPart(user)}@${encodedDomain}`;
	}
	/**
	* Normalizes the local part of an address into a form that can be emitted as is.
	*
	* A local part is either a dot-atom or a quoted-string, anything else is not a valid
	* addr-spec. The quotes of a quoted local part get lost along the way, and a bare
	* 'user@evil.com@good.com' leaves it to the receiver which '@' splits the domain off,
	* while the split here is always at the last one. So whatever is not already one of
	* the two valid forms goes back out as a quoted-string.
	*
	* @param user Local part of an address
	* @return Local part as a dot-atom or as a quoted-string
	* @internal
	*/
	_normalizeLocalPart(user) {
		if (DOT_ATOM.test(user) || QUOTED_STRING.test(user)) return user;
		return quoteString(user);
	}
	/**
	* If needed, mime encodes the name part
	*
	* @param name Name part of an address
	* @returns Mime word encoded string if needed
	* @internal
	*/
	_encodeAddressName(name) {
		if (!/^[\w ]*$/.test(name)) {
			if (/^[\x20-\x7e]*$/.test(name)) return quoteString(name);
			else return encodeWord(name, this._getTextEncoding(name), 52);
		}
		return name;
	}
	/**
	* Encodes an unstructured header value. Such a value can only carry VCHAR and WSP, so a
	* control char or DEL has to be forced into the mime encoded word that a non-ascii value
	* would get anyway. HT stays as it is, it is valid folding whitespace here.
	*
	* @param value Header value to encode
	* @returns Mime word encoded string if needed
	* @internal
	*/
	_encodeHeaderText(value) {
		return /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value) ? encodeWord(value, this._getTextEncoding(value), 52) : this._encodeWords(value);
	}
	/**
	* If needed, mime encodes the name part
	*
	* @param value Name part of an address
	* @returns Mime word encoded string if needed
	* @internal
	*/
	_encodeWords(value) {
		return encodeWords(value, this._getTextEncoding(value), 52, true);
	}
	/**
	* Detects best mime encoding for a text value
	*
	* @param value Value to check for
	* @return either 'Q' or 'B'
	* @internal
	*/
	_getTextEncoding(value) {
		value = (value || "").toString();
		if (this.textEncoding) return this.textEncoding;
		let nonLatinLen = 0;
		let latinLen = 0;
		for (let i = 0, len = value.length; i < len; i++) {
			const code = value.charCodeAt(i);
			if (code >= 0 && code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31 || code >= 128) nonLatinLen++;
			else if (code >= 65 && code <= 90 || code >= 97 && code <= 122) latinLen++;
		}
		return nonLatinLen < latinLen ? "Q" : "B";
	}
	/**
	* Generates a message id
	*
	* @return Random Message-ID value
	* @internal
	*/
	_generateMessageId() {
		return "<" + [
			2,
			2,
			2,
			6
		].reduce((prev, len) => prev + "-" + crypto.randomBytes(len).toString("hex"), crypto.randomBytes(4).toString("hex")) + "@" + (this.getEnvelope().from || this.hostname || "localhost").split("@").pop() + ">";
	}
};
// node_modules/nodemailer/dist/esm/mail-composer/index.js
/**
* Creates the object for composing a MimeNode instance out from the mail options
*
* @constructor
* @param mail Mail options
*/
/**
* Tells whether a content value is a content descriptor object (something to load or to
* use as is) rather than the content itself
*/
function isContentObject(value) {
	const content = value;
	return typeof value === "object" && !!(content.content || content.path || content.href || content.raw);
}
/**
* Tells whether attachment content is a string or a Buffer that 7bit can describe: ASCII
* only, no NUL and no line over the 998 octets of RFC 5322. Anything else, a stream or a
* file path included, can not be checked here
*/
function fitsSevenBit(content) {
	let at;
	let length;
	if (typeof content === "string") {
		at = (i) => content.charCodeAt(i);
		length = content.length;
	} else if (Buffer.isBuffer(content)) {
		at = (i) => content[i];
		length = content.length;
	} else return false;
	let lineLength = 0;
	for (let i = 0; i < length; i++) {
		const c = at(i);
		if (c === 0 || c > 127) return false;
		if (c === 10 || c === 13) lineLength = 0;
		else if (++lineLength > 998) return false;
	}
	return true;
}
var MailComposer = class {
	constructor(mail) {
		this.mail = mail || {};
		this.message = false;
	}
	/**
	* Builds MimeNode instance
	*/
	compile() {
		this._alternatives = this.getAlternatives();
		this._htmlNode = this._alternatives.filter((alternative) => /^text\/html\b/i.test(alternative.contentType)).pop();
		this._attachments = this.getAttachments(!!this._htmlNode);
		this._useRelated = !!(this._htmlNode && this._attachments.related.length);
		this._useAlternative = this._alternatives.length > 1;
		this._useMixed = this._attachments.attached.length > 1 || this._alternatives.length && this._attachments.attached.length === 1;
		if (this.mail.raw) this.message = new MimeNode("message/rfc822", {
			newline: this.mail.newline,
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess
		}).setRaw(this.mail.raw);
		else if (this._useMixed) this.message = this._createMixed();
		else if (this._useAlternative) this.message = this._createAlternative();
		else if (this._useRelated) this.message = this._createRelated();
		else this.message = this._createContentNode(false, [].concat(this._alternatives || []).concat(this._attachments.attached || []).shift() || {
			contentType: "text/plain",
			content: ""
		});
		if (this.mail.headers) this.message.addHeader(this.mail.headers);
		if (this.mail.otp) this.message.setHeader("OTP-Token", formatOtpToken(this.mail.otp));
		[
			"from",
			"sender",
			"to",
			"cc",
			"bcc",
			"reply-to",
			"in-reply-to",
			"references",
			"subject",
			"message-id",
			"date"
		].forEach((header) => {
			const key = header.replace(/-(\w)/g, (o, c) => c.toUpperCase());
			if (this.mail[key]) this.message.setHeader(header, this.mail[key]);
		});
		if (this.mail.envelope) this.message.setEnvelope(this.mail.envelope);
		this.message.messageId();
		return this.message;
	}
	/**
	* List all attachments. Resulting attachment objects can be used as input for MimeNode nodes
	*
	* @param findRelated If true separate related attachments from attached ones
	* @returns An object of arrays (`related` and `attached`)
	*/
	getAttachments(findRelated) {
		let eventObject;
		const attachments = [].concat(this.mail.attachments || []).map((attachment, i) => {
			if (/^data:/i.test(attachment.path || attachment.href)) attachment = this._processDataUrl(attachment);
			const contentType = attachment.contentType || detectMimeType(attachment.filename || attachment.path || attachment.href || "bin");
			const isImage = /^image\//i.test(contentType);
			const isMessageNode = /^message\//i.test(contentType);
			const contentDisposition = attachment.contentDisposition || (isMessageNode || isImage && attachment.cid ? "inline" : "attachment");
			let contentTransferEncoding;
			if ("contentTransferEncoding" in attachment) contentTransferEncoding = attachment.contentTransferEncoding;
			else if (isMessageNode) contentTransferEncoding = !attachment.encoding && fitsSevenBit(attachment.content) ? "7bit" : "8bit";
			else contentTransferEncoding = "base64";
			const data = {
				contentType,
				contentDisposition,
				contentTransferEncoding
			};
			if (attachment.filename) data.filename = attachment.filename;
			else if (!isMessageNode && attachment.filename !== false) {
				data.filename = (attachment.path || attachment.href || "").split(/[/\\]/).pop().split("?").shift() || "attachment-" + (i + 1);
				if (data.filename.indexOf(".") < 0) data.filename += "." + detectExtension(data.contentType);
			}
			if (/^https?:\/\//i.test(attachment.path)) {
				attachment.href = attachment.path;
				attachment.path = void 0;
			}
			if (attachment.cid) data.cid = attachment.cid;
			if (attachment.raw) data.raw = attachment.raw;
			else if (attachment.path) data.content = { path: attachment.path };
			else if (attachment.href) data.content = {
				href: attachment.href,
				httpHeaders: attachment.httpHeaders,
				tls: attachment.tls
			};
			else data.content = attachment.content || "";
			if (attachment.encoding) data.encoding = attachment.encoding;
			if (attachment.headers) data.headers = attachment.headers;
			return data;
		});
		if (this.mail.icalEvent) {
			eventObject = Object.assign({}, this._getIcalEvent());
			eventObject.contentType = "application/ics";
			if (!eventObject.headers) eventObject.headers = {};
			eventObject.filename = eventObject.filename || "invite.ics";
			eventObject.headers["Content-Disposition"] = "attachment";
			eventObject.headers["Content-Transfer-Encoding"] = "base64";
		}
		if (!findRelated) return {
			attached: attachments.concat(eventObject || []),
			related: []
		};
		return {
			attached: attachments.filter((attachment) => !attachment.cid).concat(eventObject || []),
			related: attachments.filter((attachment) => !!attachment.cid)
		};
	}
	/**
	* Returns the icalEvent value with `path`/`href`/data uri input normalized into
	* a `content` entry, the same way as for regular attachments. The same event is
	* included twice (as a text/calendar alternative and as an application/ics
	* attachment), so the shared content object is marked to be resolved just once
	* and the buffered result is reused by the second node.
	*
	* @returns Normalized icalEvent data
	* @internal
	*/
	_getIcalEvent() {
		if (!this._icalEvent) {
			let icalEvent;
			if (isContentObject(this.mail.icalEvent)) icalEvent = copyOwnKeys({}, this.mail.icalEvent);
			else icalEvent = { content: this.mail.icalEvent };
			if (/^data:/i.test(icalEvent.path || icalEvent.href)) icalEvent = this._processDataUrl(icalEvent);
			if (/^https?:\/\//i.test(icalEvent.path)) {
				icalEvent.href = icalEvent.path;
				icalEvent.path = void 0;
			}
			if (!icalEvent.raw) {
				if (icalEvent.path) {
					icalEvent.content = { path: icalEvent.path };
					icalEvent.path = void 0;
				} else if (icalEvent.href) {
					icalEvent.content = {
						href: icalEvent.href,
						httpHeaders: icalEvent.httpHeaders,
						tls: icalEvent.tls
					};
					icalEvent.href = void 0;
				}
			}
			if (icalEvent.content && typeof icalEvent.content === "object") icalEvent.content._resolve = true;
			this._icalEvent = icalEvent;
		}
		return this._icalEvent;
	}
	/**
	* List alternatives. Resulting objects can be used as input for MimeNode nodes
	*
	* @returns An array of alternative elements. Includes the `text` and `html` values as well
	*/
	getAlternatives() {
		const alternatives = [];
		let text, html, watchHtml, amp, eventObject;
		if (this.mail.text) {
			if (isContentObject(this.mail.text)) text = this.mail.text;
			else text = { content: this.mail.text };
			text.contentType = "text/plain; charset=utf-8";
		}
		if (this.mail.watchHtml) {
			if (isContentObject(this.mail.watchHtml)) watchHtml = this.mail.watchHtml;
			else watchHtml = { content: this.mail.watchHtml };
			watchHtml.contentType = "text/watch-html; charset=utf-8";
		}
		if (this.mail.amp) {
			if (isContentObject(this.mail.amp)) amp = this.mail.amp;
			else amp = { content: this.mail.amp };
			amp.contentType = "text/x-amp-html; charset=utf-8";
		}
		if (this.mail.icalEvent) {
			eventObject = Object.assign({}, this._getIcalEvent());
			eventObject.filename = false;
			eventObject.contentType = "text/calendar; charset=utf-8; method=" + (eventObject.method || "PUBLISH").toString().trim().toUpperCase();
			if (!eventObject.headers) eventObject.headers = {};
		}
		if (this.mail.html) {
			if (isContentObject(this.mail.html)) html = this.mail.html;
			else html = { content: this.mail.html };
			html.contentType = "text/html; charset=utf-8";
		}
		[].concat(text || []).concat(watchHtml || []).concat(amp || []).concat(html || []).concat(eventObject || []).concat(this.mail.alternatives || []).forEach((alternative) => {
			if (/^data:/i.test(alternative.path || alternative.href)) alternative = this._processDataUrl(alternative);
			const data = {
				contentType: alternative.contentType || detectMimeType(alternative.filename || alternative.path || alternative.href || "txt"),
				contentTransferEncoding: alternative.contentTransferEncoding
			};
			if (alternative.filename) data.filename = alternative.filename;
			if (/^https?:\/\//i.test(alternative.path)) {
				alternative.href = alternative.path;
				alternative.path = void 0;
			}
			if (alternative.raw) data.raw = alternative.raw;
			else if (alternative.path) data.content = { path: alternative.path };
			else if (alternative.href) data.content = {
				href: alternative.href,
				httpHeaders: alternative.httpHeaders,
				tls: alternative.tls
			};
			else data.content = alternative.content || "";
			if (alternative.encoding) data.encoding = alternative.encoding;
			if (alternative.headers) data.headers = alternative.headers;
			alternatives.push(data);
		});
		return alternatives;
	}
	/**
	* Builds multipart/mixed node. It should always contain different type of elements on the same level
	* eg. text + attachments
	*
	* @param parentNode Parent for this note. If it does not exist, a root node is created
	* @returns MimeNode node element
	* @internal
	*/
	_createMixed(parentNode) {
		const node = parentNode ? parentNode.createChild("multipart/mixed", {
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		}) : new MimeNode("multipart/mixed", {
			baseBoundary: this.mail.baseBoundary,
			textEncoding: this.mail.textEncoding,
			boundaryPrefix: this.mail.boundaryPrefix,
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		});
		if (this._useAlternative) this._createAlternative(node);
		else if (this._useRelated) this._createRelated(node);
		[].concat(!this._useAlternative && this._alternatives || []).concat(this._attachments.attached || []).forEach((element) => {
			if (!this._useRelated || element !== this._htmlNode) this._createContentNode(node, element);
		});
		return node;
	}
	/**
	* Builds multipart/alternative node. It should always contain same type of elements on the same level
	* eg. text + html view of the same data
	*
	* @param parentNode Parent for this note. If it does not exist, a root node is created
	* @returns MimeNode node element
	* @internal
	*/
	_createAlternative(parentNode) {
		const node = parentNode ? parentNode.createChild("multipart/alternative", {
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		}) : new MimeNode("multipart/alternative", {
			baseBoundary: this.mail.baseBoundary,
			textEncoding: this.mail.textEncoding,
			boundaryPrefix: this.mail.boundaryPrefix,
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		});
		this._alternatives.forEach((alternative) => {
			if (this._useRelated && this._htmlNode === alternative) this._createRelated(node);
			else this._createContentNode(node, alternative);
		});
		return node;
	}
	/**
	* Builds multipart/related node. It should always contain html node with related attachments
	*
	* @param parentNode Parent for this note. If it does not exist, a root node is created
	* @returns MimeNode node element
	* @internal
	*/
	_createRelated(parentNode) {
		const node = parentNode ? parentNode.createChild("multipart/related; type=\"text/html\"", {
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		}) : new MimeNode("multipart/related; type=\"text/html\"", {
			baseBoundary: this.mail.baseBoundary,
			textEncoding: this.mail.textEncoding,
			boundaryPrefix: this.mail.boundaryPrefix,
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		});
		this._createContentNode(node, this._htmlNode);
		this._attachments.related.forEach((alternative) => this._createContentNode(node, alternative));
		return node;
	}
	/**
	* Creates a regular node with contents
	*
	* @param parentNode Parent for this note. If it does not exist, a root node is created
	* @param element Node data
	* @returns MimeNode node element
	* @internal
	*/
	_createContentNode(parentNode, element) {
		element = element || {};
		element.content = element.content || "";
		const encoding = (element.encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
		const node = parentNode ? parentNode.createChild(element.contentType, {
			filename: element.filename,
			textEncoding: this.mail.textEncoding,
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		}) : new MimeNode(element.contentType, {
			filename: element.filename,
			baseBoundary: this.mail.baseBoundary,
			textEncoding: this.mail.textEncoding,
			boundaryPrefix: this.mail.boundaryPrefix,
			disableUrlAccess: this.mail.disableUrlAccess,
			disableFileAccess: this.mail.disableFileAccess,
			normalizeHeaderKey: this.mail.normalizeHeaderKey,
			newline: this.mail.newline
		});
		if (element.headers) node.addHeader(element.headers);
		if (element.cid) node.setHeader("Content-Id", "<" + element.cid.replace(/[<>]/g, "") + ">");
		if (element.contentTransferEncoding) node.setHeader("Content-Transfer-Encoding", element.contentTransferEncoding);
		else if (this.mail.encoding && /^text\//i.test(element.contentType)) node.setHeader("Content-Transfer-Encoding", this.mail.encoding);
		if (!/^text\//i.test(element.contentType) || element.contentDisposition) node.setHeader("Content-Disposition", element.contentDisposition || (element.cid && /^image\//i.test(element.contentType) ? "inline" : "attachment"));
		if (typeof element.content === "string" && ![
			"utf8",
			"usascii",
			"ascii"
		].includes(encoding)) element.content = Buffer.from(element.content, encoding);
		if (element.raw) node.setRaw(element.raw);
		else node.setContent(element.content);
		return node;
	}
	/**
	* Parses data uri and converts it to a Buffer
	*
	* @param element Content element
	* @return Parsed element
	* @internal
	*/
	_processDataUrl(element) {
		const dataUrl = element.path || element.href;
		if (!dataUrl || typeof dataUrl !== "string") return element;
		if (!dataUrl.startsWith("data:")) return element;
		if (dataUrl.length > 52428800) {
			let detectedType = "application/octet-stream";
			const commaPos = dataUrl.indexOf(",");
			if (commaPos > 0 && commaPos < 200) {
				const parts = dataUrl.substring(5, commaPos).split(";");
				if (parts[0] && parts[0].includes("/")) detectedType = parts[0].trim();
			}
			return Object.assign(copyOwnKeys({}, element), {
				path: false,
				href: false,
				content: Buffer.alloc(0),
				contentType: element.contentType || detectedType
			});
		}
		let parsedDataUri;
		try {
			parsedDataUri = parseDataURI(dataUrl);
		} catch (_err) {
			return element;
		}
		if (!parsedDataUri) return element;
		element.content = parsedDataUri.data;
		element.contentType = element.contentType || parsedDataUri.contentType;
		if ("path" in element) element.path = false;
		if ("href" in element) element.href = false;
		return element;
	}
};
/**
* Returns the value of the OTP-Token header for the otp option. The header is defined by
* draft-goto-otp-token-01, an Internet-Draft that expires on 25 March 2027. By then check
* for a newer revision of the draft or a published RFC, the header name and its
* parameters are still open questions in the draft.
*/
function formatOtpToken(otp) {
	if (typeof otp.code !== "string" || !/^[\x20-\x7e]+$/.test(otp.code)) throw otpError("The otp code must be a non-empty string of printable ASCII characters");
	return quoteString(otp.code) + "; origin=" + quoteString(getOtpOrigin(otp.origin));
}
/**
* Returns the canonical ascii serialization of the origin the code is bound to. The draft
* requires a potentially trustworthy origin, so only https is accepted, plus http on a
* loopback host for local development
*/
function getOtpOrigin(origin) {
	let url;
	try {
		url = new URL(String(origin));
	} catch {}
	if (!url || url.username || url.password || !/^([a-z0-9_-]+\.)*[a-z0-9_-]+$|^\[[0-9a-f:.]+\]$/.test(url.hostname)) throw otpError("The otp origin must be an absolute https URL");
	const isLoopback = /^(localhost|.+\.localhost|127(\.\d+){3}|\[::1\])$/.test(url.hostname);
	if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) throw otpError("The otp origin must be an https URL, or an http URL on a loopback host");
	return url.origin;
}
function otpError(message) {
	const err = new Error(message);
	err.code = EOTP;
	return err;
}
// node_modules/nodemailer/dist/esm/dkim/message-parser.js
/**
* Drops the SP and HTAB from both ends of a field name.
*
* An index scan rather than `/^[ \t]+|[ \t]+$/g`, which retries the trailing branch at
* every offset of a blank run that is followed by other text: the run is consumed greedily,
* `$` fails, and the engine gives the characters back one at a time before moving on to
* start the same walk one offset further in. A field name carrying a 128 KiB run of spaces
* between two atoms took about 6.7 seconds to trim, and the cost grows with its square.
*
* Not `.trim()`, which takes the other Unicode spaces along: an NBSP in front of a field
* name would come off and select the name into the signed set, where the relaxed
* canonicalization in sign.ts deliberately leaves everything but SP and HTAB alone.
*
* @param str Field name to trim
* @return The field name without the surrounding SP and HTAB
*/
function _trimFieldName(str) {
	let start = 0;
	let end = str.length;
	while (start < end && (str.charCodeAt(start) === 32 || str.charCodeAt(start) === 9)) start++;
	while (end > start && (str.charCodeAt(end - 1) === 32 || str.charCodeAt(end - 1) === 9)) end--;
	return str.slice(start, end);
}
/**
* MessageParser instance is a transform stream that separates message headers
* from the rest of the body. Headers are emitted with the 'headers' event. Message
* body is passed on as the resulting stream.
*/
var MessageParser = class extends Transform {
	constructor(options) {
		super(options);
		this.lastBytes = Buffer.alloc(4);
		this.headersParsed = false;
		this.headerBytes = 0;
		this.headerChunks = [];
		this.rawHeaders = false;
		this.bodySize = 0;
	}
	/**
	* Keeps count of the last 4 bytes in order to detect line breaks on chunk boundaries
	*
	* @param data Next data chunk from the stream
	*/
	updateLastBytes(data) {
		const lblen = this.lastBytes.length;
		const nblen = Math.min(data.length, lblen);
		for (let i = 0, len = lblen - nblen; i < len; i++) this.lastBytes[i] = this.lastBytes[i + nblen];
		for (let i = 1; i <= nblen; i++) this.lastBytes[lblen - i] = data[data.length - i];
	}
	/**
	* Finds and removes message headers from the remaining body. We want to keep
	* headers separated until final delivery to be able to modify these
	*
	* @param data Next chunk of data
	* @return Returns true if headers are already found or false otherwise
	*/
	checkHeaders(data) {
		if (this.headersParsed) return true;
		const lblen = this.lastBytes.length;
		let headerPos = 0;
		for (let i = 0, len = this.lastBytes.length + data.length; i < len; i++) {
			let chr;
			if (i < lblen) chr = this.lastBytes[i];
			else chr = data[i - lblen];
			if (chr === 10 && i) {
				const pr1 = i - 1 < lblen ? this.lastBytes[i - 1] : data[i - 1 - lblen];
				const pr2 = i > 1 ? i - 2 < lblen ? this.lastBytes[i - 2] : data[i - 2 - lblen] : false;
				if (pr1 === 10) {
					this.headersParsed = true;
					headerPos = i - lblen + 1;
					this.headerBytes += headerPos;
					break;
				} else if (pr1 === 13 && pr2 === 10) {
					this.headersParsed = true;
					headerPos = i - lblen + 1;
					this.headerBytes += headerPos;
					break;
				}
			}
		}
		if (this.headersParsed) {
			this.headerChunks.push(data.slice(0, headerPos));
			this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes);
			this.headerChunks = null;
			this.emit("headers", this.parseHeaders());
			if (data.length > headerPos) {
				const chunk = data.slice(headerPos);
				this.bodySize += chunk.length;
				this.push(chunk);
			}
			return false;
		}
		this.headerBytes += data.length;
		this.headerChunks.push(data);
		this.updateLastBytes(data);
		return false;
	}
	/** @internal */
	_transform(chunk, encoding, callback) {
		if (!chunk || !chunk.length) return callback();
		if (typeof chunk === "string") chunk = Buffer.from(chunk, encoding);
		let headersFound;
		try {
			headersFound = this.checkHeaders(chunk);
		} catch (E) {
			return callback(E);
		}
		if (headersFound) {
			this.bodySize += chunk.length;
			this.push(chunk);
		}
		callback();
	}
	/** @internal */
	_flush(callback) {
		if (this.headerChunks) {
			this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes);
			this.headerChunks = null;
			this.emit("headers", this.parseHeaders());
		}
		callback();
	}
	parseHeaders() {
		const rawLines = (this.rawHeaders || Buffer.alloc(0)).toString("binary").split(/\r?\n/);
		const lines = [];
		for (const rawLine of rawLines) if (lines.length && /^[ \t]/.test(rawLine)) lines[lines.length - 1] += "\n" + rawLine;
		else lines.push(rawLine);
		return lines.filter((line) => /[^ \t\r]/.test(line)).map((line) => ({
			key: _trimFieldName(line.substr(0, line.indexOf(":"))).toLowerCase(),
			line
		}));
	}
};
// node_modules/nodemailer/dist/esm/dkim/relaxed-body.js
const CHAR_CR = 13;
const CHAR_LF = 10;
const CHAR_SPACE = 32;
const CHAR_TAB = 9;
const CRLF = Buffer.from("\r\n");
const EMPTY_LINES = Buffer.alloc(4096, CRLF);
/**
* Passes the message body through unchanged and hashes its relaxed
* canonicalization (RFC 6376 section 3.4.4) on the side: whitespace at the end
* of a line is dropped, runs of whitespace within a line become a single space,
* every line ends with CRLF, empty lines at the end of the body are ignored and
* a non-empty body always ends with CRLF. Bytes are canonicalized as they arrive,
* so a line of any length costs constant memory.
*/
var RelaxedBody = class extends Transform {
	constructor(options) {
		super();
		options = options || {};
		this.bodyHash = crypto.createHash(options.hashAlgo || "sha256");
		this.byteLength = 0;
		this.debug = options.debug;
		this._debugBody = options.debug ? [] : false;
		this._lineHasContent = false;
		this._pendingWsp = false;
		this._pendingCr = false;
		this._pendingEmptyLines = 0;
	}
	/** @internal */
	_hashCanonical(data) {
		if (!data.length) return;
		this.bodyHash.update(data);
		if (this._debugBody) this._debugBody.push(Buffer.from(data));
	}
	/** @internal */
	_hashEmptyLines() {
		while (this._pendingEmptyLines > 0) {
			const count = Math.min(this._pendingEmptyLines, EMPTY_LINES.length / 2);
			this._hashCanonical(EMPTY_LINES.subarray(0, count * 2));
			this._pendingEmptyLines -= count;
		}
	}
	/**
	* Writes a content byte, with the space a pending run of whitespace collapses to,
	* into the output buffer and returns the new write position. Kept a method rather
	* than a closure so the write position stays a plain local in the byte loop
	* @internal
	*/
	_emitContent(out, outPos, c) {
		if (!this._lineHasContent) {
			if (this._pendingEmptyLines) {
				this._hashCanonical(out.subarray(0, outPos));
				outPos = 0;
				this._hashEmptyLines();
			}
			this._lineHasContent = true;
		}
		if (this._pendingWsp) {
			out[outPos++] = CHAR_SPACE;
			this._pendingWsp = false;
		}
		out[outPos++] = c;
		return outPos;
	}
	updateHash(chunk, final) {
		const out = Buffer.allocUnsafe(chunk.length * 2 + 2);
		let outPos = 0;
		for (let i = 0; i < chunk.length; i++) {
			const c = chunk[i];
			if (c === CHAR_LF) {
				if (this._lineHasContent) {
					out[outPos++] = CHAR_CR;
					out[outPos++] = CHAR_LF;
					this._lineHasContent = false;
				} else this._pendingEmptyLines++;
				this._pendingWsp = false;
				this._pendingCr = false;
				continue;
			}
			if (this._pendingCr) {
				outPos = this._emitContent(out, outPos, CHAR_CR);
				this._pendingCr = false;
			}
			if (c === CHAR_CR) this._pendingCr = true;
			else if (c === CHAR_SPACE || c === CHAR_TAB) this._pendingWsp = true;
			else outPos = this._emitContent(out, outPos, c);
		}
		if (final && this._pendingCr) {
			outPos = this._emitContent(out, outPos, CHAR_CR);
			this._pendingCr = false;
		}
		this._hashCanonical(out.subarray(0, outPos));
	}
	/** @internal */
	_transform(chunk, encoding, callback) {
		if (!chunk || !chunk.length) return callback();
		if (typeof chunk === "string") chunk = Buffer.from(chunk, encoding);
		this.updateHash(chunk);
		this.byteLength += chunk.length;
		this.push(chunk);
		callback();
	}
	/** @internal */
	_flush(callback) {
		this.updateHash(Buffer.alloc(0), true);
		if (this._lineHasContent) this._hashCanonical(CRLF);
		this.emit("hash", this.bodyHash.digest("base64"), this.debug ? Buffer.concat(this._debugBody) : false);
		callback();
	}
};
// node_modules/nodemailer/dist/esm/dkim/sign.js
/**
* Error for a hashAlgo value the crypto module does not know
*/
function unsupportedHashAlgoError(hashAlgo) {
	const err = /* @__PURE__ */ new Error("Unsupported DKIM hash algorithm \"" + hashAlgo + "\"");
	err.code = ECONFIG;
	return err;
}
/**
* Returns DKIM signature header line
*
* @param headers Parsed headers object from MessageParser
* @param hashAlgo Hash algorithm the body hash was calculated with, for example "sha256"
* @param bodyHash Base64 encoded hash of the message
* @param options DKIM options
* @param options.domainName Domain name to be signed for
* @param options.keySelector DKIM key selector to use
* @param options.privateKey DKIM private key to use
* @return Complete header line
*/
function sign(headers, hashAlgo, bodyHash, options) {
	options = options || {};
	const canonicalizedHeaderData = relaxedHeaders(headers, options.headerFieldNames || "From:Sender:Reply-To:Subject:Date:Message-ID:To:Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:Content-Description:Resent-Date:Resent-From:Resent-Sender:Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:List-Id:List-Help:List-Unsubscribe:List-Unsubscribe-Post:List-Subscribe:List-Post:List-Owner:List-Archive:OTP-Token", options.skipFields);
	const dkimHeader = generateDKIMHeader(options.domainName, options.keySelector, canonicalizedHeaderData.fieldNames, hashAlgo, bodyHash);
	canonicalizedHeaderData.headers += "dkim-signature:" + relaxedHeaderLine(dkimHeader);
	let signer;
	try {
		signer = crypto.createSign(("rsa-" + hashAlgo).toUpperCase());
	} catch (_E) {
		throw unsupportedHashAlgoError(hashAlgo);
	}
	signer.update(canonicalizedHeaderData.headers, "latin1");
	let signature;
	try {
		signature = signer.sign(options.privateKey, "base64");
	} catch (_E) {
		return false;
	}
	return dkimHeader + signature.replace(/(^.{73}|.{75}(?!\r?\n|\r))/g, "$&\r\n ").trim();
}
sign.relaxedHeaders = relaxedHeaders;
sign.unsupportedHashAlgoError = unsupportedHashAlgoError;
function generateDKIMHeader(domainName, keySelector, fieldNames, hashAlgo, bodyHash) {
	const cleanTagValue = (value) => (value || "").toString().replace(/[\x00-\x1f\x7f;=]/g, "");
	return foldLines("DKIM-Signature: " + [
		"v=1",
		"a=rsa-" + hashAlgo,
		"c=relaxed/relaxed",
		"d=" + normalizeDomain(cleanTagValue(domainName), false),
		"q=dns/txt",
		"s=" + cleanTagValue(keySelector),
		"bh=" + bodyHash,
		"h=" + cleanTagValue(fieldNames)
	].join("; "), 76) + ";\r\n b=";
}
function relaxedHeaders(headers, fieldNames, skipFields) {
	const includedFields = /* @__PURE__ */ new Set();
	const skip = /* @__PURE__ */ new Set();
	const headerFields = /* @__PURE__ */ new Map();
	(skipFields || "").toLowerCase().split(":").forEach((field) => {
		skip.add(field.trim());
	});
	(fieldNames || "").toLowerCase().split(":").filter((field) => !skip.has(field.trim())).forEach((field) => {
		includedFields.add(field.trim());
	});
	for (let i = headers.length - 1; i >= 0; i--) {
		const line = headers[i];
		if (includedFields.has(line.key) && !headerFields.has(line.key)) headerFields.set(line.key, relaxedHeaderLine(line.line));
	}
	const headersList = [];
	const fields = [];
	includedFields.forEach((field) => {
		if (headerFields.has(field)) {
			fields.push(field);
			headersList.push(field + ":" + headerFields.get(field));
		}
	});
	return {
		headers: headersList.join("\r\n") + "\r\n",
		fieldNames: fields.join(":")
	};
}
/**
* Relaxed canonicalization of a header field value (RFC 6376 section 3.4.2): unfold, turn
* every run of SP and HTAB into a single SP and drop the whitespace next to the colon and
* at the end. Only SP and HTAB count as whitespace, so bytes that decode to other space
* characters, such as a non-breaking space in a UTF-8 header, stay as they are
*/
function relaxedHeaderLine(line) {
	return line.substr(line.indexOf(":") + 1).replace(/\r?\n/g, "").replace(/[ \t]+/g, " ").replace(/^ | $/g, "");
}
// node_modules/nodemailer/dist/esm/dkim/index.js
const DKIM_ALGO = "sha256";
const MAX_MESSAGE_SIZE = 10485760;
var DKIMSigner = class {
	constructor(options, keys, input, output) {
		this.options = options || {};
		this.keys = keys;
		this.cacheTreshold = Number(this.options.cacheTreshold) || MAX_MESSAGE_SIZE;
		this.hashAlgo = this.options.hashAlgo || DKIM_ALGO;
		this.cacheDir = this.options.cacheDir || false;
		this.chunks = [];
		this.chunklen = 0;
		this.readPos = 0;
		this.cachePath = this.cacheDir ? path.join(this.cacheDir, "message." + Date.now() + "-" + crypto.randomBytes(14).toString("hex")) : false;
		this.cache = false;
		this.headers = false;
		this.bodyHash = false;
		this.parser = false;
		this.relaxedBody = false;
		this.input = input;
		this.output = output;
		this.output.usingCache = false;
		this.hasErrored = false;
		this.input.on("error", (err) => this.fail(err));
		this.output.once("close", () => {
			if (this.output.writableFinished) return;
			this.hasErrored = true;
			this.input.unpipe();
			this.input.destroy();
			this.cleanup();
		});
	}
	/**
	* Ends the output with an error and releases the cache file
	*/
	fail(err) {
		this.hasErrored = true;
		this.cleanup();
		this.output.destroy(err);
	}
	cleanup() {
		if (!this.cache || !this.cachePath) return;
		const cache = this.cache;
		this.cache = false;
		cache.destroy();
		fs.unlink(this.cachePath, () => false);
	}
	createReadCache() {
		this.cache = fs.createReadStream(this.cachePath);
		this.cache.once("error", (err) => this.fail(err));
		this.cache.once("close", () => {
			this.cleanup();
		});
		this.cache.pipe(this.output);
	}
	sendNextChunk() {
		while (!this.hasErrored) {
			if (this.readPos >= this.chunks.length) {
				if (!this.cache) {
					this.output.end();
					return;
				}
				return this.createReadCache();
			}
			const chunk = this.chunks[this.readPos++];
			if (this.output.write(chunk) === false) {
				this.output.once("drain", () => {
					this.sendNextChunk();
				});
				return;
			}
		}
	}
	sendSignedOutput() {
		if (this.hasErrored) return;
		let keyPos = 0;
		const signNextKey = () => {
			if (keyPos >= this.keys.length) {
				this.output.write(this.parser.rawHeaders);
				setImmediate(() => this.sendNextChunk());
				return;
			}
			const key = this.keys[keyPos++];
			let dkimField;
			try {
				dkimField = sign(this.headers, this.hashAlgo, this.bodyHash, {
					domainName: key.domainName,
					keySelector: key.keySelector,
					privateKey: key.privateKey,
					headerFieldNames: this.options.headerFieldNames,
					skipFields: this.options.skipFields
				});
			} catch (err) {
				this.fail(err);
				return;
			}
			if (dkimField) this.output.write(Buffer.from(dkimField + "\r\n"));
			setImmediate(signNextKey);
		};
		if (this.bodyHash && this.headers) return signNextKey();
		this.output.write(this.parser.rawHeaders);
		this.sendNextChunk();
	}
	createWriteCache() {
		this.output.usingCache = true;
		this.cache = fs.createWriteStream(this.cachePath, { mode: 384 });
		this.cache.once("error", (err) => {
			this.relaxedBody.unpipe(this.cache);
			this.relaxedBody.on("readable", () => {
				while (this.relaxedBody.read() !== null);
			});
			this.fail(err);
		});
		this.cache.once("close", () => {
			if (this.hasErrored) return;
			this.sendSignedOutput();
		});
		this.relaxedBody.removeAllListeners("readable");
		this.relaxedBody.pipe(this.cache);
	}
	signStream() {
		this.parser = new MessageParser();
		this.relaxedBody = new RelaxedBody({ hashAlgo: this.hashAlgo });
		this.parser.on("headers", (value) => {
			this.headers = value;
		});
		this.relaxedBody.on("hash", (value) => {
			this.bodyHash = value;
		});
		this.relaxedBody.on("readable", () => {
			let chunk;
			if (this.cache) return;
			while ((chunk = this.relaxedBody.read()) !== null) {
				this.chunks.push(chunk);
				this.chunklen += chunk.length;
				if (this.chunklen >= this.cacheTreshold && this.cachePath) return this.createWriteCache();
			}
		});
		this.relaxedBody.on("end", () => {
			if (this.cache) return;
			this.sendSignedOutput();
		});
		this.parser.pipe(this.relaxedBody);
		setImmediate(() => this.input.pipe(this.parser));
	}
};
var DKIM = class {
	constructor(options) {
		this.options = options || {};
		this.keys = [].concat(this.options.keys || {
			domainName: options.domainName,
			keySelector: options.keySelector,
			privateKey: options.privateKey
		});
	}
	sign(input, extraOptions) {
		const output = new PassThrough();
		let inputStream = input;
		let writeValue = false;
		if (Buffer.isBuffer(input)) {
			writeValue = input;
			inputStream = new PassThrough();
		} else if (typeof input === "string") {
			writeValue = Buffer.from(input);
			inputStream = new PassThrough();
		}
		let options = this.options;
		if (extraOptions && Object.keys(extraOptions).length) {
			options = copyOwnKeys({}, extraOptions);
			copyOwnKeys(options, this.options);
		}
		const signer = new DKIMSigner(options, this.keys, inputStream, output);
		setImmediate(() => {
			try {
				signer.signStream();
			} catch (_E) {
				signer.fail(sign.unsupportedHashAlgoError(signer.hashAlgo));
				return;
			}
			if (writeValue) setImmediate(() => {
				inputStream.end(writeValue);
			});
		});
		return output;
	}
};
// node_modules/nodemailer/dist/esm/smtp-connection/http-proxy-client.js
/**
* Minimal HTTP/S proxy client
*/
const MAX_RESPONSE_HEADER_BYTES = 65536;
const unbracket = (host) => typeof host === "string" && host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
function httpProxyClient(proxyUrl, destinationPort, destinationHost, tlsOptions, callback) {
	if (typeof tlsOptions === "function") {
		callback = tlsOptions;
		tlsOptions = {};
	}
	tlsOptions = tlsOptions || {};
	const done = callback;
	destinationPort = Number(destinationPort) || 0;
	if (!destinationPort || /[\r\n]/.test(destinationHost)) {
		const err = /* @__PURE__ */ new Error("Invalid proxy destination");
		err.code = EPROXY;
		setImmediate(() => done(err));
		return;
	}
	const proxy = parse(proxyUrl);
	const authority = (net.isIPv6(unbracket(destinationHost)) ? "[" + unbracket(destinationHost) + "]" : destinationHost) + ":" + destinationPort;
	const connectOptions = {
		host: proxy.hostname,
		port: Number(proxy.port) ? Number(proxy.port) : proxy.protocol === "https:" ? 443 : 80
	};
	let connect;
	if (proxy.protocol === "https:") {
		connectOptions.rejectUnauthorized = tlsOptions.rejectUnauthorized !== false;
		connect = tls.connect.bind(tls);
	} else connect = net.connect.bind(net);
	const timeout = Number(tlsOptions.timeout) || httpProxyClient.timeout || 3e4;
	let socket;
	let finished = false;
	let timer;
	const cleanup = () => {
		clearTimeout(timer);
		socket.removeListener("data", onSocketData);
		socket.removeListener("error", fail);
		socket.removeListener("close", onEarlyClose);
	};
	function fail(err) {
		if (finished) return;
		finished = true;
		cleanup();
		try {
			socket.destroy();
		} catch (_E) {}
		done(err);
	}
	function onEarlyClose() {
		const err = /* @__PURE__ */ new Error("Proxy closed the connection before the tunnel was established");
		err.code = EPROXY;
		fail(err);
	}
	const chunks = [];
	let received = 0;
	let tail = "";
	function onSocketData(chunk) {
		if (finished) return;
		const window = tail + chunk.toString("binary");
		const windowEnd = window.indexOf("\r\n\r\n");
		chunks.push(chunk);
		received += chunk.length;
		tail = window.slice(-3);
		if (windowEnd < 0) {
			if (received > MAX_RESPONSE_HEADER_BYTES) {
				const err = /* @__PURE__ */ new Error("Proxy response headers too large");
				err.code = EPROXY;
				fail(err);
			}
			return;
		}
		socket.removeListener("data", onSocketData);
		socket.pause();
		const headerEnd = received - window.length + windowEnd;
		const response = Buffer.concat(chunks, received);
		if (response.length > headerEnd + 4) socket.unshift(response.subarray(headerEnd + 4));
		const match = response.toString("binary", 0, headerEnd).match(/^HTTP\/\d+\.\d+ (\d+)/i);
		if (!match || (match[1] || "").charAt(0) !== "2") {
			const err = /* @__PURE__ */ new Error("Invalid response from proxy" + (match && ": " + match[1] || ""));
			err.code = EPROXY;
			return fail(err);
		}
		finished = true;
		cleanup();
		const resumeOnData = (event) => {
			if (event === "data") {
				socket.removeListener("newListener", resumeOnData);
				socket.resume();
			}
		};
		socket.on("newListener", resumeOnData);
		return done(null, socket);
	}
	socket = connect(connectOptions, () => {
		if (finished) return;
		const reqHeaders = {
			Host: authority,
			Connection: "close"
		};
		if (proxy.auth) reqHeaders["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64");
		socket.write("CONNECT " + authority + " HTTP/1.1\r\n" + Object.keys(reqHeaders).map((key) => key + ": " + reqHeaders[key]).join("\r\n") + "\r\n\r\n");
		socket.on("data", onSocketData);
	});
	timer = setTimeout(() => {
		const err = /* @__PURE__ */ new Error("Proxy socket timed out");
		err.code = ETIMEDOUT;
		fail(err);
	}, timeout);
	socket.once("error", fail);
	socket.once("close", onEarlyClose);
}
// node_modules/nodemailer/dist/esm/mailer/mail-message.js
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
var MailMessage = class {
	constructor(mailer, data) {
		this.mailer = mailer;
		this.data = {};
		this.message = null;
		data = data || {};
		const options = mailer.options || {};
		const defaults = mailer._defaults || {};
		copyOwnKeys(this.data, data);
		this.data.headers = this.data.headers || {};
		copyOwnKeys(this.data, defaults, (key) => hasOwn(this.data, key));
		copyOwnKeys(this.data.headers, defaults.headers, (key) => hasOwn(this.data.headers, key));
		[
			"disableFileAccess",
			"disableUrlAccess",
			"normalizeHeaderKey",
			"maxRecipients"
		].forEach((key) => {
			if (key in options) this.data[key] = options[key];
		});
		["disableFileAccess", "disableUrlAccess"].forEach((key) => {
			if (!(key in options) && hasOwn(defaults, key)) this.data[key] = this.data[key] || defaults[key];
		});
	}
	resolveContent(data, key, options, callback) {
		if (!callback && typeof options === "function") {
			callback = options;
			options = false;
		}
		options = options || {};
		return resolveContent(data, key, {
			disableFileAccess: this.data.disableFileAccess || options.disableFileAccess,
			disableUrlAccess: this.data.disableUrlAccess || options.disableUrlAccess
		}, callback);
	}
	resolveAll(callback) {
		const keys = [
			[this.data, "html"],
			[this.data, "text"],
			[this.data, "watchHtml"],
			[this.data, "amp"],
			[this.data, "icalEvent"]
		];
		if (this.data.alternatives && this.data.alternatives.length) this.data.alternatives.forEach((alternative, i) => {
			keys.push([this.data.alternatives, i]);
		});
		if (this.data.attachments && this.data.attachments.length) this.data.attachments.forEach((attachment, i) => {
			if (!attachment.filename) {
				attachment.filename = (attachment.path || attachment.href || "").split(/[/\\]/).pop().split("?").shift() || "attachment-" + (i + 1);
				if (attachment.filename.indexOf(".") < 0) attachment.filename += "." + detectExtension(attachment.contentType);
			}
			if (!attachment.contentType) attachment.contentType = detectMimeType(attachment.filename || attachment.path || attachment.href || "bin");
			keys.push([this.data.attachments, i]);
		});
		const mimeNode = new MimeNode();
		[
			"from",
			"to",
			"cc",
			"bcc",
			"sender",
			"replyTo"
		].forEach((address) => {
			let value;
			if (this.message) value = [].concat(mimeNode._parseAddresses(this.message.getHeader(address === "replyTo" ? "reply-to" : address)) || []);
			else if (this.data[address]) value = [].concat(mimeNode._parseAddresses(this.data[address]) || []);
			if (value && value.length) this.data[address] = value;
			else if (address in this.data) this.data[address] = null;
		});
		["from", "sender"].forEach((address) => {
			if (this.data[address]) this.data[address] = this.data[address].shift();
		});
		let pos = 0;
		const resolveNext = () => {
			if (pos >= keys.length) return callback(null, this.data);
			const args = keys[pos++];
			if (!args[0] || !args[0][args[1]]) return resolveNext();
			resolveContent(...args, {
				disableFileAccess: this.data.disableFileAccess,
				disableUrlAccess: this.data.disableUrlAccess
			}, (err, value) => {
				if (err) return callback(err);
				const node = { content: value };
				if (args[0][args[1]] && typeof args[0][args[1]] === "object" && !Buffer.isBuffer(args[0][args[1]])) copyOwnKeys(node, args[0][args[1]], (key) => key in node || [
					"content",
					"path",
					"href",
					"raw"
				].includes(key));
				args[0][args[1]] = node;
				resolveNext();
			});
		};
		setImmediate(() => resolveNext());
	}
	/**
	* Destroys the content streams of the message once sending failed. A stream that was not
	* read to the end would otherwise keep the file or the socket behind it open
	*/
	releaseStreams() {
		const data = this.data;
		const values = [
			data.html,
			data.text,
			data.watchHtml,
			data.amp,
			data.raw,
			data.icalEvent
		];
		for (const key of ["attachments", "alternatives"]) if (Array.isArray(data[key])) for (const entry of data[key]) values.push(entry);
		for (const value of values) if (value && typeof value === "object") {
			destroyStream(value);
			destroyStream(value.content);
			destroyStream(value.raw);
		}
	}
	normalize(callback) {
		const envelope = this.message.getEnvelope();
		const messageId = this.message.messageId();
		this.resolveAll((err, data) => {
			if (err) return callback(err);
			data.envelope = envelope;
			data.messageId = messageId;
			[
				"html",
				"text",
				"watchHtml",
				"amp"
			].forEach((key) => {
				if (data[key] && data[key].content) {
					if (typeof data[key].content === "string") data[key] = data[key].content;
					else if (Buffer.isBuffer(data[key].content)) data[key] = data[key].content.toString();
				}
			});
			if (data.icalEvent && Buffer.isBuffer(data.icalEvent.content)) {
				data.icalEvent.content = data.icalEvent.content.toString("base64");
				data.icalEvent.encoding = "base64";
			}
			if (data.alternatives && data.alternatives.length) data.alternatives.forEach((alternative) => {
				if (alternative && alternative.content && Buffer.isBuffer(alternative.content)) {
					alternative.content = alternative.content.toString("base64");
					alternative.encoding = "base64";
				}
			});
			if (data.attachments && data.attachments.length) data.attachments.forEach((attachment) => {
				if (attachment && attachment.content && Buffer.isBuffer(attachment.content)) {
					attachment.content = attachment.content.toString("base64");
					attachment.encoding = "base64";
				}
			});
			data.normalizedHeaders = {};
			Object.keys(data.headers || {}).forEach((key) => {
				if (isProtoKey(key)) return;
				let value = [].concat(data.headers[key] || []).shift();
				value = value && value.value || value;
				if (value) {
					if ([
						"references",
						"in-reply-to",
						"message-id",
						"content-id"
					].includes(key)) value = this.message.encodeHeaderValue(key, value);
					data.normalizedHeaders[key] = value;
				}
			});
			if (data.list && typeof data.list === "object") this._getListHeaders(data.list).forEach((entry) => {
				data.normalizedHeaders[entry.key] = entry.value.map((val) => val && val.value || val).join(", ");
			});
			if (data.references) data.normalizedHeaders.references = this.message.encodeHeaderValue("references", data.references);
			if (data.inReplyTo) data.normalizedHeaders["in-reply-to"] = this.message.encodeHeaderValue("in-reply-to", data.inReplyTo);
			return callback(null, data);
		});
	}
	setMailerHeader() {
		if (!this.message || !this.data.xMailer) return;
		this.message.setHeader("X-Mailer", this.data.xMailer);
	}
	setPriorityHeaders() {
		if (!this.message || !this.data.priority) return;
		switch ((this.data.priority || "").toString().toLowerCase()) {
			case "high":
				this.message.setHeader("X-Priority", "1 (Highest)");
				this.message.setHeader("X-MSMail-Priority", "High");
				this.message.setHeader("Importance", "High");
				break;
			case "low":
				this.message.setHeader("X-Priority", "5 (Lowest)");
				this.message.setHeader("X-MSMail-Priority", "Low");
				this.message.setHeader("Importance", "Low");
		}
	}
	setListHeaders() {
		if (!this.message || !this.data.list || typeof this.data.list !== "object") return;
		this._getListHeaders(this.data.list).forEach((listHeader) => {
			listHeader.value.forEach((value) => {
				this.message.addHeader(listHeader.key, value);
			});
		});
	}
	/** @internal */
	_getListHeaders(listData) {
		return Object.keys(listData).map((key) => ({
			key: "list-" + key.toLowerCase().trim(),
			value: [].concat(listData[key] || []).map((value) => ({
				prepared: true,
				foldLines: true,
				value: [].concat(value || []).map((value) => {
					if (typeof value === "string") value = { url: value };
					if (value && value.url) {
						let comment = (value.comment || "").toString().replace(/\r?\n|\r/g, " ");
						const needsEncoding = !isPlainText(comment) || /\x7f/.test(comment);
						if (key.toLowerCase().trim() === "id") {
							comment = needsEncoding ? encodeWord(comment) : quoteString(comment);
							return (value.comment ? comment + " " : "") + this._formatListUrl(value.url).replace(/^<[^:]+:\/{0,2}/, "<");
						}
						comment = needsEncoding ? encodeWord(comment) : comment.replace(/[()\\]/g, "\\$&");
						return this._formatListUrl(value.url) + (value.comment ? " (" + comment + ")" : "");
					}
					return "";
				}).filter((value) => value).join(", ")
			}))
		}));
	}
	/** @internal */
	_formatListUrl(url) {
		url = url.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").replace(/[\s<]+|[\s>]+/g, "");
		if (/^(https?|mailto|ftp):/.test(url)) return "<" + url + ">";
		if (/^[^@]+@[^@]+$/.test(url)) return "<mailto:" + url + ">";
		return "<http://" + url + ">";
	}
};
// node_modules/nodemailer/dist/esm/mailer/index.js
/**
* Recipients allowed on one message unless the caller sets its own maxRecipients. A backstop
* against a runaway or hostile recipient list rather than a delivery policy: RFC 5321 only
* asks a server to accept 100, so a real send is bounded far below this.
*/
const DEFAULT_MAX_RECIPIENTS = 1e5;
/**
* Duck-typed so that signals from another realm or a polyfill are accepted as well
*/
function isAbortSignal(value) {
	return typeof value === "object" && value !== null && "aborted" in value && typeof value.addEventListener === "function" && typeof value.removeEventListener === "function";
}
/**
* Creates an object for exposing the Mail API
*
* @constructor
* @param transporter Transport object instance to pass the mails to
*/
var Mail = class extends EventEmitter {
	constructor(transporter, options, defaults) {
		super();
		this.options = options || {};
		this._defaults = defaults || {};
		this._defaultPlugins = {
			compile: [(...args) => this._convertDataImages(...args)],
			stream: []
		};
		this._userPlugins = {
			compile: [],
			stream: []
		};
		this.meta = /* @__PURE__ */ new Map();
		this.dkim = this.options.dkim ? new DKIM(this.options.dkim) : false;
		this.transporter = transporter;
		this.transporter.mailer = this;
		this.logger = getLogger(this.options, { component: this.options.component || "mail" });
		this.logger.debug({ tnx: "create" }, "Creating transport: %s", this.getVersionString());
		if (typeof this.transporter.on === "function") {
			this.transporter.on("log", (log) => {
				this.logger.debug({ tnx: "transport" }, "%s: %s", log.type, log.message);
			});
			this.transporter.on("error", (err) => {
				this.logger.error({
					err,
					tnx: "transport"
				}, "Transport Error: %s", err.message);
				this.emit("error", err);
			});
			this.transporter.on("idle", (...args) => {
				this.emit("idle", ...args);
			});
			this.transporter.on("clear", (...args) => {
				this.emit("clear", ...args);
			});
		}
		/**
		* Optional methods passed to the underlying transport object
		*/
		[
			"close",
			"isIdle",
			"verify"
		].forEach((method) => {
			this[method] = (...args) => {
				if (typeof this.transporter[method] === "function") {
					if (method === "verify" && typeof this.getSocket === "function") {
						this.transporter.getSocket = this.getSocket;
						this.getSocket = false;
					}
					return this.transporter[method](...args);
				}
				this.logger.warn({
					tnx: "transport",
					methodName: method
				}, "Non existing method %s called for transport", method);
				return false;
			};
		});
		if (this.options.proxy && typeof this.options.proxy === "string") this.setupProxy(this.options.proxy);
	}
	use(step, plugin) {
		step = (step || "").toString();
		if (!this._userPlugins.hasOwnProperty(step)) this._userPlugins[step] = [plugin];
		else this._userPlugins[step].push(plugin);
		return this;
	}
	sendMail(data, callback = null) {
		let promise;
		if (!callback) promise = new Promise((resolve, reject) => {
			callback = callbackPromise(resolve, reject);
		});
		const done = callback;
		if (typeof this.getSocket === "function") {
			this.transporter.getSocket = this.getSocket;
			this.getSocket = false;
		}
		const mail = new MailMessage(this, data);
		const signalOption = mail.data.signal;
		const signal = isAbortSignal(signalOption) ? signalOption : void 0;
		let settled = false;
		const removeAbortListener = () => signal?.removeEventListener("abort", onAbort);
		const finish = (err, info) => {
			if (settled) return;
			settled = true;
			removeAbortListener();
			if (err) mail.releaseStreams();
			done(err, info);
		};
		const fail = (err) => {
			finish(err);
		};
		function onAbort() {
			fail(createAbortError(signal));
		}
		if (signalOption !== void 0 && signalOption !== null && !signal) {
			const err = /* @__PURE__ */ new Error("The signal option must be an AbortSignal");
			err.code = ECONFIG;
			setImmediate(() => fail(err));
			return promise;
		}
		if (signal) {
			signal.addEventListener("abort", onAbort, { once: true });
			if (signal.aborted) {
				setImmediate(onAbort);
				return promise;
			}
		}
		this.logger.debug({
			tnx: "transport",
			name: this.transporter.name,
			version: this.transporter.version,
			action: "send"
		}, "Sending mail using %s/%s", this.transporter.name, this.transporter.version);
		this._processPlugins("compile", mail, (err) => {
			if (settled) return;
			if (err) {
				this.logger.error({
					err,
					tnx: "plugin",
					action: "compile"
				}, "PluginCompile Error: %s", err.message);
				return fail(err);
			}
			let recipientCount;
			try {
				mail.message = new MailComposer(mail.data).compile();
				mail.setMailerHeader();
				mail.setPriorityHeaders();
				mail.setListHeaders();
				recipientCount = mail.message.getEnvelope().to.length;
			} catch (err) {
				this.logger.error({
					err,
					tnx: "transport",
					action: "send"
				}, "Compile Error: %s", err.message);
				return fail(err);
			}
			const maxRecipients = mail.data.maxRecipients === void 0 ? DEFAULT_MAX_RECIPIENTS : mail.data.maxRecipients;
			if (maxRecipients && recipientCount > maxRecipients) {
				const err = /* @__PURE__ */ new Error(`Message has ${recipientCount} recipients, which is over the ${maxRecipients} allowed by maxRecipients`);
				err.code = EMAXRECIPIENTS;
				this.logger.error({
					err,
					tnx: "transport",
					action: "send"
				}, "Send Error: %s", err.message);
				return fail(err);
			}
			this._processPlugins("stream", mail, (err) => {
				if (settled) return;
				if (err) {
					this.logger.error({
						err,
						tnx: "plugin",
						action: "stream"
					}, "PluginStream Error: %s", err.message);
					return fail(err);
				}
				if (mail.data.dkim || this.dkim) mail.message.processFunc((input) => {
					const dkim = mail.data.dkim ? new DKIM(mail.data.dkim) : this.dkim;
					this.logger.debug({
						tnx: "DKIM",
						messageId: mail.message.messageId(),
						dkimDomains: dkim.keys.map((key) => key.keySelector + "." + key.domainName).join(", ")
					}, "Signing outgoing message with %s keys", dkim.keys.length);
					return dkim.sign(input, mail.data._dkim);
				});
				removeAbortListener();
				this.transporter.send(mail, (...args) => {
					if (args[0]) this.logger.error({
						err: args[0],
						tnx: "transport",
						action: "send"
					}, "Send Error: %s", args[0].message);
					finish(...args);
				});
			});
		});
		return promise;
	}
	getVersionString() {
		return util.format("%s (%s; +%s; %s/%s)", name, version, homepage, this.transporter.name, this.transporter.version);
	}
	/** @internal */
	_processPlugins(step, mail, callback) {
		step = (step || "").toString();
		if (!this._userPlugins.hasOwnProperty(step)) return callback();
		const userPlugins = this._userPlugins[step] || [];
		const defaultPlugins = this._defaultPlugins[step] || [];
		if (userPlugins.length) this.logger.debug({
			tnx: "transaction",
			pluginCount: userPlugins.length,
			step
		}, "Using %s plugins for %s", userPlugins.length, step);
		if (userPlugins.length + defaultPlugins.length === 0) return callback();
		let pos = 0;
		let block = "default";
		const processPlugins = () => {
			if (mail.data.signal?.aborted) return callback(createAbortError(mail.data.signal));
			let curplugins = block === "default" ? defaultPlugins : userPlugins;
			if (pos >= curplugins.length) {
				if (block === "default" && userPlugins.length) {
					block = "user";
					pos = 0;
					curplugins = userPlugins;
				} else return callback();
			}
			const plugin = curplugins[pos++];
			plugin(mail, (err) => {
				if (err) return callback(err);
				processPlugins();
			});
		};
		processPlugins();
	}
	/**
	* Sets up proxy handler for a Nodemailer object
	*
	* @param proxyUrl Proxy configuration url
	*/
	setupProxy(proxyUrl) {
		const proxy = parse(proxyUrl);
		this.getSocket = (options, callback) => {
			const protocol = proxy.protocol.replace(/:$/, "").toLowerCase();
			const configuredTimeout = Number(this.options.connectionTimeout) || 0;
			const connectStartedAt = Number(options.connectStartedAt) || Date.now();
			const connectionTimeout = configuredTimeout ? Math.max(connectStartedAt + configuredTimeout - Date.now(), 1) : void 0;
			if (this.meta.has("proxy_handler_" + protocol)) return this.meta.get("proxy_handler_" + protocol)(proxy, options, callback);
			switch (protocol) {
				case "http":
				case "https":
					httpProxyClient(proxy.href, options.port, options.host, connectionTimeout ? Object.assign({}, this.options.tls, { timeout: connectionTimeout }) : this.options.tls || {}, (err, socket) => {
						if (err) return callback(err);
						return callback(null, { connection: socket });
					});
					return;
				case "socks":
				case "socks5":
				case "socks4":
				case "socks4a": {
					if (!this.meta.has("proxy_socks_module")) {
						let err = /* @__PURE__ */ new Error("Socks module not loaded");
						err.code = EPROXY;
						return callback(err);
					}
					const connect = (ipaddress) => {
						const proxyV2 = !!this.meta.get("proxy_socks_module").SocksClient;
						const socksClient = proxyV2 ? this.meta.get("proxy_socks_module").SocksClient : this.meta.get("proxy_socks_module");
						const proxyType = Number(proxy.protocol.replace(/\D/g, "")) || 5;
						const connectionOpts = {
							proxy: {
								ipaddress,
								port: Number(proxy.port),
								type: proxyType
							},
							[proxyV2 ? "destination" : "target"]: {
								host: options.host,
								port: options.port
							},
							command: "connect"
						};
						if (connectionTimeout) connectionOpts.timeout = connectionTimeout;
						if (proxy.username || proxy.password) {
							const username = proxy.username || "";
							const password = proxy.password || "";
							if (proxyV2) {
								connectionOpts.proxy.userId = username;
								connectionOpts.proxy.password = password;
							} else if (proxyType === 4) connectionOpts.userid = username;
							else connectionOpts.authentication = {
								username,
								password
							};
						}
						socksClient.createConnection(connectionOpts, (err, info) => {
							if (err) return callback(err);
							return callback(null, { connection: info.socket || info });
						});
					};
					if (net.isIP(proxy.hostname)) return connect(proxy.hostname);
					return dns.lookup(proxy.hostname, (err, address) => {
						if (err) return callback(err);
						connect(address);
					});
				}
			}
			let err = /* @__PURE__ */ new Error("Unknown proxy configuration");
			err.code = EPROXY;
			callback(err);
		};
	}
	/** @internal */
	_convertDataImages(mail, callback) {
		if (!this.options.attachDataUrls && !mail.data.attachDataUrls || !mail.data.html) return callback();
		mail.resolveContent(mail.data, "html", {
			disableFileAccess: mail.data.disableFileAccess,
			disableUrlAccess: mail.data.disableUrlAccess
		}, (err, html) => {
			if (err) return callback(err);
			let cidCounter = 0;
			html = (html || "").toString().replace(/(<img\b[^<>]{0,1024} src\s{0,20}=[\s"']{0,20})(data:([^;"'<>\s]{1,255});[^"'>\s]+)/gi, (match, prefix, dataUri, mimeType) => {
				const cid = crypto.randomBytes(10).toString("hex") + "@localhost";
				if (!mail.data.attachments) mail.data.attachments = [];
				if (!Array.isArray(mail.data.attachments)) mail.data.attachments = [].concat(mail.data.attachments || []);
				mail.data.attachments.push({
					path: dataUri,
					cid,
					filename: "image-" + ++cidCounter + "." + detectExtension$1(mimeType)
				});
				return prefix + "cid:" + cid;
			});
			mail.data.html = html;
			callback();
		});
	}
	set(key, value) {
		return this.meta.set(key, value);
	}
	get(key) {
		return this.meta.get(key);
	}
};
// node_modules/nodemailer/dist/esm/smtp-connection/data-stream.js
const INSERT_LF = Buffer.from("\n");
const INSERT_LF_DOT = Buffer.from("\n.");
const INSERT_CR = Buffer.from("\r");
const INSERT_DOT = Buffer.from(".");
/**
* Escapes dots in the beginning of lines. Ends the stream with <CR><LF>.<CR><LF>
* Also makes sure that only <CR><LF> sequences are used for linebreaks, bare CR and bare LF
* are both turned into <CR><LF>
*
* @param options Stream options
*/
var DataStream = class extends Transform {
	constructor(options) {
		super(options);
		this.options = options || {};
		this.inByteCount = 0;
		this.outByteCount = 0;
		this.lastByte = false;
	}
	/**
	* Escapes dots
	* @internal
	*/
	_transform(chunk, encoding, done) {
		const chunks = [];
		let chunklen = 0;
		let i, len, lastPos = 0;
		let buf;
		if (!chunk || !chunk.length) return done();
		if (typeof chunk === "string") chunk = Buffer.from(chunk);
		this.inByteCount += chunk.length;
		for (i = 0, len = chunk.length; i < len; i++) {
			const byte = chunk[i];
			const prev = i ? chunk[i - 1] : this.lastByte;
			let insert = false;
			if (prev === 13 && byte !== 10) insert = byte === 46 ? INSERT_LF_DOT : INSERT_LF;
			else if (byte === 10 && prev !== 13) insert = INSERT_CR;
			else if (byte === 46 && (prev === 10 || prev === false)) insert = INSERT_DOT;
			if (insert) {
				if (i > lastPos) {
					buf = chunk.slice(lastPos, i);
					chunks.push(buf);
					chunklen += buf.length;
				}
				chunks.push(insert);
				chunklen += insert.length;
				lastPos = i;
			}
		}
		if (chunks.length) {
			if (lastPos < chunk.length) {
				buf = chunk.slice(lastPos);
				chunks.push(buf);
				chunklen += buf.length;
			}
			this.outByteCount += chunklen;
			this.push(Buffer.concat(chunks, chunklen));
		} else {
			this.outByteCount += chunk.length;
			this.push(chunk);
		}
		this.lastByte = chunk[chunk.length - 1];
		done();
	}
	/**
	* Finalizes the stream with a dot on a single line
	* @internal
	*/
	_flush(done) {
		let buf;
		if (this.lastByte === 10) buf = Buffer.from(".\r\n");
		else if (this.lastByte === 13) buf = Buffer.from("\n.\r\n");
		else buf = Buffer.from("\r\n.\r\n");
		this.outByteCount += buf.length;
		this.push(buf);
		done();
	}
};
// node_modules/nodemailer/dist/esm/smtp-connection/server-message-id.js
/**
* Reads the Message-ID a receiving server gave the message out of its final 250 reply. Some
* servers replace the Message-ID header of a submitted message with one of their own, and
* the copy the recipients and the sent folder get carries that one instead of the id the
* message was built with. Only replies in a format known to carry such an id are read.
*/
const OUTLOOK_REPLY = /^250 2\.0\.0 OK (<[^<>\s]+\.prod\.outlook\.com>)/i;
const SES_REPLY = /^250 Ok ([0-9a-f]+(?:-[0-9a-f]+)+)$/i;
const AWS_REGION = /^[a-z]{2}(?:-[a-z]+)+-\d+$/;
/**
* Finds the AWS region an SES SMTP endpoint is in from its hostname, such as
* email-smtp.eu-west-1.amazonaws.com or a VPC endpoint name under it
*
* @param host SMTP hostname
* @returns Region name, or undefined for a host outside amazonaws.com and awsapps.com
*/
function sesRegion(host) {
	const labels = host.toLowerCase().replace(/\.$/, "").split(".");
	const domain = labels.slice(-2).join(".");
	if (domain !== "amazonaws.com" && domain !== "awsapps.com") return;
	return labels.slice(0, -2).find((label) => AWS_REGION.test(label));
}
/**
* Reads the server assigned Message-ID out of the final reply to a message
*
* @param response Final server reply for the message
* @param [host] Hostname the connection was made to, SES replies are only read for an SES host
* @returns The Message-ID with its angle brackets, or undefined when the reply names none
*/
function parseServerMessageId(response, host) {
	const reply = (response || "").toString().trim();
	const outlook = reply.match(OUTLOOK_REPLY);
	if (outlook) return outlook[1];
	const ses = reply.match(SES_REPLY);
	if (ses && host) {
		const region = sesRegion(host);
		if (region) return "<" + ses[1].toLowerCase() + "@" + (region === "us-east-1" ? "email" : region) + ".amazonses.com>";
	}
}
// node_modules/nodemailer/dist/esm/smtp-connection/index.js
const CONNECTION_TIMEOUT = 12e4;
const SOCKET_TIMEOUT = 6e5;
const GREETING_TIMEOUT = 3e4;
const DNS_TIMEOUT = 3e4;
const CLOSE_TIMEOUT = 5e3;
const KEEPALIVE_DELAY = 3e4;
const TEARDOWN_NOOP = () => {};
function shuffle(list) {
	const result = list.slice();
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
function timeoutError(message, timeoutType) {
	const err = new Error(message);
	err.timeoutType = timeoutType;
	return err;
}
const MAX_RESPONSE_SIZE = 1048576;
/**
* Re-interpret a server response stored in fake 8-bit byte-container form
* (the result of chunk.toString('binary') in _onData) as UTF-8.
*
* Server reply text has no formally defined charset (RFC 5321 §4.2.1), but
* modern MTAs commonly use UTF-8. The byte-container plumbing in _onData is
* required to reassemble multi-byte sequences split across socket chunks;
* this helper performs the actual decode at the line boundary, falling back
* to the byte-container form when the bytes are not valid UTF-8 so that
* legacy 8-bit replies are still recoverable byte-for-byte.
*/
function decodeServerResponse(str) {
	if (!str) return str;
	const utf8 = Buffer.from(str, "binary").toString("utf8");
	return utf8.includes("�") ? str : utf8;
}
/**
* True when the last line of a queued reply is a continuation ("250-..."), which means
* the rest of the reply is still on its way.
*
* Called with the byte-container form the queue holds (see _onData): the check only looks
* at leading ASCII digits and '-' of the last line, and a UTF-8 continuation byte is never
* 0x0A, so line boundaries and the tested prefix are the same before and after decoding.
* The last line is read with lastIndexOf rather than split() because a queue entry may hold
* a whole multiline reply and only its final line matters.
*/
function isPartialResponse(str) {
	return isPartialLine(str.slice(str.lastIndexOf("\n") + 1));
}
/**
* True when a single reply line is a continuation ("250-..."). Used where the line is
* already known to be one line, which skips the scan isPartialResponse needs to find the
* last line of a whole reply.
*/
function isPartialLine(line) {
	return /^\d+-/.test(line);
}
/**
* The log form of a command a custom authentication handler sends. Such a command carries
* the credentials in whatever shape its mechanism uses, so only an AUTH verb with its
* mechanism name is kept, the way the built-in mechanisms hide their own secrets.
*
* @param cmd Command the handler sends
* @return What the transaction log gets instead
*/
function maskAuthCommand(cmd) {
	const match = (cmd || "").toString().match(/^AUTH\s+[^\s]+/i);
	if (!match) return "/* secret */";
	return match[0].length === cmd.length ? cmd : match[0] + " /* secret */";
}
/**
* Generates a SMTP connection object
*
* Optional options object takes the following possible properties:
*
*  * **port** - is the port to connect to (defaults to 587 or 465)
*  * **host** - is the hostname or IP address to connect to (defaults to 'localhost')
*  * **secure** - use SSL
*  * **ignoreTLS** - ignore server support for STARTTLS (has no effect when requireTLS is set)
*  * **requireTLS** - forces the client to use STARTTLS, takes precedence over ignoreTLS and opportunisticTLS
*  * **name** - the name of the client server
*  * **localAddress** - outbound address to bind to (see: http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener)
*  * **greetingTimeout** - Time to wait in ms until greeting message is received from the server (defaults to 30 seconds)
*  * **connectionTimeout** - how many milliseconds to wait for the connection to establish (defaults to 2 minutes)
*  * **socketTimeout** - Time of inactivity until the connection is closed (defaults to 10 minutes)
*  * **socketCloseTimeout** - Time in ms to wait for the peer to close after ending the socket (defaults to 5 seconds, 0 destroys immediately)
*  * **maxResponseSize** - Largest single server response to accept in bytes (defaults to 1 MB)
*  * **dnsTimeout** - Time to wait in ms for the DNS requests to be resolved (defaults to 30 seconds)
*  * **lmtp** - if true, uses LMTP instead of SMTP protocol
*  * **logger** - bunyan compatible logger interface
*  * **debug** - if true pass SMTP traffic to the logger
*  * **tls** - options for createCredentials
*  * **socket** - existing socket to use instead of creating a new one (see: http://nodejs.org/api/net.html#net_class_net_socket)
*  * **secured** - boolean indicates that the provided socket has already been upgraded to tls
*
* @constructor
* @namespace SMTP Client module
* @param [options] Option properties
*/
var SMTPConnection = class extends EventEmitter {
	constructor(options) {
		super(options);
		this.id = crypto.randomBytes(8).toString("base64").replace(/\W/g, "");
		this.stage = "init";
		this.options = options || {};
		if (this.options.requireTLS && (this.options.ignoreTLS || this.options.opportunisticTLS)) this.options = Object.assign({}, this.options, {
			ignoreTLS: false,
			opportunisticTLS: false
		});
		this.secureConnection = !!this.options.secure;
		this.alreadySecured = !!this.options.secured;
		this.port = Number(this.options.port) || (this.secureConnection ? 465 : 587);
		this.host = this.options.host || "localhost";
		this.servername = this.options.servername ? this.options.servername : !net.isIP(this.host) ? this.host : false;
		this.allowInternalNetworkInterfaces = this.options.allowInternalNetworkInterfaces || false;
		if (typeof this.options.secure === "undefined" && this.port === 465) this.secureConnection = true;
		this.name = (this.options.name || this._getHostname()).toString().replace(/[\r\n]+/g, "");
		this.logger = getLogger(this.options, {
			component: this.options.component || "smtp-connection",
			sid: this.id
		});
		this.customAuth = /* @__PURE__ */ new Map();
		for (const key of Object.keys(this.options.customAuth || {})) {
			const mapKey = (key || "").toString().trim().toUpperCase();
			if (mapKey) this.customAuth.set(mapKey, this.options.customAuth[key]);
		}
		this.version = version;
		this.authenticated = false;
		this.destroyed = false;
		this.secure = !!this.secureConnection;
		this._remainder = "";
		this._responseQueue = [];
		this._responsePartial = false;
		this.lastServerResponse = false;
		this._socket = false;
		this._supportedAuth = [];
		this.allowsAuth = false;
		this._envelope = false;
		this._supportedExtensions = [];
		this._maxAllowedSize = 0;
		this._responseActions = [];
		this._recipientQueue = [];
		this._phaseTimer = false;
		this._plaintextEhlo = false;
		this._destroyed = false;
		this._closing = false;
		this._currentDataStream = false;
		this._pendingSend = false;
		this._connectCallback = false;
		this._onSocketData = (chunk) => this._onData(chunk);
		this._onSocketError = (error) => this._onError(error, "ESOCKET", false, "CONN");
		this._onSocketClose = () => this._onClose();
		this._onSocketEnd = () => this._onEnd();
		this._onSocketTimeout = () => this._onTimeout();
		this._onConnectionSocketError = (err) => this._onError(err, "ESOCKET", false, "CONN");
	}
	/**
	* Creates a connection to a SMTP server and sets up connection
	* listener
	*/
	connect(connectCallback) {
		if (this._connectCalled && !this._destroyed) {
			const err = this._formatError("Cannot connect - connect() was already called for this connection", "ECONNECTION", false, "API");
			if (typeof connectCallback === "function") {
				setImmediate(() => connectCallback(err));
				return;
			}
			this.logger.warn({ tnx: "smtp" }, "%s", err.message);
			return;
		}
		this._connectCalled = true;
		if (typeof connectCallback === "function") {
			this._connectCallback = connectCallback;
			this.once("connect", () => {
				this._connectCallback = false;
				this.logger.debug({ tnx: "smtp" }, "SMTP handshake finished");
				connectCallback();
			});
			const isDestroyedMessage = this._isDestroyedMessage("connect");
			if (isDestroyedMessage) return connectCallback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "CONN"));
		}
		const connectionTimeout = this.options.connectionTimeout || CONNECTION_TIMEOUT;
		this._connectionDeadline = (this._connectStartedAt || Date.now()) + connectionTimeout;
		let opts = {
			port: this.port,
			host: this.host,
			allowInternalNetworkInterfaces: this.allowInternalNetworkInterfaces,
			timeout: Math.min(this.options.dnsTimeout || DNS_TIMEOUT, connectionTimeout)
		};
		if (this.options.localAddress) opts.localAddress = this.options.localAddress;
		if (this.options.connection) {
			this._socket = this.options.connection;
			this._setupConnectionHandlers();
			if (this.secureConnection && !this.alreadySecured) setImmediate(() => this._upgradeConnection((err) => {
				if (err) {
					this._onError(/* @__PURE__ */ new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "CONN");
					return;
				}
				this._onConnect();
			}));
			else setImmediate(() => this._onConnect());
			return;
		} else if (this.options.socket) {
			this._socket = this.options.socket;
			return this._resolveAndConnect(opts, (_resolved) => {
				if (this._destroyed || this._closing) return;
				try {
					this._socket.connect(this.port, this.host, () => {
						if (this.secureConnection && !this.alreadySecured) return this._upgradeConnection((err) => {
							if (err) {
								this._onError(/* @__PURE__ */ new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "CONN");
								return;
							}
							this._onConnect();
						});
						this._onConnect();
					});
					this._setupConnectionHandlers();
				} catch (E) {
					setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
					return;
				}
			});
		} else {
			if (this.secureConnection) {
				Object.assign(opts, this.options.tls || {});
				if (this.servername && !opts.servername) opts.servername = this.servername;
			}
			return this._resolveAndConnect(opts, (resolved) => {
				let addresses = resolved._addresses || [];
				if (opts.localAddress) {
					const localFamily = net.isIPv6(opts.localAddress) ? 6 : 4;
					const sameFamily = addresses.filter((addr) => net.isIP(addr) === localFamily);
					addresses = sameFamily.length ? sameFamily : addresses;
				}
				if (addresses.length > 1) {
					const ipv6 = addresses.filter((addr) => net.isIPv6(addr));
					const ipv4 = addresses.filter((addr) => !net.isIPv6(addr));
					const ordered = shuffle(ipv6).concat(shuffle(ipv4));
					opts.host = this.host;
					opts.autoSelectFamily = true;
					if (!ipv6.length || !ipv4.length) {
						const remaining = this._connectionDeadline - Date.now();
						opts.autoSelectFamilyAttemptTimeout = Math.max(Math.floor(remaining / ordered.length), 10);
					}
					opts.lookup = ((hostname, lookupOptions, callback) => {
						if (lookupOptions && lookupOptions.all) {
							const all = ordered.map((address) => ({
								address,
								family: net.isIPv6(address) ? 6 : 4
							}));
							return setImmediate(() => callback(null, all));
						}
						setImmediate(() => callback(null, ordered[0], net.isIPv6(ordered[0]) ? 6 : 4));
					});
				} else if (addresses.length) opts.host = addresses[0];
				this._connectToHost(opts, this.secureConnection);
			});
		}
	}
	/**
	* Resolves the hostname and applies resolved values to opts,
	* then calls the provided callback with the resolved data
	*
	* @param opts Connection options (modified in place)
	* @param callback Called with resolved data on success
	* @internal
	*/
	_resolveAndConnect(opts, callback) {
		return resolveHostname(opts, (err, resolved) => {
			if (err) return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
			this.logger.debug({
				tnx: "dns",
				source: opts.host,
				resolved: resolved.host,
				cached: !!resolved.cached
			}, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
			for (const key of Object.keys(resolved)) if (key.charAt(0) !== "_" && resolved[key]) opts[key] = resolved[key];
			callback(resolved);
		});
	}
	/**
	* Attempts to connect to the specified host address
	*
	* @param opts Connection options
	* @param secure Whether to use TLS
	* @internal
	*/
	_connectToHost(opts, secure) {
		if (this._destroyed || this._closing) return;
		const connectFn = secure ? tls.connect : net.connect;
		try {
			this._socket = connectFn(opts, () => this._onConnect());
			this._setupConnectionHandlers();
		} catch (E) {
			setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
			return;
		}
	}
	/**
	* Sets up connection timeout and error handlers
	* @internal
	*/
	_setupConnectionHandlers() {
		this._startPhase(Math.max((this._connectionDeadline || Date.now()) - Date.now(), 0), timeoutError("Connection timeout", "CONNECT_TIMEOUT"));
		this._socket.on("error", this._onConnectionSocketError);
	}
	/**
	* Starts the timer of a connection phase: connecting, waiting for the greeting or a TLS
	* upgrade. The phases follow one another, so starting one ends the one before
	*
	* @param timeout Time the phase may take
	* @param err Error to fail with when it takes longer
	* @internal
	*/
	_startPhase(timeout, err) {
		this._clearPhase();
		this._phaseTimer = setTimeout(() => {
			this._phaseTimer = false;
			this._onError(err, "ETIMEDOUT", false, "CONN");
		}, timeout);
	}
	/**
	* Time the greeting or a STARTTLS upgrade may take: greetingTimeout, cut short by what is left
	* of connectionTimeout
	*
	* @internal
	*/
	_remainingSetupTime() {
		return Math.min(this.options.greetingTimeout || GREETING_TIMEOUT, Math.max((this._connectionDeadline || Infinity) - Date.now(), 1));
	}
	/** @internal */
	_clearPhase() {
		clearTimeout(this._phaseTimer);
		this._phaseTimer = false;
	}
	/**
	* Sends QUIT
	*/
	quit() {
		this._sendCommand("QUIT");
		this._responseActions.push(this.close);
	}
	/**
	* Closes the connection to the server
	*/
	close() {
		this._clearPhase();
		this._responseActions = [];
		if (this._closing) return;
		this._closing = true;
		const configuredCloseTimeout = this.options.socketCloseTimeout;
		const socketCloseTimeout = typeof configuredCloseTimeout === "number" && Number.isFinite(configuredCloseTimeout) && configuredCloseTimeout >= 0 ? configuredCloseTimeout : CLOSE_TIMEOUT;
		const closeMethod = this.stage === "init" || socketCloseTimeout === 0 ? "destroy" : "end";
		this.logger.debug({ tnx: "smtp" }, "Closing connection to the server using \"%s\"", closeMethod);
		const socket = this._socket;
		if (this._currentDataStream) {
			try {
				this._currentDataStream.unpipe(this._socket);
			} catch (_E) {}
			this._currentDataStream = false;
		}
		if (this._pendingSend) {
			const { stream, onStreamError } = this._pendingSend;
			if (stream) {
				stream.removeListener("error", onStreamError);
				stream.on("error", TEARDOWN_NOOP);
				stream.destroy();
			}
			this._pendingSend = false;
		}
		if (socket && !socket.destroyed) try {
			socket.setTimeout(0);
			socket.removeListener("data", this._onSocketData);
			socket.removeListener("timeout", this._onSocketTimeout);
			socket.removeListener("close", this._onSocketClose);
			socket.removeListener("end", this._onSocketEnd);
			socket.removeListener("error", this._onSocketError);
			socket.removeListener("error", this._onConnectionSocketError);
			socket.on("error", TEARDOWN_NOOP);
			socket[closeMethod]();
			if (closeMethod === "end") {
				const closeTimer = setTimeout(() => socket.destroy(), socketCloseTimeout);
				if (typeof closeTimer.unref === "function") closeTimer.unref();
				socket.once("close", () => clearTimeout(closeTimer));
			}
		} catch (_E) {}
		this._destroy();
	}
	/**
	* Authenticate user
	*/
	login(authData, callback) {
		const isDestroyedMessage = this._isDestroyedMessage("login");
		if (isDestroyedMessage) return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
		this._auth = authData || {};
		this._authMethod = (this._auth.method || "").toString().trim().toUpperCase() || false;
		const canUseXOAuth2 = !!this._auth.oauth2 || this.customAuth.has("XOAUTH2");
		if (!this._authMethod && this._auth.oauth2 && !this._auth.credentials) this._authMethod = "XOAUTH2";
		else if (!this._authMethod || this._authMethod === "XOAUTH2" && !this._auth.oauth2) {
			const supported = this._supportedAuth.find((method) => method !== "XOAUTH2" || canUseXOAuth2);
			this._authMethod = (supported || "PLAIN").toUpperCase().trim();
		}
		if ((this._authMethod !== "XOAUTH2" || this.customAuth.has("XOAUTH2")) && (!this._auth.credentials || !this._auth.credentials.user || !this._auth.credentials.pass)) {
			if (this._auth.user && this._auth.pass || this.customAuth.has(this._authMethod)) this._auth.credentials = {
				user: this._auth.user,
				pass: this._auth.pass,
				options: this._auth.options
			};
			else return callback(this._formatError("Missing credentials for \"" + this._authMethod + "\"", "EAUTH", false, "API"));
		}
		if (this.customAuth.has(this._authMethod)) {
			const handler = this.customAuth.get(this._authMethod);
			let lastResponse;
			let returned = false;
			const resolve = () => {
				if (returned) return;
				returned = true;
				this.logger.info({
					tnx: "smtp",
					username: this._auth.user,
					action: "authenticated",
					method: this._authMethod
				}, "User %s authenticated", JSON.stringify(this._auth.user));
				this.authenticated = true;
				callback(null, true);
			};
			const reject = (err) => {
				if (returned) return;
				returned = true;
				callback(this._formatError(err, "EAUTH", lastResponse, "AUTH " + this._authMethod));
			};
			const sendCommand = (cmd, done) => {
				let promise;
				if (!done) promise = new Promise((resolve, reject) => {
					done = callbackPromise(resolve, reject);
				});
				this._responseActions.push((str) => {
					lastResponse = str;
					let codes = str.match(/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/);
					let data = {
						command: cmd,
						response: str
					};
					if (codes) {
						data.status = Number(codes[1]) || 0;
						if (codes[2]) data.code = codes[2];
						data.text = str.substr(codes[0].length);
					} else {
						data.text = str;
						data.status = 0;
					}
					done(null, data);
				});
				setImmediate(() => this._sendCommand(cmd, maskAuthCommand(cmd)));
				return promise;
			};
			const handlerResponse = handler({
				auth: this._auth,
				method: this._authMethod,
				extensions: [].concat(this._supportedExtensions),
				authMethods: [].concat(this._supportedAuth),
				maxAllowedSize: this._maxAllowedSize || false,
				sendCommand,
				resolve,
				reject
			});
			if (handlerResponse && typeof handlerResponse.catch === "function") handlerResponse.then(resolve).catch(reject);
			return;
		}
		switch (this._authMethod) {
			case "XOAUTH2":
				this._handleXOauth2Token(false, callback);
				return;
			case "LOGIN":
				this._responseActions.push((str) => {
					this._actionAUTH_LOGIN_USER(str, callback);
				});
				this._sendCommand("AUTH LOGIN");
				return;
			case "PLAIN":
				this._responseActions.push((str) => {
					this._actionAUTHComplete(str, callback);
				});
				this._sendCommand("AUTH PLAIN " + Buffer.from("\0" + this._auth.credentials.user + "\0" + this._auth.credentials.pass, "utf-8").toString("base64"), "AUTH PLAIN " + Buffer.from("\0" + this._auth.credentials.user + "\0/* secret */", "utf-8").toString("base64"));
				return;
			case "CRAM-MD5":
				this._responseActions.push((str) => {
					this._actionAUTH_CRAM_MD5(str, callback);
				});
				this._sendCommand("AUTH CRAM-MD5");
				return;
		}
		return callback(this._formatError("Unknown authentication method \"" + this._authMethod + "\"", "EAUTH", false, "API"));
	}
	/**
	* Sends a message
	*
	* @param envelope Envelope object, {from: addr, to: [addr]}
	* @param message String, Buffer or a Stream
	* @param done Callback to return once sending is completed
	*/
	send(envelope, message, done) {
		let returned = false;
		const callback = (err, info) => {
			if (returned) return;
			returned = true;
			if (this._pendingSend && this._pendingSend.callback === callback) this._pendingSend = false;
			done(err, info);
		};
		if (!message) return callback(this._formatError("Empty message", "EMESSAGE", false, "API"));
		const isDestroyedMessage = this._isDestroyedMessage("send message");
		if (isDestroyedMessage) return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
		if (this._maxAllowedSize && envelope.size > this._maxAllowedSize) {
			setImmediate(() => {
				callback(this._formatError("Message size larger than allowed " + this._maxAllowedSize, "EMESSAGE", false, "MAIL FROM"));
			});
			return;
		}
		const pendingSend = {
			callback,
			stream: false,
			onStreamError: (err) => callback(this._formatError(err, "ESTREAM", false, "API"))
		};
		if (typeof message.on === "function") {
			pendingSend.stream = message;
			pendingSend.stream.on("error", pendingSend.onStreamError);
		}
		this._pendingSend = pendingSend;
		const startTime = Date.now();
		this._setEnvelope(envelope, (err, info) => {
			if (err) {
				if (typeof message.destroy === "function") message.destroy();
				return callback(err);
			}
			const envelopeTime = Date.now();
			const stream = this._createSendStream((err, str) => {
				if (err) return callback(err);
				const result = info;
				result.envelopeTime = envelopeTime - startTime;
				result.messageTime = Date.now() - envelopeTime;
				result.messageSize = stream.outByteCount;
				result.response = str;
				const serverMessageId = parseServerMessageId(result.response, this.options.host);
				if (serverMessageId) result.serverMessageId = serverMessageId;
				const rejectedErrors = this._envelope?.rejectedErrors;
				if (!result.rejectedErrors && rejectedErrors && rejectedErrors.length) result.rejectedErrors = rejectedErrors;
				return callback(null, result);
			});
			if (typeof message.pipe === "function") message.pipe(stream);
			else {
				stream.write(message);
				stream.end();
			}
		});
	}
	/**
	* Resets connection state
	*
	* @param callback Callback to return once connection is reset
	*/
	reset(callback) {
		const isDestroyedMessage = this._isDestroyedMessage("reset");
		if (isDestroyedMessage) return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
		this._sendCommand("RSET");
		this._responseActions.push((str) => {
			if (str.charAt(0) !== "2") return callback(this._formatError("Could not reset session state. response=" + str, "EPROTOCOL", str, "RSET"));
			this._envelope = false;
			return callback(null, true);
		});
	}
	/**
	* Connection listener that is run when the connection to
	* the server is opened
	*
	* @event
	* @internal
	*/
	_onConnect() {
		const socket = this._socket;
		this._clearPhase();
		this.logger.info({
			tnx: "network",
			localAddress: socket.localAddress,
			localPort: socket.localPort,
			remoteAddress: socket.remoteAddress,
			remotePort: socket.remotePort
		}, "%s established to %s:%s", this.secure ? "Secure connection" : "Connection", socket.remoteAddress, socket.remotePort);
		if (this._destroyed) {
			this.close();
			return;
		}
		this.stage = "connected";
		socket.removeListener("data", this._onSocketData);
		socket.removeListener("timeout", this._onSocketTimeout);
		socket.removeListener("close", this._onSocketClose);
		socket.removeListener("end", this._onSocketEnd);
		socket.removeListener("error", this._onConnectionSocketError);
		socket.removeListener("error", this._onSocketError);
		socket.on("error", this._onSocketError);
		socket.on("data", this._onSocketData);
		socket.once("close", this._onSocketClose);
		socket.once("end", this._onSocketEnd);
		socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
		socket.on("timeout", this._onSocketTimeout);
		if (typeof socket.setKeepAlive === "function") socket.setKeepAlive(true, KEEPALIVE_DELAY);
		if (typeof socket.setNoDelay === "function") socket.setNoDelay(true);
		this._startPhase(this._remainingSetupTime(), timeoutError("Greeting never received", "GREETING_TIMEOUT"));
		this._responseActions.push(this._actionGreeting);
		socket.resume();
	}
	/**
	* Ends the session after a 421 reply. The replies queued for commands sent along with the
	* answered one are not going to come, so the message in flight is failed here
	*
	* @param str The 421 reply
	* @internal
	*/
	_onServerClosing(str) {
		if (this._destroyed) return;
		const pendingSend = this._pendingSend;
		const envelope = this._envelope;
		this._responseActions = [];
		this.close();
		if (pendingSend) pendingSend.callback(envelope && envelope.mailError || this._formatError("Server closed the connection", "ECONNECTION", str, "CONN"));
	}
	/**
	* 'data' listener for data coming from the server
	*
	* @event
	* @param chunk Data chunk coming from the server
	* @internal
	*/
	_onData(chunk) {
		if (this._destroyed || !chunk || !chunk.length) return;
		const maxResponseSize = this.options.maxResponseSize || MAX_RESPONSE_SIZE;
		const data = chunk.toString("binary");
		if (!data.includes("\n")) {
			this._remainder += data;
			if (this._remainder.length > maxResponseSize) return this._onResponseTooLarge();
			return;
		}
		const lines = (this._remainder + data).split(/\r?\n/);
		this._remainder = lines.pop();
		for (let i = 0, len = lines.length; i < len; i++) {
			if (this._responsePartial) this._responseQueue[this._responseQueue.length - 1] += "\n" + lines[i];
			else this._responseQueue.push(lines[i]);
			this._responsePartial = isPartialLine(lines[i]);
			if (this._responsePartial && this._responseQueue[this._responseQueue.length - 1].length > maxResponseSize) return this._onResponseTooLarge();
		}
		if (this._remainder.length > maxResponseSize) return this._onResponseTooLarge();
		if (this._responsePartial) return;
		this._processResponse();
	}
	/**
	* Drops a connection whose peer keeps extending a reply it never completes, releasing
	* whatever was buffered for that reply
	* @internal
	*/
	_onResponseTooLarge() {
		this._remainder = "";
		this._responseQueue = [];
		this._responsePartial = false;
		this._onError(/* @__PURE__ */ new Error("Server response exceeds maximum allowed size"), "EPROTOCOL", false, "CONN");
	}
	/**
	* 'error' listener for the socket
	*
	* @event
	* @param err Error object
	* @param type Error name
	* @param data Server response that triggered the error, false if there is none
	* @param command SMTP command that was in flight
	* @internal
	*/
	_onError(err, type, data, command) {
		this._clearPhase();
		if (this._destroyed) return;
		err = this._formatError(err, type, data, command);
		if (isTransientError(err)) this.logger.warn({
			tnx: "smtp",
			err
		}, "%s", err.message);
		else this.logger.error({
			tnx: "smtp",
			err
		}, "%s", err.message);
		const pendingSend = this._pendingSend;
		this.emit("error", err);
		this.close();
		if (pendingSend) pendingSend.callback(err);
	}
	/** @internal */
	_formatError(message, type, response, command) {
		let err;
		if (/Error\]$/i.test(Object.prototype.toString.call(message))) err = message;
		else err = new Error(message);
		if (type && type !== "Error" && err.code !== "ERR_ACCESS_DENIED") {
			if (err.code && err.code !== type && !err.originalCode) err.originalCode = err.code;
			err.code = type;
		}
		if (response) {
			err.response = response;
			err.message += ": " + response;
		}
		const responseCode = typeof response === "string" && Number((response.match(/^\d+/) || [])[0]) || false;
		if (responseCode) {
			err.responseCode = responseCode;
			err.permanent = isPermanentResponseCode(responseCode);
		}
		if (command) err.command = command;
		return err;
	}
	/**
	* 'close' listener for the socket
	*
	* @event
	* @internal
	*/
	_onClose() {
		let serverResponse = false;
		if (this._remainder && this._remainder.trim()) {
			this.lastServerResponse = serverResponse = decodeServerResponse(this._remainder.trim());
			if (this.options.debug || this.options.transactionLog) this.logger.debug({ tnx: "server" }, serverResponse);
		}
		this.logger.info({ tnx: "network" }, "Connection closed");
		const failureResponse = typeof serverResponse === "string" && /^[45]\d{2}[ -]/.test(serverResponse) ? serverResponse : false;
		if (this.upgrading && !this._destroyed) return this._onError(/* @__PURE__ */ new Error("Connection closed unexpectedly"), "ETLS", failureResponse, "CONN");
		if (!failureResponse && this._responseActions[0] === this._actionGreeting && this._connectCallback && !this._destroyed) {
			const connectCallback = this._connectCallback;
			this._connectCallback = false;
			const err = this._formatError(/* @__PURE__ */ new Error("Connection closed unexpectedly"), "ECONNECTION", false, "CONN");
			this.logger.warn({ tnx: "network" }, err.message);
			connectCallback(err);
			this.close();
			return;
		}
		if (!failureResponse && this.stage === "connected" && !this._responseActions.length && !this._pendingSend && !this._destroyed && !this._closing) {
			this.logger.info({ tnx: "network" }, "Server closed the idle connection");
			return this._destroy();
		}
		if (failureResponse || this._responseActions[0] !== this.close && !this._destroyed) return this._onError(/* @__PURE__ */ new Error("Connection closed unexpectedly"), "ECONNECTION", failureResponse, "CONN");
		this._destroy();
	}
	/**
	* 'end' listener for the socket
	*
	* @event
	* @internal
	*/
	_onEnd() {
		if (this._socket && !this._socket.destroyed) this._socket.end();
	}
	/**
	* 'timeout' listener for the socket
	*
	* @event
	* @internal
	*/
	_onTimeout() {
		return this._onError(timeoutError("Timeout", "SOCKET_TIMEOUT"), "ETIMEDOUT", false, "CONN");
	}
	/**
	* Destroys the client, emits 'end'
	* @internal
	*/
	_destroy() {
		if (this._destroyed) return;
		this._destroyed = true;
		this.destroyed = true;
		this._clearPhase();
		this.emit("end");
	}
	/**
	* Upgrades the connection to TLS
	*
	* @param callback Callback function to run when the connection
	*        has been secured
	* @internal
	*/
	_upgradeConnection(callback) {
		if (this._destroyed || this._closing) return;
		const discarded = this._remainder.length + this._responseQueue.reduce((total, response) => total + response.length, 0);
		if (discarded) this.logger.warn({
			tnx: "smtp",
			discarded
		}, "Discarded %s bytes received in plaintext after the STARTTLS response", discarded);
		this._plaintextEhlo = false;
		this._remainder = "";
		this._responseQueue = [];
		this._responsePartial = false;
		const socketPlain = this._socket;
		socketPlain.removeListener("data", this._onSocketData);
		socketPlain.removeListener("timeout", this._onSocketTimeout);
		socketPlain.setTimeout(0);
		const opts = Object.assign({
			socket: socketPlain,
			host: this.host
		}, this.options.tls || {});
		if (this.servername && !opts.servername) opts.servername = this.servername;
		const removePlainSocketListeners = () => {
			socketPlain.removeListener("close", this._onSocketClose);
			socketPlain.removeListener("end", this._onSocketEnd);
			socketPlain.removeListener("error", this._onSocketError);
			socketPlain.removeListener("error", this._onConnectionSocketError);
		};
		this.upgrading = true;
		this._startPhase(this._remainingSetupTime(), timeoutError("TLS handshake timed out", "UPGRADE_TIMEOUT"));
		try {
			this._socket = tls.connect(opts, () => {
				this._clearPhase();
				this.secure = true;
				this.upgrading = false;
				this._socket.on("data", this._onSocketData);
				removePlainSocketListeners();
				return callback(null, true);
			});
		} catch (err) {
			this._clearPhase();
			removePlainSocketListeners();
			return callback(err);
		}
		this._socket.on("error", this._onSocketError);
		this._socket.once("close", this._onSocketClose);
		this._socket.once("end", this._onSocketEnd);
		this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
		this._socket.on("timeout", this._onSocketTimeout);
		socketPlain.resume();
	}
	/**
	* Processes queued responses from the server
	* @internal
	*/
	_processResponse() {
		if (!this._responseQueue.length) return false;
		const raw = (this._responseQueue.shift() || "").toString();
		if (!raw.trim()) {
			setImmediate(() => this._processResponse());
			return;
		}
		if (isPartialResponse(raw)) {
			this._responseQueue.unshift(raw);
			return;
		}
		const str = this.lastServerResponse = decodeServerResponse(raw);
		if (this.options.debug || this.options.transactionLog) this.logger.debug({ tnx: "server" }, str.replace(/\r?\n$/, ""));
		const action = this._responseActions.shift();
		const closing = /^421[ -]/.test(str);
		if (typeof action === "function") {
			action.call(this, str);
			if (closing) return this._onServerClosing(str);
			setImmediate(() => this._processResponse());
		} else if (closing && !this._pendingSend && this.stage === "connected") {
			this.logger.info({ tnx: "smtp" }, "Server closed the idle connection: %s", str);
			this.close();
		} else return this._onError(/* @__PURE__ */ new Error("Unexpected Response"), "EPROTOCOL", str, "CONN");
	}
	/**
	* Send a command to the server, append \r\n
	*
	* @param str String to be sent to the server
	* @param logStr Optional string to be used for logging instead of the actual string
	* @internal
	*/
	_sendCommand(str, logStr) {
		if (this._destroyed) return;
		const socket = this._socket;
		if (socket.destroyed) return this.close();
		if (this.options.debug || this.options.transactionLog) this.logger.debug({ tnx: "client" }, (logStr || str || "").toString().replace(/\r?\n$/, ""));
		socket.write(Buffer.from(str + "\r\n", "utf-8"));
	}
	/**
	* Initiates a new message by submitting envelope data, starting with
	* MAIL FROM: command
	*
	* @param envelope Envelope object in the form of
	*        {from:'...', to:['...']}
	*        or
	*        {from:{address:'...',name:'...'}, to:[address:'...',name:'...']}
	* @param callback Callback to run once the envelope is processed
	* @internal
	*/
	_setEnvelope(envelope, callback) {
		const args = [];
		let useSmtpUtf8 = false;
		this._envelope = envelope || {};
		this._envelope.from = (this._envelope.from && this._envelope.from.address || this._envelope.from || "").toString().trim();
		this._envelope.to = [].concat(this._envelope.to || []).map((to) => (to && to.address || to || "").toString().trim());
		if (!this._envelope.to.length) return callback(this._formatError("No recipients defined", "EENVELOPE", false, "API"));
		if (this._envelope.from && /[\r\n<>]/.test(this._envelope.from)) return callback(this._formatError("Invalid sender " + JSON.stringify(this._envelope.from), "EENVELOPE", false, "API"));
		if (/[\x80-\uFFFF]/.test(this._envelope.from)) useSmtpUtf8 = true;
		for (let i = 0, len = this._envelope.to.length; i < len; i++) {
			if (!this._envelope.to[i] || /[\r\n<>]/.test(this._envelope.to[i])) return callback(this._formatError("Invalid recipient " + JSON.stringify(this._envelope.to[i]), "EENVELOPE", false, "API"));
			if (/[\x80-\uFFFF]/.test(this._envelope.to[i])) useSmtpUtf8 = true;
		}
		this._envelope.rcptQueue = [].concat(this._envelope.to || []);
		this._envelope.rejected = [];
		this._envelope.rejectedErrors = [];
		this._envelope.accepted = [];
		if (this._envelope.dsn) try {
			this._envelope.dsn = this._setDsnEnvelope(this._envelope.dsn);
		} catch (err) {
			return callback(this._formatError("Invalid DSN " + err.message, "EENVELOPE", false, "API"));
		}
		if (this._envelope.requireTLSExtensionEnabled) {
			if (!this.secure) return callback(this._formatError("REQUIRETLS can only be used over TLS connections (RFC 8689)", "EREQUIRETLS", false, "MAIL FROM"));
			if (!this._supportedExtensions.includes("REQUIRETLS")) return callback(this._formatError("Server does not support REQUIRETLS extension (RFC 8689)", "EREQUIRETLS", false, "MAIL FROM"));
		}
		this._envelope.pipelined = this._supportedExtensions.includes("PIPELINING");
		this._responseActions.push((str) => {
			this._actionMAIL(str, callback);
		});
		if (useSmtpUtf8 && this._supportedExtensions.includes("SMTPUTF8")) {
			args.push("SMTPUTF8");
			this._usingSmtpUtf8 = true;
		}
		if (this._envelope.use8BitMime && this._supportedExtensions.includes("8BITMIME")) {
			args.push("BODY=8BITMIME");
			this._using8BitMime = true;
		}
		if (this._envelope.size && this._supportedExtensions.includes("SIZE")) {
			const sizeValue = Number(this._envelope.size) || 0;
			if (sizeValue > 0) args.push("SIZE=" + sizeValue);
		}
		if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
			if (this._envelope.dsn.ret) args.push("RET=" + encodeXText(this._envelope.dsn.ret));
			if (this._envelope.dsn.envid) args.push("ENVID=" + encodeXText(this._envelope.dsn.envid));
		}
		if (this._envelope.requireTLSExtensionEnabled) args.push("REQUIRETLS");
		const mailFrom = "MAIL FROM:<" + this._envelope.from + ">" + (args.length ? " " + args.join(" ") : "");
		this._recipientQueue = [];
		if (!this._envelope.pipelined) {
			this._sendCommand(mailFrom);
			return;
		}
		const socket = this._socket;
		socket.cork();
		this._sendCommand(mailFrom);
		while (this._envelope.rcptQueue.length) this._sendRcpt(this._envelope.rcptQueue.shift(), callback);
		this._responseActions.push((str) => {
			this._actionDATA(str, callback);
		});
		this._sendCommand("DATA");
		socket.uncork();
	}
	/**
	* Sends RCPT TO for a recipient and queues the handler for the reply
	*
	* @param recipient Recipient address
	* @param callback Callback to run once the envelope is processed
	* @internal
	*/
	_sendRcpt(recipient, callback) {
		this._recipientQueue.push(recipient);
		this._responseActions.push((str) => {
			this._actionRCPT(str, callback);
		});
		this._sendCommand("RCPT TO:<" + recipient + ">" + this._getDsnRcptToArgs());
	}
	/** @internal */
	_setDsnEnvelope(params) {
		let ret = (params.ret || params.return || "").toString().toUpperCase() || null;
		if (ret) switch (ret) {
			case "HDRS":
			case "HEADERS":
				ret = "HDRS";
				break;
			case "FULL":
			case "BODY": ret = "FULL";
		}
		if (ret && !["FULL", "HDRS"].includes(ret)) throw new Error("ret: " + JSON.stringify(ret));
		const envid = (params.envid || params.id || "").toString() || null;
		let notify = params.notify || null;
		if (notify) {
			if (typeof notify === "string") notify = notify.split(",");
			notify = notify.map((n) => n.trim().toUpperCase());
			const validNotify = [
				"NEVER",
				"SUCCESS",
				"FAILURE",
				"DELAY"
			];
			if (notify.filter((n) => !validNotify.includes(n)).length || notify.length > 1 && notify.includes("NEVER")) throw new Error("notify: " + JSON.stringify(notify.join(",")));
			notify = notify.join(",");
		}
		let orcpt = (params.recipient || params.orcpt || "").toString() || null;
		if (orcpt && orcpt.indexOf(";") < 0) orcpt = "rfc822;" + orcpt;
		return {
			ret,
			envid,
			notify,
			orcpt
		};
	}
	/** @internal */
	_getDsnRcptToArgs() {
		const envelope = this._envelope;
		const args = [];
		if (envelope.dsn && this._supportedExtensions.includes("DSN")) {
			if (envelope.dsn.notify) args.push("NOTIFY=" + encodeXText(envelope.dsn.notify));
			if (envelope.dsn.orcpt) args.push("ORCPT=" + encodeXText(envelope.dsn.orcpt));
		}
		return args.length ? " " + args.join(" ") : "";
	}
	/** @internal */
	_createSendStream(callback) {
		const envelope = this._envelope;
		const dataStream = new DataStream();
		if (this.options.lmtp) envelope.accepted.forEach((recipient, i) => {
			const final = i === envelope.accepted.length - 1;
			this._responseActions.push((str) => {
				this._actionLMTPStream(recipient, final, str, callback);
			});
		});
		else this._responseActions.push((str) => {
			this._actionSMTPStream(str, callback);
		});
		this._currentDataStream = dataStream;
		dataStream.pipe(this._socket, { end: false });
		if (this.options.debug) {
			const logStream = new PassThrough();
			logStream.on("readable", () => {
				let chunk;
				while (chunk = logStream.read()) this.logger.debug({ tnx: "message" }, chunk.toString("binary").replace(/\r?\n$/, ""));
			});
			dataStream.pipe(logStream);
		}
		dataStream.once("end", () => {
			if (this._currentDataStream === dataStream) this._currentDataStream = false;
			this.logger.info({
				tnx: "message",
				inByteCount: dataStream.inByteCount,
				outByteCount: dataStream.outByteCount
			}, "<%s bytes encoded mime message (source size %s bytes)>", dataStream.outByteCount, dataStream.inByteCount);
		});
		return dataStream;
	}
	/** ACTIONS **/
	/**
	* Will be run after the connection is created and the server sends
	* a greeting. If the incoming message starts with 220 initiate
	* SMTP session by sending EHLO command
	*
	* @param str Message from the server
	* @internal
	*/
	_actionGreeting(str) {
		this._clearPhase();
		if (str.substr(0, 3) !== "220") {
			this._onError(/* @__PURE__ */ new Error("Invalid greeting. response=" + str), "EPROTOCOL", str, "CONN");
			return;
		}
		if (this.options.lmtp) {
			this._responseActions.push(this._actionLHLO);
			this._sendCommand("LHLO " + this.name);
		} else {
			this._responseActions.push(this._actionEHLO);
			this._sendCommand("EHLO " + this.name);
		}
	}
	/**
	* Handles server response for LHLO command. If it yielded in
	* error, emit 'error', otherwise treat this as an EHLO response
	*
	* @param str Message from the server
	* @internal
	*/
	_actionLHLO(str) {
		if (str.charAt(0) !== "2") {
			this._onError(/* @__PURE__ */ new Error("Invalid LHLO. response=" + str), "EPROTOCOL", str, "LHLO");
			return;
		}
		this._actionEHLO(str);
	}
	/**
	* Handles server response for EHLO command. If it yielded in
	* error, try HELO instead, otherwise initiate TLS negotiation
	* if STARTTLS is supported by the server or move into the
	* authentication phase.
	*
	* @param str Message from the server
	* @internal
	*/
	_actionEHLO(str) {
		if (str.substr(0, 3) === "421") {
			this._onError(/* @__PURE__ */ new Error("Server terminates connection. response=" + str), "ECONNECTION", str, "EHLO");
			return;
		}
		if (str.charAt(0) !== "2") {
			if (this.options.requireTLS) {
				this._onError(/* @__PURE__ */ new Error("EHLO failed but HELO does not support required STARTTLS. response=" + str), "ECONNECTION", str, "EHLO");
				return;
			}
			this._responseActions.push(this._actionHELO);
			this._sendCommand("HELO " + this.name);
			return;
		}
		if (!this.secure && !this.options.ignoreTLS && (/[ -]STARTTLS\b/im.test(str) || this.options.requireTLS)) {
			this._plaintextEhlo = str;
			this._sendCommand("STARTTLS");
			this._responseActions.push(this._actionSTARTTLS);
			return;
		}
		this._parseEhloExtensions(str);
		this.emit("connect");
	}
	/**
	* Reads the extensions and the authentication mechanisms out of an EHLO response
	*
	* @param str EHLO response from the server
	* @internal
	*/
	_parseEhloExtensions(str) {
		let match;
		this._ehloLines = str.split(/\r?\n/).map((line) => line.replace(/^\d+[ -]/, "").trim()).filter((line) => line).slice(1);
		if (/[ -]SMTPUTF8\b/im.test(str)) this._supportedExtensions.push("SMTPUTF8");
		if (/[ -]DSN\b/im.test(str)) this._supportedExtensions.push("DSN");
		if (/[ -]8BITMIME\b/im.test(str)) this._supportedExtensions.push("8BITMIME");
		if (/[ -]REQUIRETLS\b/im.test(str)) this._supportedExtensions.push("REQUIRETLS");
		if (/[ -]PIPELINING\b/im.test(str)) this._supportedExtensions.push("PIPELINING");
		if (/[ -]AUTH\b/i.test(str)) this.allowsAuth = true;
		const authMechanisms = /* @__PURE__ */ new Set();
		for (const line of this._ehloLines) {
			const authMatch = /^AUTH[\s=](.*)/i.exec(line);
			if (authMatch) for (const mechanism of authMatch[1].split(/[\s=]+/)) authMechanisms.add(mechanism.toUpperCase());
		}
		for (const mechanism of [
			"PLAIN",
			"LOGIN",
			"CRAM-MD5",
			"XOAUTH2"
		]) if (authMechanisms.has(mechanism)) this._supportedAuth.push(mechanism);
		if (match = str.match(/[ -]SIZE(?:[ \t]+(\d+))?/im)) {
			this._supportedExtensions.push("SIZE");
			this._maxAllowedSize = Number(match[1]) || 0;
		}
	}
	/**
	* Handles server response for HELO command. If it yielded in
	* error, emit 'error', otherwise move into the authentication phase.
	*
	* @param str Message from the server
	* @internal
	*/
	_actionHELO(str) {
		if (str.charAt(0) !== "2") {
			this._onError(/* @__PURE__ */ new Error("Invalid HELO. response=" + str), "EPROTOCOL", str, "HELO");
			return;
		}
		this.allowsAuth = true;
		this.emit("connect");
	}
	/**
	* Handles server response for STARTTLS command. If there's an error
	* try HELO instead, otherwise initiate TLS upgrade. If the upgrade
	* succeedes restart the EHLO
	*
	* @param str Message from the server
	* @internal
	*/
	_actionSTARTTLS(str) {
		if (str.charAt(0) !== "2") {
			if (this.options.opportunisticTLS) {
				this.logger.info({ tnx: "smtp" }, "Failed STARTTLS upgrade, continuing unencrypted");
				if (this._plaintextEhlo) {
					this._parseEhloExtensions(this._plaintextEhlo);
					this._plaintextEhlo = false;
					this.allowsAuth = false;
					this._supportedAuth = [];
				}
				this.emit("connect");
				return;
			}
			this._onError(/* @__PURE__ */ new Error("Error upgrading connection with STARTTLS"), "ETLS", str, "STARTTLS");
			return;
		}
		this._upgradeConnection((err, secured) => {
			if (err) {
				this._onError(/* @__PURE__ */ new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "STARTTLS");
				return;
			}
			this.logger.info({ tnx: "smtp" }, "Connection upgraded with STARTTLS");
			if (secured) {
				if (this.options.lmtp) {
					this._responseActions.push(this._actionLHLO);
					this._sendCommand("LHLO " + this.name);
				} else {
					this._responseActions.push(this._actionEHLO);
					this._sendCommand("EHLO " + this.name);
				}
			} else this.emit("connect");
		});
	}
	/**
	* Handle the response for AUTH LOGIN command. We are expecting
	* '334 VXNlcm5hbWU6' (base64 for 'Username:'). Data to be sent as
	* response needs to be base64 encoded username. We do not need
	* exact match but settle with 334 response in general as some
	* hosts invalidly use a longer message than VXNlcm5hbWU6
	*
	* @param str Message from the server
	* @param callback Callback to run once the authentication sequence completes
	* @internal
	*/
	_actionAUTH_LOGIN_USER(str, callback) {
		if (!/^334[ -]/.test(str)) {
			callback(this._formatError("Invalid login sequence while waiting for \"334 VXNlcm5hbWU6\"", "EAUTH", str, "AUTH LOGIN"));
			return;
		}
		this._responseActions.push((str) => {
			this._actionAUTH_LOGIN_PASS(str, callback);
		});
		this._sendCommand(Buffer.from(this._auth.credentials.user + "", "utf-8").toString("base64"));
	}
	/**
	* Handle the response for AUTH CRAM-MD5 command. We are expecting
	* '334 <challenge string>'. Data to be sent as response needs to be
	* base64 decoded challenge string, MD5 hashed using the password as
	* a HMAC key, prefixed by the username and a space, and finally all
	* base64 encoded again.
	*
	* @param str Message from the server
	* @param callback Callback to run once the authentication sequence completes
	* @internal
	*/
	_actionAUTH_CRAM_MD5(str, callback) {
		const challengeMatch = str.match(/^334\s+(.+)$/);
		if (!challengeMatch) return callback(this._formatError("Invalid login sequence while waiting for server challenge string", "EAUTH", str, "AUTH CRAM-MD5"));
		const base64decoded = Buffer.from(challengeMatch[1], "base64").toString("ascii");
		const hmacMD5 = crypto.createHmac("md5", this._auth.credentials.pass);
		hmacMD5.update(base64decoded);
		const prepended = this._auth.credentials.user + " " + hmacMD5.digest("hex");
		this._responseActions.push((str) => {
			this._actionAUTH_CRAM_MD5_PASS(str, callback);
		});
		this._sendCommand(Buffer.from(prepended).toString("base64"), Buffer.from(this._auth.credentials.user + " /* secret */").toString("base64"));
	}
	/**
	* Handles the response to CRAM-MD5 authentication, if there's no error,
	* the user can be considered logged in. Start waiting for a message to send
	*
	* @param str Message from the server
	* @param callback Callback to run once the authentication sequence completes
	* @internal
	*/
	_actionAUTH_CRAM_MD5_PASS(str, callback) {
		if (!str.match(/^235\s+/)) return callback(this._formatError("Invalid login sequence while waiting for \"235\"", "EAUTH", str, "AUTH CRAM-MD5"));
		this.logger.info({
			tnx: "smtp",
			username: this._auth.user,
			action: "authenticated",
			method: this._authMethod
		}, "User %s authenticated", JSON.stringify(this._auth.user));
		this.authenticated = true;
		callback(null, true);
	}
	/**
	* Handle the response for AUTH LOGIN command. We are expecting
	* '334 UGFzc3dvcmQ6' (base64 for 'Password:'). Data to be sent as
	* response needs to be base64 encoded password.
	*
	* @param str Message from the server
	* @param callback Callback to run once the authentication sequence completes
	* @internal
	*/
	_actionAUTH_LOGIN_PASS(str, callback) {
		if (!/^334[ -]/.test(str)) return callback(this._formatError("Invalid login sequence while waiting for \"334 UGFzc3dvcmQ6\"", "EAUTH", str, "AUTH LOGIN"));
		this._responseActions.push((str) => {
			this._actionAUTHComplete(str, callback);
		});
		this._sendCommand(Buffer.from((this._auth.credentials.pass || "").toString(), "utf-8").toString("base64"), Buffer.from("/* secret */", "utf-8").toString("base64"));
	}
	/**
	* Handles the response for authentication, if there's no error,
	* the user can be considered logged in. Start waiting for a message to send
	*
	* @param str Message from the server
	* @param isRetry True if this is a retry after a failed login, or the callback itself
	* @param [callback] Callback to run once the authentication sequence completes
	* @internal
	*/
	_actionAUTHComplete(str, isRetry, callback) {
		if (!callback && typeof isRetry === "function") {
			callback = isRetry;
			isRetry = false;
		}
		if (str.substr(0, 3) === "334") {
			this._responseActions.push((str) => {
				if (isRetry || this._authMethod !== "XOAUTH2") this._actionAUTHComplete(str, true, callback);
				else setImmediate(() => this._handleXOauth2Token(true, callback));
			});
			this._sendCommand("");
			return;
		}
		if (str.charAt(0) !== "2") {
			this.logger.info({
				tnx: "smtp",
				username: this._auth.user,
				action: "authfail",
				method: this._authMethod
			}, "User %s failed to authenticate", JSON.stringify(this._auth.user));
			return callback(this._formatError("Invalid login", "EAUTH", str, "AUTH " + this._authMethod));
		}
		this.logger.info({
			tnx: "smtp",
			username: this._auth.user,
			action: "authenticated",
			method: this._authMethod
		}, "User %s authenticated", JSON.stringify(this._auth.user));
		this.authenticated = true;
		callback(null, true);
	}
	/**
	* Handle response for a MAIL FROM: command
	*
	* @param str Message from the server
	* @param callback Callback to run once the envelope is processed
	* @internal
	*/
	_actionMAIL(str, callback) {
		const envelope = this._envelope;
		if (Number(str.charAt(0)) !== 2) {
			const message = this._usingSmtpUtf8 && /^550 /.test(str) && /[\x80-\uFFFF]/.test(envelope.from) ? "Internationalized mailbox name not allowed" : "Mail command failed";
			envelope.mailError = this._formatError(message, "EENVELOPE", str, "MAIL FROM");
		}
		this._advanceEnvelope(str, callback);
	}
	/**
	* Handle response for a RCPT TO: command
	*
	* @param str Message from the server
	* @param callback Callback to run once the envelope is processed
	* @internal
	*/
	_actionRCPT(str, callback) {
		const envelope = this._envelope;
		let err;
		const curRecipient = this._recipientQueue.shift();
		if (Number(str.charAt(0)) !== 2) {
			const message = this._usingSmtpUtf8 && /^553 /.test(str) && /[\x80-\uFFFF]/.test(curRecipient) ? "Internationalized mailbox name not allowed" : "Recipient command failed";
			envelope.rejected.push(curRecipient);
			err = this._formatError(message, "EENVELOPE", str, "RCPT TO");
			err.recipient = curRecipient;
			envelope.rejectedErrors.push(err);
		} else envelope.accepted.push(curRecipient);
		this._advanceEnvelope(str, callback);
	}
	/**
	* Moves the envelope on after a reply to MAIL FROM or RCPT TO. A pipelined envelope sent every
	* command at once and is decided by the reply to DATA. Otherwise the commands go one at a
	* time: the next recipient, or once every reply is in, DATA or the error that ends the message
	*
	* @param str The reply that was handled
	* @param callback Callback to run once the envelope is processed
	* @internal
	*/
	_advanceEnvelope(str, callback) {
		const envelope = this._envelope;
		if (envelope.pipelined) return;
		if (envelope.mailError) return callback(envelope.mailError);
		if (envelope.rcptQueue.length) return this._sendRcpt(envelope.rcptQueue.shift(), callback);
		if (this._recipientQueue.length) return;
		const err = this._envelopeError(str);
		if (err) return callback(err);
		this._responseActions.push((str) => {
			this._actionDATA(str, callback);
		});
		this._sendCommand("DATA");
	}
	/**
	* Decides how the envelope went once every reply to MAIL FROM and RCPT TO is in. Called after
	* the last RCPT TO reply, or with PIPELINING on the reply to the DATA command sent along
	*
	* @param str The reply being handled
	* @returns The error to fail the message with, or null when DATA can go ahead
	* @internal
	*/
	_envelopeError(str) {
		const envelope = this._envelope;
		if (envelope.mailError) return envelope.mailError;
		if (envelope.accepted.length) return null;
		const deferred = envelope.rejectedErrors.find((rejectedErr) => rejectedErr.responseCode && rejectedErr.responseCode < 500);
		const lastRejected = envelope.rejectedErrors[envelope.rejectedErrors.length - 1];
		const reply = deferred?.response ?? (envelope.pipelined && lastRejected ? lastRejected.response : str);
		const err = this._formatError("Can't send mail - all recipients were rejected", "EENVELOPE", reply, "RCPT TO");
		err.rejected = envelope.rejected;
		err.rejectedErrors = envelope.rejectedErrors;
		return err;
	}
	/**
	* Handle response for a DATA command
	*
	* @param str Message from the server
	* @param callback Callback to run once the envelope is processed
	* @internal
	*/
	_actionDATA(str, callback) {
		const envelope = this._envelope;
		if (envelope.pipelined) {
			const err = this._envelopeError(str);
			if (err) {
				if (/^3/.test(str)) {
					if (envelope.mailError) {
						this.close();
						return callback(err);
					}
					this._responseActions.push(() => callback(err));
					this._sendCommand(".");
					return;
				}
				return callback(err);
			}
		}
		if (!/^[23]/.test(str)) return callback(this._formatError("Data command failed", "EENVELOPE", str, "DATA"));
		const response = {
			accepted: envelope.accepted,
			rejected: envelope.rejected
		};
		if (this._ehloLines && this._ehloLines.length) response.ehlo = this._ehloLines;
		if (envelope.rejectedErrors.length) response.rejectedErrors = envelope.rejectedErrors;
		callback(null, response);
	}
	/**
	* Handle response for a DATA stream when using SMTP
	* We expect a single response that defines if the sending succeeded or failed
	*
	* @param str Message from the server
	* @param callback Callback to run with the final send result
	* @internal
	*/
	_actionSMTPStream(str, callback) {
		if (Number(str.charAt(0)) !== 2) return callback(this._formatError("Message failed", "EMESSAGE", str, "DATA"));
		return callback(null, str);
	}
	/**
	* Handle response for a DATA stream
	* We expect a separate response for every recipient. All recipients can either
	* succeed or fail separately
	*
	* @param recipient The recipient this response applies to
	* @param final Is this the final recipient?
	* @param str Message from the server
	* @param callback Callback to run with the final send result
	* @internal
	*/
	_actionLMTPStream(recipient, final, str, callback) {
		const envelope = this._envelope;
		let err;
		if (Number(str.charAt(0)) !== 2) {
			err = this._formatError("Message failed for recipient " + recipient, "EMESSAGE", str, "DATA");
			err.recipient = recipient;
			envelope.rejected.push(recipient);
			envelope.rejectedErrors.push(err);
			for (let i = 0, len = envelope.accepted.length; i < len; i++) if (envelope.accepted[i] === recipient) envelope.accepted.splice(i, 1);
		}
		if (final) return callback(null, str);
	}
	/** @internal */
	_handleXOauth2Token(isRetry, callback) {
		this._auth.oauth2.getToken(isRetry, (err, accessToken) => {
			if (err) {
				this.logger.info({
					tnx: "smtp",
					username: this._auth.user,
					action: "authfail",
					method: this._authMethod
				}, "User %s failed to authenticate", JSON.stringify(this._auth.user));
				return callback(this._formatError(err, "EAUTH", false, "AUTH XOAUTH2"));
			}
			this._responseActions.push((str) => {
				this._actionAUTHComplete(str, isRetry, callback);
			});
			this._sendCommand("AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token(accessToken), "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token("/* secret */"));
		});
	}
	/**
	*
	* @param command
	* @internal
	*/
	_isDestroyedMessage(command) {
		if (this._destroyed) return "Cannot " + command + " - smtp connection is already destroyed.";
		if (this._socket) {
			if (this._socket.destroyed) return "Cannot " + command + " - smtp connection socket is already destroyed.";
			if (!this._socket.writable) return "Cannot " + command + " - smtp connection socket is already half-closed.";
		}
	}
	/** @internal */
	_getHostname() {
		let defaultHostname;
		try {
			defaultHostname = os.hostname() || "";
		} catch (_err) {
			defaultHostname = "localhost";
		}
		if (!defaultHostname || defaultHostname.indexOf(".") < 0) defaultHostname = "[127.0.0.1]";
		if (defaultHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) defaultHostname = "[" + defaultHostname + "]";
		return defaultHostname;
	}
};
// node_modules/nodemailer/dist/esm/xoauth2/index.js
/**
* XOAUTH2 access_token generator for Gmail.
* Create client ID for web applications in Google API console to use it.
* See Offline Access for receiving the needed refreshToken for an user
* https://developers.google.com/accounts/docs/OAuth2WebServer#offline
*
* Usage for generating access tokens with a custom method using provisionCallback:
* provisionCallback(user, renew, callback)
*   * user is the username to get the token for
*   * renew is a boolean that if true indicates that existing token failed and needs to be renewed
*   * callback is the callback to run with (error, accessToken [, expires])
*     * accessToken is a string
*     * expires is an optional expire time in milliseconds
* If provisionCallback is used, then Nodemailer does not try to attempt generating the token by itself
*
* @constructor
* @param options Client information for token generation
* @param options.user User e-mail address
* @param options.clientId Client ID value
* @param options.clientSecret Client secret value
* @param options.refreshToken Refresh token for an user
* @param options.accessUrl Endpoint for token generation, defaults to 'https://accounts.google.com/o/oauth2/token'
* @param options.accessToken An existing valid accessToken
* @param options.privateKey Private key for JSW
* @param options.expires Optional Access Token expire time in ms
* @param options.timeout Optional TTL for Access Token in seconds
* @param options.provisionCallback Function to run when a new access token is required
* @param options.tls Optional TLS options forwarded to the HTTPS token request. Defaults to strict cert validation; supply { rejectUnauthorized: false } only for self-hosted OAuth providers on private CAs.
*/
var XOAuth2 = class extends Stream {
	constructor(options, logger) {
		super();
		this.options = options || {};
		this.configError = false;
		if (options && options.serviceClient) {
			if (!options.privateKey || !options.user) {
				const err = /* @__PURE__ */ new Error("Options \"privateKey\" and \"user\" are required for service account!");
				err.code = EOAUTH2;
				this.configError = err;
			}
			const serviceRequestTimeout = Math.min(Math.max(Number(this.options.serviceRequestTimeout) || 0, 0), 3600);
			this.options.serviceRequestTimeout = serviceRequestTimeout || 300;
		}
		this.logger = getLogger({ logger }, { component: this.options.component || "OAuth2" });
		this.provisionCallback = typeof this.options.provisionCallback === "function" ? this.options.provisionCallback : false;
		this.options.accessUrl = this.options.accessUrl || "https://accounts.google.com/o/oauth2/token";
		this.options.customHeaders = this.options.customHeaders || {};
		this.options.customParams = this.options.customParams || {};
		this.accessToken = this.options.accessToken || false;
		if (this.options.expires && Number(this.options.expires)) this.expires = this.options.expires;
		else {
			const timeout = Math.max(Number(this.options.timeout) || 0, 0);
			this.expires = timeout && Date.now() + timeout * 1e3 || 0;
		}
		this.renewing = false;
		this.renewalQueue = [];
	}
	/**
	* Returns or generates (if previous has expired) a XOAuth2 token
	*
	* @param renew If false then use cached access token (if available)
	* @param callback Callback function with error object and token string
	*/
	getToken(renew, callback) {
		const done = callback;
		if (this.configError) return done(this.configError);
		if (!renew && this.accessToken && (!this.expires || this.expires > Date.now())) {
			this.logger.debug({
				tnx: "OAUTH2",
				user: this.options.user,
				action: "reuse"
			}, "Reusing existing access token for %s", this.options.user);
			return callback(null, this.accessToken);
		}
		if (!this.provisionCallback && !this.options.refreshToken && !this.options.serviceClient) {
			if (this.accessToken) {
				this.logger.debug({
					tnx: "OAUTH2",
					user: this.options.user,
					action: "reuse"
				}, "Reusing existing access token (no refresh capability) for %s", this.options.user);
				return callback(null, this.accessToken);
			}
			this.logger.error({
				tnx: "OAUTH2",
				user: this.options.user,
				action: "renew"
			}, "Cannot renew access token for %s: No refresh mechanism available", this.options.user);
			const err = /* @__PURE__ */ new Error("Can't create new access token for user");
			err.code = EOAUTH2;
			return done(err);
		}
		if (this.renewing) {
			this.renewalQueue.push({
				renew,
				callback: done
			});
			return;
		}
		this.renewing = true;
		const generateCallback = (err, accessToken) => {
			this.renewalQueue.forEach((item) => item.callback(err, accessToken));
			this.renewalQueue = [];
			this.renewing = false;
			if (err) this.logger.error({
				err,
				tnx: "OAUTH2",
				user: this.options.user,
				action: "renew"
			}, "Failed generating new Access Token for %s", this.options.user);
			else this.logger.info({
				tnx: "OAUTH2",
				user: this.options.user,
				action: "renew"
			}, "Generated new Access Token for %s", this.options.user);
			done(err, accessToken);
		};
		if (this.provisionCallback) this.provisionCallback(this.options.user, !!renew, (err, accessToken, expires) => {
			if (!err && accessToken) {
				this.accessToken = accessToken;
				this.expires = expires || 0;
			}
			generateCallback(err, accessToken);
		});
		else this.generateToken(generateCallback);
	}
	/**
	* Updates token values
	*
	* @param accessToken New access token
	* @param timeout Access token lifetime in seconds
	*
	* Emits 'token': { user: User email-address, accessToken: the new accessToken, timeout: TTL in seconds}
	*/
	updateToken(accessToken, timeout) {
		this.accessToken = accessToken;
		timeout = Math.max(Number(timeout) || 0, 0);
		this.expires = timeout && Date.now() + timeout * 1e3 || 0;
		this.emit("token", {
			user: this.options.user,
			accessToken: accessToken || "",
			expires: this.expires
		});
	}
	/**
	* Generates a new XOAuth2 token with the credentials provided at initialization
	*
	* @param callback Callback function with error object and token string
	*/
	generateToken(callback) {
		const done = callback;
		let urlOptions;
		let loggedUrlOptions;
		if (this.options.serviceClient) {
			const iat = Math.floor(Date.now() / 1e3);
			const tokenData = {
				iss: this.options.serviceClient,
				scope: this.options.scope || "https://mail.google.com/",
				sub: this.options.user,
				aud: this.options.accessUrl,
				iat,
				exp: iat + this.options.serviceRequestTimeout
			};
			let token;
			try {
				token = this.jwtSignRS256(tokenData);
			} catch (_err) {
				const err = /* @__PURE__ */ new Error("Can't generate token. Check your auth options");
				err.code = EOAUTH2;
				return done(err);
			}
			urlOptions = {
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: token
			};
			loggedUrlOptions = {
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: tokenData
			};
		} else {
			if (!this.options.refreshToken) {
				const err = /* @__PURE__ */ new Error("Can't create new access token for user");
				err.code = EOAUTH2;
				return done(err);
			}
			urlOptions = {
				client_id: this.options.clientId || "",
				client_secret: this.options.clientSecret || "",
				refresh_token: this.options.refreshToken,
				grant_type: "refresh_token"
			};
			loggedUrlOptions = {
				client_id: this.options.clientId || "",
				client_secret: (this.options.clientSecret || "").substr(0, 6) + "...",
				refresh_token: (this.options.refreshToken || "").substr(0, 6) + "...",
				grant_type: "refresh_token"
			};
		}
		const customParams = this.options.customParams || {};
		Object.assign(urlOptions, customParams);
		for (const key of Object.keys(customParams)) {
			const param = customParams[key];
			loggedUrlOptions[key] = (param === void 0 || param === null ? "" : String(param)).substr(0, 6) + "...";
		}
		this.logger.debug({
			tnx: "OAUTH2",
			user: this.options.user,
			action: "generate"
		}, "Requesting token using: %s", JSON.stringify(loggedUrlOptions));
		this.postRequest(this.options.accessUrl, urlOptions, this.options, (error, body) => {
			let data;
			if (error) return done(error);
			try {
				data = JSON.parse(body.toString());
			} catch (E) {
				return done(E);
			}
			if (!data || typeof data !== "object") {
				this.logger.debug({
					tnx: "OAUTH2",
					user: this.options.user,
					action: "post"
				}, "Response: %s", (body || "").toString());
				const err = /* @__PURE__ */ new Error("Invalid authentication response");
				err.code = EOAUTH2;
				return done(err);
			}
			const logData = Object.assign({}, data);
			if (logData.access_token) logData.access_token = (logData.access_token || "").toString().substr(0, 6) + "...";
			this.logger.debug({
				tnx: "OAUTH2",
				user: this.options.user,
				action: "post"
			}, "Response: %s", JSON.stringify(logData));
			if (data.error) {
				let errorMessage = data.error;
				if (data.error_description) errorMessage += ": " + data.error_description;
				if (data.error_uri) errorMessage += " (" + data.error_uri + ")";
				const err = new Error(errorMessage);
				err.code = EOAUTH2;
				return done(err);
			}
			if (data.access_token) {
				this.updateToken(data.access_token, data.expires_in);
				return callback(null, this.accessToken);
			}
			const err = /* @__PURE__ */ new Error("No access token");
			err.code = EOAUTH2;
			return done(err);
		});
	}
	/**
	* Converts an access_token and user id into a base64 encoded XOAuth2 token
	*
	* @param [accessToken] Access token string
	* @return Base64 encoded token for IMAP or SMTP login
	*/
	buildXOAuth2Token(accessToken) {
		const authData = [
			"user=" + (this.options.user || ""),
			"auth=Bearer " + (accessToken || this.accessToken),
			"",
			""
		];
		return Buffer.from(authData.join(""), "utf-8").toString("base64");
	}
	/**
	* Custom POST request handler.
	* This is only needed to keep paths short in Windows, usually this module
	* is a dependency of a dependency and if it tries to require something
	* like the request module the paths get way too long to handle for Windows.
	* As we do only a simple POST request we do not actually require complicated
	* logic support (no redirects, no nothing) anyway.
	*
	* @param url Url to POST to
	* @param payload Payload to POST
	* @param params Client options, the customHeaders and tls values are used for the request
	* @param callback Callback function with (err, buff)
	*/
	postRequest(url, payload, params, callback) {
		let returned = false;
		const chunks = [];
		let chunklen = 0;
		const fetchOptions = {
			method: "post",
			headers: params.customHeaders,
			body: payload,
			allowErrorResponse: true,
			timeout: params.requestTimeout
		};
		if (/^https:/i.test(url)) fetchOptions.tls = Object.assign({ rejectUnauthorized: true }, params.tls || {});
		const req = nmfetch(url, fetchOptions);
		req.on("readable", () => {
			let chunk;
			while ((chunk = req.read()) !== null) {
				chunks.push(chunk);
				chunklen += chunk.length;
			}
		});
		req.once("error", (err) => {
			if (returned) return;
			returned = true;
			return callback(err);
		});
		req.once("end", () => {
			if (returned) return;
			returned = true;
			return callback(null, Buffer.concat(chunks, chunklen));
		});
	}
	/**
	* Encodes a buffer or a string into Base64url format
	*
	* @param data The data to convert
	* @return The encoded string
	*/
	toBase64URL(data) {
		if (typeof data === "string") data = Buffer.from(data);
		return data.toString("base64").replace(/[=]+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	}
	/**
	* Creates a JSON Web Token signed with RS256 (SHA256 + RSA)
	*
	* @param payload The payload to include in the generated token
	* @return The generated and signed token
	*/
	jwtSignRS256(payload) {
		const signedPayload = ["{\"alg\":\"RS256\",\"typ\":\"JWT\"}", JSON.stringify(payload)].map((val) => this.toBase64URL(val)).join(".");
		const signature = crypto.createSign("RSA-SHA256").update(signedPayload).sign(this.options.privateKey);
		return signedPayload + "." + this.toBase64URL(signature);
	}
};
// node_modules/nodemailer/dist/esm/smtp-pool/pool-resource.js
/**
* Creates an element for the pool
*
* @constructor
* @param pool SMTPPool instance
*/
var PoolResource = class extends EventEmitter {
	constructor(pool) {
		super();
		this.pool = pool;
		this.options = pool.options;
		this.logger = this.pool.logger;
		if (this.options.auth) switch ((this.options.auth.type || "").toString().toUpperCase()) {
			case "OAUTH2": {
				const oauth2 = new XOAuth2(this.options.auth, this.logger);
				oauth2.provisionCallback = this.pool.mailer && this.pool.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
				this.auth = {
					type: "OAUTH2",
					user: this.options.auth.user,
					oauth2,
					method: "XOAUTH2"
				};
				oauth2.on("token", (token) => this.pool.mailer.emit("token", token));
				oauth2.on("error", (err) => this._fail(err));
				break;
			}
			default:
				if (!this.options.auth.user && !this.options.auth.pass) break;
				this.auth = {
					type: (this.options.auth.type || "").toString().toUpperCase() || "LOGIN",
					user: this.options.auth.user,
					credentials: {
						user: this.options.auth.user || "",
						pass: this.options.auth.pass,
						options: this.options.auth.options
					},
					method: (this.options.auth.method || "").trim().toUpperCase() || this.options.authMethod || false
				};
		}
		this._connection = false;
		this._connected = false;
		this._closed = false;
		this.messages = 0;
		this.available = true;
		this._failed = false;
		this._sending = false;
		this._idleTimer = false;
	}
	/**
	* Emits 'error' for the first failure only. A dead resource can report the same failure more
	* than once (the connection error, then the send callback), the pool handles it once
	* @internal
	*/
	_fail(err) {
		if (this._failed) return;
		this._failed = true;
		this.emit("error", err);
	}
	/**
	* Initiates a connection to the SMTP server
	*
	* @param callback Callback function to run once the connection is established or failed
	*/
	connect(callback) {
		const connectStartedAt = Date.now();
		this.pool.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
			if (this._closed) {
				socketOptions && socketOptions.connection?.destroy();
				return;
			}
			if (err) {
				this._fail(err);
				return callback(err);
			}
			let returned = false;
			let options = this.options;
			if (socketOptions && socketOptions.connection) {
				this.logger.info({
					tnx: "proxy",
					remoteAddress: socketOptions.connection.remoteAddress,
					remotePort: socketOptions.connection.remotePort,
					destHost: options.host || "",
					destPort: options.port || "",
					action: "connected"
				}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
				options = Object.assign(assign(false, options), socketOptions);
			}
			this.connection = new SMTPConnection(options);
			this.connection._connectStartedAt = connectStartedAt;
			this.connection.on("error", (err) => {
				if (this._closed || this._sending) return;
				if (this._connected && isTransientError(err)) {
					this.logger.info({
						tnx: "pool",
						cid: this.id
					}, "Connection #%s was closed by the server: %s", this.id, err.message);
					return;
				}
				this._fail(err);
				if (returned || this._closed) return;
				returned = true;
				return callback(err);
			});
			this.connection.once("end", () => {
				this.close();
				returned = true;
			});
			this.connection.connect((err) => {
				if (returned || this._closed) return;
				if (err) {
					returned = true;
					return;
				}
				if (this.auth && (this.connection.allowsAuth || options.forceAuth)) this.connection.login(this.auth, (err) => {
					if (returned || this._closed) return;
					returned = true;
					if (err) {
						this.connection.close();
						this._fail(err);
						return callback(err);
					}
					this._connected = true;
					callback(null, true);
				});
				else {
					returned = true;
					this._connected = true;
					return callback(null, true);
				}
			});
		});
	}
	/**
	* Sends an e-mail to be sent using the selected settings
	*
	* @param mail Mail object
	* @param callback Callback function
	*/
	send(mail, callback) {
		if (this._closed) return;
		if (!this._connected) return this.connect((err) => {
			if (err) return callback(err);
			return this.send(mail, callback);
		});
		const envelope = mail.message.getEnvelope();
		const messageId = mail.message.messageId();
		const recipients = [].concat(envelope.to || []);
		if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
		this.logger.info({
			tnx: "send",
			messageId,
			cid: this.id
		}, "Sending message %s using #%s to <%s>", messageId, this.id, recipients.join(", "));
		if (mail.data.dsn) envelope.dsn = mail.data.dsn;
		if (mail.data.requireTLSExtensionEnabled) envelope.requireTLSExtensionEnabled = mail.data.requireTLSExtensionEnabled;
		this._sending = true;
		const reused = this.messages > 0;
		const messageStream = mail.message.createReadStream();
		this.connection.send(envelope, messageStream, (err, info) => {
			if (mail.data.signal?.aborted) return;
			this._sending = false;
			this.messages++;
			if (err) {
				if (reused && messageStream.readableDidRead === false && isTransientError(err)) {
					this.logger.info({
						tnx: "pool",
						cid: this.id,
						messageId
					}, "Connection #%s was closed by the server before message %s was sent: %s", this.id, messageId, err.message);
					this.connection.close();
					return;
				}
				if ((err.code === "EENVELOPE" || err.code === "EMESSAGE") && err.responseCode !== 421 && !this.connection._destroyed) {
					this.connection.reset((resetErr) => {
						if (resetErr) {
							this.connection.close();
							return;
						}
						this._release();
					});
					return callback(err);
				}
				this.connection.close();
				this._fail(err);
				return callback(err);
			}
			info.envelope = {
				from: envelope.from,
				to: envelope.to
			};
			info.messageId = messageId;
			setImmediate(() => this._release());
			callback(null, info);
		});
	}
	/**
	* Makes the connection available for the next message, or closes it once it has sent
	* maxMessages messages
	*
	* @internal
	*/
	_release() {
		if (this._closed) return;
		if (this.messages >= this.options.maxMessages) {
			const err = /* @__PURE__ */ new Error("Resource exhausted");
			err.code = EMAXLIMIT;
			this.connection.close();
			this._fail(err);
			return;
		}
		this.pool._checkRateLimit(() => {
			if (this._closed) return;
			this.available = true;
			this._startIdleTimer();
			this.emit("available");
		});
	}
	/** @internal */
	_startIdleTimer() {
		if (!this.options.idleTimeout || this.options.idleTimeout < 0) return;
		if (this._idleTimer && typeof this._idleTimer.refresh === "function") {
			this._idleTimer.refresh();
			return;
		}
		clearTimeout(this._idleTimer);
		this._idleTimer = setTimeout(() => {
			if (!this.available) return;
			this.logger.debug({
				tnx: "pool",
				cid: this.id
			}, "Closing connection #%s after it was idle for %sms", this.id, this.options.idleTimeout);
			this.available = false;
			this.connection.quit();
		}, this.options.idleTimeout);
		if (typeof this._idleTimer.unref === "function") this._idleTimer.unref();
	}
	/** @internal */
	_stopIdleTimer() {
		clearTimeout(this._idleTimer);
		this._idleTimer = false;
	}
	/**
	* Closes the connection
	*/
	close() {
		if (this._closed) return;
		this._closed = true;
		this.available = false;
		this._connected = false;
		this._stopIdleTimer();
		if (this.auth && this.auth.oauth2) this.auth.oauth2.removeAllListeners();
		if (this.connection) this.connection.close();
		this.emit("close");
	}
};
// node_modules/nodemailer/dist/esm/well-known/services.js
const services = {
	"126": {
		"description": "126 Mail (NetEase)",
		"host": "smtp.126.com",
		"port": 465,
		"secure": true
	},
	"163": {
		"description": "163 Mail (NetEase)",
		"host": "smtp.163.com",
		"port": 465,
		"secure": true
	},
	"1und1": {
		"description": "1&1 Mail (German hosting provider)",
		"host": "smtp.1und1.de",
		"port": 465,
		"secure": true,
		"authMethod": "LOGIN"
	},
	"Aliyun": {
		"description": "Alibaba Cloud Mail",
		"domains": ["aliyun.com"],
		"host": "smtp.aliyun.com",
		"port": 465,
		"secure": true
	},
	"AliyunQiye": {
		"description": "Alibaba Cloud Enterprise Mail",
		"host": "smtp.qiye.aliyun.com",
		"port": 465,
		"secure": true
	},
	"AOL": {
		"description": "AOL Mail",
		"domains": ["aol.com"],
		"host": "smtp.aol.com",
		"port": 587
	},
	"Aruba": {
		"description": "Aruba PEC (Italian email provider)",
		"domains": ["aruba.it", "pec.aruba.it"],
		"aliases": ["Aruba PEC"],
		"host": "smtps.aruba.it",
		"port": 465,
		"secure": true,
		"authMethod": "LOGIN"
	},
	"Bluewin": {
		"description": "Bluewin (Swiss email provider)",
		"host": "smtpauths.bluewin.ch",
		"domains": ["bluewin.ch"],
		"port": 465
	},
	"BOL": {
		"description": "BOL Mail (Brazilian provider)",
		"domains": ["bol.com.br"],
		"host": "smtp.bol.com.br",
		"port": 587,
		"requireTLS": true
	},
	"DebugMail": {
		"description": "DebugMail (email testing service)",
		"host": "debugmail.io",
		"port": 25
	},
	"Disroot": {
		"description": "Disroot (privacy-focused provider)",
		"domains": ["disroot.org"],
		"host": "disroot.org",
		"port": 587,
		"secure": false,
		"authMethod": "LOGIN"
	},
	"DynectEmail": {
		"description": "Dyn Email Delivery",
		"aliases": ["Dynect"],
		"host": "smtp.dynect.net",
		"port": 25
	},
	"ElasticEmail": {
		"description": "Elastic Email",
		"aliases": ["Elastic Email"],
		"host": "smtp.elasticemail.com",
		"port": 465,
		"secure": true
	},
	"Ethereal": {
		"description": "Ethereal Email (email testing service)",
		"aliases": ["ethereal.email"],
		"host": "smtp.ethereal.email",
		"port": 587
	},
	"FastMail": {
		"description": "FastMail",
		"domains": ["fastmail.com", "fastmail.fm"],
		"host": "smtp.fastmail.com",
		"port": 465,
		"secure": true
	},
	"Feishu Mail": {
		"description": "Feishu Mail (Lark)",
		"aliases": ["Feishu", "FeishuMail"],
		"domains": ["www.feishu.cn"],
		"host": "smtp.feishu.cn",
		"port": 465,
		"secure": true
	},
	"Forward Email": {
		"description": "Forward Email (email forwarding service)",
		"aliases": ["FE", "ForwardEmail"],
		"domains": ["forwardemail.net"],
		"host": "smtp.forwardemail.net",
		"port": 465,
		"secure": true
	},
	"GandiMail": {
		"description": "Gandi Mail",
		"aliases": ["Gandi", "Gandi Mail"],
		"host": "mail.gandi.net",
		"port": 587
	},
	"Gmail": {
		"description": "Gmail",
		"aliases": ["Google Mail"],
		"domains": ["gmail.com", "googlemail.com"],
		"host": "smtp.gmail.com",
		"port": 465,
		"secure": true
	},
	"GmailWorkspace": {
		"description": "Gmail Workspace",
		"aliases": ["Google Workspace Mail"],
		"host": "smtp-relay.gmail.com",
		"port": 465,
		"secure": true
	},
	"GMX": {
		"description": "GMX Mail",
		"domains": [
			"gmx.com",
			"gmx.net",
			"gmx.de"
		],
		"host": "mail.gmx.com",
		"port": 587
	},
	"Godaddy": {
		"description": "GoDaddy Email (US)",
		"host": "smtpout.secureserver.net",
		"port": 25
	},
	"GodaddyAsia": {
		"description": "GoDaddy Email (Asia)",
		"host": "smtp.asia.secureserver.net",
		"port": 25
	},
	"GodaddyEurope": {
		"description": "GoDaddy Email (Europe)",
		"host": "smtp.europe.secureserver.net",
		"port": 25
	},
	"Groundmail": {
		"description": "Groundmail",
		"host": "smtp.groundmail.dev",
		"port": 587,
		"secure": false,
		"requireTLS": true
	},
	"hot.ee": {
		"description": "Hot.ee (Estonian email provider)",
		"host": "mail.hot.ee"
	},
	"Hotmail": {
		"description": "Outlook.com / Hotmail",
		"aliases": [
			"Outlook",
			"Outlook.com",
			"Hotmail.com"
		],
		"domains": ["hotmail.com", "outlook.com"],
		"host": "smtp-mail.outlook.com",
		"port": 587
	},
	"iCloud": {
		"description": "iCloud Mail",
		"aliases": ["Me", "Mac"],
		"domains": [
			"icloud.com",
			"me.com",
			"mac.com"
		],
		"host": "smtp.mail.me.com",
		"port": 587
	},
	"Infomaniak": {
		"description": "Infomaniak Mail (Swiss hosting provider)",
		"host": "mail.infomaniak.com",
		"domains": [
			"ik.me",
			"ikmail.com",
			"etik.com"
		],
		"port": 587
	},
	"KolabNow": {
		"description": "KolabNow (secure email service)",
		"domains": ["kolabnow.com"],
		"aliases": ["Kolab"],
		"host": "smtp.kolabnow.com",
		"port": 465,
		"secure": true,
		"authMethod": "LOGIN"
	},
	"Loopia": {
		"description": "Loopia (Swedish hosting provider)",
		"host": "mailcluster.loopia.se",
		"port": 465
	},
	"Loops": {
		"description": "Loops",
		"host": "smtp.loops.so",
		"port": 587
	},
	"mail.ee": {
		"description": "Mail.ee (Estonian email provider)",
		"host": "smtp.mail.ee"
	},
	"Mail.ru": {
		"description": "Mail.ru",
		"host": "smtp.mail.ru",
		"port": 465,
		"secure": true
	},
	"Mailcatch.app": {
		"description": "Mailcatch (email testing service)",
		"host": "sandbox-smtp.mailcatch.app",
		"port": 2525
	},
	"Maildev": {
		"description": "MailDev (local email testing)",
		"port": 1025,
		"ignoreTLS": true
	},
	"MailerSend": {
		"description": "MailerSend",
		"host": "smtp.mailersend.net",
		"port": 587
	},
	"Mailgun": {
		"description": "Mailgun",
		"host": "smtp.mailgun.org",
		"port": 465,
		"secure": true
	},
	"Mailjet": {
		"description": "Mailjet",
		"host": "in.mailjet.com",
		"port": 587
	},
	"Mailosaur": {
		"description": "Mailosaur (email testing service)",
		"host": "mailosaur.io",
		"port": 25
	},
	"MailSenpai": {
		"description": "MailSenpai (SMTP Senpai, EU)",
		"host": "relay.mailsenpai.com",
		"port": 2525,
		"secure": false
	},
	"Mailtrap": {
		"description": "Mailtrap",
		"host": "live.smtp.mailtrap.io",
		"port": 587
	},
	"Mandrill": {
		"description": "Mandrill (by Mailchimp)",
		"host": "smtp.mandrillapp.com",
		"port": 587
	},
	"Naver": {
		"description": "Naver Mail (Korean email provider)",
		"host": "smtp.naver.com",
		"port": 587
	},
	"OhMySMTP": {
		"description": "OhMySMTP (email delivery service)",
		"host": "smtp.ohmysmtp.com",
		"port": 587,
		"secure": false
	},
	"One": {
		"description": "One.com Email",
		"host": "send.one.com",
		"port": 465,
		"secure": true
	},
	"OpenMailBox": {
		"description": "OpenMailBox",
		"aliases": ["OMB", "openmailbox.org"],
		"host": "smtp.openmailbox.org",
		"port": 465,
		"secure": true
	},
	"Outlook365": {
		"description": "Microsoft 365 / Office 365",
		"host": "smtp.office365.com",
		"port": 587,
		"secure": false
	},
	"Oveyon": {
		"description": "Oveyon",
		"host": "smtp.oveyon.com",
		"port": 587,
		"secure": false,
		"requireTLS": true
	},
	"Postmark": {
		"description": "Postmark",
		"aliases": ["PostmarkApp"],
		"host": "smtp.postmarkapp.com",
		"port": 2525
	},
	"Proton": {
		"description": "Proton Mail",
		"aliases": [
			"ProtonMail",
			"Proton.me",
			"Protonmail.com",
			"Protonmail.ch"
		],
		"domains": [
			"proton.me",
			"protonmail.com",
			"pm.me",
			"protonmail.ch"
		],
		"host": "smtp.protonmail.ch",
		"port": 587,
		"requireTLS": true
	},
	"qiye.aliyun": {
		"description": "Alibaba Mail Enterprise Edition",
		"host": "smtp.mxhichina.com",
		"port": "465",
		"secure": true
	},
	"QQ": {
		"description": "QQ Mail",
		"domains": ["qq.com"],
		"host": "smtp.qq.com",
		"port": 465,
		"secure": true
	},
	"QQex": {
		"description": "QQ Enterprise Mail",
		"aliases": ["QQ Enterprise"],
		"domains": ["exmail.qq.com"],
		"host": "smtp.exmail.qq.com",
		"port": 465,
		"secure": true
	},
	"Resend": {
		"description": "Resend",
		"host": "smtp.resend.com",
		"port": 465,
		"secure": true
	},
	"Runbox": {
		"description": "Runbox (Norwegian email provider)",
		"domains": ["runbox.com"],
		"host": "smtp.runbox.com",
		"port": 465,
		"secure": true
	},
	"SendCloud": {
		"description": "SendCloud (Chinese email delivery)",
		"host": "smtp.sendcloud.net",
		"port": 2525
	},
	"SendGrid": {
		"description": "SendGrid",
		"host": "smtp.sendgrid.net",
		"port": 587
	},
	"SendinBlue": {
		"description": "Brevo (formerly Sendinblue)",
		"aliases": ["Brevo"],
		"host": "smtp-relay.brevo.com",
		"port": 587
	},
	"Sendora": {
		"description": "Sendora",
		"host": "smtp.sendora.se",
		"port": 465,
		"secure": true
	},
	"SendPulse": {
		"description": "SendPulse",
		"host": "smtp-pulse.com",
		"port": 465,
		"secure": true
	},
	"SES": {
		"description": "AWS SES US East (N. Virginia)",
		"host": "email-smtp.us-east-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-AP-NORTHEAST-1": {
		"description": "AWS SES Asia Pacific (Tokyo)",
		"host": "email-smtp.ap-northeast-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-AP-NORTHEAST-2": {
		"description": "AWS SES Asia Pacific (Seoul)",
		"host": "email-smtp.ap-northeast-2.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-AP-NORTHEAST-3": {
		"description": "AWS SES Asia Pacific (Osaka)",
		"host": "email-smtp.ap-northeast-3.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-AP-SOUTH-1": {
		"description": "AWS SES Asia Pacific (Mumbai)",
		"host": "email-smtp.ap-south-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-AP-SOUTHEAST-1": {
		"description": "AWS SES Asia Pacific (Singapore)",
		"host": "email-smtp.ap-southeast-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-AP-SOUTHEAST-2": {
		"description": "AWS SES Asia Pacific (Sydney)",
		"host": "email-smtp.ap-southeast-2.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-CA-CENTRAL-1": {
		"description": "AWS SES Canada (Central)",
		"host": "email-smtp.ca-central-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-EU-CENTRAL-1": {
		"description": "AWS SES Europe (Frankfurt)",
		"host": "email-smtp.eu-central-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-EU-NORTH-1": {
		"description": "AWS SES Europe (Stockholm)",
		"host": "email-smtp.eu-north-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-EU-WEST-1": {
		"description": "AWS SES Europe (Ireland)",
		"host": "email-smtp.eu-west-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-EU-WEST-2": {
		"description": "AWS SES Europe (London)",
		"host": "email-smtp.eu-west-2.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-EU-WEST-3": {
		"description": "AWS SES Europe (Paris)",
		"host": "email-smtp.eu-west-3.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-SA-EAST-1": {
		"description": "AWS SES South America (São Paulo)",
		"host": "email-smtp.sa-east-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-US-EAST-1": {
		"description": "AWS SES US East (N. Virginia)",
		"host": "email-smtp.us-east-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-US-EAST-2": {
		"description": "AWS SES US East (Ohio)",
		"host": "email-smtp.us-east-2.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-US-GOV-EAST-1": {
		"description": "AWS SES GovCloud (US-East)",
		"host": "email-smtp.us-gov-east-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-US-GOV-WEST-1": {
		"description": "AWS SES GovCloud (US-West)",
		"host": "email-smtp.us-gov-west-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-US-WEST-1": {
		"description": "AWS SES US West (N. California)",
		"host": "email-smtp.us-west-1.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"SES-US-WEST-2": {
		"description": "AWS SES US West (Oregon)",
		"host": "email-smtp.us-west-2.amazonaws.com",
		"port": 465,
		"secure": true
	},
	"Seznam": {
		"description": "Seznam Email (Czech email provider)",
		"aliases": ["Seznam Email"],
		"domains": [
			"seznam.cz",
			"email.cz",
			"post.cz",
			"spoluzaci.cz"
		],
		"host": "smtp.seznam.cz",
		"port": 465,
		"secure": true
	},
	"SMTP2GO": {
		"description": "SMTP2GO",
		"host": "mail.smtp2go.com",
		"port": 2525
	},
	"SpacePost": {
		"description": "SpacePost",
		"host": "smtp.spacepost.dev",
		"port": 25976,
		"secure": false,
		"requireTLS": true
	},
	"Sparkpost": {
		"description": "SparkPost",
		"aliases": ["SparkPost", "SparkPost Mail"],
		"domains": ["sparkpost.com"],
		"host": "smtp.sparkpostmail.com",
		"port": 587,
		"secure": false
	},
	"Tipimail": {
		"description": "Tipimail (email delivery service)",
		"host": "smtp.tipimail.com",
		"port": 587
	},
	"TurboSMTP": {
		"description": "TurboSMTP",
		"host": "pro.turbo-smtp.com",
		"port": 465,
		"secure": true
	},
	"TurboSMTP-EU": {
		"description": "TurboSMTP (EU region)",
		"host": "pro.eu.turbo-smtp.com",
		"port": 465,
		"secure": true
	},
	"Tutanota": {
		"description": "Tutanota (Tuta Mail)",
		"domains": [
			"tutanota.com",
			"tuta.com",
			"tutanota.de",
			"tuta.io"
		],
		"host": "smtp.tutanota.com",
		"port": 465,
		"secure": true
	},
	"Yahoo": {
		"description": "Yahoo Mail",
		"domains": ["yahoo.com"],
		"host": "smtp.mail.yahoo.com",
		"port": 465,
		"secure": true
	},
	"Yandex": {
		"description": "Yandex Mail",
		"domains": ["yandex.ru"],
		"host": "smtp.yandex.ru",
		"port": 465,
		"secure": true
	},
	"Zimbra": {
		"description": "Zimbra Mail Server",
		"aliases": ["Zimbra Collaboration"],
		"host": "smtp.zimbra.com",
		"port": 587,
		"requireTLS": true
	},
	"Zoho": {
		"description": "Zoho Mail",
		"host": "smtp.zoho.com",
		"port": 465,
		"secure": true,
		"authMethod": "LOGIN"
	}
};
// node_modules/nodemailer/dist/esm/well-known/index.js
const normalized = {};
Object.keys(services).forEach((key) => {
	const service = services[key];
	const normalizedService = normalizeService(service);
	normalized[normalizeKey(key)] = normalizedService;
	[].concat(service.aliases || []).forEach((alias) => {
		normalized[normalizeKey(alias)] = normalizedService;
	});
	[].concat(service.domains || []).forEach((domain) => {
		normalized[normalizeKey(domain)] = normalizedService;
	});
});
function normalizeKey(key) {
	return key.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
}
function normalizeService(service) {
	const response = {};
	Object.keys(service).forEach((key) => {
		if (!["domains", "aliases"].includes(key)) response[key] = service[key];
	});
	return response;
}
/**
* Resolves SMTP config for given key. Key can be a name (like 'Gmail'), alias (like 'Google Mail') or
* an email address (like 'test@googlemail.com').
*
* @param key Service name, alias or an email address
* @returns SMTP config or false if not found
*/
function wellKnown(key) {
	key = normalizeKey(key.split("@").pop());
	return normalized[key] || false;
}
// node_modules/nodemailer/dist/esm/smtp-pool/index.js
/** First delay before a requeued message is retried, doubled on every further requeue */
const REQUEUE_BASE_DELAY = 50;
/** Upper bound for the requeue delay */
const REQUEUE_MAX_DELAY = 2e3;
/**
* Creates a SMTP pool transport object for Nodemailer
*
* @constructor
* @param options SMTP Connection options
*/
var SMTPPool = class extends EventEmitter {
	constructor(options) {
		super();
		this.supportsAbortSignal = true;
		options = options || {};
		if (typeof options === "string") options = { url: options };
		let urlData;
		let service = options.service;
		if (typeof options.getSocket === "function") this.getSocket = options.getSocket;
		if (options.url) {
			urlData = parseConnectionUrl(options.url);
			service = service || urlData.service;
		}
		this.options = assign(false, options, urlData, service && wellKnown(service));
		this.options.maxConnections = this.options.maxConnections || 5;
		this.options.maxMessages = this.options.maxMessages || 100;
		this.options.maxRequeues = typeof this.options.maxRequeues === "number" ? this.options.maxRequeues : 5;
		this.options.idleTimeout = typeof this.options.idleTimeout === "number" ? this.options.idleTimeout : 24e4;
		this.logger = getLogger(this.options, { component: this.options.component || "smtp-pool" });
		this.name = "SMTP (pool)";
		this.version = "10.6.1[client:10.6.1]";
		this._rateLimit = {
			counter: 0,
			timeout: null,
			waiting: [],
			checkpoint: false,
			delta: Number(this.options.rateDelta) || 1e3,
			limit: Number(this.options.rateLimit) || 0
		};
		this._closed = false;
		this._queue = [];
		this._connections = [];
		this._connectionCounter = 0;
		this._pending = 0;
		this.idling = true;
		setImmediate(() => {
			if (this.idling) this.emit("idle");
		});
	}
	/**
	* Placeholder function for creating proxy sockets. This method immediatelly returns
	* without a socket
	*
	* @param options Connection options
	* @param callback Callback function to run with the socket keys
	*/
	getSocket(options, callback) {
		setImmediate(() => callback(null, false));
	}
	/**
	* Queues an e-mail to be sent using the selected settings
	*
	* @param mail Mail object
	* @param callback Callback function
	*/
	send(mail, callback) {
		if (this._closed) {
			const err = /* @__PURE__ */ new Error("Connection pool was closed");
			err.code = ECONNECTION;
			setImmediate(() => callback(err));
			return false;
		}
		let counted = true;
		let detachSignal;
		this._pending++;
		const entry = {
			mail,
			requeueAttempts: 0,
			callback: (err, info) => {
				if (!counted) return;
				counted = false;
				this._pending--;
				detachSignal?.();
				entry.resource = void 0;
				callback(err, info);
			}
		};
		this._queue.push(entry);
		const signal = mail.data.signal;
		if (signal) {
			detachSignal = this._watchAbortSignal(entry, signal, () => counted);
			if (signal.aborted) return true;
		}
		if (this.idling && this._queue.length >= this.options.maxConnections) this.idling = false;
		setImmediate(() => this._processMessages());
		return true;
	}
	/**
	* Fails a queued or assigned entry when its signal aborts: removes it from the queue, or
	* closes the connection delivering it, so other deliveries in the pool can continue.
	* Returns a function that removes the listener.
	* @internal
	*/
	_watchAbortSignal(entry, signal, isPending) {
		const onAbort = () => {
			if (!isPending()) return;
			const index = this._queue.indexOf(entry);
			if (index !== -1) this._queue.splice(index, 1);
			const resource = entry.resource;
			if (resource && resource.queueEntry === entry) {
				resource.queueEntry = false;
				resource.close();
			}
			try {
				entry.callback(createAbortError(signal));
			} finally {
				setImmediate(() => this._processMessages());
			}
		};
		signal.addEventListener("abort", onAbort, { once: true });
		if (signal.aborted) setImmediate(onAbort);
		return () => signal.removeEventListener("abort", onAbort);
	}
	/**
	* Closes the pool. Idle connections are closed at once and a connection in the middle of a
	* delivery finishes it first, unless `force` is set: then it is closed too and its message
	* fails. `force` is for a caller that has given up on a delivery, such as one a server is
	* stalling by trickling its replies, which no socket timeout notices.
	*
	* @param options.force - Also close connections that are delivering a message
	*/
	close(options) {
		let connection;
		const len = this._connections.length;
		this._closed = true;
		this._clearRateLimit();
		if (!len && !this._queue.length) return;
		const force = !!options?.force;
		for (let i = len - 1; i >= 0; i--) if (this._connections[i] && (force || this._connections[i].available)) {
			connection = this._connections[i];
			connection.close();
			this.logger.info({
				tnx: "connection",
				cid: connection.id,
				action: "removed"
			}, "Connection #%s removed", connection.id);
		}
		if (len && !this._connections.length) this.logger.debug({ tnx: "connection" }, "All connections removed");
		if (!this._queue.length) return;
		const invokeCallbacks = () => {
			if (!this._queue.length) {
				this.logger.debug({ tnx: "connection" }, "Pending queue entries cleared");
				return;
			}
			const entry = this._queue.shift();
			if (entry && typeof entry.callback === "function") try {
				entry.callback(/* @__PURE__ */ new Error("Connection pool was closed"));
			} catch (E) {
				this.logger.error({
					err: E,
					tnx: "callback"
				}, "Callback error: %s", E.message);
			}
			setImmediate(invokeCallbacks);
		};
		setImmediate(invokeCallbacks);
	}
	/**
	* Check the queue and available connections. If there is a message to be sent and there is
	* an available connection, then use this connection to send the mail
	* @internal
	*/
	_processMessages() {
		if (this._closed) return;
		if (!this._queue.length) {
			if (!this.idling) {
				this.idling = true;
				this.emit("idle");
			}
			return;
		}
		let connection = this._connections.find((c) => c.available);
		if (!connection && this._connections.length < this.options.maxConnections) connection = this._createConnection();
		if (!connection) {
			this.idling = false;
			return;
		}
		if (!this.idling && this._queue.length < this.options.maxConnections) {
			this.idling = true;
			this.emit("idle");
		}
		const entry = connection.queueEntry = this._queue.shift();
		entry.resource = connection;
		entry.messageId = (connection.queueEntry.mail.message.getHeader("message-id") || "").replace(/[<>\s]/g, "");
		connection.available = false;
		this.logger.debug({
			tnx: "pool",
			cid: connection.id,
			messageId: entry.messageId,
			action: "assign"
		}, "Assigned message <%s> to #%s (%s)", entry.messageId, connection.id, connection.messages + 1);
		if (this._rateLimit.limit) {
			this._rateLimit.counter++;
			if (!this._rateLimit.checkpoint) this._rateLimit.checkpoint = Date.now();
		}
		connection.send(entry.mail, (err, info) => {
			if (entry === connection.queueEntry) {
				try {
					entry.callback(err, info);
				} catch (E) {
					this.logger.error({
						err: E,
						tnx: "callback",
						cid: connection.id
					}, "Callback error for #%s: %s", connection.id, E.message);
				}
				connection.queueEntry = false;
			}
		});
	}
	/**
	* Creates a new pool resource
	* @internal
	*/
	_createConnection() {
		const connection = new PoolResource(this);
		connection.id = ++this._connectionCounter;
		this.logger.info({
			tnx: "pool",
			cid: connection.id,
			action: "conection"
		}, "Created new pool resource #%s", connection.id);
		connection.on("available", () => {
			this.logger.debug({
				tnx: "connection",
				cid: connection.id,
				action: "available"
			}, "Connection #%s became available", connection.id);
			if (this._closed) this.close();
			else this._processMessages();
		});
		connection.once("error", (err) => {
			if (err.code !== "EMAXLIMIT") this.logger.warn({
				err,
				tnx: "pool",
				cid: connection.id
			}, "Pool Error for #%s: %s", connection.id, err.message);
			else this.logger.debug({
				tnx: "pool",
				cid: connection.id,
				action: "maxlimit"
			}, "Max messages limit exchausted for #%s", connection.id);
			if (connection.queueEntry) {
				try {
					connection.queueEntry.callback(err);
				} catch (E) {
					this.logger.error({
						err: E,
						tnx: "callback",
						cid: connection.id
					}, "Callback error for #%s: %s", connection.id, E.message);
				}
				connection.queueEntry = false;
			}
			this._removeConnection(connection);
			this._continueProcessing();
		});
		connection.once("close", () => {
			this.logger.info({
				tnx: "connection",
				cid: connection.id,
				action: "closed"
			}, "Connection #%s was closed", connection.id);
			this._removeConnection(connection);
			if (connection.queueEntry) setTimeout(() => {
				let delay = 0;
				if (connection.queueEntry) {
					if (!this._closed && this._shouldRequeuOnConnectionClose(connection.queueEntry)) delay = this._requeueEntryOnConnectionClose(connection);
					else this._failDeliveryOnConnectionClose(connection);
				}
				if (delay) setTimeout(() => this._continueProcessing(), delay);
				else this._continueProcessing();
			}, 50);
			else {
				if (!this._closed && this.idling && !this._connections.length) this.emit("clear");
				this._continueProcessing();
			}
		});
		this._connections.push(connection);
		return connection;
	}
	/** @internal */
	_shouldRequeuOnConnectionClose(queueEntry) {
		if (this.options.maxRequeues < 0) return true;
		return queueEntry.requeueAttempts < this.options.maxRequeues;
	}
	/** @internal */
	_failDeliveryOnConnectionClose(connection) {
		if (connection.queueEntry && connection.queueEntry.callback) {
			try {
				const err = /* @__PURE__ */ new Error("Reached maximum number of retries after connection was closed");
				err.code = ECONNECTION;
				connection.queueEntry.callback(err);
			} catch (E) {
				this.logger.error({
					err: E,
					tnx: "callback",
					messageId: connection.queueEntry.messageId,
					cid: connection.id
				}, "Callback error for #%s: %s", connection.id, E.message);
			}
			connection.queueEntry = false;
		}
	}
	/** @internal */
	_requeueEntryOnConnectionClose(connection) {
		const delay = Math.min(REQUEUE_BASE_DELAY * 2 ** connection.queueEntry.requeueAttempts, REQUEUE_MAX_DELAY);
		connection.queueEntry.requeueAttempts += 1;
		this.logger.debug({
			tnx: "pool",
			cid: connection.id,
			messageId: connection.queueEntry.messageId,
			action: "requeue"
		}, "Re-queued message <%s> for #%s. Attempt: #%s", connection.queueEntry.messageId, connection.id, connection.queueEntry.requeueAttempts);
		connection.queueEntry.resource = void 0;
		this._queue.unshift(connection.queueEntry);
		connection.queueEntry = false;
		return delay;
	}
	/**
	* Continue to process message if the pool hasn't closed
	* @internal
	*/
	_continueProcessing() {
		if (this._closed) this.close();
		else setTimeout(() => this._processMessages(), 100);
	}
	/**
	* Remove resource from pool
	*
	* @param connection The PoolResource to remove
	* @internal
	*/
	_removeConnection(connection) {
		const index = this._connections.indexOf(connection);
		if (index !== -1) this._connections.splice(index, 1);
	}
	/**
	* Checks if connections have hit current rate limit and if so, queues the availability callback
	*
	* @param callback Callback function to run once rate limiter has been cleared
	* @internal
	*/
	_checkRateLimit(callback) {
		if (!this._rateLimit.limit) return callback();
		const now = Date.now();
		if (this._rateLimit.counter < this._rateLimit.limit) return callback();
		this._rateLimit.waiting.push(callback);
		if (this._rateLimit.checkpoint <= now - this._rateLimit.delta) return this._clearRateLimit();
		if (!this._rateLimit.timeout) {
			this._rateLimit.timeout = setTimeout(() => this._clearRateLimit(), this._rateLimit.delta - (now - this._rateLimit.checkpoint));
			this._rateLimit.checkpoint = now;
		}
	}
	/**
	* Clears current rate limit limitation and runs paused callback
	* @internal
	*/
	_clearRateLimit() {
		clearTimeout(this._rateLimit.timeout);
		this._rateLimit.timeout = null;
		this._rateLimit.counter = 0;
		this._rateLimit.checkpoint = false;
		while (this._rateLimit.waiting.length) {
			const cb = this._rateLimit.waiting.shift();
			setImmediate(cb);
		}
	}
	/**
	* Returns true if there are free slots in the queue
	*/
	isIdle() {
		return this.idling;
	}
	/**
	* Counts the messages the pool has not finished with yet: the ones waiting in the queue
	* plus the ones a connection is transmitting right now. isIdle() only tells whether the
	* pool can take another message, it is already true while a message is still being sent,
	* so use this to check that nothing would be lost by closing the pool. A message that is
	* re-queued after its connection dropped is counted until its callback runs, also while it waits to be put back on the queue, and
	* it is no longer counted by the time its callback runs.
	*
	* @returns Number of queued and in-flight messages
	*/
	pendingCount() {
		return this._pending;
	}
	verify(callback) {
		let promise;
		if (!callback) promise = new Promise((resolve, reject) => {
			callback = callbackPromise(resolve, reject);
		});
		const done = callback;
		const auth = new PoolResource(this).auth;
		const connectStartedAt = Date.now();
		this.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
			if (err) return done(err);
			let options = this.options;
			if (socketOptions && socketOptions.connection) {
				this.logger.info({
					tnx: "proxy",
					remoteAddress: socketOptions.connection.remoteAddress,
					remotePort: socketOptions.connection.remotePort,
					destHost: options.host || "",
					destPort: options.port || "",
					action: "connected"
				}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
				options = Object.assign(assign(false, options), socketOptions);
			}
			const connection = new SMTPConnection(options);
			connection._connectStartedAt = connectStartedAt;
			let returned = false;
			connection.once("error", (err) => {
				if (returned) return;
				returned = true;
				connection.close();
				return done(err);
			});
			connection.once("end", () => {
				if (returned) return;
				returned = true;
				return done(/* @__PURE__ */ new Error("Connection closed"));
			});
			const finalize = () => {
				if (returned) return;
				returned = true;
				connection.quit();
				return done(null, true);
			};
			connection.connect((err) => {
				if (returned) return;
				if (err) {
					returned = true;
					connection.close();
					return done(err);
				}
				if (auth && (connection.allowsAuth || options.forceAuth)) connection.login(auth, (err) => {
					if (returned) return;
					if (err) {
						returned = true;
						connection.close();
						return done(err);
					}
					finalize();
				});
				else if (!auth && connection.allowsAuth && options.forceAuth) {
					const err = /* @__PURE__ */ new Error("Authentication info was not provided");
					err.code = ENOAUTH;
					returned = true;
					connection.close();
					return done(err);
				} else finalize();
			});
		});
		return promise;
	}
};
// node_modules/nodemailer/dist/esm/smtp-transport/index.js
const MESSAGE_AUTH_KEYS = [
	"type",
	"user",
	"pass",
	"accessToken",
	"refreshToken",
	"expires"
];
/**
* Creates a SMTP transport object for Nodemailer
*
* @constructor
* @param options Connection options
*/
var SMTPTransport = class extends EventEmitter {
	constructor(options) {
		super();
		this.supportsAbortSignal = true;
		options = options || {};
		if (typeof options === "string") options = { url: options };
		let urlData;
		let service = options.service;
		if (typeof options.getSocket === "function") this.getSocket = options.getSocket;
		if (options.url) {
			urlData = parseConnectionUrl(options.url);
			service = service || urlData.service;
		}
		this.options = assign(false, options, urlData, service && wellKnown(service));
		this.logger = getLogger(this.options, { component: this.options.component || "smtp-transport" });
		this.name = "SMTP";
		this.version = "10.6.1[client:10.6.1]";
		if (this.options.auth) this.auth = this.getAuth({});
	}
	/**
	* Placeholder function for creating proxy sockets. This method immediatelly returns
	* without a socket
	*
	* @param options Connection options
	* @param callback Callback function to run with the socket keys
	*/
	getSocket(options, callback) {
		setImmediate(() => callback(null, false));
	}
	getAuth(authOpts) {
		if (!authOpts) {
			if (this.auth && this.auth.oauth2 && this.mailer) this.auth.oauth2.provisionCallback = this.mailer.get("oauth2_provision_cb") || this.auth.oauth2.provisionCallback;
			return this.auth;
		}
		const authData = Object.assign({}, this.options.auth && typeof this.options.auth === "object" ? this.options.auth : {});
		if (typeof authOpts === "object") copyOwnKeys(authData, authOpts, (key) => !MESSAGE_AUTH_KEYS.includes(key));
		if (Object.keys(authData).length === 0) return false;
		switch ((authData.type || "").toString().toUpperCase()) {
			case "OAUTH2": {
				if (!authData.service && !authData.user) return false;
				const oauth2 = new XOAuth2(authData, this.logger);
				oauth2.provisionCallback = this.mailer && this.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
				oauth2.on("token", (token) => this.mailer.emit("token", token));
				oauth2.on("error", (err) => this.emit("error", err));
				return {
					type: "OAUTH2",
					user: authData.user,
					oauth2,
					method: "XOAUTH2"
				};
			}
			default: return {
				type: (authData.type || "").toString().toUpperCase() || "LOGIN",
				user: authData.user,
				credentials: {
					user: authData.user || "",
					pass: authData.pass,
					options: authData.options
				},
				method: (authData.method || "").trim().toUpperCase() || this.options.authMethod || false
			};
		}
	}
	/**
	* Sends an e-mail using the selected settings
	*
	* @param mail Mail object
	* @param callback Callback function
	*/
	send(mail, callback) {
		const signal = mail.data.signal;
		let returned = false;
		let connection;
		let perCallAuth;
		const cleanupPerCallAuth = () => {
			if (perCallAuth && perCallAuth !== this.auth && perCallAuth.oauth2) perCallAuth.oauth2.removeAllListeners();
			perCallAuth = null;
		};
		const finish = (err, info) => {
			if (returned) return;
			returned = true;
			signal?.removeEventListener("abort", onAbort);
			cleanupPerCallAuth();
			connection?.close();
			callback(err, info);
		};
		function onAbort() {
			finish(createAbortError(signal));
		}
		if (signal) {
			signal.addEventListener("abort", onAbort, { once: true });
			if (signal.aborted) {
				setImmediate(onAbort);
				return;
			}
		}
		const connectStartedAt = Date.now();
		this.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
			if (returned) {
				socketOptions && socketOptions.connection?.destroy();
				return;
			}
			if (err) return finish(err);
			let options = this.options;
			if (socketOptions && socketOptions.connection) {
				this.logger.info({
					tnx: "proxy",
					remoteAddress: socketOptions.connection.remoteAddress,
					remotePort: socketOptions.connection.remotePort,
					destHost: options.host || "",
					destPort: options.port || "",
					action: "connected"
				}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
				options = Object.assign(assign(false, options), socketOptions);
			}
			const smtp = connection = new SMTPConnection(options);
			smtp._connectStartedAt = connectStartedAt;
			smtp.once("error", (err) => finish(err));
			const sendMessage = () => {
				const envelope = mail.message.getEnvelope();
				const messageId = mail.message.messageId();
				const recipients = [].concat(envelope.to || []);
				if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
				if (mail.data.dsn) envelope.dsn = mail.data.dsn;
				if (mail.data.requireTLSExtensionEnabled) envelope.requireTLSExtensionEnabled = mail.data.requireTLSExtensionEnabled;
				this.logger.info({
					tnx: "send",
					messageId
				}, "Sending message %s to <%s>", messageId, recipients.join(", "));
				smtp.send(envelope, mail.message.createReadStream(), (err, info) => {
					if (returned) return;
					if (err) {
						this.logger.error({
							err,
							tnx: "send"
						}, "Send error for %s: %s", messageId, err.message);
						return finish(err);
					}
					info.envelope = {
						from: envelope.from,
						to: envelope.to
					};
					info.messageId = messageId;
					try {
						return finish(null, info);
					} catch (E) {
						this.logger.error({
							err: E,
							tnx: "callback"
						}, "Callback error for %s: %s", messageId, E.message);
					}
				});
			};
			smtp.connect((err) => {
				if (returned) return;
				if (err) return finish(err);
				perCallAuth = this.getAuth(mail.data.auth);
				if (perCallAuth && (smtp.allowsAuth || options.forceAuth)) smtp.login(perCallAuth, (err) => {
					cleanupPerCallAuth();
					if (returned) return;
					if (err) return finish(err);
					sendMessage();
				});
				else sendMessage();
			});
		});
	}
	verify(callback) {
		let promise;
		if (!callback) promise = new Promise((resolve, reject) => {
			callback = callbackPromise(resolve, reject);
		});
		const done = callback;
		const connectStartedAt = Date.now();
		this.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
			if (err) return done(err);
			let options = this.options;
			if (socketOptions && socketOptions.connection) {
				this.logger.info({
					tnx: "proxy",
					remoteAddress: socketOptions.connection.remoteAddress,
					remotePort: socketOptions.connection.remotePort,
					destHost: options.host || "",
					destPort: options.port || "",
					action: "connected"
				}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
				options = Object.assign(assign(false, options), socketOptions);
			}
			const connection = new SMTPConnection(options);
			connection._connectStartedAt = connectStartedAt;
			let returned = false;
			let perCallAuth;
			const cleanupPerCallAuth = () => {
				if (perCallAuth && perCallAuth !== this.auth && perCallAuth.oauth2) perCallAuth.oauth2.removeAllListeners();
				perCallAuth = null;
			};
			connection.once("error", (err) => {
				if (returned) return;
				returned = true;
				cleanupPerCallAuth();
				connection.close();
				return done(err);
			});
			connection.once("end", () => {
				if (returned) return;
				returned = true;
				cleanupPerCallAuth();
				return done(/* @__PURE__ */ new Error("Connection closed"));
			});
			const finalize = () => {
				if (returned) return;
				returned = true;
				cleanupPerCallAuth();
				connection.quit();
				return done(null, true);
			};
			connection.connect((err) => {
				if (returned) return;
				if (err) {
					returned = true;
					connection.close();
					return done(err);
				}
				perCallAuth = this.getAuth({});
				if (perCallAuth && (connection.allowsAuth || options.forceAuth)) connection.login(perCallAuth, (err) => {
					cleanupPerCallAuth();
					if (returned) return;
					if (err) {
						returned = true;
						connection.close();
						return done(err);
					}
					finalize();
				});
				else if (!perCallAuth && connection.allowsAuth && options.forceAuth) {
					const err = /* @__PURE__ */ new Error("Authentication info was not provided");
					err.code = ENOAUTH;
					returned = true;
					cleanupPerCallAuth();
					connection.close();
					return done(err);
				} else finalize();
			});
		});
		return promise;
	}
	/**
	* Releases resources
	*/
	close() {
		if (this.auth && this.auth.oauth2) this.auth.oauth2.removeAllListeners();
		this.emit("close");
	}
};
// node_modules/nodemailer/dist/esm/sendmail-transport/index.js
const STDIN_ERROR_EXIT_WAIT = 1e3;
/**
* Generates a Transport object for Sendmail
*
* Possible options can be the following:
*
*  * **path** optional path to sendmail binary
*  * **newline** either 'windows' or 'unix'
*  * **args** an array of arguments for the sendmail binary
*
* @constructor
* @param optional config parameter for Sendmail
*/
var SendmailTransport = class {
	constructor(options) {
		options = options || {};
		this._spawn = spawn;
		this.options = options;
		this.name = "Sendmail";
		this.version = version;
		this.path = "sendmail";
		this.args = false;
		this.logger = getLogger(this.options, { component: this.options.component || "sendmail" });
		if (typeof options === "string") this.path = options;
		else if (typeof options === "object") {
			if (options.path) this.path = options.path;
			if (Array.isArray(options.args)) this.args = options.args;
		}
		this.winbreak = [
			"win",
			"windows",
			"dos",
			"\r\n"
		].includes((options.newline || "").toString().toLowerCase());
	}
	/**
	* <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
	*
	* @param mail MailComposer object
	* @param done Callback function to run when the sending is completed
	*/
	send(mail, done) {
		mail.message.keepBcc = true;
		const envelope = mail.message.getEnvelope();
		const messageId = mail.message.messageId();
		let returned;
		if ([].concat(envelope.from || []).concat(envelope.to || []).some((addr) => /^"?-/.test(addr))) {
			const err = /* @__PURE__ */ new Error("Can not send mail. Invalid envelope addresses.");
			err.code = ESENDMAIL;
			return done(err);
		}
		const args = this.args ? ["-i"].concat(this.args).concat(envelope.to) : ["-i"].concat(envelope.from ? ["-f", envelope.from] : []).concat(envelope.to);
		const callback = (err) => {
			if (returned) return;
			returned = true;
			if (typeof done === "function") {
				if (err) return done(err);
				return done(null, {
					envelope,
					messageId,
					response: "Messages queued for delivery"
				});
			}
		};
		let sendmail;
		try {
			sendmail = this._spawn(this.path, args);
		} catch (E) {
			this.logger.error({
				err: E,
				tnx: "spawn",
				messageId
			}, "Error occurred while spawning sendmail. %s", E.message);
			return callback(E);
		}
		if (sendmail) {
			let stream;
			const messageWritten = () => !!stream && stream.readableEnded;
			let stdinError = null;
			const release = () => {
				if (stream && !messageWritten()) stream.destroy();
			};
			const fail = (err) => {
				release();
				callback(err);
			};
			sendmail.on("error", (err) => {
				this.logger.error({
					err,
					tnx: "spawn",
					messageId
				}, "Error occurred when sending message %s. %s", messageId, err.message);
				fail(err);
			});
			const onExit = (code, signal) => {
				let err = null;
				if (code) err = /* @__PURE__ */ new Error(code === 127 ? "Sendmail command not found, process exited with code " + code : "Sendmail exited with code " + code);
				else if (signal) err = /* @__PURE__ */ new Error("Sendmail was terminated by " + signal);
				else if (!messageWritten()) err = /* @__PURE__ */ new Error("Sendmail exited before the message was written");
				else if (stdinError) err = stdinError;
				if (!err) return callback();
				err.code = err.code || "ESENDMAIL";
				this.logger.error({
					err,
					tnx: "stdin",
					messageId
				}, "Error sending message %s to sendmail. %s", messageId, err.message);
				fail(err);
			};
			sendmail.once("exit", onExit);
			sendmail.once("close", onExit);
			sendmail.stdin.on("error", (err) => {
				this.logger.error({
					err,
					tnx: "stdin",
					messageId
				}, "Error occurred when piping message %s to sendmail. %s", messageId, err.message);
				if (stdinError) return;
				stdinError = err;
				release();
				const exitTimer = setTimeout(() => fail(err), STDIN_ERROR_EXIT_WAIT);
				sendmail.once("exit", () => clearTimeout(exitTimer));
			});
			const recipients = [].concat(envelope.to || []);
			if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
			this.logger.info({
				tnx: "send",
				messageId
			}, "Sending message %s to <%s>", messageId, recipients.join(", "));
			const sourceStream = mail.message.createReadStream();
			stream = sourceStream;
			if (this.options.newline) stream = pipeline(sourceStream, this.winbreak ? new LeWindows() : new LeUnix(), () => false);
			stream.once("error", (err) => {
				this.logger.error({
					err,
					tnx: "stdin",
					messageId
				}, "Error occurred when generating message %s. %s", messageId, err.message);
				sendmail.kill("SIGINT");
				callback(err);
			});
			stream.pipe(sendmail.stdin);
		} else {
			const err = /* @__PURE__ */ new Error("sendmail was not found");
			err.code = ESENDMAIL;
			return callback(err);
		}
	}
};
// node_modules/nodemailer/dist/esm/stream-transport/index.js
/**
* Generates a Transport object for streaming
*
* Possible options can be the following:
*
*  * **buffer** if true, then returns the message as a Buffer object instead of a stream
*  * **newline** either 'windows' or 'unix'
*
* @constructor
* @param optional config parameter
*/
var StreamTransport = class {
	constructor(options) {
		options = options || {};
		this.options = options;
		this.name = "StreamTransport";
		this.version = version;
		this.logger = getLogger(this.options, { component: this.options.component || "stream-transport" });
		this.winbreak = [
			"win",
			"windows",
			"dos",
			"\r\n"
		].includes((options.newline || "").toString().toLowerCase());
	}
	/**
	* Compiles a mailcomposer message and forwards it to handler that sends it
	*
	* @param mail MailComposer object
	* @param done Callback function to run when the sending is completed
	*/
	send(mail, done) {
		mail.message.keepBcc = true;
		const envelope = mail.message.getEnvelope();
		const messageId = mail.message.messageId();
		const recipients = [].concat(envelope.to || []);
		if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
		this.logger.info({
			tnx: "send",
			messageId
		}, "Sending message %s to <%s> using %s line breaks", messageId, recipients.join(", "), this.winbreak ? "<CR><LF>" : "<LF>");
		setImmediate(() => {
			let stream;
			try {
				stream = mail.message.createReadStream();
				if (this.options.newline) {
					const sourceStream = stream;
					stream = sourceStream.pipe(this.winbreak ? new LeWindows() : new LeUnix());
					sourceStream.once("error", (err) => stream.emit("error", err));
				}
			} catch (E) {
				this.logger.error({
					err: E,
					tnx: "send",
					messageId
				}, "Creating send stream failed for %s. %s", messageId, E.message);
				return done(E);
			}
			if (!this.options.buffer) {
				stream.once("error", (err) => {
					this.logger.error({
						err,
						tnx: "send",
						messageId
					}, "Failed creating message for %s. %s", messageId, err.message);
				});
				return done(null, {
					envelope,
					messageId,
					message: stream
				});
			}
			const chunks = [];
			let chunklen = 0;
			stream.on("readable", () => {
				let chunk;
				while ((chunk = stream.read()) !== null) {
					chunks.push(chunk);
					chunklen += chunk.length;
				}
			});
			stream.once("error", (err) => {
				this.logger.error({
					err,
					tnx: "send",
					messageId
				}, "Failed creating message for %s. %s", messageId, err.message);
				return done(err);
			});
			stream.on("end", () => done(null, {
				envelope,
				messageId,
				message: Buffer.concat(chunks, chunklen)
			}));
		});
	}
};
// node_modules/nodemailer/dist/esm/json-transport/index.js
/**
* Generates a Transport object to generate JSON output
*
* @constructor
* @param optional config parameter
*/
var JSONTransport = class {
	constructor(options) {
		options = options || {};
		this.options = options;
		this.name = "JSONTransport";
		this.version = version;
		this.logger = getLogger(this.options, { component: this.options.component || "json-transport" });
	}
	/**
	* <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
	*
	* @param mail MailComposer object
	* @param done Callback function to run when the sending is completed
	*/
	send(mail, done) {
		mail.message.keepBcc = true;
		const envelope = mail.message.getEnvelope();
		const messageId = mail.message.messageId();
		const recipients = [].concat(envelope.to || []);
		if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
		this.logger.info({
			tnx: "send",
			messageId
		}, "Composing JSON structure of %s to <%s>", messageId, recipients.join(", "));
		setImmediate(() => {
			mail.normalize((err, data) => {
				if (err) {
					this.logger.error({
						err,
						tnx: "send",
						messageId
					}, "Failed building JSON structure for %s. %s", messageId, err.message);
					return done(err);
				}
				delete data.envelope;
				delete data.normalizedHeaders;
				delete data.signal;
				return done(null, {
					envelope,
					messageId,
					message: this.options.skipEncoding ? data : JSON.stringify(data)
				});
			});
		});
	}
};
// node_modules/nodemailer/dist/esm/ses-transport/index.js
/**
* Tags AWS SDK rejections that carry no `code` property (SDK v3 errors only
* have a `name`) with the generic SES transport error code, keeping the
* original error object intact
*/
function tagSesError(err) {
	if (err && typeof err === "object" && !err.code) err.code = ESES;
	return err;
}
/**
* Generates a Transport object for AWS SES
*
* @constructor
* @param optional config parameter
*/
var SESTransport = class extends EventEmitter$1 {
	constructor(options) {
		super();
		if (!options || !options.SES || !options.SES.sesClient) {
			const error = /* @__PURE__ */ new Error("Missing SES configuration, expecting { sesClient, SendEmailCommand } from @aws-sdk/client-sesv2, see https://nodemailer.com/transports/ses/");
			error.code = ECONFIG;
			throw error;
		}
		this.options = options;
		this.ses = this.options.SES;
		this.name = "SESTransport";
		this.version = version;
		this.logger = getLogger(this.options, { component: this.options.component || "ses-transport" });
	}
	getRegion(cb) {
		if (this.ses.sesClient.config && typeof this.ses.sesClient.config.region === "function") {
			this.ses.sesClient.config.region().then((region) => cb(null, region), (err) => cb(err));
			return;
		}
		return cb(null, false);
	}
	/**
	* Compiles a mailcomposer message and forwards it to SES
	*
	* @param mail MailComposer object
	* @param callback Callback function to run when the sending is completed
	*/
	send(mail, callback) {
		let fromHeader = mail.message._headers.find((header) => /^from$/i.test(header.key));
		if (fromHeader) {
			const mimeNode = new MimeNode("text/plain");
			fromHeader = mimeNode._convertAddresses(mimeNode._parseAddresses(fromHeader.value));
		}
		const envelope = mail.message.getEnvelope();
		const messageId = mail.message.messageId();
		const recipients = [].concat(envelope.to || []);
		if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
		this.logger.info({
			tnx: "send",
			messageId
		}, "Sending message %s to <%s>", messageId, recipients.join(", "));
		const getRawMessage = (next) => {
			if (!mail.data._dkim) mail.data._dkim = {};
			if (mail.data._dkim.skipFields && typeof mail.data._dkim.skipFields === "string") mail.data._dkim.skipFields += ":date:message-id";
			else mail.data._dkim.skipFields = "date:message-id";
			const sourceStream = mail.message.createReadStream();
			const stream = sourceStream.pipe(new LeWindows());
			const chunks = [];
			let chunklen = 0;
			stream.on("readable", () => {
				let chunk;
				while ((chunk = stream.read()) !== null) {
					chunks.push(chunk);
					chunklen += chunk.length;
				}
			});
			sourceStream.once("error", (err) => stream.emit("error", err));
			stream.once("error", (err) => next(err));
			stream.once("end", () => next(null, Buffer.concat(chunks, chunklen)));
		};
		setImmediate(() => getRawMessage((err, raw) => {
			if (err) {
				this.logger.error({
					err,
					tnx: "send",
					messageId
				}, "Failed creating message for %s. %s", messageId, err.message);
				return callback(err);
			}
			const sesMessage = copyOwnKeys({
				Content: { Raw: { Data: raw } },
				FromEmailAddress: fromHeader || envelope.from,
				Destination: { ToAddresses: envelope.to }
			}, mail.data.ses);
			this.getRegion((err, region) => {
				if (err || !region) region = "us-east-1";
				let sendPromise;
				try {
					const command = new this.ses.SendEmailCommand(sesMessage);
					sendPromise = this.ses.sesClient.send(command);
				} catch (err) {
					tagSesError(err);
					this.logger.error({
						err,
						tnx: "send"
					}, "Send error for %s: %s", messageId, err.message);
					setImmediate(() => callback(err));
					return;
				}
				sendPromise.then((data) => {
					if (region === "us-east-1") region = "email";
					const info = {
						envelope: {
							from: envelope.from,
							to: envelope.to
						},
						messageId: "<" + data.MessageId + (!/@/.test(data.MessageId) ? "@" + region + ".amazonses.com" : "") + ">",
						response: data.MessageId,
						raw
					};
					setImmediate(() => callback(null, info));
				}).catch((err) => {
					tagSesError(err);
					this.logger.error({
						err,
						tnx: "send"
					}, "Send error for %s: %s", messageId, err.message);
					setImmediate(() => callback(err));
				});
			});
		}));
	}
	verify(callback) {
		let promise;
		if (!callback) promise = new Promise((resolve, reject) => {
			callback = callbackPromise(resolve, reject);
		});
		const done = callback;
		const cb = (err) => {
			if (err && !["InvalidParameterValue", "MessageRejected"].includes(err.code || err.Code || err.name)) return done(tagSesError(err));
			return done(null, true);
		};
		const sesMessage = {
			Content: { Raw: { Data: Buffer.from("From: <invalid@invalid>\r\nTo: <invalid@invalid>\r\n Subject: Invalid\r\n\r\nInvalid") } },
			FromEmailAddress: "invalid@invalid",
			Destination: { ToAddresses: ["invalid@invalid"] }
		};
		this.getRegion(() => {
			let sendPromise;
			try {
				const command = new this.ses.SendEmailCommand(sesMessage);
				sendPromise = this.ses.sesClient.send(command);
			} catch (err) {
				setImmediate(() => cb(err));
				return;
			}
			sendPromise.then(() => setImmediate(() => cb(null))).catch((err) => setImmediate(() => cb(err)));
		});
		return promise;
	}
};
// node_modules/nodemailer/dist/esm/nodemailer.js
const etherealApi = () => (process.env.ETHEREAL_API || "https://api.nodemailer.com").replace(/\/+$/, "");
const etherealWeb = () => (process.env.ETHEREAL_WEB || "https://ethereal.email").replace(/\/+$/, "");
const etherealApiKey = () => (process.env.ETHEREAL_API_KEY || "").replace(/\s*/g, "") || null;
const etherealCache = () => [
	"true",
	"yes",
	"y",
	"1"
].includes((process.env.ETHEREAL_CACHE || "yes").toString().trim().toLowerCase());
let testAccount = false;
function createTransport(transporter, defaults) {
	let options;
	if (typeof transporter === "object" && typeof transporter.send !== "function" || typeof transporter === "string" && /^(smtps?|direct):/i.test(transporter)) {
		const urlConfig = typeof transporter === "string" ? transporter : transporter.url;
		if (urlConfig) {
			const parsed = parseConnectionUrl(urlConfig);
			options = typeof transporter === "object" ? assign(false, copyOwnKeys({}, transporter, (key) => key === "url"), parsed) : parsed;
		} else options = transporter;
		if (options.pool) transporter = new SMTPPool(options);
		else if (options.sendmail) transporter = new SendmailTransport(options);
		else if (options.streamTransport) transporter = new StreamTransport(options);
		else if (options.jsonTransport) transporter = new JSONTransport(options);
		else if (options.SES) {
			const ses = options.SES;
			if (ses.ses && ses.aws) {
				const error = /* @__PURE__ */ new Error("Using legacy SES configuration, expecting @aws-sdk/client-sesv2, see https://nodemailer.com/transports/ses/");
				error.code = ECONFIG;
				throw error;
			}
			transporter = new SESTransport(options);
		} else transporter = new SMTPTransport(options);
	}
	return new Mail(transporter, options, defaults);
}
function createTestAccount(apiUrl, callback) {
	let promise;
	if (!callback && typeof apiUrl === "function") {
		callback = apiUrl;
		apiUrl = false;
	}
	if (!callback) promise = new Promise((resolve, reject) => {
		callback = callbackPromise(resolve, reject);
	});
	const done = callback;
	if (etherealCache() && testAccount) {
		setImmediate(() => done(null, testAccount));
		return promise;
	}
	apiUrl = apiUrl || etherealApi();
	const chunks = [];
	let chunklen = 0;
	const requestHeaders = {};
	const requestBody = {
		requestor: name,
		version
	};
	const apiKey = etherealApiKey();
	if (apiKey) requestHeaders.Authorization = "Bearer " + apiKey;
	const fetchOptions = {
		contentType: "application/json",
		method: "POST",
		headers: requestHeaders,
		body: Buffer.from(JSON.stringify(requestBody))
	};
	if (/^https:/i.test(apiUrl)) fetchOptions.tls = { rejectUnauthorized: true };
	const req = nmfetch(apiUrl + "/user", fetchOptions);
	req.on("readable", () => {
		let chunk;
		while ((chunk = req.read()) !== null) {
			chunks.push(chunk);
			chunklen += chunk.length;
		}
	});
	req.once("error", (err) => done(err));
	req.once("end", () => {
		const res = Buffer.concat(chunks, chunklen);
		let data;
		try {
			data = JSON.parse(res.toString());
		} catch (E) {
			return done(E);
		}
		if (data.status !== "success" || data.error) return done(new Error(data.error || "Request failed"));
		delete data.status;
		testAccount = data;
		done(null, testAccount);
	});
	return promise;
}
/**
* Resolves the Ethereal web URL for a message sent through an Ethereal test account
*
* @param info Result object of sendMail()
* @returns URL of the message in the Ethereal web interface, or false if the response does not carry one
*/
function getTestMessageUrl(info) {
	if (!info || !info.response) return false;
	const infoProps = /* @__PURE__ */ new Map();
	const response = info.response.toString();
	if (response.length > 2 && response.charAt(response.length - 1) === "]") {
		const open = response.indexOf("[", response.lastIndexOf("]", response.length - 2) + 1);
		if (open >= 0 && open < response.length - 2) response.substring(open + 1, response.length - 1).replace(/\b([A-Z0-9]+)=([^\s]+)/g, (m, key, value) => {
			infoProps.set(key, value);
			return m;
		});
	}
	if (infoProps.has("STATUS") && infoProps.has("MSGID")) return (testAccount && testAccount.web || etherealWeb()) + "/message/" + infoProps.get("MSGID");
	return false;
}
const nodemailer = {
	createTransport,
	createTestAccount,
	getTestMessageUrl
};
// server/mailer.ts
/**
* Email notifications over SMTP (nodemailer).
* SMTP credentials live ONLY in environment variables (.env), never in the database.
* Sending is fire-and-forget: a mail failure never blocks or fails a booking.
*/
const env = () => ({
	host: process$1.env.SMTP_HOST ?? "",
	port: Number(process$1.env.SMTP_PORT ?? 465),
	secure: (process$1.env.SMTP_SECURE ?? (Number(process$1.env.SMTP_PORT ?? 465) === 465 ? "true" : "false")) === "true",
	user: process$1.env.SMTP_USER ?? "",
	pass: process$1.env.SMTP_PASS ?? "",
	from: process$1.env.MAIL_FROM || process$1.env.SMTP_USER || "",
	siteUrl: (process$1.env.SITE_URL ?? "").replace(/\/+$/, "")
});
let transporter = null;
const status = {
	configured: false,
	host: "",
	from: "",
	lastSentAt: null,
	lastError: null
};
function getTransporter() {
	const e = env();
	status.configured = Boolean(e.host && e.from);
	status.host = e.host;
	status.from = e.from;
	if (!status.configured) return null;
	if (!transporter) transporter = nodemailer.createTransport({
		host: e.host,
		port: e.port,
		secure: e.secure,
		auth: e.user ? {
			user: e.user,
			pass: e.pass
		} : void 0,
		connectionTimeout: 15e3,
		greetingTimeout: 15e3,
		socketTimeout: 2e4
	});
	return transporter;
}
function mailStatus() {
	getTransporter();
	return { ...status };
}
const parseRecipients = (list) => list.split(/[,;\s]+/).map((s) => s.trim()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
async function send(to, subject, html, text, replyTo) {
	const t = getTransporter();
	if (!t || to.length === 0) return false;
	try {
		await t.sendMail({
			from: env().from,
			to,
			subject,
			html,
			text,
			replyTo
		});
		status.lastSentAt = (/* @__PURE__ */ new Date()).toISOString();
		status.lastError = null;
		return true;
	} catch (err) {
		status.lastError = `${(/* @__PURE__ */ new Date()).toISOString()}: ${err.message}`;
		console.error("[mail] failed:", err.message);
		throw err;
	}
}
/** Run without awaiting; errors are logged and surfaced in the admin status. */
const background = (p) => {
	const safe = p.catch(() => {});
	globalThis.EdgeRuntime?.waitUntil(safe);
};
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[c]);
const fmtDate = (s) => new Date(parseDay(s)).toLocaleDateString("en-IN", {
	weekday: "short",
	day: "numeric",
	month: "short",
	year: "numeric",
	timeZone: "UTC"
});
const guestsText = (b) => `${b.adults} adult${b.adults > 1 ? "s" : ""}${b.children ? `, ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}`;
const waLink = (phone) => {
	const d = phone.replace(/\D/g, "");
	return `https://wa.me/${d.length === 10 ? "91" + d : d}`;
};
function layout(cfg, heading, intro, body) {
	const s = cfg.settings;
	return `<!doctype html><html><body style="margin:0;background:#F4EFE6;font-family:Helvetica,Arial,sans-serif;color:#2B241F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF7EF;border:1px solid #e3d8c6;border-radius:16px;overflow:hidden">
<tr><td style="background:#1C352D;padding:22px 28px;color:#F4EFE6">
<div style="font-family:Georgia,serif;font-size:20px;font-weight:bold">${esc(s.resortName)}</div>
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#f3c79a;margin-top:4px">Kullan · Sonamarg</div>
</td></tr>
<tr><td style="padding:26px 28px">
<h1 style="font-family:Georgia,serif;font-size:22px;color:#1C352D;margin:0 0 8px">${heading}</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#4a403a">${intro}</p>
${body}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e3d8c6;font-size:12px;color:#7a6e66;line-height:1.6">
${esc(s.resortName)} · ${esc(s.address)}<br>${esc(s.phone)}${s.email ? ` · ${esc(s.email)}` : ""}
</td></tr></table></td></tr></table></body></html>`;
}
function detailsTable(b, cfg) {
	const addonNames = b.addons.map((id) => cfg.addons.find((a) => a.id === id)?.name ?? id);
	const row = (k, v) => `<tr><td style="padding:6px 0;color:#7a6e66;font-size:13px;width:38%;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px;font-weight:bold">${v}</td></tr>`;
	const lines = b.quote.lines.map((l) => `<tr><td style="padding:3px 0;font-size:13px;color:#4a403a">${esc(l.label)}</td><td align="right" style="padding:3px 0;font-size:13px">${inr(l.amount)}</td></tr>`).join("");
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
${row("Reference", esc(b.ref))}
${row("Room", esc(b.stayName))}
${row("Check-in", `${fmtDate(b.checkIn)} · from ${esc(cfg.settings.checkInTime)}`)}
${row("Check-out", `${fmtDate(b.checkOut)} · by ${esc(cfg.settings.checkOutTime)}`)}
${row("Nights", String(b.nights))}
${row("Guests", guestsText(b))}
${addonNames.length ? row("Experiences", esc(addonNames.join(", "))) : ""}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;border-radius:10px;padding:12px 14px">
${lines}
<tr><td style="padding-top:8px;border-top:1px solid #e3d8c6;font-weight:bold">Total incl. GST</td><td align="right" style="padding-top:8px;border-top:1px solid #e3d8c6;font-weight:bold;font-size:16px;color:#1C352D">${inr(b.total)}</td></tr>
</table>`;
}
function detailsText(b, cfg) {
	const addonNames = b.addons.map((id) => cfg.addons.find((a) => a.id === id)?.name ?? id);
	return [
		`Reference: ${b.ref}`,
		`Room: ${b.stayName}`,
		`Check-in: ${fmtDate(b.checkIn)} (from ${cfg.settings.checkInTime})`,
		`Check-out: ${fmtDate(b.checkOut)} (by ${cfg.settings.checkOutTime})`,
		`Nights: ${b.nights}`,
		`Guests: ${guestsText(b)}`,
		addonNames.length ? `Experiences: ${addonNames.join(", ")}` : "",
		"",
		...b.quote.lines.map((l) => `${l.label}: ${inr(l.amount)}`),
		`Total incl. GST: ${inr(b.total)}`
	].filter((l) => l !== null).join("\n");
}
const button = (href, label, bg = "#D96B27") => `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 20px;border-radius:999px;margin:4px 6px 4px 0">${esc(label)}</a>`;
/** New booking: alert the resort, and send the guest a receipt. */
function notifyNewBooking(b, cfg) {
	const s = cfg.settings;
	const staff = parseRecipients(s.notifyEmails);
	const pending = b.status === "pending";
	if (staff.length) {
		const site = env().siteUrl;
		const actions = [site ? button(`${site}/admin#bookings`, pending ? "Review & confirm" : "Open admin", "#1C352D") : "", button(waLink(b.phone), "WhatsApp guest", "#2B7A78")].join("");
		const guestBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e3d8c6;border-radius:10px;padding:12px 14px">
<tr><td style="font-size:14px;line-height:1.6"><b>${esc(b.name)}</b><br>📞 <a href="tel:${esc(b.phone.replace(/\s/g, ""))}" style="color:#2B7A78">${esc(b.phone)}</a>${b.email ? `<br>✉️ <a href="mailto:${esc(b.email)}" style="color:#2B7A78">${esc(b.email)}</a>` : ""}${b.notes ? `<br><i style="color:#6E473B">“${esc(b.notes)}”</i>` : ""}</td></tr></table>`;
		background(send(staff, `${pending ? "🔔 New booking request" : "✅ New booking"}: ${b.name}, ${b.stayName}, ${fmtDate(b.checkIn)} (${b.ref})`, layout(cfg, pending ? "New booking request" : "New confirmed booking", pending ? "A guest has requested a stay. Please confirm it from the admin dashboard and let them know." : "A guest has booked a stay through the website.", guestBlock + detailsTable(b, cfg) + `<div style="margin-top:18px">${actions}</div>`), `${pending ? "New booking request" : "New confirmed booking"}\n\nGuest: ${b.name}\nPhone: ${b.phone}\n${b.email ? `Email: ${b.email}\n` : ""}${b.notes ? `Notes: ${b.notes}\n` : ""}\n${detailsText(b, cfg)}\n${site ? `\nAdmin: ${site}/admin#bookings` : ""}`, b.email || void 0));
	}
	if (s.emailGuests && b.email) {
		const heading = pending ? "We’ve received your booking request" : "Your stay is confirmed";
		const intro = pending ? `Thank you, ${esc(b.name)}! ${esc(s.confirmationNote)}` : `Thank you, ${esc(b.name)}! We look forward to welcoming you to Kullan. Please show your reference at check-in.`;
		background(send([b.email], `${pending ? "Booking request received" : "Booking confirmed"}: ${s.resortName} (${b.ref})`, layout(cfg, heading, intro, detailsTable(b, cfg) + guestFooter(cfg)), `${heading}\n\n${pending ? s.confirmationNote : "We look forward to welcoming you."}\n\n${detailsText(b, cfg)}\n\nPayment is made at the resort.\n${s.policies}`, s.email || void 0));
	}
}
function guestFooter(cfg) {
	const s = cfg.settings;
	return `<p style="font-size:13px;color:#4a403a;line-height:1.6;margin:18px 0 0">Payment is made at the resort. ${esc(s.policies)}</p>
<div style="margin-top:16px">${s.whatsapp ? button(`https://wa.me/${s.whatsapp}`, "WhatsApp the resort", "#2B7A78") : ""}${s.phone ? button(`tel:${s.phone.replace(/\s/g, "")}`, `Call ${s.phone}`, "#1C352D") : ""}</div>`;
}
/** Booking confirmed or cancelled from the admin: tell the guest. */
function notifyStatusChange(b, cfg) {
	const s = cfg.settings;
	if (!s.emailGuests || !b.email) return;
	if (b.status === "confirmed") background(send([b.email], `Booking confirmed: ${s.resortName} (${b.ref})`, layout(cfg, "Your stay is confirmed 🎉", `Good news, ${esc(b.name)}! Your booking is confirmed. We look forward to welcoming you to Kullan.`, detailsTable(b, cfg) + guestFooter(cfg)), `Your stay is confirmed\n\n${detailsText(b, cfg)}\n\nPayment is made at the resort.\n${s.policies}`, s.email || void 0));
	else if (b.status === "cancelled") background(send([b.email], `Booking cancelled: ${s.resortName} (${b.ref})`, layout(cfg, "Your booking has been cancelled", `Hello ${esc(b.name)}, your booking ${esc(b.ref)} for the ${esc(b.stayName)} (${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)}) has been cancelled. If this is unexpected, please get in touch and we’ll help.`, guestFooter(cfg)), `Your booking ${b.ref} (${b.stayName}, ${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)}) has been cancelled. If this is unexpected, please contact us: ${s.phone} ${s.email}`, s.email || void 0));
}
/** Admin "send test email" button. Awaited, so the admin sees success or the SMTP error. */
async function sendTestEmail(to, cfg) {
	if (!getTransporter()) throw new Error("Email isn’t set up on the server yet. Add the SMTP_* settings to .env and restart.");
	if (!to.length) throw new Error("Add at least one notification email first.");
	await send(to, `Test email from ${cfg.settings.resortName}`, layout(cfg, "Email notifications are working ✓", "This is a test from your booking dashboard. New booking alerts will arrive at this address.", ""), "Email notifications are working. New booking alerts will arrive at this address.");
}
// server/app.ts
/**
* The Yamsar Resort booking & admin API (Hono). Started by server/node.ts, which
* picks the storage (MySQL on Hostinger, Postgres, or SQLite locally).
*/
const day = string().refine((s) => !Number.isNaN(parseDay(s)), "Invalid date");
const cabin = _enum(CABIN_IDS);
const text = (max) => string().trim().max(max);
const STATUSES = [
	"pending",
	"confirmed",
	"cancelled",
	"checked_in",
	"completed"
];
const BookingBody = object({
	cabin,
	checkIn: day,
	checkOut: day,
	adults: number().int().min(1).max(12),
	children: number().int().min(0).max(8),
	addons: array(string().max(40)).max(20).default([]),
	name: text(80).min(2, "Please add the lead guest’s name."),
	phone: text(24).regex(/^\+?[\d\s()-]{7,}$/, "Please add a valid phone number."),
	email: union([literal(""), email("Please check the email address.")]).optional().default(""),
	notes: text(600).optional().default("")
});
const money = number().int().min(0).max(1e7);
const Season = object({
	id: text(40).min(1),
	name: text(60),
	from: day,
	to: day,
	rate: money
});
const Stay = object({
	id: cabin,
	name: text(80).min(1),
	short: text(40).min(1),
	tagline: text(240),
	rate: money,
	weekendRate: money.nullable(),
	seasons: array(Season).max(50),
	sleeps: number().int().min(1).max(20),
	size: text(30),
	view: text(80),
	features: array(text(120)).max(20),
	units: number().int().min(0).max(100),
	active: boolean()
});
const Addon = object({
	id: text(40).regex(/^[a-z0-9-]+$/, "IDs use lowercase letters, numbers and dashes"),
	name: text(100).min(1),
	note: text(240),
	price: money,
	per: _enum([
		"adult",
		"guest",
		"stay",
		"night"
	]),
	active: boolean()
});
const emailList = text(500).refine((v) => v.trim() === "" || v.split(/[,;\s]+/).filter(Boolean).every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)), "Check the notification email addresses (separate them with commas).");
const SettingsBody = object({
	resortName: text(80).min(1),
	tagline: text(240),
	phone: text(30),
	whatsapp: text(20).regex(/^\d*$/, "WhatsApp number: digits only, with country code (e.g. 917889504310)"),
	email: union([literal(""), email()]),
	address: text(200),
	instagram: union([literal(""), url()]),
	facebook: union([literal(""), url()]),
	checkInTime: text(20),
	checkOutTime: text(20),
	petsAllowed: boolean(),
	breakfastIncluded: boolean(),
	policies: text(2e3),
	bookingMode: _enum(["instant", "request"]),
	minNights: number().int().min(1).max(30),
	maxNights: number().int().min(1).max(365),
	maxAdvanceDays: number().int().min(1).max(1e3),
	extraGuestFee: money,
	maxExtraGuests: number().int().min(0).max(10),
	gst: object({
		roomThreshold: number().int().min(0),
		roomLowRate: number().min(0).max(50),
		roomHighRate: number().min(0).max(50),
		addonRate: number().min(0).max(50)
	}),
	confirmationNote: text(400),
	notifyEmails: emailList,
	emailGuests: boolean()
});
var HttpError = class extends Error {
	status;
	extra;
	constructor(status, message, extra) {
		super(message);
		this.status = status;
		this.extra = extra;
	}
};
async function body(c, schema) {
	let raw;
	try {
		raw = await c.req.json();
	} catch {
		throw new HttpError(400, "Invalid JSON");
	}
	const r = schema.safeParse(raw);
	if (r.success) return r.data;
	const issue = r.error.issues[0];
	throw new HttpError(400, issue?.message ?? "Invalid request", { field: issue?.path.join(".") });
}
const newRef = () => {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	return "YMS-" + Array.from(randomBytes(6), (b) => alphabet[b % 32]).join("");
};
/** Best-effort client IP (platforms set x-forwarded-for). */
const clientIp = (c) => c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "local";
/** In-memory fixed-window limiter (per instance; serverless instances each keep their own window). */
function rateLimit(max, windowMs) {
	const hits = /* @__PURE__ */ new Map();
	return async (c, next) => {
		const key = clientIp(c);
		const now = Date.now();
		const h = hits.get(key);
		if (!h || now > h.reset) hits.set(key, {
			n: 1,
			reset: now + windowMs
		});
		else if (++h.n > max) return c.json({ error: "Too many attempts. Please wait a few minutes and try again." }, 429);
		if (hits.size > 5e3) {
			for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
		}
		await next();
	};
}
function createApp(store) {
	let ready = null;
	const ensureReady = () => ready ??= (async () => {
		await seed(store);
		await initAuth(store);
	})().catch((e) => {
		ready = null;
		throw e;
	});
	const app = new Hono();
	app.use("/api/*", async (c, next) => {
		await ensureReady();
		await next();
		c.header("X-Content-Type-Options", "nosniff");
		c.header("Referrer-Policy", "strict-origin-when-cross-origin");
		if (!c.res.headers.has("Cache-Control")) c.header("Cache-Control", "no-store");
	});
	app.onError((err, c) => {
		if (err instanceof HttpError) return c.json({
			error: err.message,
			...err.extra
		}, err.status);
		console.error(err);
		return c.json({ error: "Something went wrong on our side." }, 500);
	});
	app.get("/api/health", (c) => c.json({ ok: true }));
	app.get("/api/config", async (c) => {
		const cfg = await getConfig(store);
		const { notifyEmails: _hidden, ...settings } = cfg.settings;
		return c.json({
			...cfg,
			settings
		});
	});
	app.get("/api/availability", async (c) => {
		const checkIn = c.req.query("checkIn") ?? "";
		const checkOut = c.req.query("checkOut") ?? "";
		if (Number.isNaN(parseDay(checkIn)) || Number.isNaN(parseDay(checkOut)) || checkOut <= checkIn) throw new HttpError(400, "Invalid dates");
		return c.json(await availability(store, checkIn, checkOut));
	});
	app.post("/api/bookings", rateLimit(8, 6e5), async (c) => {
		const b = await body(c, BookingBody);
		const cfg = await getConfig(store);
		const q = quote(b, cfg, todayIST());
		if (q.errors.length) throw new HttpError(400, q.errors[0]);
		const stay = cfg.stays.find((s) => s.id === b.cabin);
		const booking = await store.exclusive(b.cabin, async (tx) => {
			if ((await availability(tx, b.checkIn, b.checkOut))[b.cabin] < 1) throw new HttpError(409, `Sorry, ${stay.name} is fully booked for those dates. Please try other dates or another room.`);
			const now = (/* @__PURE__ */ new Date()).toISOString();
			const nb = {
				ref: newRef(),
				createdAt: now,
				updatedAt: now,
				status: cfg.settings.bookingMode === "instant" ? "confirmed" : "pending",
				cabin: stay.id,
				stayName: stay.name,
				checkIn: b.checkIn,
				checkOut: b.checkOut,
				nights: q.nights,
				adults: b.adults,
				children: b.children,
				addons: b.addons,
				name: b.name,
				phone: b.phone,
				email: b.email ?? "",
				notes: b.notes ?? "",
				adminNotes: "",
				quote: q,
				total: q.total,
				source: "website"
			};
			await tx.insertBooking(nb);
			return nb;
		});
		notifyNewBooking(booking, cfg);
		console.log(`[booking] ${booking.ref} ${booking.status} ${stay.name} ${booking.checkIn}→${booking.checkOut} ₹${booking.total}`);
		const { ref, status, stayName, checkIn, checkOut, nights, adults, children, addons, name, total } = booking;
		return c.json({
			ref,
			status,
			stayName,
			checkIn,
			checkOut,
			nights,
			adults,
			children,
			addons,
			name,
			quote: booking.quote,
			total
		}, 201);
	});
	app.post("/api/admin/login", rateLimit(6, 3e5), async (c) => {
		const { password } = await body(c, object({ password: string().max(200) }));
		if (!await checkPassword(store, password)) throw new HttpError(401, "That password didn’t match.");
		return c.json({ token: await issueToken(store) });
	});
	const admin = new Hono();
	admin.use("*", async (c, next) => {
		const h = c.req.header("authorization");
		if (!await verifyToken(store, h?.startsWith("Bearer ") ? h.slice(7) : void 0)) return c.json({ error: "Please sign in again." }, 401);
		await next();
	});
	admin.get("/summary", async (c) => {
		const today = todayIST();
		const all = await store.listBookings({});
		const live = all.filter((b) => b.status !== "cancelled");
		const month = today.slice(0, 7);
		return c.json({
			today,
			pending: all.filter((b) => b.status === "pending").length,
			arrivalsToday: live.filter((b) => b.checkIn === today).length,
			inHouse: live.filter((b) => b.checkIn <= today && today < b.checkOut).length,
			upcoming: live.filter((b) => b.checkIn > today).length,
			revenueThisMonth: live.filter((b) => b.checkIn.startsWith(month)).reduce((a, b) => a + b.total, 0),
			tonight: await availability(store, today, addDaysISO(today, 1))
		});
	});
	admin.get("/bookings", async (c) => {
		const q = c.req.query();
		return c.json(await store.listBookings({
			status: q.status || void 0,
			from: q.from || void 0,
			to: q.to || void 0,
			q: q.q || void 0
		}));
	});
	admin.get("/bookings.csv", async (c) => {
		const rows = await store.listBookings({});
		const esc = (v) => `"${String(v ?? "").replace(/"/g, "\"\"")}"`;
		const head = [
			"Reference",
			"Status",
			"Room",
			"Check-in",
			"Check-out",
			"Nights",
			"Adults",
			"Children",
			"Add-ons",
			"Guest",
			"Phone",
			"Email",
			"Guest notes",
			"Admin notes",
			"Subtotal",
			"GST",
			"Total",
			"Created"
		];
		const lines = rows.map((b) => [
			b.ref,
			b.status,
			b.stayName,
			b.checkIn,
			b.checkOut,
			b.nights,
			b.adults,
			b.children,
			b.addons.join(" | "),
			b.name,
			b.phone,
			b.email,
			b.notes,
			b.adminNotes,
			b.quote.subtotal,
			b.quote.tax,
			b.total,
			b.createdAt
		].map(esc).join(","));
		c.header("Content-Type", "text/csv; charset=utf-8");
		c.header("Content-Disposition", `attachment; filename="yamsar-bookings-${todayIST()}.csv"`);
		return c.body("﻿" + [head.map(esc).join(","), ...lines].join("\r\n"));
	});
	admin.patch("/bookings/:ref", async (c) => {
		const patch = await body(c, object({
			status: _enum(STATUSES).optional(),
			adminNotes: text(2e3).optional()
		}));
		const current = await store.getBooking(c.req.param("ref"));
		if (!current) throw new HttpError(404, "Booking not found");
		const update = async (s) => {
			if (current.status === "cancelled" && patch.status && patch.status !== "cancelled") {
				if ((await availability(s, current.checkIn, current.checkOut, current.ref))[current.cabin] < 1) throw new HttpError(409, "That room is no longer free for these dates.");
			}
			return s.updateBooking(current.ref, patch);
		};
		const updated = patch.status ? await store.exclusive(current.cabin, update) : await update(store);
		if (updated && patch.status && patch.status !== current.status) notifyStatusChange(updated, await getConfig(store));
		return c.json(updated);
	});
	admin.get("/config", async (c) => c.json(await getConfig(store)));
	admin.put("/stays", async (c) => {
		const stays = await body(c, array(Stay).length(3));
		for (const s of stays) if (s.seasons.some((x) => x.to < x.from)) throw new HttpError(400, `${s.name}: a season ends before it starts.`);
		if (new Set(stays.map((s) => s.id)).size !== 3) throw new HttpError(400, "Each room type must appear once.");
		await store.setKV("stays", stays);
		return c.json(await getConfig(store));
	});
	admin.put("/addons", async (c) => {
		const addons = await body(c, array(Addon).max(30));
		if (new Set(addons.map((a) => a.id)).size !== addons.length) throw new HttpError(400, "Each experience needs a unique ID.");
		await store.setKV("addons", addons);
		return c.json(await getConfig(store));
	});
	admin.put("/settings", async (c) => {
		const s = await body(c, SettingsBody);
		if (s.minNights > s.maxNights) throw new HttpError(400, "Minimum nights can’t be more than maximum nights.");
		await store.setKV("settings", s);
		return c.json(await getConfig(store));
	});
	admin.get("/blocks", async (c) => c.json(await store.listBlocks()));
	admin.post("/blocks", async (c) => {
		const b = await body(c, object({
			cabin,
			from: day,
			to: day,
			units: number().int().min(1).max(100),
			reason: text(200)
		}));
		if (b.to <= b.from) throw new HttpError(400, "The end date must be after the start date.");
		await store.addBlock(b);
		return c.json(await store.listBlocks(), 201);
	});
	admin.delete("/blocks/:id", async (c) => {
		await store.deleteBlock(Number(c.req.param("id")));
		return c.json(await store.listBlocks());
	});
	admin.get("/email/status", (c) => c.json(mailStatus()));
	admin.post("/email/test", rateLimit(5, 3e5), async (c) => {
		const cfg = await getConfig(store);
		try {
			await sendTestEmail(parseRecipients(cfg.settings.notifyEmails), cfg);
		} catch (e) {
			throw new HttpError(400, e.message);
		}
		return c.json({
			ok: true,
			...mailStatus()
		});
	});
	admin.post("/password", async (c) => {
		const b = await body(c, object({
			current: string(),
			next: string().min(10, "Use at least 10 characters.").max(200)
		}));
		if (!await checkPassword(store, b.current)) throw new HttpError(401, "Your current password didn’t match.");
		await setPassword(store, b.next);
		return c.json({ token: await issueToken(store) });
	});
	app.route("/api/admin", admin);
	app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));
	return app;
}
// server/node.ts
async function createStore() {
	const env = process.env;
	const url = env.DATABASE_URL ?? "";
	if (url.startsWith("mysql") || env.DB_HOST && env.DB_NAME) {
		const { createMysqlStore } = await import("./chunks/store-mysql-Dj8kSZS7.mjs");
		return {
			store: createMysqlStore(env),
			kind: `MySQL (${env.DB_NAME ?? "DATABASE_URL"})`
		};
	}
	if (url.startsWith("postgres")) {
		const { createPostgresStore } = await import("./chunks/store-postgres-DslrJnKr.mjs");
		return {
			store: createPostgresStore(url),
			kind: "Postgres"
		};
	}
	const { createSqliteStore } = await import("./chunks/store-sqlite-CT7naUcd.mjs");
	return {
		store: createSqliteStore(),
		kind: `SQLite (${env.DB_PATH ?? "data/yamsar.db"})`
	};
}
const { store, kind } = await createStore();
const app = createApp(store);
const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const hasDist = existsSync(resolve(dist, "index.html"));
if (hasDist) {
	const root = relative(process.cwd(), dist) || ".";
	const html = readFileSync(resolve(dist, "index.html"), "utf8");
	const page = () => new Response(html, { headers: {
		"content-type": "text/html; charset=utf-8",
		"cache-control": "no-cache"
	} });
	app.get("/", page);
	app.use("/assets/*", serveStatic({
		root,
		onFound: (_p, c) => c.header("Cache-Control", "public, max-age=31536000, immutable")
	}));
	app.use("*", serveStatic({ root }));
	app.get("*", (c) => c.req.path.startsWith("/assets/") ? c.notFound() : page());
}
const port = Number(process.env.PORT ?? 8787);
serve({
	fetch: app.fetch,
	port
}, () => console.log(`Yamsar Resort on port ${port} · storage: ${kind}${hasDist ? " · serving site" : ""}`));
export {};

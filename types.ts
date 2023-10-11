import * as http from 'http';

type readBodyFunction = (max?: number) => Promise<Buffer>;

export interface ServerConfig {
	host: string;
	port: number;
	prod: boolean;
	routes: Array<routeItem>;
}

export interface routeItem {
	method: Array<string>;
	path: RegExp;
	fn: Function;
	timeout: number;
}

export interface middlewareItem {
	path: RegExp;
	handler: Function;
	timeout: number;
	method: Array<string>;
}

export interface middlewareMatched {
	handler: Function;
	timeout: number;
	params: RegExpMatchArray | null;
}

export interface reqCtx {
	params: RegExpMatchArray | null;
	run: boolean;
	middlewares: Array<middlewareItem>;
	routes: Array<routeItem>;
}

export interface afterTask {
	timeout: number;
	handler: Function;
	params: RegExpMatchArray | null;
}

export type requestctx = http.IncomingMessage & requestFns

export interface requestFns {
	body: readBodyFunction;
	json: Function;
	ctx: reqCtx;
	path: string;
	query: URLSearchParams;
	after: Function;
}

export type responsectx = http.ServerResponse & responseFns

export interface responseFns {
	json: Function;
	file: Function;
	send: Function;
}
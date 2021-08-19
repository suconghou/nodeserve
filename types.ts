import * as http from 'http';
import * as querystring from 'querystring';

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

export interface reqCtx {
	params: RegExpMatchArray;
	run: boolean;
	middlewares: Array<middlewareItem>;
	routes: Array<routeItem>;
}

export interface afterTask {
	timeout: number;
	handler: Function;
	params: RegExpMatchArray;
}

export interface requestctx extends http.IncomingMessage {
	body?: Function;
	json?: Function;
	ctx?: reqCtx;
	path?: string;
	query?: querystring.ParsedUrlQuery;
	after?: Function;
}

export interface responsectx extends http.ServerResponse {
	json?: Function;
	file?: Function;
	send?: Function;
}

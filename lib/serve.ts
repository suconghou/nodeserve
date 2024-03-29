import * as http from 'http'

import file from './file'
import servefns from './servefns'
import { requestctx, responsectx, middlewareItem, afterTask, requestFns } from '../types'

export default class extends servefns {

	private httpser: http.Server;

	constructor() {
		super()
		this.httpser = this.init();
	}

	private init() {
		return http.createServer(async (request: http.IncomingMessage, response: http.ServerResponse) => {
			const errhandler = (e?: any) => {
				console.error(e);
				if (!response.headersSent) {
					response.writeHead(500);
				}
				if (!response.writableEnded) {
					response.end(e.message || e.toString())
				}
			}
			try {
				request.once('error', errhandler);
				response.once('error', errhandler);
				const [pathname, qs] = decodeURI(request.url || '').split('?');
				const query = new URLSearchParams(qs);
				this.buildctx(request, response, pathname, query);
				let ret: any;
				ret = await this.middleware(request as requestctx, response as responsectx, pathname, query);
				if (ret) {
					ret = await this.route(request as requestctx, response as responsectx, pathname, query);
					if (ret) {
						ret = await this.servestatic(request as requestctx, response as responsectx, pathname, query);
					}
				}
				await this.runAfter(request as requestctx, response as responsectx, pathname, query);
			} catch (e) {
				errhandler(e)
			}
		});
	}



	listen(...args: Array<any>) {
		return this.httpser.listen(...args);
	}


	private async middleware(req: requestctx, res: responsectx, pathname: string, query: URLSearchParams) {
		const ret = await this.runMiddleWare(req, res, pathname, query)
		return ret && req.ctx.run;
	}


	private async route(req: requestctx, res: responsectx, pathname: string, query: URLSearchParams) {
		const ret = await this.runRoute(req, res, pathname, query);
		return ret && req.ctx.run;
	}


	private servestatic(req: requestctx, res: responsectx, pathname: string, query: URLSearchParams) {
		return file.serve(req, res, pathname);
	}

	private getAfter(middlewareList: Array<middlewareItem>, m: string, uri: string) {
		const middlewares: Array<afterTask> = [];
		for (let i = 0, j = middlewareList.length; i < j; i++) {
			const { method, handler, path, timeout } = middlewareList[i];
			if (method.includes(m) && path.test(uri)) {
				middlewares.push({ timeout, handler, params: uri.match(path) })
			}
		}
		return middlewares;
	}

	private async runAfter(req: requestctx, res: responsectx, pathname: string, query: URLSearchParams) {
		const m = this.getAfter(req.ctx.middlewares, req.method || 'GET', pathname)
		for (let i = 0, j = m.length; i < j; i++) {
			const { handler, timeout } = m[i];
			const ret = await new Promise(async (resolve, reject) => {
				const t = setTimeout(() => {
					resolve(false)
				}, timeout);
				const next = () => {
					clearTimeout(t);
					resolve(true);
				}
				const stop = () => {
					clearTimeout(t);
					resolve(false);
				}
				try {
					await handler(req, res, next, stop)
				} catch (e) {
					reject(e)
				}
			});
			if (ret === false) {
				return false
			}
		}
		return true
	}

}
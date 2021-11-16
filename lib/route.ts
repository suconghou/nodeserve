
import { routeItem, middlewareItem, requestctx, responsectx } from '../types'

export default class {

	private routes: Array<routeItem> = []

	private middlewares: Array<middlewareItem> = [];


	constructor() {

	}

	get(path: RegExp, fn: Function) {
		return this.add(path, fn, ['GET']);
	}
	post(path: RegExp, fn: Function) {
		return this.add(path, fn, ['POST']);
	}
	put(path: RegExp, fn: Function) {
		return this.add(path, fn, ['PUT']);
	}
	delete(path: RegExp, fn: Function) {
		return this.add(path, fn, ['DELETE']);
	}
	head(path: RegExp, fn: Function) {
		return this.add(path, fn, ['HEAD']);
	}
	patch(path: RegExp, fn: Function) {
		return this.add(path, fn, ['PATCH']);
	}
	options(path: RegExp, fn: Function) {
		return this.add(path, fn, ['OPTIONS']);
	}
	add(path: RegExp, fn: Function, method: Array<string> = ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH", "OPTIONS"], timeout = 5000) {
		this.routes.push({ method, path, fn, timeout });
		return this;
	}

	use(prefix: any = '', middleware: any = null, timeout = 5000, method: Array<string> = ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH", "OPTIONS"]) {
		let path = prefix;
		let handler = middleware;
		if (!handler) {
			path = false
			handler = prefix
		}
		this.middlewares.push({ path, handler, timeout, method })
		return this;
	}

	private match(m: string, uri: string) {
		for (let i = 0, j = this.routes.length; i < j; i++) {
			const { method, path, fn, timeout } = this.routes[i];
			if (method.includes(m) && (!path || path.test(uri))) {
				return { fn, params: uri.match(path), timeout }
			}
		}
		return false;
	}

	protected async runRoute(req: requestctx, res: responsectx, pathname: string, query: URLSearchParams) {
		const m = this.match(req.method, pathname)
		if (!m) {
			return true
		}
		const { fn, params, timeout } = m;
		req.ctx.params = params
		return await new Promise(async (resolve, reject) => {
			const t = setTimeout(() => {
				resolve(false)
			}, timeout);
			try {
				await fn(req, res, pathname, query)
			} catch (e) {
				reject(e)
			} finally {
				resolve(false);
				clearTimeout(t)
			}
		})
	}

	private middlewareMatch(m: string, uri: string) {
		const middlewares = [];
		for (let i = 0, j = this.middlewares.length; i < j; i++) {
			const { method, handler, path, timeout } = this.middlewares[i];
			if (method.includes(m) && (!path || path.test(uri))) {
				middlewares.push({ timeout, handler, params: uri.match(path) })
			}
		}
		return middlewares;
	}

	protected async runMiddleWare(req: requestctx, res: responsectx, pathname: string, query: URLSearchParams) {
		const m = this.middlewareMatch(req.method, pathname)
		req.ctx = {
			params: [],
			run: true,
			middlewares: [],
			routes: []
		};
		for (let i = 0, j = m.length; i < j; i++) {
			const { handler, params, timeout } = m[i];
			const ret = await new Promise(async (resolve, reject) => {
				req.ctx.params = params
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
		return true;
	}

}
import * as querystring from 'querystring';
import * as http from 'http'

import file from './file'
import servefns from './servefns'
import { requestctx, responsectx, middlewareItem } from '../types'

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
                if (!response.finished) {
                    response.end(e.message || e.toString())
                }
            }
            try {
                request.once('error', errhandler);
                response.once('error', errhandler);
                const [pathname, qs] = decodeURI(request.url).split('?');
                const query = querystring.parse(qs);
                this.buildctx(request, response, pathname, query);
                let ret: any;
                ret = await this.middleware(request, response, pathname, query);
                if (ret) {
                    ret = await this.route(request, response, pathname, query);
                    if (ret) {
                        ret = await this.servestatic(request, response, pathname, query);
                    }
                }
                await this.runAfter(request, response, pathname, query);
            } catch (e) {
                errhandler(e)
            }
        });
    }



    listen(...args: Array<any>) {
        return this.httpser.listen(...args);
    }


    private async middleware(req: requestctx, res: responsectx, pathname: string, query: querystring.ParsedUrlQuery) {
        await this.runMiddleWare(req, res, pathname, query)
        return req.ctx.run;
    }


    private async route(req: requestctx, res: responsectx, pathname: string, query: querystring.ParsedUrlQuery) {
        let ret: any;
        try {
            ret = await this.runRoute(req, res, pathname, query);
        } catch (e) {
            if (e !== true) {
                throw e;
            }
            ret = false
        } finally {
            return ret && req.ctx.run;
        }
    }


    private async servestatic(req: requestctx, res: responsectx, pathname: string, query: querystring.ParsedUrlQuery) {
        return file.serve(req, res, pathname);
    }

    private getAfter(middlewareList: Array<middlewareItem>, m: string, uri: string) {
        const middlewares = [];
        for (let i = 0, j = middlewareList.length; i < j; i++) {
            const { method, handler, path, timeout } = middlewareList[i];
            if (method.includes(m) && path.test(uri)) {
                middlewares.push({ timeout, handler, params: uri.match(path) })
            }
        }
        return middlewares;
    }

    private async runAfter(req: requestctx, res: responsectx, pathname: string, query: querystring.ParsedUrlQuery) {
        try {
            const m = this.getAfter(req.ctx.middlewares, req.method, pathname)
            for (let i = 0, j = m.length; i < j; i++) {
                const { handler, timeout } = m[i];
                await new Promise((resolve, reject) => {
                    const t = setTimeout(() => {
                        reject(true)
                    }, timeout);
                    const next = () => {
                        clearTimeout(t);
                        resolve();
                    }
                    const stop = () => {
                        clearTimeout(t);
                        reject(true);
                    }
                    handler(req, res, next, stop)
                });
            }
        } catch (e) {
            if (e !== true) {
                throw e;
            }
        }
    }

}
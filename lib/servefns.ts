import * as querystring from 'querystring';
import * as http from 'http'
import * as path from 'path'

import route from './route'
import file from './file'
import { requestctx, responsectx } from '../types'

export default class extends route {
    constructor() {
        super()
    }

    protected buildctx(req: requestctx, res: responsectx, pathname: string, query: querystring.ParsedUrlQuery) {
        req.path = pathname
        req.query = query;
        req.body = this.body(req);
        req.json = this.parseJson(req);

        req.after = (prefix: any, middleware: any, timeout: number = 5000, method: Array<string> = ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH", "OPTIONS"]) => {
            let path = prefix;
            let handler = middleware;
            if (!handler) {
                path = /^\//
                handler = prefix
            }
            req.ctx.middlewares.push({ path, handler, timeout, method })
            return req;
        };

        res.json = this.sendJson(res);
        res.send = this.sendData(res)
        res.file = this.sendFile(req, res);

    }

    private body(request: requestctx) {
        return async (max = 8192) => {
            return await new Promise((resolve, reject) => {
                let buf = [], count = 0;
                request
                    .on('error', reject)
                    .on('aborted', reject)
                    .on('data', (data) => {
                        buf.push(data);
                        count += data.length;
                        if (count > max) {
                            reject('body too large');
                        }
                    }).on('end', () => {
                        resolve(Buffer.concat(buf));
                    });
            });
        }
    }

    private parseJson(request: requestctx) {
        return async (max = 8192) => {
            const bodyParser = this.body(request);
            const buf = await bodyParser(max);
            return JSON.parse(buf.toString() || '{}');
        }
    }

    private sendJson(response: responsectx) {
        return (data: object, status: number = 200) => {
            const str = JSON.stringify(data)
            response.writeHead(status, {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(str,'utf8')
            });
            return response.end(str);
        }
    }

    private sendData(response: responsectx) {
        return (data: string, type = 'text/html', status: number = 200) => {
            response.writeHead(status, {
                'Content-Type': type,
                'Content-Length': Buffer.byteLength(data,'utf8')
            });
            return response.end(data);
        }
    }

    private sendFile(request: requestctx, response: responsectx) {
        return (filepath: string) => {
            return file.serve(request, response, filepath, '.', '')
        }
    }

    static static(dir: string) {
        return async (request: requestctx, response: responsectx, next: Function, stop: Function) => {
            return file.serve(request, response, request.path, dir) && stop();
        }
    }

}
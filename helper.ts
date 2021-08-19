import { requestctx, responsectx } from './types';

export const cors = (request: requestctx, response: responsectx, next: Function) => {
	const { origin } = request.headers;
	if (origin) {
		response.setHeader('Access-Control-Allow-Origin', origin);
		response.setHeader('Access-Control-Allow-Credentials', 'true');
	} else {
		response.setHeader('Access-Control-Allow-Origin', '*');
	}
	response.setHeader('Access-Control-Max-Age', '604800');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD, PATCH, OPTIONS');
	response.setHeader(
		'Access-Control-Allow-Headers',
		'Range, Origin, X-Requested-With, Content-Type, Content-Length, Accept, Accept-Encoding, Cache-Control, Expires, Pragma'
	);
	response.setHeader('Access-Control-Expose-Headers', 'Content-Length, Accept-Ranges');
	next();
};

export const log = (request: requestctx, response: responsectx, next: Function) => {
	const start = Date.now();
	request.after((req: requestctx, res: responsectx, tonext: Function) => {
		setTimeout(() => {
			console.info(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}`);
		}, 0);
		tonext();
	});
	next();
};

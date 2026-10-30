# nodeserve

零依赖的 TypeScript HTTP 框架。

## 执行流程

```
中间件 → 路由 → 静态文件 → after 钩子
```

- 中间件：多匹配，按注册顺序依次执行；`next()` 继续，`stop()` 中断；两者都不调用时按超时（默认 5000ms）中断。
- 路由：单匹配，第一个 method + path 匹配的 handler 执行；命中后跳过静态文件。
- 静态文件：仅在前两步未命中时执行；支持 `Range`（206）、`304`、`416`，并拒绝路径穿越。
- after 钩子：正常流程结束后执行；在 handler 内用 `req.after()` 注册。

## 快速开始

```ts
import serve, { cors, log } from './index';

const app = new serve();

app.use(log);
app.use(cors);

// 静态域：按前缀挂载，命中即结束，不再进入路由
// serve.static 用完整 pathname 拼目录，所以 /assets/x.js 会读 ./dist/assets/x.js
app.use(/^\/assets\//, serve.static('./dist'));

app.get(/^\/api\/hello/, (req, res) => {
  res.json({ ok: true });
});

// SPA 页面兜底：最后注册，排除 /api 和带扩展名的资源
app.get(/^\/(?!api(?:\/|$))(?!.*\.[^/]*$)/, (req, res) => {
  res.file('./dist/index.html');
});

app.listen(9090, '0.0.0.0');
```

构建运行：

```sh
make ts      # tsc + rollup → main.bundle.js
node main.bundle.js
```

或 `make build` 一步完成编译并启动。

## 路由

```ts
app.get(/^\/item\/(\d+)/, (req, res) => {
  const [, id] = req.ctx.params!;
  res.json({ id });
});

app.post(/^\/api\/save/, async (req, res) => {
  const data = await req.json();
  res.json({ ok: true, data });
});

// 自定义方法与超时
app.add(/^\/api\/slow/, handler, ['GET', 'POST'], 10000);
```

- `app.get/post/put/delete/head/patch/options(path: RegExp, fn)`
- `app.add(path, fn, methods?, timeout?)`
- handler：`(req, res, pathname, query) => void | Promise<void>`

## 中间件

```ts
app.use(async (req, res, next, stop) => {
  if (!req.headers.authorization) {
    res.json({ error: 'unauthorized' }, 401);
    return stop();
  }
  next();
});

// 带前缀、超时、方法限制
app.use(/^\/admin\//, handler, 3000, ['GET']);
```

- `app.use(handler)` 或 `app.use(prefix: RegExp, handler, timeout?, methods?)`
- handler：`(req, res, next, stop)`；不调用 next/stop 时超时后中断
- 内置：`serve.static(dir)`、`cors`、`log`

## request

| 成员 | 说明 |
| --- | --- |
| `req.path` | 路径（不含 query） |
| `req.query` | `URLSearchParams` |
| `req.ctx.params` | 当前匹配到的路由参数 |
| `req.ctx.run` | 是否继续后续步骤 |
| `req.body(max?)` | 读取原始 body，`Promise<Buffer>`，默认上限 8KB |
| `req.json(max?)` | 解析 JSON body |
| `req.after(handler)` / `req.after(prefix, handler, timeout?, methods?)` | 注册 after 钩子 |

## response

| 成员 | 说明 |
| --- | --- |
| `res.json(data, status = 200)` | 响应 JSON |
| `res.send(data, type = 'text/html', status = 200)` | 响应文本 |
| `res.file(filepath)` | 响应文件（相对进程 cwd，支持 Range / 304 / 416） |

## 结构

```
lib/serve.ts     请求主流程（中间件 → 路由 → 静态 → after）
lib/route.ts     路由与中间件注册、匹配
lib/servefns.ts  req / res 扩展
lib/file.ts      静态文件与 MIME
helper.ts        cors / log
```

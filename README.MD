## nodeserve

typescript nodejs http framework

执行流程:


中间件 --> 路由 --> 静态文件 --> after钩子

`中间件 --> 路由 --> 静态文件` 过程,任意一个过程返回false,即中断后续执行

`after钩子`必然会执行,此钩子检查当前请求生成的中间件执行栈

依次执行,每个中间件可配置使用继续执行(next),还是中断(stop);默认不选择时将会等待超时然后stop





中间件 --> 决定路由配置,动态路由
中间件 --> 决定静态文件配置


中间件是多匹配模式

路由是但匹配模式

路由超时时间

路由执行过后若未end则,执行静态文件

中间件的权限非常大,可遍历整个路由,增删查改



中间件有两种流程控制

next,stop



框架提供的req

属性

req.path

req.query

req.ctx

当前路由信息

params 匹配到的路由参数

run

middlewares

routes



方法

async req.body

async req.json

req.after



框架提供的res


方法

async json

响应json数据

async file

响应文件


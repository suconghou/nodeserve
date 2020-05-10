import { requestctx, responsectx } from './types'
import serve, { cors, log } from './index'

const opts = {
    port: 9090,
    host: '0.0.0.0'
}

const app = new serve();

app.use(log)
app.use(cors)
app.use(/^.*/, serve.static('./'))
app.get(/^\/api/, async (req: requestctx, res: responsectx) => {
    res.send("hello");
})
app.listen(opts.port, opts.host, () => {
    console.info('Server listening on port %d', opts.port)
}).on('error', err => {
    console.error(err.toString())
});

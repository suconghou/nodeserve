import serve from './lib/serve'
import { cors, log } from './helper'

const opts = {
    port: 9090,
    host: '0.0.0.0'
}

const app = new serve();
app.use('', log)
app.use('', cors)
app.use(/lib/, serve.static('./'))
app.listen(opts.port, opts.host, () => {
    console.info('Server listening on port %d', opts.port)
}).on('error', err => {
    console.error(err.toString())
});

import 'dotenv/config'
import { createApp } from './server'

const port = Number(process.env.PORT) || 4000
const app = createApp()

app.get('/ping', (c) => c.text('pong'))
app.get('/healthz', (c) => c.text('ok'))

export default {
  port,
  fetch: app.fetch,
}

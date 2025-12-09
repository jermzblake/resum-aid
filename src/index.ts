import 'dotenv/config'
import { createApp } from './server'

const port = Number(process.env.PORT) || 4000
const app = createApp()

app.get('/ping', (c) => c.text('pong'))

export default {
  port,
  fetch: app.fetch,
}

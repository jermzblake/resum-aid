import 'dotenv/config'
import { createApp } from './server'

const app = createApp()

app.get('/ping', (c) => c.text('pong'))

export default {
  port: 4000,
  fetch: app.fetch,
}

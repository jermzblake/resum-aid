import 'dotenv/config'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono()

app.use('/*', serveStatic({ root: './public' }))

// app.get('/', (c) => {
//   return c.text('Hello Hono!')
// })
app.get('/', (c) =>
  c.html(`<html>
  <head>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body class="bg-red-100">
    Hello Tailwind v4 + Hono + HTMX
  </body>
</html>`),
)

app.get('/ping', (c) => c.text('pong'))

export default {
  port: 4000,
  fetch: app.fetch,
}

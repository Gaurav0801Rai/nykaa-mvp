import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Serves the same handlers from api/ during `npm run dev`, so the Groq routes
// work locally without the Vercel CLI. Production still runs them as Vercel
// serverless functions — this is the identical code, just mounted on the dev
// server. It only ever runs in Node: no key is exposed to the browser, and the
// plugin is not applied to the build.
function localApiRoutes() {
  return {
    name: 'local-api-routes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (!path.startsWith('/api/')) return next()

        const name = path.slice('/api/'.length)
        if (!/^[a-z0-9-]+$/i.test(name)) return next()

        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', async () => {
          const raw = Buffer.concat(chunks).toString('utf8')

          // minimal Vercel-style req/res shims
          let body = null
          try {
            body = raw ? JSON.parse(raw) : null
          } catch {
            body = raw
          }

          const shim = {
            statusCode: 200,
            setHeader: (k, v) => res.setHeader(k, v),
            status(code) {
              this.statusCode = code
              return this
            },
            json(payload) {
              res.statusCode = this.statusCode
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(payload))
              return this
            },
          }

          try {
            const mod = await server.ssrLoadModule('/api/' + name + '.js')
            await mod.default({ method: req.method, body }, shim)
          } catch (err) {
            server.config.logger.error('[local-api] ' + name + ': ' + err.message)
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'No such route' }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load .env.local without a VITE_ prefix so the keys stay server-side. They
  // are pushed onto process.env for the api handlers and are never inlined
  // into client code.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of [
    'GROQ_API_KEY_CONFIDENCE',
    'GROQ_API_KEY_OCCASION',
    'GROQ_API_KEY_CROSSSELL',
    'GROQ_MODEL',
  ]) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), localApiRoutes()],
    server: {
      port: 3040,
      strictPort: true,
      open: true,
    },
  }
})

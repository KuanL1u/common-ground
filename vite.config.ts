import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { createCommunityMiddleware } from './src/community/server.ts'

export default defineConfig({
  plugins: [react(), {
    name: 'local-garden-community',
    configureServer(server) {
      const community = createCommunityMiddleware({
        dataDirectory: process.env.COMMON_GROUND_DATA_DIR ?? resolve('.local-data'),
        geometryPath: resolve('src/data/east-bay-map.json'),
        cookieName: 'common-ground-neighbor-dev',
      })
      server.middlewares.use(community)
      server.httpServer?.once('close', () => { void community.close() })
    },
    configurePreviewServer(server) {
      const community = createCommunityMiddleware({
        dataDirectory: process.env.COMMON_GROUND_DATA_DIR ?? resolve('.local-data'),
        geometryPath: resolve('src/data/east-bay-map.json'),
        cookieName: 'common-ground-neighbor-preview',
      })
      server.middlewares.use(community)
      server.httpServer.once('close', () => { void community.close() })
    },
  }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
})

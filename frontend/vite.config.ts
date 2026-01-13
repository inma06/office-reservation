import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // /api를 제거하고 이중 슬래시도 정규화
        rewrite: (path) => {
          // /api 제거 후 이중 슬래시 정규화
          const cleaned = path.replace(/^\/api\/?/, '/');
          // 이중 슬래시를 단일 슬래시로 변환 (단, http:// 같은 프로토콜은 제외)
          return cleaned.replace(/([^:]\/)\/+/g, '$1');
        },
      },
    },
  },
})


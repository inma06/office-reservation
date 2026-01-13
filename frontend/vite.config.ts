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
        // 백엔드에 /api 프리픽스가 있으므로 그대로 전달 (이중 슬래시만 정규화)
        rewrite: (path) => {
          // 이중 슬래시를 단일 슬래시로 변환 (단, http:// 같은 프로토콜은 제외)
          return path.replace(/([^:]\/)\/+/g, '$1');
        },
      },
    },
  },
})


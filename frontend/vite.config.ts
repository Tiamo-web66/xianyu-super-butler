import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 后端基础 URL，支持通过环境变量 VITE_BACKEND_URL 覆盖
const backendUrl = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8090';

export default defineConfig(({ mode }) => ({
  // 开发模式使用根路径，生产模式使用 /static/ 前缀
  base: mode === 'production' ? '/static/' : '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // 代理API请求到后端
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 代理其他后端请求
      '/cookies': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/qr-login': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/password-login': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/keywords': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/keywords-with-item-id': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/default-reply': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/items': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/cards': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/delivery-rules': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/notification-channels': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/message-notifications': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/ai-reply-settings': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/system-settings': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/user-settings': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/admin': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/analytics': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/backup': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/logs': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/login': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/api/login': {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/login/, '/login'),
      },
      '/verify': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/logout': {
        target: backendUrl,
        changeOrigin: true,
      },
      // '/register' 不代理，让 Vite 处理前端路由
      '/generate-captcha': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/verify-captcha': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/geetest': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/send-verification-code': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/change-password': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/health': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: '../static',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    emptyOutDir: false,
  },
}));

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 后端基础 URL，支持通过环境变量 VITE_BACKEND_URL 覆盖
const backendUrl = process.env.VITE_BACKEND_URL || backendUrl

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  optimizeDeps: {
    exclude: []
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/login': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          if (req.method === 'GET') {
            return '/index.html'
          }
        },
      },
      '/verify': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/cookies': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/delivery-rules': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/system-settings': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/logs': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/users': {
        target: backendUrl,
        changeOrigin: true,
      },
      // 管理员API - 前端有 /admin/* 路由，需要区分浏览器访问和 API 请求
      '/admin': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          // 浏览器直接访问（Accept 包含 text/html）时，让前端路由处理
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      '/risk-control-logs': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/qrcode': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/generate-captcha': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/verify-captcha': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/send-verification-code': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/registration-status': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/login-info-status': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/geetest': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/register': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          // 浏览器直接访问时返回前端页面，只有 POST 请求才代理到后端
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      '/itemReplays': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/item-reply': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/default-replies': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/ai-reply-settings': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/ai-reply-test': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/password-login': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/qr-login': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/keywords-export': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/keywords-import': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/upload-image': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/default-reply': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/static': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/backup': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/project-stats': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/change-password': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/change-admin-password': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/check-default-password': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/logout': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/user-settings': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/search': {
        target: backendUrl,
        changeOrigin: true,
      },
      // 商品管理 - 前端有 /items 路由，需要区分浏览器访问和 API 请求
      '/items': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          // 只有浏览器直接访问 /items 路径时才返回前端页面
          // API 请求通常是 /items/xxx 或带有 application/json
          const isApiRequest = req.url !== '/items' ||
            req.headers.accept?.includes('application/json') ||
            req.headers['content-type']?.includes('application/json')
          if (!isApiRequest && req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      // 卡券管理 - 前端有 /cards 路由
      '/cards': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      // 通知渠道 - 前端有 /notification-channels 路由
      '/notification-channels': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      // 消息通知 - 前端有 /message-notifications 路由
      '/message-notifications': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      // 关键词 - 前端有 /keywords 路由
      '/keywords': {
        target: backendUrl,
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        },
      },
      // 订单 API - 后端路径是 /api/orders
      '/api/orders': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../static',
    // 不使用 emptyOutDir，避免删除重要文件（如 xianyu_js_version_2.js）
    // 资源放在 assets 目录
    assetsDir: 'assets',
  },
  // 生产环境使用 /static/ 作为 base，确保资源路径正确
  base: command === 'build' ? '/static/' : '/',
}))

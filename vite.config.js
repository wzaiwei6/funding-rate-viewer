import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // ✨✨✨ 新增 base 属性 ✨✨✨
  base: '/funding-rate-viewer/', // ‼️ 替换为你的仓库名
  plugins: [vue()],
})
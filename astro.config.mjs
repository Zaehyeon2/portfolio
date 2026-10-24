// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import rehypeLabel from './src/lib/rehype-label.mjs';

export default defineConfig({
  site: 'https://hammerturtle.xyz',
  base: '/portfolio',
  trailingSlash: 'always',
  // 화면에 보이는 링크의 상세 HTML 을 미리 받아, 눌렀을 때 네트워크를 기다리지 않고 바로 전환한다
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  integrations: [react()],
  markdown: { processor: unified({ rehypePlugins: [rehypeLabel] }) },
  vite: { plugins: [tailwindcss()] },
});

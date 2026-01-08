# Bundle Analysis & Advanced Caching

This project supports advanced bundle analysis and caching for optimal performance and observability.

---

## Bundle Analysis
- Use `vite-plugin-analyzer` for Vite projects or `webpack-bundle-analyzer` for Webpack.
- Add a script to generate bundle reports after build.
- Example (Vite):
  1. Install: `pnpm add -D vite-plugin-analyzer`
  2. Add to `vite.config.ts`:
     ```ts
     import { visualizer } from 'vite-plugin-analyzer';
     export default defineConfig({
       plugins: [visualizer()]
     });
     ```
  3. Run: `pnpm build` and open the generated report.

## Advanced Caching
- Use HTTP cache headers (CDN, Vercel, NGINX, etc.)
- Add service worker for offline and asset caching (e.g., Workbox)
- Use CI cache for dependencies and build artifacts (see GitHub Actions docs)

---

## References
- [vite-plugin-analyzer](https://github.com/vitejs/vite-plugin-analyzer)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Workbox](https://developer.chrome.com/docs/workbox/)
- [GitHub Actions Cache](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

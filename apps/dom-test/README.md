# @jl-org/tool DOM Test

独立的 Vite + SolidJS 浏览器测试应用，用于通过真实 DOM、媒体设备和浏览器 API 验证 `@jl-org/tool` 源码行为。

## 目录

```text
src/
  components/  页面共享 UI
  pages/       每个测试路由对应一个 Solid 页面
  routeMeta.ts 首页和路由共用的页面元数据
  routes.tsx   元数据到页面组件的注册表
```

页面必须使用 JSX 声明 DOM，并通过 Solid 的 `onMount` / `onCleanup` 管理外部 API 和资源生命周期。不要新增 `document.createElement`、iframe 或旧式页面初始化脚本。

## 命令

```bash
pnpm dev
pnpm typecheck
pnpm build
pnpm test
```

# 发布 SYS_ERROR 完整游戏

## 一、本地已保存

项目根目录已初始化 Git，所有源码在 `sys-error-full-game/` 内。

## 二、上线前构建

```bash
cd sys-error-full-game
npm install
npm run build
```

构建产物在 **`dist/`** 文件夹（含 Step 1–4、Bridge 视频、手势 samples、Shuttle 支持脚本）。

本地预览：

```bash
npm run preview
```

## 三、发布方式（任选其一）

### 方式 A：Netlify 拖拽（最简单）

1. 运行 `npm run build`
2. 打开 https://app.netlify.com/drop
3. 把 **`dist` 整个文件夹** 拖进去
4. 获得公网链接，例如 `https://xxx.netlify.app`

### 方式 B：Netlify 连 GitHub

1. 把本项目 push 到 GitHub 仓库
2. Netlify → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. 根目录已有 `netlify.toml`，会自动识别

### 方式 C：Vercel

1. 导入 GitHub 仓库
2. Framework: Vite
3. Build: `npm run build`，Output: `dist`

## 四、现场装置注意事项

- 必须用 **HTTPS 或 localhost** 才能使用摄像头与 Shuttle WebHID
- 推荐 **Chrome / Edge** 全屏运行
- 首次使用 Shuttle 需点右上角 **Connect Shuttle** 授权
- Step 4 手势数据已打包在 `part4/samples.json`，首次进入自动导入

## 五、游戏流程速查

`/` → `/part3/` → `/part2/` → `/bridge/` → `/part4/sequence.html` → 自动回到 `/`

详细说明见 [README-FULL-GAME.md](./README-FULL-GAME.md)

# GESTO Biometric XP

**AAA Studio** — 手势驱动的生物识别表演体验，Win98 怀旧桌面外壳。

基于 [gestomeme.com](https://gestomeme.com) 识别引擎（@hi.jessie）。摄像头、MediaPipe 与手势数据均在浏览器本地运行，不上传服务器。

## 在线体验

部署后访问站点根目录即可打开 Win98 桌面。主流程入口：**Biometric Sequence**（`sequence.html`）。

## 本地运行

需要 **HTTPS 或 localhost**（摄像头 + ES modules）：

```bash
cd gesto-biometric-xp
python -m http.server 8000
```

浏览器打开：

- 桌面首页：http://localhost:8000/
- 主表演：http://localhost:8000/sequence.html

## 使用流程

1. **我的表情包**（`trainer.html`）— 训练手势样本  
2. **Biometric Sequence**（`sequence.html`）— 扫描 → 表演 → 关机终幕  
3. **摄像头**（`play.html`）— 经典实时弹出模式  

手势数据保存在 `localStorage`。可导入 `samples.example.json` 作为模板；完整 `samples.json` 体积较大，请自行训练或导出。

## 部署

### Netlify（拖拽）

1. 将整个文件夹打成 zip（或使用下方已生成的 zip）  
2. 登录 [Netlify Drop](https://app.netlify.com/drop)  
3. 拖入 zip，获得公开 URL  

### Vercel

```bash
npx vercel --prod
```

### GitHub Pages

```bash
git init
git add .
git commit -m "Initial publish: GESTO Biometric XP"
# 在 GitHub 新建仓库后：
git remote add origin https://github.com/YOUR_USER/gesto-biometric-xp.git
git push -u origin main
```

仓库 Settings → Pages → Source: **Deploy from branch** → `main` / `/ (root)`。

## 依赖说明

- MediaPipe Hands / Face Landmarker（CDN）  
- 猫叫音效（运行时从 Wikimedia / Pixabay 加载，需联网）  
- 无需构建步骤，纯静态站点  

## 许可

手势引擎版权归 gestomeme.com 原作者。本项目为创意演示与表演用途。

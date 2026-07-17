# SYS_ERROR — Full Installation Game

A.A.A Studio 完整互动体验，四个章节串联：

| 章节 | 内容 | 路径 |
|------|------|------|
| Step 1 | XP 登录 → 桌面 → Relationship Detector | `/` |
| Step 2 | 双人脸关系识别扫描（face-scan） | `/part3/` |
| Step 3 | Human Verify 拼图竞技场（sys-error） | `/part2/` |
| Step 4 | GESTO 生物识别表演 → 关机终幕 | `/part4/sequence.html` |

## 流程

```
Step 1 Finish → Step 2 人脸扫描 → 结尾 OK
  → Step 3 拼图游戏 → 崩溃画面 CONTINUE
  → 过渡视频 → 白光 + Loading → Step 4 手势表演 → 系统关机 → credits → 自动回到 Step 1
```

## AB Shuttle 3 · 蓝牙快捷键

本装置默认控制器：**AB Shuttle 3（Bluetooth）**

### 设置步骤

1. Windows **蓝牙配对** AB Shuttle 3  
2. 打开 **Contour Shuttle** 驱动，把常用按钮映射为 **Enter** / **Space** / 任意单键  
3. 打开游戏 → **先点一下屏幕** → 在 Press to … 等待点 **按 Shuttle**  
4. **不必** Connect WebHID（蓝牙走键盘模式即可）

### 继续方式

| 输入 | 说明 |
|------|------|
| **AB Shuttle 3 蓝牙快捷键** | 驱动映射的任意键 / 组合键 |
| **鼠标点击** | 屏幕任意位置 |
| WebHID（可选） | 右上角按钮；蓝牙一般不用 |

等待时提示：`点击屏幕 或 按 AB Shuttle 3（蓝牙快捷键）→ 继续`  
按键成功时右上角：`✓ AB Shuttle 3 · Bluetooth · Enter`（示例）

实现：`game-shuttle-device.js` + `game-advance-input.js`

## 40 秒无人操作自动重置

任意 **Press to … / 按键继续** 等待点若 **40 秒内无人操作**，会自动退出整场游戏并回到 Step 1（`/`）。

实现：`public/game-idle-reset.js`（Part 2–4 + Bridge）与 Step 1 登录页的 `src/utils/gameIdleReset.ts`。

覆盖等待点包括：
- Step 1：`Press to log in`
- Step 2：`Press to start`、标题屏按键、`Press to OK`、片头 `PRESS ANY KEY TO SKIP`
- Step 3：欢迎向导 / Game Start 屏
- Bridge：`Press any key to skip`
- Step 4：关机 Results 对话框（Retry / Ignore）

## Step 4 训练数据

手势样本保存在浏览器 `localStorage`（键名 `gesto_engine_samples`），**不会**随 zip 自动带上你在别的地址训练的数据。

已把你桌面上的 `samples.json` 复制到 `public/part4/samples.json`。首次进入 Step 4 且本地无数据时会**自动导入**。

若仍为空：
1. 打开 `/part4/trainer.html` →「Import samples (json)」手动导入  
2. 或在控制台清除后重进：`localStorage.removeItem('gesto_engine_samples')`

## 过渡视频（Step 3 之后）

文件：`public/bridge/transition.mp4`  
Step 3 结束后自动进入播放页，播完（或按键跳过）进入 Step 4。

## 本地运行

需要 Node.js（Part 1 为 Vite + React）：

```bash
cd sys-error-full-game
npm install
npm run dev
```

浏览器打开 http://localhost:3000

**注意：** Part 2–4 需要摄像头；请用 localhost 访问，不要直接双击 HTML 文件。

## 构建部署

```bash
npm run build
npm run preview
```

`dist/` 文件夹包含全部四个章节，可部署到 Netlify / GitHub Pages / Vercel。

### Netlify 拖拽

1. 运行 `npm run build`
2. 将 `dist` 文件夹拖到 [Netlify Drop](https://app.netlify.com/drop)

## 开发说明

- Step 1：Relationship Detector 弹出约 1.4s 后 → 白光 + 魔法音效 → 自动进入 Step 2
- Step 2 结尾 OK → `/part2/`（拼图竞技场）
- Step 3 崩溃画面 → `/bridge/`（过渡视频）→ `/part4/sequence.html`
- Step 4 关机终幕 credits（AAA STUDIO + Thanks to @hi.jessie.）播完后 **自动回到 Step 1**（`/`）

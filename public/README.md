# Profile Avatar Replacement Guide (头像替换指南)

To replace the **A.A.A Studio** avatar (a.a.a studio Profile Picture) with your own custom image, follow the instructions below:

## English Instructions
1. Prepare your custom image in **PNG** or **JPG/JPEG** format.
2. Crop or resize it to a square ratio (e.g., `256x256` or `512x512` pixels) for the best visual display.
3. Name your file **`aaa-avatar.png`** (all lowercase, exactly like this).
4. Place or upload the file into the **`/public`** directory of this workspace:
   - File path: `/public/aaa-avatar.png`
5. The application will immediately and automatically detect your photo.
   - *Note:* If the image is not found, or has any issue loading, the login system will gracefully fallback to the custom hand-drawn vector SVG logo to prevent any broken image boxes.

---

## 中文指南
1. 准备您想要使用的自定义图片（格式可以是 **PNG**、**JPG** 或 **JPEG**）。
2. 为了达到最佳的 1:1 还原与视觉效果，建议将图片裁剪为正方形比例（例如 `256x256` 或 `512x512` 像素）。
3. 将您的图片命名为 **`aaa-avatar.png`**（确保全部为小写字母，名称完全一致）。
4. 将该文件放置或上传至当前工作区的 **`/public`** 目录下：
   - 完整文件路径：`/public/aaa-avatar.png`
5. 系统会自动并实时识别并渲染您上传的头像照片。
   - *提示：* 如果该路径下的图片文件不存在或无法加载，登录界面将自动、无缝地回退至精美的极简手绘线条 SVG 矢量 Logo，确保界面永远不会出现空图或破图裂块。

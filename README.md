# Dark Deco 3D 个人作品集

基于 React、Vite 与 React Three Fiber 的全屏第三人称作品集。访客以背影人物为视点，在 Dark Deco 门厅之间移动，并进入个人介绍、精选作品与能力优势三个空间化模块。

## 本地运行

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
```

## 操作

- 点击人物解锁场景与程序化音效
- `A` / `D` 或左右方向键：切换门厅，首尾循环
- `W` 或上方向键：进入当前模块
- 房间内 `A` / `D`：聚焦不同展品
- `S` / `Esc`：先收起展品，再返回走廊
- 窄屏设备使用底部触控按钮

## 内容更新

- 三个模块的占位内容统一位于 `src/portfolioData.js`
- 3D 世界和人物位于 `src/Experience.jsx`
- 交互状态、音效与降级逻辑位于 `src/main.jsx`
- React Bits `DepthText` 的项目内实现位于 `src/DepthText.jsx`
- React Bits `DriftWall` 的项目内实现位于 `src/DriftWall.jsx`；三个房间的分类内容均使用 Dark Deco 漂移陈列墙展示，并与原有键盘聚焦状态联动
- 全局视觉样式位于 `src/styles.css`
- 当前项目视觉为 AI 生成的原创 Dark Deco 艺术化素材；发布版本使用压缩 JPEG 纹理，并在用户进入档案馆后再加载人物动作帧。
- 当前引路人为原创电影感 Dark Deco 档案管家；待机、四段举镜过程与最终检查姿态位于 `public/assets/dark-deco-butler-*.jpg`。场景着色器以五阶段短混合完成连贯姿态过渡，W 入场时依次举镜、开门、推镜进入模块
- 房间展板集成了项目内 `Plasma` 光影组件；门厅采用三套原创高清深胡桃木双扇门，分别以鹿、渡鸦和狮子徽章代表个人介绍、精选作品与能力优势，并保留实体厚度、分扇开合和景深效果
- WebGL 不可用时自动显示静态可访问入口；减少动态效果模式会关闭持续动效与后期光效

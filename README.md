# 🏋️ FitBuddy — 免费的周期化健身计划生成器

> 不是又一个健身 App。是一套**科学周期化训练引擎**——自动为你的目标、水平、可用天数，生成有渐进超负荷和减载周的专业计划。
>
> 永久免费 · 开源 MIT · 无广告 · 无需注册 · 数据 100% 本地存储

[🚀 立即使用](https://santeb.github.io/fitbuddy/index.html) · [📖 产品介绍](https://santeb.github.io/fitbuddy/landing.html) · [⭐ 给个 Star](https://github.com/santeb/fitbuddy)

---

## ✨ 为什么是 FitBuddy？

大多数健身 App 只是**把一堆动作扔给你**，然后按月收钱。

FitBuddy 不一样：

| 常见做法 | FitBuddy |
|---------|----------|
| 每月 ¥25~¥40 订阅费 | **永久免费**，MIT 开源 |
| 训练数据上传云端 | **100% 本地存储**，只有你能看到 |
| 随机动作堆砌成"计划" | **科学周期化**：适应 → 渐进超负荷 → 减载 → 再突破 |
| 一套计划应付所有人 | **5 目标 × 3 水平 × 自定义天数** |
| 枯燥打卡，难以坚持 | **训练精灵养成 + 成就徽章 + 热力图** |

👉 [详细了解设计理念](https://santeb.github.io/fitbuddy/landing.html)

---

## 🎯 核心功能

### 📊 智能训练计划生成
- **5 大目标**：增肌 / 力量 / 减脂 / 心肺体能 / 马拉松（16 周备赛）
- **3 个水平**：新手 / 中级 / 进阶，自动调节训练量和休息时间
- **2-6 天/周**：灵活适配你的时间
- **多种设备**：健身房器械 / 哑铃 / 弹力带 / 自重

### 🔄 周期化训练逻辑（这是核心）
```
第 1 周  适应期   → 建立动作模式，中等强度
第 2-3 周 增负荷  → 渐进超负荷，推动肌肉/力量增长
第 4 周  减载周  → 降低训练量，防止过度训练
然后下一周期重新开始，重量/组数递增
```
这是力量训练教科书里的方法，99% 的健身 App 没做。

### 🏃 马拉松专项
- 16 周分阶段备赛计划
- LSD（长距离慢跑）自动排程
- 配速计算器
- 分档营养食谱和补给策略

### 🎮 训练精灵养成
- 5 个物种（含 1 个隐藏款），5 阶段进化
- 每次训练获得经验值
- SVG 手绘风格精灵肖像
- 社区训练者互动

### 🏆 游戏化激励系统
- 连续打卡记录 + 热力图
- 4 类 17 枚成就徽章
- 6 级等级系统
- 里程碑庆祝动画
- 热量消耗换算食物等价物（12 种）

### 🔧 实用工具
- **组间休息计时器**：浮动按钮，5 档预设（30s/60s/90s/2min/3min），蜂鸣音效
- **1RM 极限重量计算**：Epley + Brzycki 双公式，百分比负荷表
- **数据导出/导入**：JSON 格式备份和恢复
- **训练笔记**：每个训练日可写备注

### 🍎 营养计算
- 基础代谢率 + TDEE 计算
- 三大营养素配比
- 增肌/减脂双套饮食指南（中国饮食习惯适配）

### 📱 PWA 支持
- 可安装到手机主屏幕（iOS/Android）
- Service Worker 离线缓存
- 训练提醒通知

---

## 🚀 快速开始

### 在线使用
👉 **[santeb.github.io/fitbuddy](https://santeb.github.io/fitbuddy/index.html)**

### 本地使用
```bash
# 克隆仓库
git clone https://github.com/santeb/fitbuddy.git

# 直接用浏览器打开
open index.html   # macOS
start index.html  # Windows
```

**不需要安装任何东西。** 纯 HTML/CSS/JS，浏览器打开就能用。

---

## 📁 项目结构

```
fitbuddy/
├── index.html           # 主应用入口（~1150行）
├── landing.html         # 产品落地页
├── planner-core.js      # 核心引擎：计划生成/进度/营养/游戏化（~3950行）
├── data-constants.js    # 静态数据：动作库/配置/饮食指南（~370行）
├── pets.js              # 训练精灵养成系统（~1200行）
├── community.js         # 社区大厅/排行榜/AI训练者（~1130行）
├── sw.js                # PWA Service Worker
├── manifest.json        # PWA 清单
├── exercise-gifs/       # 86+ 动作示范 GIF
├── exercise-images/     # 打赏二维码
└── .gitignore
```

---

## 🛠 技术栈

- **纯前端**：HTML + CSS + JavaScript（零框架依赖）
- **存储**：localStorage（本地持久化）
- **PWA**：Service Worker + Web App Manifest
- **图表**：SVG 手绘精灵 + Canvas 热力图
- **音效**：Web Audio API

---

## 🗺 路线图

- [x] 5 目标 × 3 水平训练计划生成
- [x] 周期化递增 + 减载周
- [x] 100+ 动作库（含 B 站视频链接）
- [x] 营养计算 + 饮食指南
- [x] 连续打卡 + 热力图
- [x] 成就徽章系统
- [x] 训练精灵养成
- [x] 马拉松 16 周专项
- [x] PWA 离线支持
- [x] 组间休息计时器
- [x] 1RM 计算器
- [x] 数据导出/导入
- [x] 产品落地页
- [ ] 微信小程序版
- [ ] 训练数据可视化图表
- [ ] 自定义训练周期长度
- [ ] 多语言支持（英文）

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果你觉得 FitBuddy 有用：
- ⭐ **Star 这个仓库**
- 🐛 **报告 Bug** 或提功能建议
- 📢 **分享给需要的朋友**

---

## 📄 许可证

[MIT License](LICENSE) — 自由使用、修改、分发。

---

## 💬 联系

- **GitHub Issues**：[提交反馈](https://github.com/santeb/fitbuddy/issues)
- **Gitee 镜像**：[国内访问](https://gitee.com/wang-jiajienb/fitbuddy)

---

<p align="center">
  <sub>Made with 🏋️ by <a href="https://github.com/santeb">santeb</a></sub>
</p>

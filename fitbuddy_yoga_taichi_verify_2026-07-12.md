# FitBuddy 瑜伽/太极功能 — Node 运行时验证

日期：2026-07-12
项目路径：F:\workbuddy\fitness-app

## 目标
验证此前新增的「瑜伽/柔韧」(goal=yoga) 与「太极/养生」(goal=taichi) 训练目标能否正确生成计划、数据是否完整、UI 是否接线。

## 验证方法
由于无法在此环境启动真实浏览器，采用 Node 沙箱注入 DOM/localStorage 桩，加载 data-constants.js + planner-core.js，直接调用 buildPlan / buildYogaPlan / buildTaichiPlan 并打印结果。

> 关键发现：`planner-core.js` 第 5 行有一个生产环境 IIFE，当 `window` 存在且 `window._DEBUG` 为假时会把 `console.log` 替换为空函数。早期测试"静默退出"其实是 console.log 被静音，并非代码崩溃。测试桩须设 `window._DEBUG = true` 才能看到输出。

## 验证结果（全部通过）
- `buildPlan('yoga'/'taichi'/'muscle')` 均返回合法计划，days=4，badNames=0（所有动作名都能在 EXES 中找到）。
- EXES 中 `身心` 部位共 29 条：瑜伽 18 + 太极 11。
- 29 条身心动作 `desc` 与 `tips` 字段完整度为 100%（0 缺失）。
- `vid` 字段 29 条均为空字符串 → 动作库缩略图优雅降级为 `ex-badge`（与既有 GIF 缺失逻辑一致，属设计内）。
- `CONFIGS` 三个等级（beginner/intermediate/advanced）均已含 `yoga` 与 `taichi` 预设。
- `MUSCLE_ORDER` 含 `身心`；`BADGE_COLORS["身心"]=["#14B8A6","#F0FDFA"]`；`BADGE_TEXT["身心"]="柔"`。
- index.html 已接线：`g6`(🧘瑜伽/柔韧)、`g7`(☯️太极/养生) 目标单选；部位筛选栏含 `data-part="身心"` 筛选 chip。

## 结论
瑜伽/太极训练目标在「数据 → 计划生成 → 部位/徽章/配置 → UI 单选/筛选」全链路已完整可用，运行时逻辑无误。
动作演示媒体（GIF/视频）仍为占位（vid 空），沿用现有 ex-badge 降级，未编造视频 ID。

## 待确认/可选后续
- 是否补充瑜伽/太极动作的演示视频 URL（vid）以丰富动作库缩略图（需真实可用链接，避免伪造）。
- 真实浏览器视觉验收（本环境无法执行）。
- 删除本次验证产生的临时脚本（_verify*.js / _bisect*.js / _*.txt 等），需用户二次确认。

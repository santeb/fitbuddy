# FitBuddy 瑜伽/太极动作「动图」实现

日期：2026-07-12
项目路径：F:\workbuddy\fitness-app

## 需求
用户要求给瑜伽/太极动作加上动图（此前 29 个身心部位动作 vid 为空，动作库优雅降级为 ex-badge 占位）。

## 方案选择
- 现有 `exercise-gifs/` 有 86 个真实摄影 GIF（哈希文件名），`GIF_MAP` 把动作名映射到文件名；`renderLib` 与 `showEx` 都用 `exercise-gifs/<GIF_MAP[name]>`，且不检查扩展名（SVG 可入）。
- 无法可靠获取 29 个真实瑜伽/太极摄影 GIF（外链易 404，会成破图）。
- 决定：生成**自包含动画 SVG 演示**（本地文件、永不 404、真实可动、离线可用利于 PWA、不伪造照片）。

## 实现
1. `_gen_yt.js`：前向运动学(FK)生成火柴人，按 29 个动作各自的角度集合摆姿势；用 SMIL `<animateTransform>` 做符合动作语义的循环动效（呼吸起伏/左右轻摆/手臂云摆/起落/折叠/蹬腿等）；含动作中文名标注、应用 teal 主题渐变背景。输出 `exercise-gifs/yt01.svg`…`yt29.svg`（共 29 个）。
2. `_wire.js`：把 29 条 `"动作名":"ytNN.svg"` 追加进 `data-constants.js` 的 `GIF_MAP`（原 80 条→共 109 条）。语法自检通过。
3. 校验：`GIF_MAP` 29 个身心动作全部命中、对应 SVG 文件均存在；用 sharp 把 9 个代表性动作栅格化为 PNG，经图像识别确认姿势可辨、无断裂/悬浮/错位等渲染故障。

## 验证结论
- 29 个瑜伽/太极动作已有本地动画 SVG 演示，动作库缩略图与详情弹窗(`showEx`)均会显示。
- SVG 格式良好、可被浏览器 `<img>` 渲染并播放 SMIL 动画（Chrome/Firefox/Safari 均支持）。
- 因浏览器工具当前被禁用（需重启 gateway 启用），未做真实浏览器内动画播放截图；改以栅格化单帧 + 图像识别间接验证，姿势与渲染均正常。

## 待办/说明
- 真实浏览器动画播放需用户重启 gateway 后由浏览器工具复检（可选）。
- 临时脚本（_gen_yt.js/_wire.js/_verify_map.js/_render_test.js/_render_set.js/_server.js 及 _list_body.js 等）与预览 PNG 待清理，删除不可逆，需用户二次确认。
- 若日后有真实瑜伽/太极 GIF 源，只需替换 `exercise-gifs/ytNN.svg` 或在 GIF_MAP 改指向即可，无需改逻辑。

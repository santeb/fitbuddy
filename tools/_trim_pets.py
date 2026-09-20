# -*- coding: utf-8 -*-
# 一次性脚本：删除 pets.js 的精灵切磋战系统
# 保留 TYPE_CHART（community.js 的 showTrainerProfile 仍在使用）
import sys

p = r'F:\WorkBuddy\fitness-app\pets.js'
raw = open(p, 'rb').read()
L = raw.split(b'\n')
print('total_lines:', len(L))

# --- 边界校验：不通过就绝不改文件 ---
checks = [
    (618, b'petShowBattleModal', '切磋按钮所在行'),
    (681, b'petCalcPower',       '对战段起始行'),
    (693, b'petShowBattleModal', '对战弹窗函数'),
    (965, b'}',                  '对战段结束行'),
]
ok = True
for idx, token, desc in checks:
    line = L[idx] if idx < len(L) else b''
    hit = token in line
    print('  [%s] line %d (%s) -> %s' % ('OK' if hit else 'FAIL', idx + 1, desc, hit))
    if not hit:
        ok = False

if not ok:
    print('BOUNDARY CHECK FAILED - file untouched')
    sys.exit(1)

# --- 删除：先删靠后的区间，避免行号偏移 ---
del L[680:966]   # 行 681-966：petCalcPower ... renderWildBattleAnimation 结束
del L[616:620]   # 行 617-620：⚔️ 精灵切磋入口按钮块

open(p, 'wb').write(b'\n'.join(L))
print('done. new_total_lines:', len(L))

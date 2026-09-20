# -*- coding: utf-8 -*-
# 一次性脚本：删除 community.js 的对战 / 野外探索 / 捕捉 / 图鉴 玩法
# 保留：排行榜、训练者广场、档案、晒计划、微信群（1-371 行 + 末尾 load 监听）
import sys

p = r'F:\WorkBuddy\fitness-app\community.js'
raw = open(p, 'rb').read()
L = raw.split(b'\n')
print('total_lines:', len(L))

checks = [
    (372,  b'petChallengeTrainer', '对战段起始（函数定义）'),
    (1318, b'showWildGuide',       '图鉴引导（段内）'),
    (1363, b'};',                  'renderCommunity 包装结束'),
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

# 删除行 372-1364（petChallengeTrainer ... renderCommunity 包装结束）
del L[371:1364]

open(p, 'wb').write(b'\n'.join(L))
print('done. new_total_lines:', len(L))

// 饮食计算器（动作库页 #calcHub 第 4 tab「饮食」tab）
// 输入：体重 + 目标 + 活动 → 输出「一日蛋白/碳水/脂肪克数 + 手掌份数翻译 + 食材速查」
// 设计：零摩擦、私密本地、对齐 FitBuddy「轻工具」定位
// 2026-09-17：① 食材库扩到 55 种（补鱼/豆/外卖/坚果） ② localStorage 草稿（「今日已吃」按天清零）
//            ③ 首次使用自动带入计划页体重/目标 + 营养面板入口 goDietCalc()
// 2026-09-20：计划页营养建议联动——goDietCalc() 跳转时把计划页算好的 蛋白/碳水/脂肪/热量
//            直接同步过来 + 按 schedule 自动识别今天是否训练日，「今日已吃」的百分比和缺口
//            直接对标计划页数字；可一键切回手动矩阵。
//            同日晚些：加逐日档——每个训练日按「自己的」当日消耗单独算（腿日/手臂日/LSD 日碳水不同），
//            chip 条可切换 休息日/周一胸日🔥420/周六LSD🔥890 等，计划重渲染后按 label 重新对位。
(function () {
  // ---------- 公式：体重 × 系数（按目标 × 活动量调档） ----------
  // 数据来源：综合 ACSM/ISSN 主流建议，给日常用户够用的「目标档位」
  // 蛋白 1.6~2.2 g/kg，碳水 3~6 g/kg，脂肪 0.8~1.2 g/kg
  var DIET_MATRIX = {
    cut:   { p: [1.8, 2.0, 2.2], c: [3.0, 3.5, 4.0], f: [0.8, 0.9, 1.0] }, // 减脂
    keep:  { p: [1.6, 1.8, 2.0], c: [4.0, 4.5, 5.0], f: [1.0, 1.1, 1.2] }, // 维持
    bulk:  { p: [1.6, 1.8, 2.0], c: [5.0, 5.5, 6.0], f: [1.0, 1.1, 1.2] }  // 增肌
  };
  var ACTIVITY_LABEL = ['久坐', '活跃', '很累'];
  var GOAL_LABEL = { cut: '减脂', keep: '维持', bulk: '增肌' };

  // ---------- 内置食材速查库（55 种，每 100g 数据，蛋白/碳/脂 g + kcal） ----------
  // 数据来源：USDA / 中国食物成分表 常用值，四舍五入到日常够用
  var FOODS = [
    // 蛋白类（19）—— 生肉按生重（买多少称多少）；鸡蛋/豆制品/奶制品按成品
    { cat: '蛋白', name: '鸡胸肉',  p: 22,  c: 0,   f: 2.5, kcal: 120, hint: '生重，熟后缩~25%' },
    { cat: '蛋白', name: '牛肉(瘦)', p: 21,  c: 0,   f: 4,   kcal: 125, hint: '生重' },
    { cat: '蛋白', name: '猪里脊',    p: 22,  c: 0,   f: 7,   kcal: 155, hint: '生重' },
    { cat: '蛋白', name: '三文鱼',    p: 22,  c: 0,   f: 13,  kcal: 208, hint: '生重' },
    { cat: '蛋白', name: '金枪鱼罐头', p: 26,  c: 0,   f: 1,   kcal: 116 },
    { cat: '蛋白', name: '龙利鱼',    p: 16,  c: 0,   f: 4,   kcal: 100, hint: '生重·无刺嫩' },
    { cat: '蛋白', name: '鳕鱼',      p: 18,  c: 0,   f: 1,   kcal: 82,  hint: '生重·几乎零脂' },
    { cat: '蛋白', name: '虾',       p: 20,  c: 0.2, f: 0.3, kcal: 85,  hint: '生重' },
    { cat: '蛋白', name: '鸡蛋(整个)', p: 13,  c: 1,   f: 11,  kcal: 155 },
    { cat: '蛋白', name: '蛋清',      p: 11,  c: 0.7, f: 0.2, kcal: 52  },
    { cat: '蛋白', name: '鸡腿肉(去皮)', p: 20, c: 0,  f: 4,   kcal: 120, hint: '生重；带皮脂肪翻倍' },
    { cat: '蛋白', name: '鸭胸(去皮)', p: 20,  c: 0,   f: 4,   kcal: 112, hint: '生重' },
    { cat: '蛋白', name: '北豆腐',    p: 12,  c: 2,   f: 8,   kcal: 116 },
    { cat: '蛋白', name: '豆腐干',    p: 16,  c: 5,   f: 7,   kcal: 150, hint: '便携零食' },
    { cat: '蛋白', name: '希腊酸奶(无糖)', p: 10, c: 4,  f: 0.4, kcal: 59  },
    { cat: '蛋白', name: '牛奶',      p: 3.4, c: 5,   f: 3.6, kcal: 66  },
    { cat: '蛋白', name: '奶酪',      p: 26,  c: 2,   f: 33,  kcal: 416, hint: '高脂注意量' },
    { cat: '蛋白', name: '毛豆',      p: 13,  c: 11,  f: 5,   kcal: 130, hint: '碳水也不低' },
    { cat: '蛋白', name: '乳清蛋白粉', p: 24,  c: 2,   f: 1,   kcal: 120, hint: '1 勺≈30g' },

    // 主食/碳水类（17）
    { cat: '碳水', name: '白米饭(熟)', p: 2.7, c: 28, f: 0.3, kcal: 130 },
    { cat: '碳水', name: '面条(熟)',   p: 5,   c: 25, f: 1.1, kcal: 138 },
    { cat: '碳水', name: '馒头',       p: 7,   c: 47, f: 1.1, kcal: 223 },
    { cat: '碳水', name: '燕麦片(干)', p: 13,  c: 67, f: 7,   kcal: 379 },
    { cat: '碳水', name: '全麦面包',   p: 9,   c: 49, f: 3.4, kcal: 247 },
    { cat: '碳水', name: '红薯(熟)',   p: 1.6, c: 20, f: 0.1, kcal: 90  },
    { cat: '碳水', name: '土豆(熟)',   p: 2,   c: 17, f: 0.1, kcal: 77  },
    { cat: '碳水', name: '玉米(熟)',   p: 3.4, c: 19, f: 1.2, kcal: 96  },
    { cat: '碳水', name: '香蕉',       p: 1.1, c: 23, f: 0.3, kcal: 89  },
    { cat: '碳水', name: '藜麦(干)',   p: 14,  c: 58, f: 6,   kcal: 350, hint: '煮熟重量×3' },
    { cat: '碳水', name: '意面(干)',   p: 13,  c: 75, f: 1.5, kcal: 370, hint: '一份≈75g干' },
    { cat: '碳水', name: '山药',       p: 2,   c: 12, f: 0.2, kcal: 60,  hint: '可当主食' },
    { cat: '碳水', name: '芋头',       p: 2,   c: 18, f: 0.2, kcal: 80  },
    { cat: '碳水', name: '南瓜',       p: 1,   c: 5,  f: 0.1, kcal: 25,  hint: '低卡当菜' },
    { cat: '碳水', name: '饺子(猪肉馅)', p: 8, c: 25, f: 9,   kcal: 215, hint: '10个≈250g' },
    { cat: '碳水', name: '包子(猪肉)', p: 7,   c: 30, f: 6,   kcal: 200, hint: '1个≈100g' },
    { cat: '碳水', name: '蛋炒饭',     p: 4,   c: 25, f: 6,   kcal: 190, hint: '外卖小份≈300g' },

    // 蔬果（13）
    { cat: '蔬果', name: '西兰花',     p: 2.8, c: 7,   f: 0.4, kcal: 34 },
    { cat: '蔬果', name: '菠菜',       p: 2.9, c: 3.6, f: 0.4, kcal: 23 },
    { cat: '蔬果', name: '胡萝卜',     p: 0.9, c: 10,  f: 0.2, kcal: 41 },
    { cat: '蔬果', name: '番茄',       p: 0.9, c: 3.9, f: 0.2, kcal: 18 },
    { cat: '蔬果', name: '黄瓜',       p: 0.7, c: 3.6, f: 0.1, kcal: 15 },
    { cat: '蔬果', name: '生菜',       p: 1,   c: 2,   f: 0.2, kcal: 15 },
    { cat: '蔬果', name: '苹果',       p: 0.3, c: 14,  f: 0.2, kcal: 52 },
    { cat: '蔬果', name: '蓝莓',       p: 0.7, c: 14,  f: 0.3, kcal: 57 },
    { cat: '蔬果', name: '草莓',       p: 1,   c: 8,   f: 0.3, kcal: 32 },
    { cat: '蔬果', name: '橙子',       p: 1,   c: 12,  f: 0.2, kcal: 48 },
    { cat: '蔬果', name: '猕猴桃',     p: 1,   c: 14,  f: 0.6, kcal: 61 },
    { cat: '蔬果', name: '圣女果',     p: 1,   c: 5,   f: 0.2, kcal: 22 },
    { cat: '蔬果', name: '西瓜',       p: 0.6, c: 6,   f: 0.2, kcal: 26, hint: '吃多也是糖' },

    // 脂肪/坚果（6）
    { cat: '脂肪', name: '牛油果',     p: 2,   c: 9,   f: 15,  kcal: 160 },
    { cat: '脂肪', name: '杏仁',       p: 21,  c: 22,  f: 50,  kcal: 579 },
    { cat: '脂肪', name: '核桃',       p: 15,  c: 9,   f: 65,  kcal: 650, hint: '一小把≈20g' },
    { cat: '脂肪', name: '花生酱',     p: 25,  c: 20,  f: 50,  kcal: 588 },
    { cat: '脂肪', name: '芝麻酱',     p: 19,  c: 16,  f: 52,  kcal: 630, hint: '一勺≈15g' },
    { cat: '脂肪', name: '橄榄油',     p: 0,   c: 0,   f: 100, kcal: 880, hint: '一勺≈10g' }
  ];

  // ---------- 状态 ----------
  var state = {
    bw: 70,           // 体重 kg
    goal: 'keep',     // cut/keep/bulk
    activity: 0,      // 0/1/2 久坐/活跃/很累
    train: 0,         // 0 休息日 / 1 训练日（训练日碳水上一档，对齐计划页营养面板的分档）
    grams: {},        // 食材勾选克数 key=name → grams
    gramsOpen: {},    // 食材组折叠 key=cat → bool
    source: 'manual', // 'manual' 用本页矩阵 | 'plan' 同步计划页营养建议
    plan: null,       // 计划页目标缓存 {p,c,f,kcal, tp,tc,tf,tkcal, goalLabel, syncedAt}
    link: true        // 是否允许 goDietCalc()/计划刷新时自动同步（用户点了「改用手动计算」则置 false）
  };

  // 计划页 goal → 显示文案（计划页目标是 5 种，本页手动模式只有 3 种）
  var PLAN_GOAL_LABEL = { cut: '减脂', muscle: '增肌', strength: '力量', marathon: '马拉松', cardio: '心肺' };

  // ---------- 本地草稿（localStorage，「今日已吃」按天清零） ----------
  var LS_KEY = 'fitbuddy_diet';
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function saveDraft() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        date: todayStr(), bw: state.bw, goal: state.goal, train: state.train,
        activity: state.activity, grams: state.grams, gramsOpen: state.gramsOpen,
        source: state.source, plan: state.plan, link: state.link
      }));
    } catch (e) {}
  }
  var _autoSynced = false; // 是否自动带入了计划页资料（显示提示用，用户一改就隐藏）
  (function init() {
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) {}
    if (draft && draft.bw >= 30 && draft.bw <= 200) {
      // 有草稿：设置全恢复，「今日已吃」只在同一天恢复
      state.bw = draft.bw;
      if (draft.goal) state.goal = draft.goal;
      if (draft.activity >= 0 && draft.activity <= 2) state.activity = draft.activity;
      if (draft.train === 0 || draft.train === 1) state.train = draft.train;
      if (draft.gramsOpen) state.gramsOpen = draft.gramsOpen;
      if (draft.grams && draft.date === todayStr()) state.grams = draft.grams;
      // 联动状态恢复（plan 数据不完整则退回手动）
      if (draft.link === false) state.link = false;
      if (draft.source === 'plan' && draft.plan && draft.plan.p > 0 && draft.plan.c > 0) {
        state.plan = draft.plan;
        state.source = 'plan';
      }
    } else {
      // 首次使用：带入计划页资料（体重 + 目标映射），不查库不联网
      try {
        var prof = JSON.parse(localStorage.getItem('fitbuddy_profile') || '{}');
        if (prof.weight && prof.weight >= 30 && prof.weight <= 200) state.bw = prof.weight;
        var lp = JSON.parse(localStorage.getItem('fitbuddy_lastplan') || 'null');
        var GM = { cut: 'cut', muscle: 'bulk', strength: 'keep', marathon: 'keep', cardio: 'keep' };
        if (lp && lp.goal && GM[lp.goal]) state.goal = GM[lp.goal];
        _autoSynced = true;
      } catch (e) {}
    }
  })();

  // ---------- 算目标克数 ----------
  function calc() {
    var p, c, f, kcal;
    // 联动模式：直接用计划页营养面板算好的数字（逐日档 → 休息日 → 旧草稿双档 兜底）
    if (state.source === 'plan' && state.plan) {
      var pl = state.plan;
      var si = planSelIdx();
      if (si >= 0 && pl.days && pl.days[si]) {
        var d = pl.days[si];
        p = d.p; c = d.c; f = d.f; kcal = d.kcal;
      } else if (si === -2 && pl.tp > 0) {
        p = pl.tp; c = pl.tc; f = pl.tf; kcal = pl.tkcal;
      } else {
        p = pl.p; c = pl.c; f = pl.f; kcal = pl.kcal;
      }
    } else {
      var m = DIET_MATRIX[state.goal];
      var a = state.activity;
      p = Math.round(state.bw * m.p[a]);
      // 训练日碳水上一档（蛋白/脂肪不动——碳水才是训练燃料，对齐计划页「训练日/休息日」双档逻辑）
      c = Math.round(state.bw * m.c[Math.min(2, a + (state.train ? 1 : 0))]);
      f = Math.round(state.bw * m.f[a]);
      kcal = p * 4 + c * 4 + f * 9;
    }
    // 手掌法：1 掌心蛋白 ≈ 25g，1 拳碳水 ≈ 40g，1 拇指脂肪 ≈ 10g
    var palm = Math.max(1, Math.round(p / 25));
    var fist = Math.max(1, Math.round(c / 40));
    var thumb = Math.max(1, Math.round(f / 10));
    return { p: p, c: c, f: f, kcal: kcal, palm: palm, fist: fist, thumb: thumb };
  }

  // ---------- 联动档位选择 ----------
  // selLabel: 'rest' 休息日 | '周一' 等具体训练日 | 旧草稿(无 days)时退回 state.train 双档
  function planSelIdx() {
    var pl = state.plan;
    if (!pl) return -1;
    if (!pl.days || !pl.days.length) return state.train === 1 ? -2 : -1; // -2 = 通用训练日(旧草稿/无逐日数据)
    if (pl.selLabel === 'rest') return -1;
    for (var i = 0; i < pl.days.length; i++) {
      if (pl.days[i].label === pl.selLabel) return i;
    }
    return -1; // 选中的日子在新计划里没了(比如改了训练天数) → 回休息日
  }

  // ---------- 计划页营养上下文 → 本页联动状态 ----------
  // ctx 是 planner-core.js 的 _lastNutriCtx：{weight,height,age,gender,goal,schedule,trainDayNames,nRest,nTrain,nEasy,dayCalBurns}
  // opts.autoTrain: 是否按今天星期几自动选中当日档
  function applyPlanCtx(ctx, opts) {
    if (!ctx || !ctx.nRest || !(ctx.nRest.protein > 0)) return false;
    var r = ctx.nRest;                 // 休息日营养（计划页 calcNutrition 输出）
    var t = ctx.nTrain || ctx.nRest;   // 训练日营养（无训练日则同休息日）
    // 逐日档：每个训练日按「自己的」当日消耗单独算（对齐计划页营养面板的日程 chip，
    // 腿日/手臂日/LSD 日的碳水不再混用同一个「最大训练日」数字）
    var days = [];
    if (ctx.schedule && ctx.dayCalBurns && typeof calcNutrition === 'function') {
      var ti = 0;
      ctx.schedule.forEach(function (s) {
        if (!s.isTraining) return;
        var burn = ctx.dayCalBurns[ti] || 0;
        var dn = burn > 0 ? calcNutrition(ctx.weight, ctx.height, ctx.age, ctx.gender, ctx.goal, burn) : t;
        if (dn) {
          days.push({
            label: s.day,
            name: (ctx.trainDayNames && ctx.trainDayNames[ti]) || '',
            burn: Math.round(burn),
            p: Math.round(dn.protein), c: Math.round(dn.carb), f: Math.round(dn.fat), kcal: Math.round(dn.targetCal)
          });
        }
        ti++;
      });
    }
    state.plan = {
      p: Math.round(r.protein), c: Math.round(r.carb), f: Math.round(r.fat), kcal: Math.round(r.targetCal),
      tp: Math.round(t.protein), tc: Math.round(t.carb), tf: Math.round(t.fat), tkcal: Math.round(t.targetCal),
      goalLabel: PLAN_GOAL_LABEL[ctx.goal] || '训练计划',
      days: days,
      selLabel: (state.plan && state.plan.selLabel) || 'rest', // 保留用户当前选的日（计划重渲染后按 label 重新对位）
      todayNote: ''
    };
    state.source = 'plan';
    state.link = true;
    // 按 schedule 自动识别今天星期几 → 选中当日档（今天是休息日则选休息日）
    if (opts && opts.autoTrain && ctx.schedule && ctx.schedule.length) {
      var todayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
      var hitIdx = -1;
      for (var i = 0; i < ctx.schedule.length; i++) {
        if (ctx.schedule[i].day === todayName) { hitIdx = i; break; }
      }
      if (hitIdx >= 0) {
        if (!ctx.schedule[hitIdx].isTraining) {
          state.plan.selLabel = 'rest';
          state.train = 0;
          state.plan.todayNote = '今天 ' + todayName + ' · 已自动选休息日';
        } else {
          // 数出今天是第几个训练日 → 对位 days[] 里的当日档
          var cnt = 0, dayPos = -1;
          for (var j = 0; j < ctx.schedule.length; j++) {
            if (ctx.schedule[j].isTraining) {
              if (ctx.schedule[j].day === todayName) { dayPos = cnt; break; }
              cnt++;
            }
          }
          if (dayPos >= 0 && days[dayPos]) {
            state.plan.selLabel = days[dayPos].label;
            state.train = 1;
            state.plan.todayNote = '今天 ' + todayName + (days[dayPos].name ? ' ' + days[dayPos].name : '') +
              (days[dayPos].burn ? ' 🔥' + days[dayPos].burn : '') + ' · 已自动选当日档';
          }
        }
      }
    }
    return true;
  }

  // ---------- 手掌换算（缺口 → 几掌/几拳/几拇指） ----------
  function fmtUnits(g, per) {
    var u = g / per;
    return u >= 10 ? Math.round(u) : Math.round(u * 10) / 10;
  }

  // ---------- 算速查表实际吃了多少 ----------
  function sumEaten() {
    var p = 0, c = 0, f = 0, kcal = 0;
    FOODS.forEach(function (food) {
      var g = state.grams[food.name] || 0;
      if (g > 0) {
        p += food.p * g / 100;
        c += food.c * g / 100;
        f += food.f * g / 100;
        kcal += food.kcal * g / 100;
      }
    });
    return { p: Math.round(p), c: Math.round(c), f: Math.round(f), kcal: Math.round(kcal) };
  }

  // ---------- 渲染 ----------
  // 逐日档 chip（-1 = 休息日；i >= 0 = days[i]）
  function dayChip(idx, text, selIdx) {
    var on = idx === selIdx;
    return '<span onclick="dietSelDay(' + idx + ')" style="font-size:11px;padding:5px 9px;border-radius:14px;cursor:pointer;' +
      (on ? 'background:var(--primary);color:#fff;font-weight:600;border:1px solid transparent;'
          : 'background:var(--card);color:var(--text2);border:1px solid var(--border);') + '">' + text + '</span>';
  }

  function renderDietPanel() {
    var cats = ['蛋白', '碳水', '蔬果', '脂肪'];
    var html = '';
    var inPlan = state.source === 'plan' && state.plan;
    // 输入区
    html += '<div class="diet-inputs">';
    if (inPlan) {
      // 联动模式：锁定计划页数字，只保留 训练日/休息日 切换
      html += '  <div class="diet-row">';
      html += '    <span class="diet-label">来源</span>';
      html += '    <span style="flex:1;font-size:12px;font-weight:600;color:var(--primary);">🔗 计划页营养建议 · ' + state.plan.goalLabel + '</span>';
      html += '  </div>';
      if (state.plan.todayNote) {
        html += '  <div class="diet-row"><span class="diet-label">今天</span>' +
                '<span style="flex:1;font-size:11px;color:var(--text3);">' + state.plan.todayNote + '</span></div>';
      }
      var hasDays = state.plan.days && state.plan.days.length > 0;
      if (hasDays) {
        // 逐日档：休息日 + 每个训练日（带当日消耗），数字各不相同
        var si = planSelIdx();
        html += '  <div class="diet-row" style="flex-wrap:wrap;align-items:center;">';
        html += '    <span class="diet-label">选日</span>';
        html += '    <div style="flex:1;display:flex;flex-wrap:wrap;gap:6px;">';
        html += dayChip(-1, '😴 休息日', si);
        state.plan.days.forEach(function (d, i) {
          html += dayChip(i, d.label + (d.name ? ' ' + d.name : '') + (d.burn ? ' 🔥' + d.burn : ''), si);
        });
        html += '    </div>';
        html += '  </div>';
      } else {
        // 无逐日数据（旧草稿/计划未填身体数据）：退回双档
        html += '  <div class="diet-row">';
        html += '    <span class="diet-label">今日</span>';
        html += '    <div class="diet-seg">';
        html += '      <button class="diet-seg-btn ' + (state.train !== 1 ? 'active' : '') + '" onclick="dietSetTrain(0)">休息日</button>';
        html += '      <button class="diet-seg-btn ' + (state.train === 1 ? 'active' : '') + '" onclick="dietSetTrain(1)">训练日</button>';
        html += '    </div>';
        html += '  </div>';
      }
      html += '  <div class="diet-row">';
      html += '    <button class="diet-clear" style="flex:1;margin:0;" onclick="dietSetSource(\'manual\')">✍️ 改用手动计算（体重/目标/活动自选）</button>';
      html += '  </div>';
    } else {
      html += '  <div class="diet-row">';
      html += '    <span class="diet-label">体重</span>';
      html += '    <button class="diet-step" onclick="dietStepBw(-1)" aria-label="减 1kg">−</button>';
      html += '    <input id="dietBw" class="diet-bw" type="number" min="30" max="200" value="' + state.bw + '" onchange="dietOnBw(this.value)" />';
      html += '    <span class="diet-unit">kg</span>';
      html += '    <button class="diet-step" onclick="dietStepBw(1)" aria-label="加 1kg">+</button>';
      html += '  </div>';
      html += '  <div class="diet-row">';
      html += '    <span class="diet-label">目标</span>';
      html += '    <div class="diet-seg">';
      ['cut', 'keep', 'bulk'].forEach(function (g) {
        html += '<button class="diet-seg-btn ' + (state.goal === g ? 'active' : '') + '" data-goal="' + g + '" onclick="dietSetGoal(\'' + g + '\')">' + GOAL_LABEL[g] + '</button>';
      });
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="diet-row">';
      html += '    <span class="diet-label">活动</span>';
      html += '    <div class="diet-seg">';
      ACTIVITY_LABEL.forEach(function (lab, i) {
        html += '<button class="diet-seg-btn ' + (state.activity === i ? 'active' : '') + '" data-act="' + i + '" onclick="dietSetActivity(' + i + ')">' + lab + '</button>';
      });
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="diet-row">';
      html += '    <span class="diet-label">今日</span>';
      html += '    <div class="diet-seg">';
      html += '      <button class="diet-seg-btn ' + (state.train !== 1 ? 'active' : '') + '" onclick="dietSetTrain(0)">休息日</button>';
      html += '      <button class="diet-seg-btn ' + (state.train === 1 ? 'active' : '') + '" onclick="dietSetTrain(1)">训练日</button>';
      html += '    </div>';
      html += '  </div>';
      // 手动模式下：有计划页上下文（本次会话或草稿）就给一键切回联动
      if (window._lastNutriCtx || state.plan) {
        html += '  <div class="diet-row">';
        html += '    <button class="diet-clear" style="flex:1;margin:0;" onclick="dietSetSource(\'plan\')">🔗 同步计划页营养建议</button>';
        html += '  </div>';
      }
    }
    html += '</div>';
    if (_autoSynced && !inPlan) {
      html += '<div class="diet-sync-hint">↪ 已带入计划页资料（体重/目标），可手动改</div>';
    }

    // 目标输出
    var r = calc();
    var srcNote;
    if (inPlan) {
      var sn = planSelIdx();
      if (sn >= 0 && state.plan.days[sn]) {
        srcNote = '来自计划页 · ' + state.plan.days[sn].label + (state.plan.days[sn].name ? ' ' + state.plan.days[sn].name : '') + '档';
      } else if (sn === -2) {
        srcNote = '来自计划页营养建议 · 训练日档';
      } else {
        srcNote = '来自计划页营养建议 · 休息日档';
      }
    } else {
      srcNote = '· ' + (state.train === 1 ? '训练日碳水上一档' : '休息日');
    }
    html += '<div class="diet-result">';
    html += '  <div class="diet-result-title">每日目标 <span style="font-weight:600;font-size:11px;color:var(--text3);">' + srcNote + '</span></div>';
    html += '  <div class="diet-result-line">';
    html += '    <span class="rp"><b>蛋白</b> <i>' + r.p + '</i>g</span>';
    html += '    <span class="rp"><b>碳水</b> <i>' + r.c + '</i>g</span>';
    html += '    <span class="rp"><b>脂肪</b> <i>' + r.f + '</i>g</span>';
    html += '    <span class="rp rkcal"><b>总</b> <i>' + r.kcal + '</i>kcal</span>';
    html += '  </div>';
    html += '  <div class="diet-palm">用手掌量 → <b>' + r.palm + '</b> 掌心肉 + <b>' + r.fist + '</b> 拳碳水 + <b>' + r.thumb + '</b> 拇指油</div>';
    html += '  <div class="diet-hint">' + (inPlan
      ? '数字由计划页按你的身高/体重/年龄 + 当日训练消耗算出，训练日会自动多补碳水。'
      : '蛋白 1.6~2.2g/kg 是核心，碳水按训练日浮动；不清楚克数？下面速查库直接勾。') + '</div>';
    html += '</div>';

    // 速查库
    html += '<div class="diet-foods">';
    html += '  <div class="diet-foods-title">📚 内置食材速查 · ' + FOODS.length + ' 种（每 100g，肉/鱼/虾按生重）</div>';
    cats.forEach(function (cat) {
      var list = FOODS.filter(function (f) { return f.cat === cat; });
      var open = state.gramsOpen[cat] === true; // 默认折叠
      html += '<div class="diet-cat">';
      html += '  <div class="diet-cat-h" onclick="dietToggleCat(\'' + cat + '\')">';
      html += '    <span class="diet-cat-name">' + cat + '类</span><span class="diet-cat-cnt">' + list.length + ' 种</span>';
      html += '    <span class="diet-cat-arrow ' + (open ? 'open' : '') + '">' + (open ? '▾' : '▸') + '</span>';
      html += '  </div>';
      if (open) {
        html += '<div class="diet-cat-list">';
        list.forEach(function (food) {
          var g = state.grams[food.name] || 0;
          html += '<div class="diet-food ' + (g > 0 ? 'on' : '') + '">';
          html += '  <button class="diet-food-name" onclick="dietTap(\'' + food.name + '\')">' + food.name + '</button>';
          if (food.hint) html += '<span class="diet-food-hint">' + food.hint + '</span>';
          html += '  <span class="diet-food-data">P ' + food.p + ' · C ' + food.c + ' · F ' + food.f + '</span>';
          html += '  <div class="diet-food-grams">';
          html += '    <button onclick="dietStepG(\'' + food.name + '\',-50)">−</button>';
          html += '    <input type="number" min="0" step="50" value="' + g + '" onchange="dietSetG(\'' + food.name + '\',this.value)" />';
          html += '    <span class="diet-food-unit">g</span>';
          html += '    <button onclick="dietStepG(\'' + food.name + '\',50)">+</button>';
          html += '  </div>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';

    // 实际吃了多少（仅勾选了才显示）
    var eaten = sumEaten();
    if (eaten.p > 0 || eaten.c > 0 || eaten.f > 0) {
      var rp = Math.min(100, Math.round(eaten.p / r.p * 100));
      var rc = Math.min(100, Math.round(eaten.c / r.c * 100));
      var rf = Math.min(100, Math.round(eaten.f / r.f * 100));
      html += '<div class="diet-eaten">';
      html += '  <div class="diet-eaten-title">今日已吃 <span style="font-weight:500;font-size:11px;color:var(--text3);">· 每天自动清零</span></div>';
      html += '  <div class="diet-eaten-line">蛋白 <b>' + eaten.p + '</b>g · 碳水 <b>' + eaten.c + '</b>g · 脂肪 <b>' + eaten.f + '</b>g · 总 <b>' + eaten.kcal + '</b> kcal</div>';
      html += '  <div class="diet-bars">';
      html += '    <div class="diet-bar"><span>蛋白</span><div class="bar"><i style="width:' + rp + '%;background:#4361ee;"></i></div><b>' + rp + '%</b></div>';
      html += '    <div class="diet-bar"><span>碳水</span><div class="bar"><i style="width:' + rc + '%;background:#2ea86a;"></i></div><b>' + rc + '%</b></div>';
      html += '    <div class="diet-bar"><span>脂肪</span><div class="bar"><i style="width:' + rf + '%;background:#f59e0b;"></i></div><b>' + rf + '%</b></div>';
      html += '  </div>';
      // 缺口翻译：还差的克数换回手掌份数，把数字变回「动作」
      var gp = r.p - eaten.p, gc = r.c - eaten.c, gf = r.f - eaten.f;
      var parts = [];
      parts.push(gp > 0 ? '蛋白 ' + gp + 'g（≈' + fmtUnits(gp, 25) + ' 掌心）' : '蛋白 ✓');
      parts.push(gc > 0 ? '碳水 ' + gc + 'g（≈' + fmtUnits(gc, 40) + ' 拳）' : '碳水 ✓');
      parts.push(gf > 0 ? '脂肪 ' + gf + 'g（≈' + fmtUnits(gf, 10) + ' 拇指）' : '脂肪 ✓');
      html += '  <div class="diet-gap">还差 ' + parts.join(' · ') + '</div>';
      html += '  <button class="diet-clear" onclick="dietClear()">清空记录</button>';
      html += '</div>';
    }

    // 手掌法说明（折叠）
    html += '<details class="diet-palm-detail">';
    html += '  <summary>🤚 手掌法则怎么用？</summary>';
    html += '  <div class="diet-palm-grid">';
    html += '    <div class="pp-card"><div class="pp-icon">🖐</div><div class="pp-t">蛋白</div><div class="pp-s">掌心大小 × 厚度<br>≈ 25g 蛋白</div></div>';
    html += '    <div class="pp-card"><div class="pp-icon">✊</div><div class="pp-t">碳水</div><div class="pp-s">拳头大小<br>≈ 40g 碳水</div></div>';
    html += '    <div class="pp-card"><div class="pp-icon">👍</div><div class="pp-t">脂肪</div><div class="pp-s">拇指大小<br>≈ 10g 脂肪</div></div>';
    html += '    <div class="pp-card"><div class="pp-icon">🥗</div><div class="pp-t">蔬菜</div><div class="pp-s">双手捧<br>随便吃</div></div>';
    html += '  </div>';
    html += '  <div class="diet-palm-note">不需要记任何数字，冰箱里随手拿的食物用手量就行。</div>';
    html += '</details>';

    return html;
  }

  // ---------- 暴露给全局 ----------
  window.renderDietCalculator = function () {
    var el = document.getElementById('calcPanelDiet');
    if (el) {
      el.innerHTML = renderDietPanel();
      el.dataset.rendered = '1';
      saveDraft(); // 每次渲染后落盘，所有交互路径都会经过这里
    }
  };

  function markDirty() { _autoSynced = false; }

  window.dietStepBw = function (d) {
    var v = Math.max(30, Math.min(200, (state.bw || 70) + d));
    state.bw = v;
    markDirty();
    window.renderDietCalculator();
  };
  window.dietOnBw = function (v) {
    var n = parseFloat(v);
    if (!isNaN(n) && n >= 30 && n <= 200) {
      state.bw = n;
      markDirty();
      window.renderDietCalculator();
    }
  };
  window.dietSetGoal = function (g) {
    state.goal = g;
    markDirty();
    window.renderDietCalculator();
  };
  window.dietSetActivity = function (a) {
    state.activity = a;
    markDirty();
    window.renderDietCalculator();
  };
  window.dietSetTrain = function (t) {
    state.train = t ? 1 : 0;
    markDirty();
    window.renderDietCalculator();
  };
  window.dietToggleCat = function (cat) {
    state.gramsOpen[cat] = !(state.gramsOpen[cat] === true); // 折叠(undefined/false)→true 展开
    window.renderDietCalculator();
  };
  window.dietTap = function (name) {
    // 点名称快速 +100g（或已选则清零）
    if (state.grams[name] > 0) {
      state.grams[name] = 0;
    } else {
      state.grams[name] = 100;
    }
    window.renderDietCalculator();
  };
  window.dietSetG = function (name, v) {
    var n = parseInt(v, 10);
    if (isNaN(n) || n < 0) n = 0;
    state.grams[name] = n;
    window.renderDietCalculator();
  };
  window.dietStepG = function (name, d) {
    var v = Math.max(0, (state.grams[name] || 0) + d);
    state.grams[name] = v;
    window.renderDietCalculator();
  };
  window.dietClear = function () {
    state.grams = {};
    window.renderDietCalculator();
  };

  // 联动模式选日：-1 休息日 / i>=0 计划里第 i 个训练日（带各自消耗）
  window.dietSelDay = function (i) {
    if (!state.plan) return;
    if (i < 0 || !(state.plan.days && state.plan.days[i])) {
      state.plan.selLabel = 'rest';
      state.train = 0;
    } else {
      state.plan.selLabel = state.plan.days[i].label;
      state.train = 1;
    }
    window.renderDietCalculator();
  };

  // ---------- 计划页联动 ----------
  // 切换目标来源：'plan' 重新读取计划页上下文，'manual' 退回本页矩阵
  window.dietSetSource = function (src) {
    if (src === 'plan') {
      var ok = applyPlanCtx(window._lastNutriCtx, { autoTrain: true });
      if (!ok) {
        // 本次会话没有计划页上下文（如直接打开动作库），但草稿里有上次同步的计划
        if (state.plan && state.plan.p > 0) {
          state.source = 'plan';
          state.link = true;
        } else {
          return; // 无可同步数据，保持不动（按钮渲染时也已做判断）
        }
      }
    } else {
      state.source = 'manual';
      state.link = false; // 用户主动选手动：之后 goDietCalc 不再强制拉回
    }
    window.renderDietCalculator();
  };

  // 计划页每次重新渲染计划后调用：联动模式下静默刷新数字（不动用户的 训练日/休息日 选择）
  window.dietRefreshFromPlan = function (ctx) {
    if (state.source !== 'plan' || !state.link) return false;
    var ok = applyPlanCtx(ctx, { autoTrain: false });
    if (ok) saveDraft(); // 计划变了就落盘，避免面板未重渲染时丢失新数字
    return ok;
  };

  // 计划页营养面板的跳转入口：切到动作库 → 展开饮食 tab → 滚到面板
  // 2026-09-20：跳转即联动——把计划页算好的营养目标带进来（用户主动改过手动则不打扰）
  window.goDietCalc = function () {
    var t = document.querySelector('.tab-btn[data-tab="page-lib"]');
    if (t) t.click();
    if (typeof renderProCalculators === 'function') renderProCalculators();
    if (typeof switchCalcTab === 'function') switchCalcTab('diet');
    if (state.link && window._lastNutriCtx) {
      applyPlanCtx(window._lastNutriCtx, { autoTrain: true });
    }
    var el = document.getElementById('calcPanelDiet');
    if (el) {
      window.renderDietCalculator();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
})();

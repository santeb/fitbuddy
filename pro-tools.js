// ============ FitBuddy Pro Tools v2.0 ============
// 8项进阶功能模块
// 依赖: data-constants.js, planner-core.js (必须先加载)
// 功能清单:
//   1. 热身组计算器        - 输入目标重量→自动生成渐进热身方案
//   2. 杠铃片计算器        - 输入总重量→显示每侧杠铃片配比
//   3. RPE自调节系统       - 根据RPE评分自动建议下周±重量/组数
//   4. 减载周自动化        - 按周期表的减载周自动降量,可开关(节奏跟随用户自选周期)
//   5. 渐进超负荷趋势线    - 每个动作的重量×次数折线图
//   6. 周期化日历视图      - 16/4周波浪图,强度起伏+减载周
//   7. 智能补课重排        - 漏练自动压缩或顺延
//   8. 部位疲劳监控        - 连续3天同肌群→警告

(function() {
'use strict';

// ============ 1. 热身组计算器 ============

function calcWarmupSets(targetWeight, level) {
  if (!targetWeight || targetWeight <= 0) return [];
  level = level || 'intermediate';
  var barWeight = 20; // 标准奥举杠铃
  var sets = [];

  if (level === 'beginner') {
    // 新手:2组热身
    sets.push({ weight: barWeight, reps: 10, pct: Math.round(barWeight / targetWeight * 100), label: '空杆激活' });
    if (targetWeight > barWeight * 2) {
      var w1 = Math.round(targetWeight * 0.5 / 2.5) * 2.5;
      sets.push({ weight: w1, reps: 8, pct: 50, label: '轻重量过渡' });
    }
  } else if (level === 'intermediate') {
    // 中级:3组热身
    sets.push({ weight: barWeight, reps: 8, pct: Math.round(barWeight / targetWeight * 100), label: '空杆激活' });
    if (targetWeight > barWeight * 2) {
      var w1b = Math.round(targetWeight * 0.5 / 2.5) * 2.5;
      var w2 = Math.round(targetWeight * 0.7 / 2.5) * 2.5;
      sets.push({ weight: w1b, reps: 5, pct: 50, label: '50%过渡' });
      if (w2 > w1b) sets.push({ weight: w2, reps: 3, pct: 70, label: '70%冲组' });
    }
  } else {
    // 进阶:4-5组热身
    sets.push({ weight: barWeight, reps: 10, pct: Math.round(barWeight / targetWeight * 100), label: '空杆激活' });
    if (targetWeight > barWeight * 2) {
      var w1c = Math.round(targetWeight * 0.4 / 2.5) * 2.5;
      var w2c = Math.round(targetWeight * 0.6 / 2.5) * 2.5;
      var w3c = Math.round(targetWeight * 0.7 / 2.5) * 2.5;
      var w4c = Math.round(targetWeight * 0.85 / 2.5) * 2.5;
      if (w1c > barWeight) sets.push({ weight: w1c, reps: 6, pct: 40, label: '40%热身' });
      if (w2c > w1c) sets.push({ weight: w2c, reps: 4, pct: 60, label: '60%过渡' });
      if (w3c > w2c) sets.push({ weight: w3c, reps: 3, pct: 70, label: '70%激活' });
      if (w4c > w3c) sets.push({ weight: w4c, reps: 1, pct: 85, label: '85%冲组' });
    }
  }
  return sets;
}

function renderWarmupCalculator() {
  var html = '<div class="rm-calc" id="warmupCalcPro">' +
    '<div class="rm-title">🔥 热身组计算器</div>' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">输入目标重量,自动生成渐进热身方案</div>' +
    '<div class="rm-input-row">' +
      '<div class="form-group"><label>目标重量 (kg)</label>' +
        '<input type="number" class="text-input" id="warmupTarget" placeholder="例如 100" min="20" oninput="WarmupCalc.update()" aria-label="目标重量">' +
      '</div>' +
      '<div class="form-group"><label>训练水平</label>' +
        '<select id="warmupLevel" class="text-input" onchange="WarmupCalc.update()" style="height:42px;">' +
          '<option value="beginner">新手</option>' +
          '<option value="intermediate" selected>中级</option>' +
          '<option value="advanced">进阶</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div id="warmupResult" style="display:none;"></div>' +
  '</div>';
  return html;
}

var WarmupCalc = {
  update: function() {
    var target = parseFloat(document.getElementById('warmupTarget').value);
    var level = document.getElementById('warmupLevel').value;
    var resultEl = document.getElementById('warmupResult');
    if (!target || target < 20) { resultEl.style.display = 'none'; return; }

    var sets = calcWarmupSets(target, level);
    if (!sets.length) { resultEl.style.display = 'none'; return; }

    var html = '<div class="rm-result" style="display:block;">' +
      '<div style="font-size:13px;font-weight:700;margin-bottom:10px;">🎯 目标 ' + target + 'kg → ' + sets.length + '组热身</div>';
    sets.forEach(function(s, i) {
      // 🔗 每组挂一个「配片」：热身组排出 5 个重量后，真正卡住用户的是"那我该拿哪几片"。
      //   杠铃片计算器就摆在隔壁 tab 却没有任何入口，等于让人把这串数字手抄过去再输一遍。
      //   ⚠️ 空杆级别不挂 —— 20kg 以下就是空杆活动，配片算出来是空的。
      var plateBtn = (s.weight >= 20)
        ? '<button class="warmup-plate-btn" onclick="fbPlateFromWarmup(' + s.weight + ')" title="算出这组该挂哪几片">配片</button>'
        : '';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg);border-radius:8px;margin-bottom:6px;">' +
        '<div><span style="font-weight:700;font-size:14px;color:var(--primary);">' + s.weight + 'kg</span>' +
        '<span style="font-size:11px;color:var(--text3);margin-left:8px;">× ' + s.reps + '次</span></div>' +
        '<div style="text-align:right;display:flex;align-items:center;gap:7px;"><span style="font-size:12px;font-weight:600;color:var(--blue);">' + s.pct + '%</span>' +
        '<span style="font-size:11px;color:var(--text3);">' + s.label + '</span>' + plateBtn + '</div>' +
      '</div>';
    });
    html += '<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:center;">→ 正式组开始!</div></div>';
    resultEl.innerHTML = html;
    resultEl.style.display = 'block';
  }
};

// ============ 2. 杠铃片计算器 ============

var STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

function calcPlates(targetWeight, barWeight) {
  barWeight = barWeight || 20;
  if (!targetWeight || targetWeight <= barWeight) return { perSide: 0, plates: [], barWeight: barWeight };
  var sideWeight = (targetWeight - barWeight) / 2;
  if (sideWeight <= 0) return { perSide: 0, plates: [], barWeight: barWeight };

  var plates = [];
  var remaining = sideWeight;
  for (var i = 0; i < STANDARD_PLATES.length; i++) {
    var p = STANDARD_PLATES[i];
    while (remaining >= p - 0.01) { // 浮点容差
      plates.push(p);
      remaining -= p;
    }
  }
  // 如果无法精确配比(剩余>0.01kg),添加提示
  var exact = Math.abs(remaining) < 0.01;
  var actual = barWeight + plates.reduce(function(a,b){return a+b;}, 0) * 2;
  return { perSide: sideWeight, plates: plates, barWeight: barWeight, exact: exact, actual: actual };
}

function renderPlateCalculator() {
  var html = '<div class="rm-calc" id="plateCalcPro">' +
    '<div class="rm-title">🏋️ 杠铃片计算器</div>' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">输入总重量,显示每侧该上几片</div>' +
    '<div class="rm-input-row">' +
      '<div class="form-group"><label>总重量 (kg)</label>' +
        '<input type="number" class="text-input" id="plateTarget" placeholder="例如 85" min="20" oninput="PlateCalc.update()" aria-label="总重量">' +
      '</div>' +
      '<div class="form-group"><label>杠铃重量</label>' +
        '<select id="plateBar" class="text-input" onchange="PlateCalc.update()" style="height:42px;">' +
          '<option value="20" selected>奥举杠 20kg</option>' +
          '<option value="15">女子杠 15kg</option>' +
          '<option value="10">标准杠 10kg</option>' +
          '<option value="0">EZ杆/0kg</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div id="plateResult" style="display:none;"></div>' +
  '</div>';
  return html;
}

var PLATE_COLORS = {
  25: '#EF4444', // 红
  20: '#3B82F6', // 蓝
  15: '#F59E0B', // 黄
  10: '#22C55E', // 绿
  5: '#8B5CF6',  // 紫
  '2.5': '#EC4899', // 粉
  '1.25': '#6B7280' // 灰
};

var PlateCalc = {
  update: function() {
    var target = parseFloat(document.getElementById('plateTarget').value);
    var barW = parseFloat(document.getElementById('plateBar').value);
    var resultEl = document.getElementById('plateResult');
    if (!target || target < barW) { resultEl.style.display = 'none'; return; }

    var result = calcPlates(target, barW);
    if (!result.plates.length) {
      resultEl.innerHTML = '<div class="rm-result" style="display:block;font-size:13px;color:var(--text3);">总重量 = 杠铃重量,无需加片</div>';
      resultEl.style.display = 'block';
      return;
    }

    // 文字配比
    var plateStr = result.plates.join(' + ');
    var html = '<div class="rm-result" style="display:block;">' +
      '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">🎯 ' + target + 'kg = 杠铃' + result.barWeight + 'kg + 两侧各</div>' +
      '<div style="font-size:18px;font-weight:800;color:var(--primary);margin-bottom:10px;">' + plateStr + ' kg</div>';

    // 杠铃片可视化
    html += '<div style="display:flex;align-items:center;justify-content:center;gap:2px;margin:12px 0;padding:10px;background:var(--bg);border-radius:10px;">';
    // 左侧片
    result.plates.forEach(function(p) {
      var color = PLATE_COLORS[p] || '#999';
      var w = Math.max(6, Math.min(22, p * 0.8 + 4));
      html += '<div style="width:' + w + 'px;height:36px;background:' + color + ';border-radius:3px;margin-right:1px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;writing-mode:vertical-rl;">' + p + '</div>';
    });
    // 杠铃
    html += '<div style="width:4px;height:50px;background:var(--text3);border-radius:2px;margin:0 2px;"></div>';
    // 右侧片
    result.plates.forEach(function(p) {
      var color = PLATE_COLORS[p] || '#999';
      var w = Math.max(6, Math.min(22, p * 0.8 + 4));
      html += '<div style="width:' + w + 'px;height:36px;background:' + color + ';border-radius:3px;margin-left:1px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;writing-mode:vertical-rl;">' + p + '</div>';
    });
    html += '</div>';

    // 详细列表
    html += '<div style="font-size:11px;color:var(--text3);text-align:center;">每侧 ' + result.plates.length + ' 片,总配比 ' + result.actual + 'kg';
    if (!result.exact) html += ' <span style="color:var(--amber);">(差' + (target - result.actual).toFixed(1) + 'kg,用小片补)</span>';
    html += '</div></div>';

    resultEl.innerHTML = html;
    resultEl.style.display = 'block';
  }
};

// ============ 3. RPE自调节系统 ============

// 这条记录该不该排除掉(供下面两个函数用)。planner-core.js 先于本文件加载(index.html
// 里两个 <script> 同为 defer, 按书写顺序执行), 直接复用它的判定 —— 存下来的 deload 标记
// 和"骤降兜底"两层都要: 只认标记会漏(减载周常是周期末周, 勾完打卡跳到第 1 周后才补填,
// 此刻存进去的 deload 是 false)。加 typeof 保护: 万一本文件被单独引入而没有 planner-core,
// 退化成只看标记, 不至于报错。
function fbEntryIsDeloadSafe(log, i, exName) {
  if (!log || !log[i]) return false;
  if (typeof fbLooksLikeDeload === 'function') {
    try { return !!fbLooksLikeDeload(log, i, exName); } catch (err) {}
  }
  return log[i].deload === true;
}

function getAvgRPE(exName) {
  if (!trainingLog || !trainingLog[exName] || !trainingLog[exName].length) return null;
  var log = trainingLog[exName];
  var start = Math.max(0, log.length - 3);            // 最近3次
  var rpes = [];
  for (var ai = start; ai < log.length; ai++) {
    var ae = log[ai];
    // ⚠️ 排除 1RM 测试成绩(e.test)：测极限必然力竭，RPE 恒为 10。
    //   它是一次测量而不是一次训练量，算进平均会把均值拉高，
    //   于是下次训练被建议"太吃力，减重" —— 明明状态没问题。
    if (!ae || !(ae.rpe > 0) || ae.test) continue;
    // ⚠️ 排除减载周：减载周"很轻松"是因为重量被刻意降下来了，不是状态变好。
    //   算进均值 → 平均 RPE 被拉低 → 建议加重量，基准就实打实掉到减载重量。
    if (fbEntryIsDeloadSafe(log, ai, exName)) continue;
    rpes.push(ae);
  }
  if (!rpes.length) return null;
  var sum = rpes.reduce(function(a, e) { return a + e.rpe; }, 0);
  return Math.round(sum / rpes.length * 10) / 10;
}

function getRPEAdjustment(exName) {
  if (!trainingLog || !trainingLog[exName]) return null;
  var avgRPE = getAvgRPE(exName);
  if (!avgRPE) return null;

  // ⚠️ 基准重量也要跳过测试成绩：1RM 测试用的是"能做几次就用多重"的极限重量，
  //   拿它当"上次练了多少"去加减，等于把测量的极限当成常规训练量。
  // ⚠️ 同样要跳过减载周：减载周的重量是刻意降下来的，拿它当基准去算 ±5%，
  //   等于把减载重量固化成新的正常重量(60kg 减载到 48kg → 建议 45.6kg)。
  //   这里和 fbCalcNextLoad 的"回退到减载前那一次"是同一条口径。
  var full = trainingLog[exName] || [];
  var li = full.length - 1;
  while (li >= 0 && (!full[li] || full[li].test || fbEntryIsDeloadSafe(full, li, exName))) li--;
  var last = full[li];
  if (!last) return null;

  // 自重/计时动作:重量恒为 0,上面那句 !last.weight 会让它们永远拿不到建议。
  // 对它们而言"加量"= 多做几次/多撑几秒,而不是加 kg。
  var u = (typeof getLogUnit === 'function') ? getLogUnit(exName) : {mode:'weight', unit:'kg', label:'重量'};
  if (u.mode === 'reps') {
    var reps = parseInt(last.reps) || 0;
    if (!reps) return null;
    if (avgRPE >= 9) {
      return { action: 'decrease', rpe: avgRPE, text: '↓建议' + Math.max(1, reps - 2) + u.unit + '(太吃力)' };
    } else if (avgRPE <= 6) {
      return { action: 'increase', rpe: avgRPE, text: '↑建议' + (reps + 2) + u.unit + '(很轻松)' };
    } else if (avgRPE >= 7.5 && avgRPE <= 8.5) {
      return { action: 'maintain', rpe: avgRPE, text: '✓维持' + reps + u.unit + '(状态好)' };
    }
    return null;
  }

  if (!last.weight) return null;

  if (avgRPE >= 9) {
    // RPE ≥ 9:太难,建议-5%重量
    var newWeight = Math.round(last.weight * 0.95 / 2.5) * 2.5;
    return { action: 'decrease', weight: newWeight, oldWeight: last.weight, rpe: avgRPE, text: '↓建议' + newWeight + 'kg(-5%)' };
  } else if (avgRPE <= 6) {
    // RPE ≤ 6:太轻松,建议+5%重量
    var newWeight2 = Math.round(last.weight * 1.05 / 2.5) * 2.5;
    return { action: 'increase', weight: newWeight2, oldWeight: last.weight, rpe: avgRPE, text: '↑建议' + newWeight2 + 'kg(+5%)' };
  } else if (avgRPE >= 7.5 && avgRPE <= 8.5) {
    // RPE 7-8:甜蜜区,维持
    return { action: 'maintain', weight: last.weight, oldWeight: last.weight, rpe: avgRPE, text: '✓维持' + last.weight + 'kg(状态好)' };
  }
  return null;
}

function renderRPEAdjustmentBadge(exName) {
  var adj = getRPEAdjustment(exName);
  if (!adj) return '';
  var color = adj.action === 'increase' ? '#22C55E' : adj.action === 'decrease' ? '#EF4444' : '#3B82F6';
  return '<span style="display:inline-block;font-size:10px;font-weight:700;color:' + color + ';background:' + color + '18;padding:2px 6px;border-radius:6px;margin-left:4px;" title="RPE ' + adj.rpe + '自动分析">' + adj.text + '</span>';
}

// ============ 4. 减载周自动化 ============

function getDeloadSettings() {
  try {
    return JSON.parse(localStorage.getItem('fitbuddy_deload') || '{"enabled":true,"interval":4,"reduction":40}');
  } catch(e) {
    return { enabled: true, interval: 4, reduction: 40 };
  }
}

function saveDeloadSettings(settings) {
  localStorage.setItem('fitbuddy_deload', JSON.stringify(settings));
}

function isDeloadWeekActive(weekNum, cycle) {
  // P3: 用户在「减载决策」卡上按了"本周按减载执行" —— 那是按身体信号触发的,
  // 优先级高于日历节奏。身体说该减的时候, 日历说不该减也得听身体的。
  try {
    if (typeof fbDeloadOverrideActive === 'function' && fbDeloadOverrideActive()) return true;
  } catch (e) {}
  var settings = getDeloadSettings();
  if (!settings.enabled) return false;

  // 哪一周减载, 唯一真源是主计划的周期表 —— 用户选了 N 周周期, 那周的 deload 标记就说了算。
  // 这里曾经写死"第4周为减载周"(ir 无视用户周期), 与主计划 buildCycleWeekInfo(N) 错位:
  // 只按数字夹范围时有 10 种取值,其中只有 N=4 对得上。N=6 时它砍的是第 4 周(主计划的
  // +15% 冲击周),而真正该减载的第 5、6 周一次没减。
  // (现在周期长度只放 4/6/8/10/12 五档,3 周已取消 —— 见 planner-core 的 FB_CYCLE_LENGTHS)
  // 就算产品经理没发现, 用户也会发现: 他这周明明被安排轻练, 计划却给了最多的组数。
  if (typeof fbPeriodIsDeloadWeek === 'function') {
    try { return !!fbPeriodIsDeloadWeek(weekNum); } catch (e) {}
  }
  // planner-core 没加载时的兜底: 退回写死 interval, 至少保证长周期里还会减载
  var interval = settings.interval || 4;
  return ((weekNum - 1) % interval) === (interval - 1);
}

// ⚠️ 这里删掉了 applyDeloadToSets 和 getDeloadReduction: 它们定义之后从未被任何地方调用
// (只有 applyDeloadToSets 曾被挂到 window 上, 也没有内联 onclick 用到它), 却各自带着第三套
// 降幅口径 —— 一旦哪天被接上线, 就是又一次「同一个减载周好几个数字」的重演。
// 现在降幅只有 fbDeloadSeverity() 一个出口。

function renderDeloadToggle() {
  var settings = getDeloadSettings();
  var isDeload = isDeloadWeekActive(currentWeek, currentCycle);
  // 文案跟着真实周期走: interval 已经不再参与判定(见 isDeloadWeekActive),
  // 继续显示"每4周"等于当着选了 6 周周期的用户说假话。
  var N = (typeof fbPeriodTotalWeeks === 'function') ? fbPeriodTotalWeeks() : 4;
  var html = '<div style="background:var(--bg);border-radius:12px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">' +
    '<div><div style="font-size:13px;font-weight:700;color:var(--text);">🔄 减载周自动化</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-top:2px;">按 ' + N + ' 周周期安排减载周 · 降量' + (settings.reduction || 40) + '%</div></div>' +
    '<div style="display:flex;align-items:center;gap:8px;">';
  if (isDeload) {
    html += '<span style="font-size:11px;font-weight:700;color:#8B5CF6;">⚡ 本周减载</span>';
  }
  html += '<label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;">' +
    '<input type="checkbox" ' + (settings.enabled ? 'checked' : '') + ' onchange="DeloadCtrl.toggle(this.checked)" style="display:none;">' +
    '<span style="position:absolute;inset:0;border-radius:11px;background:' + (settings.enabled ? 'var(--primary)' : 'var(--border)') + ';transition:all .2s;"></span>' +
    '<span style="position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:all .2s;transform:translateX(' + (settings.enabled ? '18px' : '0') + ');"></span>' +
  '</label></div></div>';
  return html;
}

var DeloadCtrl = {
  toggle: function(enabled) {
    var settings = getDeloadSettings();
    settings.enabled = enabled;
    saveDeloadSettings(settings);
    // 重新渲染
    if (typeof doGenerate === 'function') doGenerate();
  }
};

// ============ 5.5 🏆 个人纪录(PR)卡片 ============
// 🧮 每行右边的按钮跳到 1RM 计算器并带上这个动作 —— 纪录卡是"回顾",
//    看完自然会问"那我现在能推多少", 给它一个不用再翻页找工具的出口。
function renderPRCards() {
  if (typeof buildPRsFromLog !== 'function') return '';
  var prs = buildPRsFromLog();
  var keys = Object.keys(prs).filter(function(k){ return prs[k] && prs[k].e1rm > 0; });
  if (!keys.length) return '';
  keys.sort(function(a, b){ return prs[b].e1rm - prs[a].e1rm; });
  var html = '<div class="progress-card"><div class="card-title" style="justify-content:space-between;">' +
    '<span>🏆 个人纪录 <span style="font-size:10px;color:var(--text3);font-weight:400;">按估算1RM(Epley)</span></span>' +
    '<button class="export-btn" style="font-size:11px;padding:4px 10px;border:none;background:var(--primary-light);color:var(--primary);" onclick="generateShareImage()">📸 分享图</button></div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:6px;">在训练动作卡「渐进超负荷」中记录重量/次数，自动统计历史最佳 · 点 🧮 用这个动作的成绩算 1RM</div>';
  keys.slice(0, 8).forEach(function(exName) {
    var p = prs[exName];
    // ⚠️ exName 早期版本直接拼接未转义。动作名可以来自用户自定义动作,
    //    一个 "<img onerror=...>" 就能打穿进度页 —— 一并修掉。
    html += '<div class="pr-row">' +
      '<div style="min-width:0;">' +
        '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + ptEsc(exName) + '</div>' +
        '<div style="font-size:10px;color:var(--text3);margin-top:2px;">' + (p.weight || 0) + 'kg × ' + (p.reps || 0) + ' 次' + (p.date ? ' · ' + p.date : '') + '</div>' +
      '</div>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;flex-shrink:0;">' +
        '<button onclick="goRmCalc(' + ptJsArg(exName) + ')" title="用 1RM 计算器算 ' + ptEsc(exName) + '" aria-label="用 1RM 计算器算 ' + ptEsc(exName) + '" style="border:1.5px solid var(--border);background:var(--bg);color:var(--text2);font-size:13px;line-height:1;padding:5px 8px;border-radius:8px;cursor:pointer;">🧮</button>' +
        '<span class="pr-badge">🏋️ ' + p.e1rm + 'kg</span>' +
      '</span>' +
    '</div>';
  });
  html += '</div>';
  return html;
}

// 把任意字符串安全地塞进内联 onclick 的参数位。
// 两段转义缺一不可:JSON.stringify 负责 JS 字符串字面量,后面的 replace 负责 HTML 属性上下文
// (动作名里带引号会提前闭合 onclick,带尖括号能直接注入标签)。
function ptJsArg(s) {
  return JSON.stringify(String(s === null || s === undefined ? '' : s))
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// HTML 转义。动作名来自用户自定义输入, 不转义的话一个 "<img onerror>" 就能打穿进度页。
function ptEsc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Pro 卡统一徽章。三处(P0/卡点诊断在 planner-core, P2/P3/P4 在这里)必须长得一样,
// 否则同一个 Pro 在页面上出现两种标识, 像两个产品。
function fbProBadgeHtml() {
  var free = (typeof FB_PRO_FREE_BETA !== 'undefined') ? FB_PRO_FREE_BETA : true;
  return '<span style="font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;margin-left:6px;' +
    'background:linear-gradient(135deg,#FF6B35,#F59E0B);color:#fff;">PRO</span>' +
    (free ? '<span style="font-size:10px;color:var(--text3);font-weight:500;margin-left:5px;">内测期免费</span>' : '');
}

// ============ Pro P2 · 部位平衡与弱点分析 ============
// 免费版有「部位训练分布」环形图, 只回答"各练了几次";
// 这张卡回答"练得均不均衡、哪里是短板" —— 从"描述"跨到"判断", 这条线就是收费线。
function renderMuscleBalance() {
  if (typeof fbBalanceReport !== 'function') return '';
  var rep = null;
  try { rep = fbBalanceReport(); } catch (e) { return ''; }
  if (!rep || !rep.hasData) return '';

  var html = '<div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:12px;padding:10px 12px;background:var(--bg);border-radius:10px;">' +
    '统计最近 <b style="color:var(--text);">' + rep.spanDays + ' 天</b>每个部位的平均周容量，' +
    '对照主流容量区间，再看<b style="color:var(--text);">推/拉、上/下肢</b>有没有练歪。<br>' +
    '<span style="color:var(--text3);">「组」= 单个动作做完一轮算 1 组（3 组 × 10 次就是 3 组）。' +
    '推/拉按<b>动作</b>判：二头算拉、三头算推。<br>' +
    '柱状图是摊到每周的平均值，恢复训练头几周会被空窗稀释；「本周已完成」是即时口径，勾完立刻更新。<br>' +
    '更早的老打卡只记了动作个数，已按每动作 3-5 组折算，仍是估算值。</span></div>';

  // 即时口径: 平均周容量被历史空窗稀释, "勾了没加"的疑虑靠这行打消。
  // 只列本周真练过的部位, 全空(刚开新周还没练)就不显示, 不占地方。
  try {
    var wk = (typeof fbWeekMuscleSets === 'function') ? fbWeekMuscleSets() : null;
    if (wk && wk.hasData) {
      var wkParts = [];
      FB_BALANCE_MUSCLES.forEach(function (m) {
        if (wk.sets[m] > 0) wkParts.push(ptEsc(m) + ' <b style="color:var(--text);">' + Math.round(wk.sets[m]) + '</b>');
      });
      if (wkParts.length) {
        html += '<div style="margin:-4px 0 12px;padding:8px 12px;background:#22C55E14;border-radius:10px;font-size:12px;color:var(--text2);line-height:1.7;">' +
          '📅 <b style="color:var(--text);">本周已完成</b>（周一起）：' + wkParts.join(' · ') + ' 组</div>';
      }
    }
  } catch (eWk) {}

  if (rep.findings.length) {
    rep.findings.forEach(function (f) {
      html += '<div style="background:' + f.color + '14;border-left:3px solid ' + f.color +
        ';border-radius:10px;padding:10px 12px;margin-bottom:8px;">' +
        '<div style="font-size:12px;color:var(--text);line-height:1.65;">' + ptEsc(f.text) + '</div></div>';
    });
  } else {
    html += '<div style="background:#22C55E14;border-left:3px solid #22C55E;border-radius:10px;padding:10px 12px;margin-bottom:10px;' +
      'font-size:12px;color:var(--text);line-height:1.65;">各部位都在推荐区间内，推拉也平衡。' +
      '这种情况最该做的不是加量，是别乱改。</div>';
  }

  // 横轴上限取"最大实际值"和"区间上限"里更大的那个, 再留 15% 余量 ——
  // 否则练得猛的人(比如胸 25 组)的柱子会全部顶满, 看不出差别。
  var maxScale = 1;
  rep.items.forEach(function (it) {
    maxScale = Math.max(maxScale, it.setsPerWeek, it.target[1]);
  });
  maxScale = maxScale * 1.15;

  html += '<div style="font-size:11px;color:var(--text3);margin:2px 0 8px;">阴影段 = 推荐区间</div>';
  rep.items.forEach(function (it) {
    var curPct = Math.min(100, it.setsPerWeek / maxScale * 100);
    var loPct = Math.min(100, it.target[0] / maxScale * 100);
    var bandW = Math.min(100, it.target[1] / maxScale * 100) - loPct;
    var color = it.status === 'low' ? '#EF4444' : it.status === 'high' ? '#8B5CF6'
      : it.status === 'ok' ? '#22C55E' : '#94A3B8';
    var tag = it.status === 'low' ? '偏少' : it.status === 'high' ? '偏多'
      : it.status === 'ok' ? '合适' : '没练';
    html += '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">' +
      '<span style="width:30px;flex:none;font-size:12px;font-weight:600;color:var(--text);">' + ptEsc(it.label) + '</span>' +
      '<div style="flex:1;position:relative;height:10px;border-radius:5px;background:var(--border);overflow:hidden;">' +
        '<div style="position:absolute;top:0;bottom:0;left:' + loPct.toFixed(1) + '%;width:' + bandW.toFixed(1) + '%;background:#22C55E22;"></div>' +
        '<div style="position:absolute;top:0;bottom:0;left:0;width:' + curPct.toFixed(1) + '%;background:' + color + ';border-radius:5px;"></div>' +
      '</div>' +
      '<span style="width:58px;flex:none;text-align:right;font-size:11px;color:var(--text2);">' +
        (it.setsPerWeek > 0 ? Math.round(it.setsPerWeek) + '组/周' : '—') + '</span>' +
      '<span style="width:26px;flex:none;text-align:right;font-size:10px;font-weight:700;color:' + color + ';">' + tag + '</span>' +
    '</div>';
  });

  // 处方只给最弱的那一个。一次改一个部位, 4 周后能明确知道"是这个改动起了作用";
  // 一次开三张处方, 见效了也不知道是谁的功劳, 下次还是不知道该怎么调。
  var target = null;
  if (rep.weak && rep.weak.status === 'low') target = rep.weak;
  if (!target) {
    var lows = rep.items.filter(function (it) { return it.status === 'low'; });
    if (lows.length) target = lows[0];
  }
  if (target) {
    var add = Math.max(2, Math.round(target.target[0] - target.setsPerWeek));
    var aid = (typeof fbBalanceAid === 'function') ? fbBalanceAid(target.muscle) : '';
    // 处方里的组数必须跟着 add 走。写死「3 组 × 10 次」的话, 上面算出要加 9 组、
    // 下面却说做 3 组, 用户照着做永远补不上 —— 而且 3 组没法"分到 2 次训练里"。
    var per = Math.max(1, Math.round(add / 2));
    html += '<div style="margin-top:12px;padding:11px 12px;background:var(--bg);border-radius:10px;">' +
      '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;">🧭 下一步：' +
        ptEsc(target.label) + '每周加 ' + add + ' 组</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.7;">' +
        (aid ? ('加 <b style="color:var(--text);">' + ptEsc(aid) + ' ' + per + ' 组 × 10 次</b>，' +
                 '安排在 2 次训练里（每次 ' + per + ' 组），排在' +
                 ptEsc(target.label) + '主项之后<br>') : '') +
        '分 2 次加，别一次加完 —— 单次容量涨超 20% 就是在攒疲劳<br>' +
        '4 周后回来看这张卡：' + ptEsc(target.label) + '的柱子进阴影段就算补上了' +
      '</div></div>';
  }

  if (typeof collapsibleCard === 'function') {
    return collapsibleCard('pc-balance', '<span>⚖️ 部位平衡分析</span>' + fbProBadgeHtml(), html, false);
  }
  return '<div class="progress-card"><div class="card-title">⚖️ 部位平衡分析' + fbProBadgeHtml() + '</div>' + html + '</div>';
}

// ============ Pro P3 · 减载决策自动化 ============
// 卡片平时也在, 显示"监控中"+ 信号清单。这跟 P0 卡点诊断不一样:
// 诊断是"有病才来", 减载是"没病也要定期体检" —— 消失了用户就不知道系统在看着。
function renderDeloadDecision() {
  if (typeof fbDeloadSignals !== 'function') return '';
  var s = null;
  try { s = fbDeloadSignals(); } catch (e) { return ''; }
  if (!s || !s.hasData) return '';

  var html = '<div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:12px;padding:10px 12px;background:var(--bg);border-radius:10px;">' +
    '减载不看日历，看身体：汇总 <b style="color:var(--text);">RPE 趋势、成绩回落、部位疲劳、连练天数、出勤率</b> 五类信号。<br>' +
    '<span style="color:var(--text3);">单条信号永远不会触发减载 —— 一条可能是巧合，两条同时出现才是真的累了。</span></div>';

  if (s.need) {
    html += '<div style="background:#EF444414;border-left:3px solid #EF4444;border-radius:10px;padding:11px 12px;margin-bottom:10px;">' +
      '<div style="font-size:13px;font-weight:800;color:#EF4444;margin-bottom:4px;">⚠️ ' +
        (s.strong ? '这周必须减载' : '这周建议减载') + '</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.65;">' +
        '有 <b style="color:var(--text);">' + s.signals.length + ' 条</b>信号同时亮起。' +
        '这时候硬加重量，长的是疲劳不是力量。</div></div>';
  } else {
    html += '<div style="background:#22C55E14;border-left:3px solid #22C55E;border-radius:10px;padding:11px 12px;margin-bottom:10px;">' +
      '<div style="font-size:13px;font-weight:800;color:#22C55E;margin-bottom:4px;">✅ 暂时不用减载</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.65;">信号都在阈值内，按原计划继续冲就行。</div></div>';
  }

  // 信号清单: 不需要减载时也照样列出来, 让用户看见"系统在看什么"
  html += '<div style="font-size:11px;color:var(--text3);margin:0 0 7px;">当前信号（' + s.signals.length + '）</div>';
  if (s.signals.length) {
    s.signals.forEach(function (g) {
      html += '<div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border);">' +
        '<span style="flex:none;width:7px;height:7px;border-radius:50%;background:' + g.color + ';margin-top:5px;"></span>' +
        '<span style="flex:1;font-size:12px;color:var(--text2);line-height:1.6;">' +
          '<b style="color:var(--text);">' + ptEsc(g.label) + '</b>：' + ptEsc(g.detail) + '</span></div>';
    });
  } else {
    html += '<div style="font-size:12px;color:var(--text3);padding:7px 0;">没有异常信号。' +
      'RPE 在正常区间，成绩没回落，也没有连练过度。</div>';
  }

  if (s.need) {
    var plan = (typeof fbDeloadPlan === 'function') ? fbDeloadPlan() : [];
    if (plan.length) {
      html += '<div style="margin-top:12px;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;">📋 减载周怎么练</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;">' +
        plan.map(function (p, i) {
          return '<div style="display:flex;gap:7px;font-size:12px;color:var(--text2);line-height:1.6;">' +
            '<span style="flex:none;width:16px;height:16px;border-radius:50%;background:#EF44441A;color:#EF4444;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-top:2px;">' + (i + 1) + '</span>' +
            '<span style="flex:1;">' + ptEsc(p) + '</span></div>';
        }).join('') + '</div>';
    }
  }

  // 行动按钮: 点了就直接把本周标成减载周, 计划页的组数立刻降下来, 不用再去找开关
  html += '<div style="display:flex;gap:8px;margin-top:12px;">';
  if (s.override) {
    html += '<button onclick="DeloadDecisionCtrl.cancel()" style="flex:1;padding:9px;border-radius:10px;background:var(--bg);color:var(--text);border:1.5px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;">↩︎ 取消本周减载</button>';
  } else {
    html += '<button onclick="DeloadDecisionCtrl.apply()" style="flex:1;padding:9px;border-radius:10px;background:linear-gradient(135deg,#FF6B35,#F59E0B);color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;">⚡ 本周按减载执行</button>';
  }
  html += '</div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-top:8px;line-height:1.6;">' +
    (s.weeksSince >= 99 ? '记录里还没有减载过的痕迹' : '距离上次减载 ' + s.weeksSince + ' 周') +
    ' · 减载标记只影响本周，下周自动恢复</div>';

  var badge = s.need
    ? '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;margin-left:6px;background:#EF444420;color:#EF4444;">该减载</span>'
    : '<span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;margin-left:6px;background:#22C55E20;color:#22C55E;">正常</span>';

  if (typeof collapsibleCard === 'function') {
    return collapsibleCard('pc-deload', '<span>🔄 减载决策</span>' + badge + fbProBadgeHtml(), html, s.need);
  }
  return '<div class="progress-card"><div class="card-title">🔄 减载决策' + badge + '</div>' + html + '</div>';
}

var DeloadDecisionCtrl = {
  apply: function () {
    try { if (typeof fbSetDeloadOverride === 'function') fbSetDeloadOverride(true); } catch (e) {}
    this._rerender();
  },
  cancel: function () {
    try { if (typeof fbSetDeloadOverride === 'function') fbSetDeloadOverride(false); } catch (e) {}
    this._rerender();
  },
  // 重渲染整页是最省事的做法, 而且 renderProgress 已被 initProToolsProgress 挂钩,
  // Pro 区块会跟着重建。代价是丢滚动位置 —— 但卡片是折叠的, 影响可控。
  _rerender: function () {
    try { if (typeof renderProgress === 'function') renderProgress(); } catch (e) {}
    try { if (typeof doGenerate === 'function') doGenerate(); } catch (e2) {}
  }
};

// ============ Pro P1 · 周期化全透明 + 可编辑 ============
// 免费版告诉你"这周练什么", 这里把整个周期的容量波浪摊开, 并且允许改。
// 敢摊开是商业模式差异: 黑盒 AI 计划画不出这张图, 一画就暴露它是模板。

// 强度中位(= 不增不减)。常量定义在 planner-core, 这里带兜底读一次:
// 万一两个文件的缓存版本错配, 也不能让它变成 0 从而算出 NaN 组数。
function fbPeriodBaseVal() {
  var v = (typeof FB_PERIOD_BASE !== 'undefined') ? parseFloat(FB_PERIOD_BASE) : 0.74;
  return (v > 0.05 && v < 2) ? v : 0.74;
}

// 这张卡要不要出现, 取决于「这一周的计划是靠什么构成的」。
// P1 的调整最终是缩放 cfg.sets 生效的(pro-tools 的 doGenerateInternal 包装里),
// 但 buildMarathonPlan(level, days, equip, wOff) 和 buildCardioPlan(...) 连 cfg 都不接 ——
// 跑步/有氧的每周内容是按分期算出来的(含赛前 taper), 改强度对它零作用。
//
// 曾经这里处理方式是「柱子保留、标成只读」, 实测是坏选择:
//   ① 不能拖的柱子图对跑步用户是纯噪音 —— 同一页的周进度条已经把
//      基础期/强化期/巅峰期/减量期 和剩余跑量说清楚了, 两张图讲的同一件事;
//   ② 「看起来能改、其实不能」比「没有这个功能」更糟, 用户会反复点, 还以为自己点漏了。
// 所以这两类目标干脆不渲染这张卡。等跑步也能按周期微调的那天再放回来。
function fbPeriodCardVisible() {
  try {
    if (typeof fbCurrentGoal === 'function') {
      var g = fbCurrentGoal();
      if (g === 'marathon' || g === 'cardio') return false;
    }
  } catch (e) {}
  return true;
}

function fbPeriodEditorInner() {
  // 周期长度跟用户自己的计划周期走, 不再写死 16 —— 写死过一次, 选 6/12 周模板的用户
  // 看到的减载周和当天实际练的完全是两周。
  var N = (typeof fbPeriodTotalWeeks === 'function') ? fbPeriodTotalWeeks() : 16;
  var cw = (typeof currentWeek !== 'undefined' && currentWeek) ? currentWeek : 1;
  if (cw > N || cw < 1) cw = ((((cw - 1) % N) + N) % N) + 1;
  var sel = PeriodCtrl.selected || cw;
  if (sel > N || sel < 1) sel = cw;

  // 减载设置: 手动减载周按 reduction 降组数, 卡片必须显示那根柱子矮下去, 而不是照周期表
  // 画一根爬坡柱 —— 上面「减载决策」卡刚说这周该减, 下面这张图却画成冲峰值, 等于互相拆台。
  var ds = (typeof getDeloadSettings === 'function') ? getDeloadSettings() : { enabled: true, reduction: 40 };
  var redPct = Math.max(0, Math.min(90, parseFloat(ds.reduction) || 40));
  // planner-core 没加载(缓存版本错配)时退回周期表判定, 卡片不该因为少一个函数就画不出来
  var stateOf = function (w) {
    if (typeof fbPeriodWeekDeloadState === 'function') {
      try { return fbPeriodWeekDeloadState(w); } catch (e) {}
    }
    return { deload: !!(typeof fbPeriodIsDeloadWeek === 'function' && fbPeriodIsDeloadWeek(w)), manual: false, disabled: false };
  };

  var html = '<div style="display:flex;align-items:flex-end;gap:2px;height:64px;padding:0 1px;">';
  for (var w = 1; w <= N; w++) {
    var st = stateOf(w);
    var inten = fbPeriodIntensity(w);
    var shown = st.manual ? inten * (1 - redPct / 100) : inten;   // 只影响这根柱子的高度
    // 高度映射不做 0 起点: 强度实际只在 0.5~0.95 之间, 从 0 画的话
    // 所有柱子都顶在上面, 看不出波浪, 也就失去了这张图的意义。
    var hPct = Math.max(10, Math.min(100, (shown - 0.4) / 0.6 * 100));
    var isNow = (w === cw), isSel = (w === sel), isDl = st.deload;
    var color = isSel ? '#FF6B35' : (st.manual ? '#8B5CF6' : (isDl ? '#94A3B8' : '#3B82F6'));
    html += '<div onclick="PeriodCtrl.select(' + w + ')" style="flex:1;height:100%;display:flex;flex-direction:column;' +
      'justify-content:flex-end;align-items:center;cursor:pointer;border-radius:4px;' +
      (isNow ? 'background:#FF6B3518;' : '') + '">' +
      '<div style="width:100%;max-width:16px;height:' + hPct.toFixed(1) + '%;background:' + color +
        ';border-radius:3px;opacity:' + (isDl && !isSel ? (st.disabled ? 0.35 : 0.6) : 1) + ';' +
        (isSel ? 'box-shadow:0 0 0 2px #FF6B3540;' : '') + '"></div></div>';
  }
  html += '</div>';

  html += '<div style="display:flex;gap:2px;padding:0 1px;margin-top:3px;">';
  for (var w2 = 1; w2 <= N; w2++) {
    var isNow2 = (w2 === cw), isSel2 = (w2 === sel);
    html += '<div style="flex:1;text-align:center;font-size:9px;font-weight:' + (isSel2 ? 800 : 600) +
      ';color:' + (isSel2 ? '#FF6B35' : (isNow2 ? 'var(--text)' : 'var(--text3)')) + ';">' + w2 + '</div>';
  }
  html += '</div>';

  var selSt = stateOf(sel);
  var curI = fbPeriodIntensity(sel);
  var pct = Math.round(curI * 100);
  var edited = (typeof fbPeriodEdited === 'function') ? fbPeriodEdited() : false;
  // 手动减载周不再报强度百分比: 那周组数是按 reduction 砍的, 周期表上的 +15% 是没执行的,
  // 报出来只会让人以为"说好的减载呢"。报实际执行的口径。
  // 组数报的是"计划页真的会生成的那个数": 基准取当前水平(新手3/中级4/进阶5),
  // 减载周走 reduction 砍, 与生成路径同一函数 —— 以前这里写死 4 组, 新手看到卡片报 4
  // 而计划页给 3, 减载周卡片 3 而计划页 2。减载自动化关掉时它也跟着不降量。
  var setsTxt = (typeof fbPeriodWeekSets === 'function')
    ? fbPeriodWeekSets(sel)
    : Math.max(2, Math.round(4 * curI / fbPeriodBaseVal()));
  // 常规(非减载)周每个动作几组 —— 减载周那行要说"从几组降到几组"用得上。
  // 减载周报的是 reduction 设置的百分比, 但组数是整数: 新手 3 组降 40% 得 1.8 → 保底减 1 → 2 组,
  // 实际降了 33%; 中级 4 组降完直接掉到 2 组(50%)。一行里写"−40% · 约 2 组", 用户拿 3 一算
  // 就发现两个数对不上 —— 报实际的前后组数, 不报那个算了也落不到整数上的百分比。
  var baseSets = (typeof fbSetsPerEx === 'function') ? fbSetsPerEx() : 3;
  // 加档预算(v116): 不是每个爬坡周都加重量 —— 一个周期只有少数几周是"加档周", 其余爬坡周的
  // +10%/+15% 靠多做几次 / 多一组兑现(见 planner-core 的 fbPeriodStepUpBudget)。
  // 卡片上这里不明说, 用户会在首页看到"周期表写着 +15%、今日目标却一点没动", 判定为坏了。
  var selWkPct = 0, selUp = null;
  try {
    if (typeof fbPeriodWeekPct === 'function') selWkPct = fbPeriodWeekPct(sel);
    if (typeof fbPeriodIsStepUpWeek === 'function') selUp = fbPeriodIsStepUpWeek(sel);
  } catch (e) {}
  var holdWeight = (!selSt.deload && selUp === false && selWkPct > 0);
  // v119: 本周的处方次数。走 planner-core 的 fbPeriodWeekReps —— 与计划页 ex-row、
  // 周信息条同一出口, 卡片不许再自己算一套(以前这里报"4 组"而计划页给 3, 同款毛病)。
  var _selLowOf = 0, _selStep = 0;
  try {
    var _pl  = JSON.parse(localStorage.getItem('fitbuddy_lastplan') || 'null');
    var _lv3 = (_pl && _pl.level) || 'beginner';
    var _gl3 = (_pl && _pl.goal) || 'muscle';
    var _b3  = ((typeof CONFIGS !== 'undefined' && CONFIGS[_lv3] && CONFIGS[_lv3][_gl3]) || {}).reps || '';
    var _n3  = (typeof fbPeriodWeekReps === 'function')
      ? fbPeriodWeekReps(sel, _b3, !!(_pl && _pl.equip === 'bodyweight')) : _b3;
    _selLowOf = (typeof fbRepsLowOf === 'function') ? fbRepsLowOf(_n3) : 0;
    _selStep  = _selLowOf - ((typeof fbRepsLowOf === 'function') ? fbRepsLowOf(_b3) : 0);
  } catch (e) {}
  // "多做几次/加组数" 是空话: 加一组 = +25% 远超一周爬坡幅度, 周期内根本不加组;
  // "几次"又是范围。这里直接报本周每组的次数下限, 加档周另说(那周靠重量)。
  var _repsTip = '';
  // 本周处方走 planner-core 的唯一出口 fbWeekRx, 不再自己从 selWkPct/selUp 推(v122):
  //   这里判断"加不加重量"的口径和首页周信息条、今日目标必须是同一个, 否则用户会在
  //   同一屏看到"周期卡说维持、今日目标说加 1 档"。
  var _rx3 = null;
  try { if (typeof fbWeekRx === 'function') _rx3 = fbWeekRx(sel); } catch (e3) {}
  var _rxUp = _rx3 ? !!_rx3.stepUp : (selUp === true);
  var _rxFlat = _rx3 ? (_rx3.hold || !(_rx3.deltaPct > 0)) : true;
  if (_selLowOf > 0) {
    if (_rxUp) {
      // ⚠️ 措辞与首页周信息条逐字对齐(renderWeekInfo 那行是"加 N 档重量，每组至少 N 次")。
      //   "维持"→"至少"(v122): 台阶是下限, 用户上次做了 15 次而台阶 14, "维持 14" 与
      //   今日目标的「×15」又是一组对不上的数字(与 planner-core 同一处修改)。
      _repsTip = '<span style="color:var(--text3);"> · 本周加 1 档重量，每组至少 ' + _selLowOf + ' 次</span>';
    } else if (_rxFlat) {
      _repsTip = '<span style="color:var(--text3);"> · 重量维持，每组至少 ' + _selLowOf + ' 次' +
        (_selStep > 0 ? '（比基准 +' + _selStep + ' 次）' : '') + '</span>';
    } else {
      // 非加档爬坡周: 那周重量不动, 增量全靠次数 —— 说"每组加到 N 次"而不是"维持",
      // 否则用户照着"维持"做完, 这周的强度一点没涨(与周信息条同一措辞)。
      _repsTip = '<span style="color:var(--text3);"> · 本周重量不变，每组加到 ' + _selLowOf + ' 次' +
        (_selStep > 0 ? '（比基准 +' + _selStep + ' 次）' : '') + '</span>';
    }
  }
  var weekSub = selSt.manual
    ? '本周按减载执行 · ' + baseSets + ' 组 → <b style="color:var(--text);">' + setsTxt + '</b> 组/动作'
    : (selSt.disabled
      ? '强度 ' + pct + '% · 减载已关闭，这周不自动降量 · 约 ' + setsTxt + ' 组/动作'
      : '强度 ' + pct + '% · 约 ' + setsTxt + ' 组/动作' + _repsTip);
  // 减载周(含手动)的组数走 isDeload 分支, 根本不读 P1 强度 —— 这时候 ± 是"看着能拧实际拧不动"
  var lockAdj = !!selSt.manual;
  var btnBase = 'width:32px;height:32px;border-radius:8px;background:var(--card);color:var(--text);border:1.5px solid var(--border);font-size:15px;font-weight:700;';
  var btnOff = btnBase + 'opacity:.4;cursor:not-allowed;';
  var btnOn = btnBase + 'cursor:pointer;';

  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding:9px 12px;background:var(--bg);border-radius:10px;">' +
    '<div><div style="font-size:13px;font-weight:700;color:var(--text);">第 ' + sel + ' 周' +
      (sel === cw ? '<span style="font-size:10px;font-weight:700;color:#FF6B35;margin-left:5px;">本周</span>' : '') +
      (selSt.manual
        ? '<span style="font-size:10px;font-weight:700;color:#8B5CF6;margin-left:5px;">减载中 · 手动</span>'
        : (fbPeriodIsDeloadWeek(sel)
          ? '<span style="font-size:10px;font-weight:700;color:var(--text3);margin-left:5px;">减载周' + (selSt.disabled ? ' · 未启用' : '') + '</span>'
          : '')) +
      '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:2px;">' + weekSub + '</div></div>' +
    '<div style="display:flex;gap:6px;">' +
      '<button onclick="PeriodCtrl.adjust(-0.05)" ' + (lockAdj ? 'disabled ' : '') + 'style="' + (lockAdj ? btnOff : btnOn) + '">−</button>' +
      '<button onclick="PeriodCtrl.adjust(0.05)" ' + (lockAdj ? 'disabled ' : '') + 'style="' + (lockAdj ? btnOff : btnOn) + '">＋</button>' +
      '</div>' +
    '</div>';

  html += '<div style="display:flex;gap:6px;margin-top:8px;">' +
    '<button onclick="PeriodCtrl.adjustGlobal(-0.05)" style="flex:1;padding:8px;border-radius:9px;background:var(--bg);color:var(--text);border:1.5px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;">整体 −5%</button>' +
    '<button onclick="PeriodCtrl.adjustGlobal(0.05)" style="flex:1;padding:8px;border-radius:9px;background:var(--bg);color:var(--text);border:1.5px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;">整体 ＋5%</button>' +
    (edited ? '<button onclick="PeriodCtrl.reset()" style="flex:none;padding:8px 12px;border-radius:9px;background:var(--bg);color:var(--text3);border:1.5px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;">恢复默认</button>' : '') +
    '</div>';

  // 周期长度待生效提示: 这张图跟着"这份计划生成时的周期"走(getCycleLength 读 lastPlan),
  // 用户在上方表单改了 chip 但还没点生成, 图上不会变 —— 不明说, 他会以为改了没生效。
  var pendingN = 0;
  try {
    var g0 = (typeof fbCurrentGoal === 'function') ? fbCurrentGoal() : '';
    if (g0 !== 'marathon' && g0 !== 'cardio') {   // 跑步/有氧的周期长度是分期内定的, 不跟 chip
      var pf = JSON.parse(localStorage.getItem('fitbuddy_prefs') || '{}') || {};
      var pn = parseInt(pf.cycleLength, 10);
      if (pn >= 4 && pn <= 16 && pn !== N) pendingN = pn;
    }
  } catch (e) {}

  html += '<div style="font-size:11px;color:var(--text3);margin-top:8px;line-height:1.6;">' +
    '点柱子选中某一周，± 只改那一周；整体 ±5% 会一次性重排全部 ' + N + ' 周（减载周不受影响）。<br>' +
    '改动<b style="color:var(--text2);">立即作用到本周计划</b>：计划页会按新强度增减<b>组数</b>。<br>' +
    '<span style="color:var(--text3);">± 拧的是容量（组数），不直接改重量 —— 单次举多重由首页「🎯 今日目标」' +
    '按<b>上次 RPE + 本周周期</b>算：一个台阶约为当前重量的 5%（腿最多 5kg，胸背等最多 2.5kg，' +
    '小重量动作 1kg），且一个周期只在少数几周加重量，其余爬坡周靠多做几次/加一组兑现。</span>';
  if (stateOf(cw).manual) {
    // 同上: 报实际前后组数, 不报落不到整数上的百分比
    var cwSets = (typeof fbPeriodWeekSets === 'function') ? fbPeriodWeekSets(cw) : baseSets;
    html += '<br><span style="color:#8B5CF6;">⚡ 紫色那周是你在上方「减载决策」卡上手动标记的减载：组数从 ' +
      baseSets + ' 组降到 ' + cwSets + ' 组（按减载设置 ' + redPct + '%），这一周的 ± 不参与。</span>';
  }
  if (ds.enabled === false) {
    html += '<br><span style="color:var(--text3);">减载自动化已关闭 —— 灰色的减载周仍按周期表画出来，但计划不会自动降量。</span>';
  }
  if (pendingN) {
    html += '<br><span style="color:var(--text3);">上方表单现在选的是 <b style="color:var(--text2);">' + pendingN +
      ' 周</b>，点「生成计划」后这张图才跟着变（周期长度生效在那一次）。</span>';
  }
  html += '</div>';
  return html;
}

function renderPeriodEditor() {
  if (typeof fbPeriodIntensity !== 'function') return '';
  // 跑步/有氧不渲染: 那两类计划的每周量是分期算出来的, 改强度对它零作用,
  // 留一张不能拖的柱子图只是在同页重复一遍周进度条已经说过的话。
  if (typeof fbPeriodCardVisible === 'function' && !fbPeriodCardVisible()) return '';
  var N = (typeof fbPeriodTotalWeeks === 'function') ? fbPeriodTotalWeeks() : 16;
  var title = '<span>📈 ' + N + '周周期化 · 可编辑</span>' + fbProBadgeHtml();
  // 说明跟着用户的实际周期走。以前写"每 4 周一个小周期" —— 选了 6 周计划的用户
  // 数一数对不上, 只会觉得这张图不是给他的。
  var headHtml = '你的计划周期是 <b style="color:var(--text);">' + N + ' 周</b>，这张图把它整个摊开：柱子越矮容量越低，灰色的那几周是减载周。';
  var tailHtml = '<span style="color:var(--text3);">这张图别家不敢画 —— 画出来你就会发现，所谓 AI 计划不过是同一条曲线。</span>';
  var head = '<div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:12px;padding:10px 12px;background:var(--bg);border-radius:10px;">' +
    headHtml + '<br>' + tailHtml + '</div>';

  if (typeof collapsibleCard === 'function') {
    return collapsibleCard('pc-period-edit', title,
      head + '<div id="periodEditorPanel">' + fbPeriodEditorInner() + '</div>', false);
  }
  return '<div class="progress-card"><div class="card-title">' + title + '</div>' +
    head + '<div id="periodEditorPanel">' + fbPeriodEditorInner() + '</div></div>';
}

var PeriodCtrl = {
  selected: 0,
  // 只刷新卡片内部, 不整页重渲染 —— 整页重渲染会把用户刚展开的其它卡片折叠状态搞乱,
  // 而且滚到一半跳回顶部, 编辑这种连续操作里最难受的就是这个。
  refresh: function () {
    var el = document.getElementById('periodEditorPanel');
    if (!el) return;
    try { el.innerHTML = fbPeriodEditorInner(); } catch (e) {}
  },
  select: function (w) { this.selected = w; this.refresh(); },
  adjust: function (d) {
    try { if (typeof fbPeriodAdjust === 'function') fbPeriodAdjust(this.selected, d); } catch (e) {}
    this.refresh();
    this._applyToPlan();
  },
  adjustGlobal: function (d) {
    try { if (typeof fbPeriodAdjustGlobal === 'function') fbPeriodAdjustGlobal(d); } catch (e) {}
    this.refresh();
    this._applyToPlan();
  },
  reset: function () {
    try { if (typeof fbPeriodReset === 'function') fbPeriodReset(); } catch (e) {}
    this.selected = 0;
    this.refresh();
    this._applyToPlan();
  },
  // 改完立刻让计划页按新强度重新生成, 否则用户看着柱子动了、计划没变, 会以为没生效
  _applyToPlan: function () {
    try { if (typeof doGenerate === 'function') doGenerate(); } catch (e) {}
  }
};

// ============ Pro P4 · 月度复盘报告 ============
function renderMonthlyReview() {
  if (typeof fbMonthlyReport !== 'function') return '';
  var rep = null, prev = null;
  try {
    rep = fbMonthlyReport(0);
    prev = fbMonthlyReport(-1);
  } catch (e) { return ''; }
  if (!rep || (!rep.hasData && rep.days <= 0)) return '';

  var html = '<div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:12px;padding:10px 12px;background:var(--bg);border-radius:10px;">' +
    ptEsc(rep.label) + '的训练全貌' + (rep.partial ? '（截至今天）' : '') + '。<br>' +
    '<span style="color:var(--text3);">日常的卡片都是局部判断，这里把它们拼成一个月。</span></div>';

  // 概览四宫格
  var ton = rep.tonnage > 0 ? (rep.tonnage >= 10000 ? (rep.tonnage / 1000).toFixed(1) + ' 吨' : Math.round(rep.tonnage) + ' kg') : '—';
  var prevTon = (prev && prev.tonnage > 0) ? prev.tonnage : 0;
  var dDays = (prev && prev.days > 0) ? (rep.days - prev.days) : null;
  var cards = [
    { label: '训练天数', val: rep.days + ' 天', delta: (dDays === null ? '' : (dDays >= 0 ? '+' : '') + dDays) },
    { label: '总组数', val: rep.totalSets > 0 ? rep.totalSets + ' 组' : '—', delta: '' },
    { label: '总容量', val: ton, delta: (prevTon > 0 ? (rep.tonnage >= prevTon ? '+' : '') + Math.round((rep.tonnage - prevTon) / prevTon * 100) + '%' : '') },
    { label: '出勤率', val: (rep.adherence >= 0 ? Math.round(rep.adherence * 100) + '%' : '—'), delta: '' }
  ];
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;">' +
    cards.map(function (c) {
      return '<div style="background:var(--bg);border-radius:10px;padding:9px 4px;text-align:center;">' +
        '<div style="font-size:15px;font-weight:800;color:var(--text);">' + ptEsc(c.val) + '</div>' +
        '<div style="font-size:10px;color:var(--text3);margin-top:2px;">' + ptEsc(c.label) + '</div>' +
        (c.delta ? '<div style="font-size:10px;font-weight:700;color:' + (c.delta.indexOf('-') === 0 ? '#EF4444' : '#22C55E') + ';margin-top:1px;">' + ptEsc(c.delta) + '</div>' : '') +
        '</div>';
    }).join('') + '</div>';

  // 力量变化: 涨的列出前 3, 跌的单独列 ——
  // 只报好消息的话是安慰剂, 掉的那几个才是下个月要处理的。
  var ups = rep.lifts.filter(function (l) { return l.gain > 0; }).slice(0, 3);
  var downs = rep.lifts.filter(function (l) { return l.gain < 0; }).slice(0, 2);
  html += '<div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px;">💪 力量变化</div>';
  if (ups.length) {
    html += '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:6px;">' +
      ups.map(function (l) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">' +
          '<span style="font-size:12px;color:var(--text);font-weight:600;">' + ptEsc(l.name) + '</span>' +
          '<span style="font-size:12px;font-weight:700;color:#22C55E;">+' + l.gain.toFixed(1) + '%</span></div>';
      }).join('') + '</div>';
  } else {
    html += '<div style="font-size:12px;color:var(--text3);margin-bottom:6px;">这个月没有明显上涨的动作 —— 要么记录太少，要么该调计划了。</div>';
  }
  if (downs.length) {
    html += '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:6px;">' +
      downs.map(function (l) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">' +
          '<span style="font-size:12px;color:var(--text2);">' + ptEsc(l.name) + '</span>' +
          '<span style="font-size:12px;font-weight:700;color:#EF4444;">' + l.gain.toFixed(1) + '%</span></div>';
      }).join('') + '</div>';
  }

  // RPE 分布: 7-8 是甜蜜区, 占比过低(练太轻)或过高(练太狠)都值得说
  if (rep.rpe.n > 0) {
    var midPct = Math.round(rep.rpe.mid / rep.rpe.n * 100);
    var hiPct = Math.round(rep.rpe.high / rep.rpe.n * 100);
    html += '<div style="font-size:12px;font-weight:700;color:var(--text);margin:10px 0 6px;">🎚 RPE 分布</div>' +
      '<div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--border);">' +
      '<div style="width:' + (rep.rpe.low / rep.rpe.n * 100) + '%;background:#94A3B8;"></div>' +
      '<div style="width:' + (rep.rpe.mid / rep.rpe.n * 100) + '%;background:#22C55E;"></div>' +
      '<div style="width:' + (rep.rpe.high / rep.rpe.n * 100) + '%;background:#EF4444;"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:5px;font-size:10px;color:var(--text3);">' +
      '<span>≤6 轻松 ' + Math.round(rep.rpe.low / rep.rpe.n * 100) + '%</span>' +
      '<span style="color:#22C55E;font-weight:700;">7-8 甜蜜区 ' + midPct + '%</span>' +
      '<span style="color:#EF4444;">≥9 力竭 ' + hiPct + '%</span></div>';
    if (hiPct >= 40) {
      html += '<div style="font-size:12px;color:var(--text2);margin-top:6px;line-height:1.6;">' +
        '有 ' + hiPct + '% 的组冲到了 RPE 9 以上 —— 这个月练得太狠了，下个月把主力组压回 7-8。</div>';
    } else if (midPct < 30 && rep.rpe.n >= 6) {
      html += '<div style="font-size:12px;color:var(--text2);margin-top:6px;line-height:1.6;">' +
        '只有 ' + midPct + '% 的组落在 RPE 7-8。太轻了不长肉，太重了攒疲劳，中段才是有效组。</div>';
    }
  }

  // 缺席归因
  if (rep.missed > 0) {
    html += '<div style="margin-top:10px;padding:10px 12px;background:#F59E0B12;border-left:3px solid #F59E0B;border-radius:10px;">' +
      '<div style="font-size:12px;color:var(--text);line-height:1.65;">' +
      '计划里该练 <b>' + rep.planned + '</b> 天，缺了 <b>' + rep.missed + '</b> 天' +
      (rep.worstDow ? '，最常缺席的是 <b>' + ptEsc(rep.worstDow) + '</b>' : '') +
      (rep.worstDow ? '。<br>与其怪自己没坚持，不如把那天的训练换到你能去的时间 —— 改时间比改意志力容易得多。' : '。') +
      '</div></div>';
  }

  // 收尾一句: 复盘必须有结论, 否则就是一堆数字
  var closing = '';
  if (ups.length >= 2) {
    closing = '这个月有 ' + ups.length + ' 个动作在涨，方向是对的，下个月不用大改，继续加就行。';
  } else if (downs.length >= 1 && ups.length === 0) {
    closing = '这个月全是掉的。别再往上加重量了 —— 先去卡点诊断看看卡在哪一环。';
  } else if (rep.days <= 4) {
    closing = '这个月只练了 ' + rep.days + ' 天。先别谈计划，把出勤稳住就是最大的进步。';
  } else {
    closing = '数据和上个月差不多。稳住出勤，' + (ups.length ? '继续推 ' + ups[0].name : '把记录做全，下个月才有东西可看') + '。';
  }
  html += '<div style="margin-top:10px;padding:10px 12px;background:var(--bg);border-radius:10px;font-size:12px;color:var(--text);line-height:1.7;font-weight:600;">' +
    '📌 ' + ptEsc(closing) + '</div>';

  if (typeof collapsibleCard === 'function') {
    return collapsibleCard('pc-monthly', '<span>📅 月度复盘 · ' + ptEsc(rep.month + '月') + '</span>' + fbProBadgeHtml(), html, false);
  }
  return '<div class="progress-card"><div class="card-title">📅 月度复盘 · ' + ptEsc(rep.month + '月') + fbProBadgeHtml() + '</div>' + html + '</div>';
}

// ============ 7. 智能补课重排 ============

function checkMissedDays() {
  if (!lastPlan || !lastPlan.trainingDays) return null;
  var plan = JSON.parse(localStorage.getItem('fitbuddy_lastplan') || 'null');
  if (!plan || !plan.trainingDays || !plan.schedule) return null;

  var trainSchedule = plan.schedule.filter(function(s) { return s.isTraining; });
  var today = new Date();
  var dayOfWeek = today.getDay() || 7; // 1-7, 周一=1

  // 检查已过去的训练日是否有未完成的
  var missedDays = [];
  var completedDays = [];
  var upcomingDays = [];

  trainSchedule.forEach(function(s, idx) {
    var dayNum = 0;
    var match = s.day.match(/周(.)/);
    if (match) {
      dayNum = '一二三四五六日'.indexOf(match[1]) + 1;
    }
    if (!dayNum) return;

    var isPast = dayNum < dayOfWeek;
    var isToday = dayNum === dayOfWeek;
    var isFuture = dayNum > dayOfWeek;

    // 🎯 冷启动修复(2026-10-20): 计划生成之前的训练日不算"漏课"。
    // 旧逻辑只看"周几过了没有": 周五生成的计划、周二凌晨打开,
    // 会被提示"周一(0/N)未完成" —— 用户刚拿到计划 30 秒就背上一笔从未存在的欠账,
    // 首屏第一眼是黄色警告条, 直接劝退。
    var planAt = plan.date || 0;
    if (planAt && isPast) {
      var _missedDate = new Date(today);
      _missedDate.setDate(_missedDate.getDate() - (dayOfWeek - dayNum)); // 该训练日的具体日期
      _missedDate.setHours(23, 59, 59, 999);                            // 当天结束时刻
      if (_missedDate.getTime() < planAt) return;                       // 生成计划前就过完的日子: 不欠
    }

    // 检查是否完成 (用与 renderDayCard 一致的 dayId 格式)
    var dayData = plan.trainingDays[idx];
    if (!dayData) return;

    var dayId = 'day_' + idx;
    var exCount = dayData.exes ? dayData.exes.length : 0;
    var doneCount = 0;
    for (var i = 0; i < exCount; i++) {
      if (localStorage.getItem(doneKey(dayId + '_ex' + i)) === '1') doneCount++;
    }
    var isComplete = exCount > 0 && doneCount >= exCount;

    if (isPast && !isComplete) {
      missedDays.push({ dayIdx: idx, dayName: s.day, dayNameFull: dayData.name, exCount: exCount, doneCount: doneCount });
    } else if (isComplete) {
      completedDays.push({ dayIdx: idx, dayName: s.day });
    } else if (isFuture || isToday) {
      upcomingDays.push({ dayIdx: idx, dayName: s.day, isToday: isToday });
    }
  });

  if (!missedDays.length) return null;
  return { missed: missedDays, upcoming: upcomingDays, completed: completedDays };
}

function renderRescheduleBanner() {
  var missed = checkMissedDays();
  if (!missed) return '';

  var missText = missed.missed.map(function(m) {
    return m.dayName + '(' + m.doneCount + '/' + m.exCount + ')';
  }).join('、');

  var html = '<div style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:1px solid #F59E0B;border-radius:12px;padding:12px 14px;margin-bottom:14px;">' +
    '<div style="font-size:13px;font-weight:700;color:#92400E;display:flex;align-items:center;gap:6px;">📅 智能补课提醒</div>' +
    '<div style="font-size:12px;color:#78350F;margin-top:4px;line-height:1.6;">检测到 <b>' + missText + '</b> 未完成</div>' +
    '<div style="display:flex;gap:8px;margin-top:10px;">' +
      '<button onclick="RescheduleCtrl.compress()" style="flex:1;padding:8px;border-radius:10px;background:#F59E0B;color:#fff;border:none;font-size:12px;font-weight:600;cursor:pointer;">📦 压缩补课</button>' +
      '<button onclick="RescheduleCtrl.shift()" style="flex:1;padding:8px;border-radius:10px;background:var(--card);color:#92400E;border:1.5px solid #F59E0B;font-size:12px;font-weight:600;cursor:pointer;">⏩ 顺延到周末</button>' +
      '<button onclick="RescheduleCtrl.dismiss()" style="padding:8px 12px;border-radius:10px;background:var(--card);color:var(--text3);border:1px solid var(--border);font-size:12px;cursor:pointer;">忽略</button>' +
    '</div>' +
    '<div style="font-size:10px;color:#92400E;margin-top:6px;opacity:0.7;">压缩:剩余训练日动作合并 · 顺延:推到本周末/下周</div>' +
  '</div>';
  return html;
}

var RescheduleCtrl = {
  compress: function() {
    // 把未完成训练日的动作分配到剩余训练日
    var missed = checkMissedDays();
    if (!missed) { showToast('没有需要补课的训练日'); return; }

    // 将漏掉的动作合并到即将到来的训练日
    var plan = JSON.parse(localStorage.getItem('fitbuddy_lastplan') || 'null');
    if (!plan) return;

    var extraExes = [];
    missed.missed.forEach(function(m) {
      var day = plan.trainingDays[m.dayIdx];
      if (day && day.exes) {
        day.exes.forEach(function(ex, ei) {
          var dayId = 'day_' + m.dayIdx;
          if (localStorage.getItem(doneKey(dayId + '_ex' + ei)) !== '1') {
            extraExes.push(ex);
          }
        });
      }
    });

    if (!extraExes.length) { showToast('漏掉的动作已完成或不存在'); return; }

    // 将额外动作分配到 upcoming days
    if (missed.upcoming.length === 0) {
      // 没有即将到来的训练日,追加到第一个训练日
      if (plan.trainingDays.length > 0) {
        plan.trainingDays[0].exes = plan.trainingDays[0].exes.concat(extraExes);
      }
    } else {
      var perDay = Math.ceil(extraExes.length / missed.upcoming.length);
      var idx = 0;
      missed.upcoming.forEach(function(up) {
        for (var i = 0; i < perDay && idx < extraExes.length; i++) {
          plan.trainingDays[up.dayIdx].exes = (plan.trainingDays[up.dayIdx].exes || []).concat(extraExes[idx]);
          idx++;
        }
      });
      // 剩余的也追加到最后一个
      while (idx < extraExes.length) {
        var last = missed.upcoming[missed.upcoming.length - 1];
        plan.trainingDays[last.dayIdx].exes = (plan.trainingDays[last.dayIdx].exes || []).concat(extraExes[idx]);
        idx++;
      }
    }

    // 去重
    plan.trainingDays.forEach(function(day) {
      if (day.exes) day.exes = day.exes.filter(function(e, i, arr) {
        return arr.indexOf(e) === i;
      });
    });

    localStorage.setItem('fitbuddy_lastplan', JSON.stringify(plan));
    lastPlan = plan;
    _skipRebuild = true;
    showToast('已将 ' + extraExes.length + ' 个动作分配到剩余训练日');
    doGenerate();
  },

  shift: function() {
    // 标记漏掉的天数,在周末或下周补
    var missed = checkMissedDays();
    if (!missed) { showToast('没有需要补课的训练日'); return; }

    var shiftKey = 'fitbuddy_shift_w' + currentWeek;
    var shiftData = missed.missed.map(function(m) {
      return { dayIdx: m.dayIdx, dayName: m.dayName, exCount: m.exCount - m.doneCount };
    });
    localStorage.setItem(shiftKey, JSON.stringify(shiftData));
    showToast('已标记 ' + shiftData.length + ' 天需要补课,将在周末或下周自动追加');
  },

  dismiss: function() {
    var banner = document.getElementById('rescheduleBanner');
    if (banner) banner.style.display = 'none';
    localStorage.setItem('fitbuddy_reschedule_dismiss_w' + currentWeek, '1');
  }
};

// ============ 8. 部位疲劳监控 ============

function checkMuscleFatigue() {
  var hist = [];
  try { hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]'); } catch (e) { return null; }
  if (!hist || !hist.length) return null;

  // 构建动作名→部位映射
  var exMuscleMap = {};
  if (typeof EXES !== 'undefined') {
    EXES.forEach(function(ex) { exMuscleMap[ex.n] = ex.m; });
  }

  // 按日期分组,获取最近7天
  var today = new Date();
  var recentDays = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var dateStr = d.toISOString().slice(0, 10);
    var dayRecord = hist.find(function(h) { return h.date === dateStr; });
    if (dayRecord && dayRecord.exercises) {
      var muscles = {};
      dayRecord.exercises.forEach(function(exName) {
        var m = exMuscleMap[exName] || '';
        if (m && m !== '有氧' && m !== '康复') {
          muscles[m] = (muscles[m] || 0) + 1;
        }
      });
      Object.keys(muscles).forEach(function(m) {
        recentDays.push({ date: dateStr, muscle: m, count: muscles[m], dayOffset: i });
      });
    }
  }

  if (!recentDays.length) return null;

  // 检查连续天数同一肌群
  var muscleStreaks = {};
  recentDays.forEach(function(r) {
    if (!muscleStreaks[r.muscle]) muscleStreaks[r.muscle] = [];
    muscleStreaks[r.muscle].push(r);
  });

  var warnings = [];
  Object.keys(muscleStreaks).forEach(function(muscle) {
    var entries = muscleStreaks[muscle].sort(function(a, b) { return a.dayOffset - b.dayOffset; });
    // 检查是否连续3天或以上
    var streak = 1;
    var maxStreak = 1;
    for (var i = 1; i < entries.length; i++) {
      if (entries[i].dayOffset === entries[i - 1].dayOffset + 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }
    if (maxStreak >= 3) {
      warnings.push({ muscle: muscle, days: maxStreak });
    }
  });

  return warnings.length ? warnings : null;
}

function renderFatigueWarning() {
  var warnings = checkMuscleFatigue();
  if (!warnings) return '';

  var muscleLabels = { '腿': '腿部', '胸': '胸部', '背': '背部', '肩': '肩部', '臂': '手臂', '核心': '核心' };
  var muscleEmoji = { '腿': '🦵', '胸': '💪', '背': '🏋️', '肩': '🤚', '臂': '💪', '核心': '🧘' };

  var html = '<div id="fatigueWarning" style="background:linear-gradient(135deg,#FEE2E2,#FECACA);border:1px solid #EF4444;border-radius:12px;padding:12px 14px;margin-bottom:14px;">' +
    '<div style="font-size:13px;font-weight:700;color:#DC2626;display:flex;align-items:center;gap:6px;">⚠️ 部位疲劳警告</div>';

  var rows = 0;
  warnings.forEach(function(w) {
    // 兜底:兼容 {muscle,days}(本文件实现) 与 {muscle,count}(历史实现),
    // 拿不到合法天数就跳过这一条 —— 宁可不显示,也不能渲染出 undefined
    var d = (w && typeof w.days === 'number' && isFinite(w.days)) ? w.days
          : ((w && typeof w.count === 'number' && isFinite(w.count)) ? w.count : 0);
    if (d < 1) return;
    var label = muscleLabels[w.muscle] || w.muscle;
    var emoji = muscleEmoji[w.muscle] || '⚠️';
    rows++;
    html += '<div style="font-size:12px;color:#991B1B;margin-top:6px;">' + emoji + ' <b>' + label + '</b>已连续训练 ' + d + ' 天,建议今天换其他部位,让肌肉充分恢复(48-72h)</div>';
  });

  // 一条都没渲染出来时不返回空警告框
  if (!rows) return '';

  html += '</div>';
  return html;
}

// ============ 初始化 & 集成钩子 ============

// 暴露到全局
window.WarmupCalc = WarmupCalc;
window.PlateCalc = PlateCalc;
window.DeloadCtrl = DeloadCtrl;
window.RescheduleCtrl = RescheduleCtrl;
// ⚠️ HTML 里写的内联事件属性是在全局作用域求值的, 本文件整体包在 IIFE 里,
// 内部 var 出来的对象全局拿不到 —— 不导出的话点击会抛 ReferenceError 且毫无反馈(看着像卡死)。
// 新增任何被内联事件引用的 Ctrl / 函数, 都必须在这里补一行 window 导出, 否则等于没做。
// (减载决策和 16 周周期化这两个 Ctrl 就是这么哑过一整版, 按钮点了完全没反应)
window.DeloadDecisionCtrl = DeloadDecisionCtrl;
window.PeriodCtrl = PeriodCtrl;
window.calcWarmupSets = calcWarmupSets;
window.calcPlates = calcPlates;
window.getRPEAdjustment = getRPEAdjustment;
window.renderRPEAdjustmentBadge = renderRPEAdjustmentBadge;
window.isDeloadWeekActive = isDeloadWeekActive;
window.getDeloadSettings = getDeloadSettings;
window.renderDeloadToggle = renderDeloadToggle;
// 老的「周期化日历视图」(canvas 版) 已删: 它只画 4 周、强度写死不能改,
// 现在由 P1 的「16周周期化 · 可编辑」完全取代。两张周期卡并存只会让用户不知道该信哪张。
window.renderRescheduleBanner = renderRescheduleBanner;
window.checkMissedDays = checkMissedDays;
window.renderFatigueWarning = renderFatigueWarning;
window.checkMuscleFatigue = checkMuscleFatigue;

// 渲染热身组+杠铃片计算器到动作库页顶部的「训练计算器」区块
// 幂等:已渲染过的面板不重复覆盖,避免用户已输入的数值被清空
window.renderProCalculators = function() {
  var w = document.getElementById('calcPanelWarmup');
  if (w && !w.dataset.rendered) { w.innerHTML = renderWarmupCalculator(); w.dataset.rendered = '1'; }
  var p = document.getElementById('calcPanelPlate');
  if (p && !p.dataset.rendered) { p.innerHTML = renderPlateCalculator(); p.dataset.rendered = '1'; }
  if (window.renderDietCalculator) window.renderDietCalculator();
};

// 🔗 进度页「今日能量收支」:摄入(饮食页草稿) vs 消耗(计划页口径)。
// 这两头以前各住在一个页面里, 减脂用户每天要回答的「我今天还差多少」只能自己心算。
// ⚠️ 数据源全部走别人家的唯一真源: 消耗用 fbTodayEnergy(内部复用 calcNutrition),
//    摄入用 dietTodayIntake(内部复用 FOODS 表)。这里一行公式都不写。
function renderTodayEnergyCard() {
  var e = null, eaten = null;
  try { if (typeof window.fbTodayEnergy === 'function') e = window.fbTodayEnergy(); } catch (err) {}
  try { if (typeof window.dietTodayIntake === 'function') eaten = window.dietTodayIntake(); } catch (err) {}
  if (!e && !eaten) return ''; // 两头都没数据 → 不占版面

  function cell(val, label, color) {
    return '<div style="flex:1;padding:10px 8px;border-radius:10px;background:var(--bg);text-align:center;">' +
      '<div style="font-size:19px;font-weight:800;color:' + (color || 'var(--primary)') + ';letter-spacing:-.3px;">' + val + '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:2px;">' + label + '</div></div>';
  }

  var html = '<div class="progress-card"><div class="card-title">⚖️ 今日能量收支</div>';
  html += '<div style="font-size:11.5px;color:var(--text3);margin-bottom:10px;">' +
    (e ? (e.isTraining ? '今天训练日 · 消耗含运动' : '今天休息日') : '还没填身高体重年龄，算不出消耗') + '</div>';

  html += '<div style="display:flex;gap:8px;">' +
    cell(eaten ? eaten.kcal : '—', eaten ? 'kcal 已吃' : '今天还没记', eaten ? 'var(--primary)' : 'var(--text3)') +
    cell(e ? e.target : '—', 'kcal 今日目标', 'var(--text2)') +
    '</div>';

  if (eaten && e) {
    var diff = eaten.kcal - e.target;
    var dc = diff < 0 ? '#22C55E' : '#EF4444';
    html += '<div style="margin-top:9px;font-size:13px;font-weight:700;color:' + dc + ';text-align:center;">' +
      (diff < 0 ? '还能吃 ' + (-diff) + ' kcal' : '已超出 ' + diff + ' kcal') + '</div>';
    // 蛋白是最容易缺的一项, 单列一条进度
    var pp = Math.min(100, Math.round(eaten.p / Math.max(1, e.protein) * 100));
    html += '<div style="margin-top:10px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text2);margin-bottom:4px;">' +
      '<span>蛋白</span><span>' + eaten.p + ' / ' + e.protein + ' g</span></div>' +
      '<div style="height:6px;border-radius:3px;background:var(--bg);overflow:hidden;">' +
      '<div style="height:100%;width:' + pp + '%;border-radius:3px;background:' + (pp >= 100 ? '#22C55E' : 'var(--primary)') + ';"></div></div></div>';
  }

  if (e) {
    html += '<div style="margin-top:9px;font-size:11.5px;color:var(--text3);text-align:center;">今日消耗 ≈ ' +
      e.total + ' kcal（日常 ' + e.tdee + ' + 运动 ' + e.burn + '）</div>';
  }
  html += '<button onclick="goDietCalc()" style="margin-top:10px;width:100%;padding:9px;border:none;border-radius:9px;background:var(--primary);color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;">' +
    (eaten ? '改一下今天吃了什么' : '记一下今天吃了什么') + '</button>';
  html += '</div>';
  return html;
}

// 进度页增强:在原有内容后追加Pro模块
var _originalRenderProgress = null;
window.initProToolsProgress = function() {
  if (typeof window.renderProgress === 'function' && !_originalRenderProgress) {
    _originalRenderProgress = window.renderProgress;
    window.renderProgress = function() {
      _originalRenderProgress();
      try {
        var progContent = document.getElementById('progContent');
        if (!progContent) return;

        // 🎯 RPE自调节建议汇总
        // ⚠️ 这张卡原先排在 Pro 区块最后一位(y≈2400,手机要滑 2.6 屏),等于白写。
        //    提到第一位,理由有两条:
        //    1) 它是下面那 3 张趋势图卡(每张 296px,共 888px)的紧凑版 ——
        //       同样的"下次用多重"信息,213px 就装完,而趋势图得展开看。
        //       先给结论(一屏读完三个动作),想看趋势再往下翻,顺序才对。
        //    2) 它是进度页里唯一一条"打开就能执行"的指令(下次卧推用 57.5kg),
        //       而 PR 卡/日历/趋势线都是回顾类 —— 行动指令不该排在回顾后面。
        var rpeSummaryHtml = '';
        if (trainingLog) {
          var rpeAdjustments = Object.keys(trainingLog).filter(function(k) {
            return getRPEAdjustment(k);
          });
          if (rpeAdjustments.length) {
            rpeSummaryHtml = '<div class="progress-card"><div class="card-title">🎯 RPE自调节建议 <span class="rpe-help" onclick="fbShowRpeGuide()" title="RPE 怎么打分？">?</span></div>' +
              '<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">基于最近3次训练的RPE评分,自动建议下周调整</div>';
            rpeAdjustments.forEach(function(exName) {
              var adj = getRPEAdjustment(exName);
              var color = adj.action === 'increase' ? '#22C55E' : adj.action === 'decrease' ? '#EF4444' : '#3B82F6';
              rpeSummaryHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">' +
                '<span style="font-size:13px;font-weight:600;">' + exName + '</span>' +
                '<span style="font-size:12px;font-weight:700;color:' + color + ';">' + adj.text + ' (RPE ' + adj.rpe + ')</span>' +
              '</div>';
            });
            rpeSummaryHtml += '</div>';
          }
        }

        // 追加Pro模块HTML
        var proHtml = '<div id="proToolsSection">';

        // 🎯 行动指令优先:先看"下次练多重",再看成就和趋势
        proHtml += rpeSummaryHtml;

        // ⚖️ 今日能量收支:跟上一条同级——它也是"今天就能执行"的指令
        //    (还能吃 680 / 已超 120),而下面那些是本周/本月的规划与回顾。
        proHtml += renderTodayEnergyCard();

        // 🔄 减载决策(P3): 紧跟 RPE。这两张是"本周就能执行"的,
        //    下面那些是"这几个月才能见效"的。先解决这周, 再看长期。
        proHtml += renderDeloadDecision();

        // ⚖️ 部位平衡(P2): 结构性问题, 改起来要按周算, 排在即时指令之后
        proHtml += renderMuscleBalance();

        // 📈 周期化(P1): 最长期的一张, 管未来 N 周。
        //    它取代了老的「周期化日历视图」卡 —— 那张只画 4 周、强度写死不能改,
        //    两张周期卡并存只会让用户不知道该信哪个。
        //    跑步/有氧 renderPeriodEditor() 自己会返回空串(那两类计划改强度没用)。
        proHtml += renderPeriodEditor();

        // 📅 月度复盘(P4): 回顾类, 放在所有"该做什么"之后。
        //    人是先想知道接下来怎么办, 再回头看上个月发生了什么。
        proHtml += renderMonthlyReview();

        // 🏆 个人纪录
        proHtml += renderPRCards();

        // 📤 力量档案导出 —— Keep 结构性地不会做:数据锁定就是它的护城河,
        // 让用户把训练数据打包成一张图带走,等于帮用户往外迁移。
        // HTML 与计划页顶部那条共用 fbStrengthCardEntryHtml('card'/'bar'),
        // 不在这里单独写一份,否则改样式要改两处。
        if (typeof fbStrengthCardEntryHtml === 'function') {
          proHtml += fbStrengthCardEntryHtml('card');
        }

        proHtml += '</div>';
        // ⚠️ 这里原本是 insertAdjacentHTML('beforeend') = 挂在进度页最末尾,
        // 用户要滑过 9 张卡(热力图/本周进度/频次/热量/部位/超负荷/跑鞋/记录/统计)才能看到
        // PR卡/周期化日历/超负荷趋势线/RPE自调节这批真正有差异化的能力 —— 等于白写。
        // 改为插到「训练频次趋势」之前,即紧跟"本周进度"之后,进度页的黄金位置。
        // 注意:collapsibleCard 只把 id 给了 -icon / -body,外层卡片本身没有 id,
        // 必须按 data-pc-id 选;用 getElementById('pc-volume-trend') 会拿到 null 从而静默退回页尾。
        var anchor = progContent.querySelector('[data-pc-id="pc-volume-trend"]')
          || progContent.querySelector('[data-pc-id="pc-muscle-dist"]');
        if (anchor) anchor.insertAdjacentHTML('beforebegin', proHtml);
        else progContent.insertAdjacentHTML('beforeend', proHtml);
      } catch(e) {
        console.warn('Pro Tools 进度页增强失败(不影响主功能):', e);
      }
    };
  }
};

// 计划页增强:在渲染后追加Pro模块
var _originalDoGenerateInternal = null;
window.initProToolsPlan = function() {
  if (typeof window.doGenerateInternal === 'function' && !_originalDoGenerateInternal) {
    _originalDoGenerateInternal = window.doGenerateInternal;
    window.doGenerateInternal = function(goal, level, days, equip, trainingDays, schedule, cfg, goalCfg) {
      // 减载周自动降量:减少组数
      var isDeload = isDeloadWeekActive(currentWeek, currentCycle);
      // ⚠️ 组数只在这里算一次, 和进度页周期卡共用 fbPeriodSetsFrom ——
      // 以前两处各算一套, 新手(3 组)在周期卡上看到 4 组、减载周看到 3 组而计划页是 2 组。
      // 减载降幅读唯一真源(reduction, 默认 40%): 这里曾被 *0.5 / *0.4 两层衰减打成实际
      // 只降 25%, 4 组的动作设 40% 和设 60% 都得到 3 组 —— 用户以为在调强度, 实际在调空气。
      // 设计了一个拧不动的阀门, 比压根没有这个阀门更伤信任。
      var weekSets = cfg.sets;
      try {
        weekSets = (typeof fbPeriodSetsFrom === 'function')
          ? fbPeriodSetsFrom(cfg.sets, currentWeek, isDeload)
          : cfg.sets;
      } catch (e) { weekSets = cfg.sets; }
      // 没改过强度、也不是减载周 → 原样传下去, 绝不悄悄改计划
      var effectiveCfg = (weekSets !== cfg.sets) ? Object.assign({}, cfg, { sets: weekSets }) : cfg;

      _originalDoGenerateInternal(goal, level, days, equip, trainingDays, schedule, effectiveCfg, goalCfg);
      // 在计划渲染后追加Pro模块(try-catch保护,不影响主功能)
      try {
        var planResult = document.getElementById('planResult');
        if (!planResult) return;

        var proHtml = '';

        // 减载周开关
        proHtml += renderDeloadToggle();

        // 部位疲劳监控
        proHtml += renderFatigueWarning();

        // 智能补课重排
        if (!localStorage.getItem('fitbuddy_reschedule_dismiss_w' + currentWeek)) {
          var missed = checkMissedDays();
          if (missed) {
            proHtml += '<div id="rescheduleBanner">' + renderRescheduleBanner() + '</div>';
          }
        }

        // 插入到计划结果的开头(在weekBar之前)
        if (proHtml) {
          var proDiv = document.createElement('div');
          proDiv.id = 'proPlanModules';
          proDiv.innerHTML = proHtml;
          planResult.insertBefore(proDiv, planResult.firstChild);
        }

        // 给每个力量动作ex-row追加RPE自调节建议
        if (typeof trainingLog !== 'undefined' && trainingLog) {
          Object.keys(trainingLog).forEach(function(exName) {
            try {
              var adj = getRPEAdjustment(exName);
              if (adj) {
                var nameEls = document.querySelectorAll('.ex-name');
                nameEls.forEach(function(el) {
                  if (el.textContent && el.textContent.indexOf(exName) >= 0 && !el.querySelector('.rpe-adj-badge')) {
                    var badge = document.createElement('span');
                    badge.className = 'rpe-adj-badge';
                    badge.innerHTML = renderRPEAdjustmentBadge(exName);
                    el.appendChild(badge);
                  }
                });
              }
            } catch(e2) {}
          });
        }
      } catch(e) {
        console.warn('Pro Tools 计划页增强失败(不影响主功能):', e);
      }
    };
  }
};

// 自动初始化 (defer脚本在DOM解析完成后执行,可以直接初始化)
window.initProToolsProgress();
window.initProToolsPlan();
window.renderProCalculators();

// 监听Tab切换,重新渲染计算器
var _originalSwitchTab = window.switchTab;
if (typeof _originalSwitchTab === 'function') {
  window.switchTab = function(btn) {
    _originalSwitchTab(btn);
    if (btn && btn.getAttribute && btn.getAttribute('data-tab') === 'page-lib') {
      setTimeout(window.renderProCalculators, 50);
    }
  };
}

})();

// ============ FitBuddy Pro Tools v2.0 ============
// 8项进阶功能模块
// 依赖: data-constants.js, planner-core.js (必须先加载)
// 功能清单:
//   1. 热身组计算器        - 输入目标重量→自动生成渐进热身方案
//   2. 杠铃片计算器        - 输入总重量→显示每侧杠铃片配比
//   3. RPE自调节系统       - 根据RPE评分自动建议下周±重量/组数
//   4. 减载周自动化        - 每4周自动降量40%,可开关
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
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg);border-radius:8px;margin-bottom:6px;">' +
        '<div><span style="font-weight:700;font-size:14px;color:var(--primary);">' + s.weight + 'kg</span>' +
        '<span style="font-size:11px;color:var(--text3);margin-left:8px;">× ' + s.reps + '次</span></div>' +
        '<div style="text-align:right;"><span style="font-size:12px;font-weight:600;color:var(--blue);">' + s.pct + '%</span>' +
        '<span style="font-size:11px;color:var(--text3);margin-left:6px;">' + s.label + '</span></div>' +
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

function getAvgRPE(exName) {
  if (!trainingLog || !trainingLog[exName] || !trainingLog[exName].length) return null;
  var entries = trainingLog[exName].slice(-3); // 最近3次
  var rpes = entries.filter(function(e){ return e && e.rpe > 0; });
  if (!rpes.length) return null;
  var sum = rpes.reduce(function(a, e) { return a + e.rpe; }, 0);
  return Math.round(sum / rpes.length * 10) / 10;
}

function getRPEAdjustment(exName) {
  if (!trainingLog || !trainingLog[exName]) return null;
  var avgRPE = getAvgRPE(exName);
  if (!avgRPE) return null;

  var last = trainingLog[exName][trainingLog[exName].length - 1];
  if (!last || !last.weight) return null;

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
  var settings = getDeloadSettings();
  if (!settings.enabled) return false;
  var interval = settings.interval || 4;
  // 第4周(或每interval周)为减载周
  return ((weekNum - 1) % interval) === (interval - 1);
}

function getDeloadReduction() {
  var settings = getDeloadSettings();
  return (settings.reduction || 40) / 100;
}

function applyDeloadToSets(sets, goal) {
  var reduction = getDeloadReduction();
  if (goal === 'marathon' || goal === 'cardio') {
    // 跑步减载:降距离不降天数
    return Math.max(1, Math.round(sets * (1 - reduction * 0.6)));
  }
  return Math.max(1, Math.round(sets * (1 - reduction)));
}

function renderDeloadToggle() {
  var settings = getDeloadSettings();
  var isDeload = isDeloadWeekActive(currentWeek, currentCycle);
  var html = '<div style="background:var(--bg);border-radius:12px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">' +
    '<div><div style="font-size:13px;font-weight:700;color:var(--text);">🔄 减载周自动化</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-top:2px;">每' + (settings.interval || 4) + '周自动降量' + (settings.reduction || 40) + '%</div></div>' +
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

// ============ 5. 渐进超负荷趋势线 ============

function drawProgressionChart(canvasId, exName, log) {
  var canvas = document.getElementById(canvasId);
  if (!canvas || !log || log.length < 2) return;

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  var W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);

  var pad = { top: 20, right: 20, bottom: 40, left: 50 };
  var cw = W - pad.left - pad.right;
  var ch = H - pad.top - pad.bottom;

  // 背景
  var cardColor = getComputedStyle(document.body).getPropertyValue('--card').trim() || '#fff';
  ctx.fillStyle = cardColor;
  ctx.fillRect(0, 0, W, H);

  // 计算训练量 (weight × reps) 和 重量两条线
  var volData = log.map(function(e) { return { v: (e.weight || 0) * (e.reps || 0), label: e.date.slice(5) }; });
  var weightData = log.map(function(e) { return { v: e.weight || 0, label: e.date.slice(5) }; });

  var maxVol = Math.max.apply(null, volData.map(function(d) { return d.v; }).concat([1]));
  var maxWeight = Math.max.apply(null, weightData.map(function(d) { return d.v; }).concat([1]));
  maxVol = Math.ceil(maxVol * 1.15);
  maxWeight = Math.ceil(maxWeight * 1.15);

  // 网格
  var borderColor = getComputedStyle(document.body).getPropertyValue('--border').trim() || '#EBEBEB';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  var ySteps = 4;
  for (var i = 0; i <= ySteps; i++) {
    var y = pad.top + (ch / ySteps) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
  }

  // Y轴标签 (训练量)
  var text3Color = getComputedStyle(document.body).getPropertyValue('--text3').trim() || '#999';
  ctx.fillStyle = text3Color;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  for (var i = 0; i <= ySteps; i++) {
    var val = Math.round(maxVol - (maxVol / ySteps) * i);
    var y = pad.top + (ch / ySteps) * i;
    ctx.fillText(val, pad.left - 6, y + 3);
  }

  // X轴标签
  ctx.textAlign = 'center';
  var maxLabels = Math.min(volData.length, Math.floor(cw / 50));
  var step = Math.max(1, Math.ceil(volData.length / maxLabels));
  for (var i = 0; i < volData.length; i += step) {
    var x = pad.left + (cw / (volData.length - 1 || 1)) * i;
    ctx.fillText(volData[i].label, x, H - pad.bottom + 16);
  }

  // 训练量柱状图
  var barW = Math.min(20, cw / volData.length * 0.6);
  volData.forEach(function(d, i) {
    var x = pad.left + (cw / (volData.length - 1 || 1)) * i - barW / 2;
    var barH = (d.v / maxVol * ch);
    var y = pad.top + ch - barH;
    ctx.fillStyle = '#FF6B35';
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x, y, barW, barH);
    ctx.globalAlpha = 1;
  });

  // 重量折线
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  weightData.forEach(function(d, i) {
    var x = pad.left + (cw / (weightData.length - 1 || 1)) * i;
    var y = pad.top + ch - (d.v / maxWeight * ch);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 重量数据点
  ctx.fillStyle = '#3B82F6';
  weightData.forEach(function(d, i) {
    var x = pad.left + (cw / (weightData.length - 1 || 1)) * i;
    var y = pad.top + ch - (d.v / maxWeight * ch);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 图例
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FF6B35';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(pad.left, 4, 10, 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = text3Color;
  ctx.fillText('训练量(kg×次)', pad.left + 14, 12);
  ctx.fillStyle = '#3B82F6';
  ctx.beginPath();
  ctx.arc(pad.left + 100, 9, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = text3Color;
  ctx.fillText('重量(kg)', pad.left + 110, 12);
}

function renderProgressionCharts() {
  if (!trainingLog) return '';
  var exNames = Object.keys(trainingLog).filter(function(k) {
    if (typeof BODYWEIGHT_EX_NAMES !== 'undefined' && BODYWEIGHT_EX_NAMES && BODYWEIGHT_EX_NAMES.has) {
      try { if (BODYWEIGHT_EX_NAMES.has(k)) return false; } catch(e) {}
    }
    return trainingLog[k] && trainingLog[k].length >= 2;
  });
  if (!exNames.length) return '';

  var html = '';
  exNames.slice(0, 6).forEach(function(exName, idx) {
    var log = trainingLog[exName];
    if (!log || log.length < 2) return;
    var first = log[0];
    var last = log[log.length - 1];
    if (!first || !last) return;
    var firstVol = (first.weight || 0) * (first.reps || 0);
    var lastVol = (last.weight || 0) * (last.reps || 0);
    var growth = firstVol > 0 ? Math.round((lastVol / firstVol - 1) * 100) : 0;
    var growthColor = growth > 0 ? '#22C55E' : (growth < 0 ? '#EF4444' : '#999');

    // RPE自调节建议
    var adjHtml = renderRPEAdjustmentBadge(exName);

    html += '<div class="progress-card">' +
      '<div class="card-title">📈 ' + exName + ' 趋势' + adjHtml + '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:8px;">' +
        '<span>起点: ' + (first.weight || 0) + 'kg×' + (first.reps || 0) + '</span>' +
        '<span>当前: ' + (last.weight || 0) + 'kg×' + (last.reps || 0) + '</span>' +
        '<span style="font-weight:700;color:' + growthColor + ';">' + (growth > 0 ? '+' : '') + growth + '%</span>' +
      '</div>' +
      '<div class="chart-wrap"><canvas id="chartProg' + idx + '" style="width:100%;height:180px;"></canvas></div>' +
    '</div>';
  });

  // 延迟绘制图表
  setTimeout(function() {
    exNames.slice(0, 6).forEach(function(exName, idx) {
      drawProgressionChart('chartProg' + idx, exName, trainingLog[exName]);
    });
  }, 50);

  return html;
}

// ============ 5.5 🏆 个人纪录(PR)卡片 ============
function renderPRCards() {
  if (typeof buildPRsFromLog !== 'function') return '';
  var prs = buildPRsFromLog();
  var keys = Object.keys(prs).filter(function(k){ return prs[k] && prs[k].e1rm > 0; });
  if (!keys.length) return '';
  keys.sort(function(a, b){ return prs[b].e1rm - prs[a].e1rm; });
  var html = '<div class="progress-card"><div class="card-title" style="justify-content:space-between;">' +
    '<span>🏆 个人纪录 <span style="font-size:10px;color:var(--text3);font-weight:400;">按估算1RM(Epley)</span></span>' +
    '<button class="export-btn" style="font-size:11px;padding:4px 10px;border:none;background:var(--primary-light);color:var(--primary);" onclick="generateShareImage()">📸 分享图</button></div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:6px;">在训练动作卡「渐进超负荷」中记录重量/次数，自动统计历史最佳</div>';
  keys.slice(0, 8).forEach(function(exName) {
    var p = prs[exName];
    html += '<div class="pr-row">' +
      '<div style="min-width:0;">' +
        '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + exName + '</div>' +
        '<div style="font-size:10px;color:var(--text3);margin-top:2px;">' + (p.weight || 0) + 'kg × ' + (p.reps || 0) + ' 次' + (p.date ? ' · ' + p.date : '') + '</div>' +
      '</div>' +
      '<span class="pr-badge">🏋️ ' + p.e1rm + 'kg</span>' +
    '</div>';
  });
  html += '</div>';
  return html;
}

// ============ 6. 周期化日历视图 ============

function drawPeriodizationCalendar(canvasId, plan) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  var goal = plan ? plan.goal : 'muscle';
  var totalWeeks = goal === 'marathon' ? 16 : (typeof getCycleLength === 'function' ? getCycleLength() : 4);
  var isMarathon = goal === 'marathon';

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  var W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);

  var cardColor = getComputedStyle(document.body).getPropertyValue('--card').trim() || '#fff';
  ctx.fillStyle = cardColor;
  ctx.fillRect(0, 0, W, H);

  var pad = { top: 30, right: 16, bottom: 30, left: 16 };
  var cw = W - pad.left - pad.right;
  var ch = H - pad.top - pad.bottom;

  // 强度模式:4周一周期,1-3周递增,第4周减载
  function getIntensity(week) {
    if (isMarathon) {
      var phase = week <= 4 ? 'base' : week <= 8 ? 'build' : week <= 12 ? 'peak' : 'taper';
      if (phase === 'taper') {
        var taperWeek = ((week - 1) % 4) + 1;
        return [0.4, 0.35, 0.3, 0.25][taperWeek - 1] || 0.3;
      }
      var cycleWeek = ((week - 1) % 4) + 1;
      var base = 0.4 + (week - 1) * 0.04;
      if (cycleWeek === 4) return base * 0.65; // 减载
      return Math.min(0.95, base);
    } else {
      // 自定义周期:第1周适应,中间逐周递增,最后一周减载
      var cwLen = Math.max(totalWeeks, 2);
      var cycleWeek2 = ((week - 1) % cwLen) + 1;
      if (cycleWeek2 === cwLen) return 0.5; // 减载周
      if (cycleWeek2 === 1) return 0.63;
      return Math.min(0.95, 0.63 + (cycleWeek2 - 1) * 0.11);
    }
  }

  // 绘制波浪图
  var weekW = cw / totalWeeks;
  var maxH = ch * 0.85;

  // 背景波浪填充
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + ch);
  for (var w = 0; w < totalWeeks; w++) {
    var intensity = getIntensity(w + 1);
    var x = pad.left + weekW * (w + 0.5);
    var y = pad.top + ch - intensity * maxH;
    if (w === 0) {
      ctx.lineTo(x, y);
    } else {
      // 平滑曲线
      var prevIntensity = getIntensity(w);
      var prevX = pad.left + weekW * (w - 0.5);
      var prevY = pad.top + ch - prevIntensity * maxH;
      var cpX1 = prevX + weekW * 0.3;
      var cpY1 = prevY;
      var cpX2 = x - weekW * 0.3;
      var cpY2 = y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
    }
  }
  ctx.lineTo(pad.left + cw, pad.top + ch);
  ctx.closePath();

  // 渐变填充
  var grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  grad.addColorStop(0, 'rgba(255,107,53,0.35)');
  grad.addColorStop(1, 'rgba(255,107,53,0.02)');
  ctx.fillStyle = grad;
  ctx.fill();

  // 波浪线
  ctx.beginPath();
  for (var w = 0; w < totalWeeks; w++) {
    var intensity = getIntensity(w + 1);
    var x = pad.left + weekW * (w + 0.5);
    var y = pad.top + ch - intensity * maxH;
    if (w === 0) {
      ctx.moveTo(x, y);
    } else {
      var prevIntensity = getIntensity(w);
      var prevX = pad.left + weekW * (w - 0.5);
      var prevY = pad.top + ch - prevIntensity * maxH;
      var cpX1 = prevX + weekW * 0.3;
      var cpY1 = prevY;
      var cpX2 = x - weekW * 0.3;
      var cpY2 = y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
    }
  }
  ctx.strokeStyle = '#FF6B35';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 周节点
  var text3Color = getComputedStyle(document.body).getPropertyValue('--text3').trim() || '#999';
  var textColor = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#1A1A2E';
  for (var w = 0; w < totalWeeks; w++) {
    var intensity = getIntensity(w + 1);
    var x = pad.left + weekW * (w + 0.5);
    var y = pad.top + ch - intensity * maxH;
    var isDeload = ((w + 1) % 4) === 0 || (isMarathon && w >= 12);
    var isActive = (w + 1) === currentWeek;

    ctx.beginPath();
    ctx.arc(x, y, isActive ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isDeload ? '#8B5CF6' : (isActive ? '#FF3E7F' : '#FF6B35');
    ctx.fill();
    if (isActive) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF3E7F';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 周标签
    ctx.fillStyle = isActive ? '#FF3E7F' : text3Color;
    ctx.font = isActive ? 'bold 10px sans-serif' : '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('W' + (w + 1), x, pad.top + ch + 14);
  }

  // 马拉松阶段分隔线
  if (isMarathon) {
    var phases = MARATHON_PHASES;
    phases.forEach(function(phase, pi) {
      if (pi === 0) return;
      var startX = pad.left + (phase.weeks[0] - 1) * weekW;
      ctx.strokeStyle = phase.color + '60';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(startX, pad.top);
      ctx.lineTo(startX, pad.top + ch);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 阶段标签
    phases.forEach(function(phase) {
      var midWeek = (phase.weeks[0] + phase.weeks[phase.weeks.length - 1]) / 2;
      var x = pad.left + (midWeek - 0.5) * weekW;
      ctx.fillStyle = phase.color;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(phase.name, x, 16);
    });
  }

  // 图例
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FF6B35';
  ctx.beginPath();
  ctx.arc(pad.left + 6, H - 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = text3Color;
  ctx.fillText('正常强度', pad.left + 12, H - 5);

  ctx.fillStyle = '#8B5CF6';
  ctx.beginPath();
  ctx.arc(pad.left + 76, H - 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = text3Color;
  ctx.fillText('减载周', pad.left + 82, H - 5);

  ctx.fillStyle = '#FF3E7F';
  ctx.beginPath();
  ctx.arc(pad.left + 130, H - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = text3Color;
  ctx.fillText('当前周', pad.left + 136, H - 5);
}

function renderPeriodizationCalendar() {
  var plan = JSON.parse(localStorage.getItem('fitbuddy_lastplan') || 'null');
  if (!plan) return '';
  var isMarathon = plan.goal === 'marathon';
  var totalWeeks = isMarathon ? 16 : 4;
  var height = isMarathon ? 180 : 160;

  var html = '<div class="progress-card">' +
    '<div class="card-title">📅 周期化日历视图</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">' + (isMarathon ? '16周完整周期' : '4周微周期') + ' · 强度起伏+减载周一目了然</div>' +
    '<div class="chart-wrap"><canvas id="calendarCanvas" style="width:100%;height:' + height + 'px;"></canvas></div>' +
  '</div>';

  setTimeout(function() {
    drawPeriodizationCalendar('calendarCanvas', plan);
  }, 50);

  return html;
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
  var hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]');
  if (!hist.length) return null;

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

  warnings.forEach(function(w) {
    var label = muscleLabels[w.muscle] || w.muscle;
    var emoji = muscleEmoji[w.muscle] || '⚠️';
    html += '<div style="font-size:12px;color:#991B1B;margin-top:6px;">' + emoji + ' <b>' + label + '</b>已连续训练 ' + w.days + ' 天,建议今天换其他部位,让肌肉充分恢复(48-72h)</div>';
  });

  html += '</div>';
  return html;
}

// ============ 初始化 & 集成钩子 ============

// 暴露到全局
window.WarmupCalc = WarmupCalc;
window.PlateCalc = PlateCalc;
window.DeloadCtrl = DeloadCtrl;
window.RescheduleCtrl = RescheduleCtrl;
window.calcWarmupSets = calcWarmupSets;
window.calcPlates = calcPlates;
window.getRPEAdjustment = getRPEAdjustment;
window.renderRPEAdjustmentBadge = renderRPEAdjustmentBadge;
window.isDeloadWeekActive = isDeloadWeekActive;
window.applyDeloadToSets = applyDeloadToSets;
window.getDeloadSettings = getDeloadSettings;
window.renderDeloadToggle = renderDeloadToggle;
window.renderProgressionCharts = renderProgressionCharts;
window.drawProgressionChart = drawProgressionChart;
window.renderPeriodizationCalendar = renderPeriodizationCalendar;
window.drawPeriodizationCalendar = drawPeriodizationCalendar;
window.renderRescheduleBanner = renderRescheduleBanner;
window.checkMissedDays = checkMissedDays;
window.renderFatigueWarning = renderFatigueWarning;
window.checkMuscleFatigue = checkMuscleFatigue;

// 渲染热身组+杠铃片计算器到动作库页面
window.renderProCalculators = function() {
  var container = document.getElementById('proCalcContainer');
  if (container) {
    container.innerHTML = renderWarmupCalculator() + renderPlateCalculator();
  }
};

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

        // 追加Pro模块HTML
        var proHtml = '<div id="proToolsSection">';

        // 🏆 个人纪录
        proHtml += renderPRCards();

        // 周期化日历视图
        proHtml += renderPeriodizationCalendar();

        // 渐进超负荷趋势线
        proHtml += renderProgressionCharts();

        // RPE自调节建议汇总
        if (trainingLog) {
          var rpeAdjustments = Object.keys(trainingLog).filter(function(k) {
            return getRPEAdjustment(k);
          });
          if (rpeAdjustments.length) {
            proHtml += '<div class="progress-card"><div class="card-title">🎯 RPE自调节建议</div>' +
              '<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">基于最近3次训练的RPE评分,自动建议下周调整</div>';
            rpeAdjustments.forEach(function(exName) {
              var adj = getRPEAdjustment(exName);
              var color = adj.action === 'increase' ? '#22C55E' : adj.action === 'decrease' ? '#EF4444' : '#3B82F6';
              proHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">' +
                '<span style="font-size:13px;font-weight:600;">' + exName + '</span>' +
                '<span style="font-size:12px;font-weight:700;color:' + color + ';">' + adj.text + ' (RPE ' + adj.rpe + ')</span>' +
              '</div>';
            });
            proHtml += '</div>';
          }
        }

        proHtml += '</div>';
        progContent.insertAdjacentHTML('beforeend', proHtml);
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
      var effectiveCfg = cfg;
      if (isDeload) {
        var reduction = getDeloadReduction();
        effectiveCfg = Object.assign({}, cfg, {
          sets: Math.max(2, Math.round(cfg.sets * (1 - reduction * 0.5)))
        });
        // 力量目标降更多
        if (goal === 'strength' || goal === 'muscle') {
          effectiveCfg.sets = Math.max(2, Math.round(cfg.sets * (1 - reduction * 0.4)));
        }
      }

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

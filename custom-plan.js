// ============ v177 自定义训练计划(教练模式) ============
// 定位: 让教练/有经验的用户手排一周计划(每天选动作+定组数/次数/休息), 存成模板替换算法计划。
//
// 设计铁律(为什么这么接, 改之前先读):
//   1. 模板快照即真源: 激活时 fbBuildCustomTrainingDays 把模板解析成 trainingDays
//      (动作对象带 _tplSets/_tplReps/_tplRest)存进 lastPlan(_customTpl=true), 之后每次
//      渲染/跳周直接复用快照, 完全不走 buildPlan —— 算法领土和人的领土分开,
//      v103 的 exswap replay / 组数偏移逻辑零接触, 不会互相打架。
//   2. 组数/次数是"绝对基准"不是最终值: 渲染层(planner-core 动作行)把 _tplSets 喂
//      fbPeriodSetsFrom、_tplReps 喂 fbCurrentWeekReps —— 减载 floor 砍量、爬坡台阶
//      进阶照常生效。教练只排骨架, 渐进系统管, 这是自定义相对 Excel 排表的核心价值。
//      ⚠️ 别在渲染层把 _tplSets 直接当最终组数用 —— 减载周会漏砍, 出现"两套数字"。
//   3. 动作必须来自 EXES(含用户自定义动作): n 是全站主键, 打卡/趋势图/平衡卡/热量
//      全按名字关联 —— 库里没有的动作名整条数据链全断, 所以编辑器只允许从库中选。
//   4. 存储 key 用 fitbuddy_ 前缀: persistence.js 零侵入镜像自动兜底(IDB+window.name)。
//   5. 编辑器 meta(goal/level/equip)从当前计划继承且不可改: doGenerate 在模板激活时
//      会用 meta 接管表单参数(同 v108 校准先例), 避免表单和模板打架。
(function () {
  'use strict';
  if (window.FB_CustomPlan) return;

  var KEY = 'fitbuddy_customplan';

  function readTpl() {
    try {
      var t = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!t || typeof t !== 'object' || !Array.isArray(t.days) || !t.days.length) return null;
      return t;
    } catch (e) { return null; }
  }
  function writeTpl(t) {
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) {}
  }

  // doGenerate 每次渲染都会问一次。返回 null = 未激活 → 走算法计划。
  window.fbCustomTplActive = function () {
    var t = readTpl();
    if (!t || !t.active || !Array.isArray(t.days) || !t.days.length) return null;
    return t;
  };

  // 模板 → trainingDays。任何一天解析失败都返回 null → doGenerate 整体退回算法计划。
  // 宁可整体退回, 也不渲染半残的模板(半残比没有更伤信任)。
  window.fbBuildCustomTrainingDays = function (tpl) {
    try {
      if (!tpl || !Array.isArray(tpl.days) || !tpl.days.length) return null;
      var out = [];
      for (var i = 0; i < tpl.days.length; i++) {
        var d = tpl.days[i];
        if (!d || !Array.isArray(d.exes) || !d.exes.length) return null;
        var exes = [];
        for (var j = 0; j < d.exes.length; j++) {
          var te = d.exes[j];
          if (!te || !te.n) return null;
          var ex = null;
          try {
            ex = (typeof getExByName === 'function') ? (getExByName(te.n) || getExByNameFuzzy(te.n)) : null;
          } catch (e0) { ex = null; }
          if (!ex && typeof EXES !== 'undefined' && Array.isArray(EXES)) {
            for (var k = 0; k < EXES.length; k++) {
              if (EXES[k] && EXES[k].n === te.n) { ex = EXES[k]; break; }
            }
          }
          if (!ex) return null;
          var e2 = {};
          for (var kk in ex) { if (Object.prototype.hasOwnProperty.call(ex, kk)) e2[kk] = ex[kk]; }
          if (parseInt(te.sets, 10) > 0) e2._tplSets = parseInt(te.sets, 10);
          if (te.reps) e2._tplReps = String(te.reps);
          if (te.rest) e2._tplRest = String(te.rest);
          exes.push(e2);
        }
        if (!exes.length) return null;
        out.push({ name: d.name || ('自定义 Day' + (i + 1)), exes: exes });
      }
      return out.length ? out : null;
    } catch (e) { return null; }
  };

  // ================= 编辑器 =================
  var ED = null;          // 工作副本 {name, meta:{goal,level,equip}, days:[{name, exes:[{n,sets,reps,rest}]}]}
  var _pickDay = -1;      // 动作选择器目标天
  var _pickMuscle = '全部';
  var _pickKw = '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function baseSetsOf() {
    var lv = (ED && ED.meta && ED.meta.level) || 'beginner';
    try { return (typeof CONFIGS !== 'undefined' && CONFIGS[lv] && CONFIGS[lv].sets) || 3; } catch (e) { return 3; }
  }
  function tplOn() { return !!(window.fbCustomTplActive && window.fbCustomTplActive()); }

  function curMeta() {
    var meta = { goal: 'muscle', level: 'beginner', equip: 'gym' };
    try {
      if (typeof lastPlan !== 'undefined' && lastPlan && lastPlan.goal) {
        meta.goal = lastPlan.goal;
        meta.level = lastPlan.level || 'beginner';
        meta.equip = lastPlan.equip || 'gym';
        return meta;
      }
      var g = document.querySelector('input[name="goal"]:checked');
      var l = document.querySelector('input[name="level"]:checked');
      var q = document.querySelector('input[name="equip"]:checked');
      if (g) meta.goal = g.value;
      if (l) meta.level = l.value;
      if (q) meta.equip = q.value;
    } catch (e) {}
    return meta;
  }

  function importFromPlan() {
    var meta = curMeta();
    var days = [];
    try {
      var lp = (typeof lastPlan !== 'undefined') ? lastPlan : null;
      if (lp && lp.trainingDays) {
        if (lp._customTpl) {
          // 已是自定义计划: 从快照导入, 保留教练定的组数/次数/休息
          lp.trainingDays.forEach(function (d) {
            if (!d || d.isTraining === false) return;
            days.push({
              name: d.name || '',
              exes: (d.exes || []).map(function (ex) {
                return { n: ex.n, sets: ex._tplSets || baseSetsOf(), reps: ex._tplReps || '', rest: ex._tplRest || '' };
              })
            });
          });
        } else {
          // 从算法计划导入骨架: 组数默认当前水平, 次数/休息留空 = 跟随计划默认
          lp.trainingDays.forEach(function (d) {
            if (!d || d.isTraining === false) return;
            days.push({
              name: d.name || '',
              exes: (d.exes || []).map(function (ex) {
                return { n: ex.n, sets: baseSetsOf(), reps: '', rest: '' };
              })
            });
          });
        }
      }
    } catch (e) {}
    if (!days.length) days = [{ name: 'Day 1', exes: [] }];
    return { name: '我的手排计划', meta: meta, days: days };
  }

  // ---------- 主编辑器 ----------
  window.fbOpenCustomPlanEditor = function () {
    if (document.getElementById('cplOverlay')) return;
    ED = importFromPlan();
    var ov = document.createElement('div');
    ov.id = 'cplOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.55);display:flex;align-items:flex-end;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;';
    ov.innerHTML =
      '<div style="background:var(--card,#fff);color:var(--text,#0f172a);width:min(96vw,560px);max-height:90vh;border-radius:18px 18px 0 0;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,0.25);">' +
        '<div style="display:flex;align-items:center;gap:8px;padding:14px 16px 10px;border-bottom:1px solid var(--border,#e2e8f0);flex:none;">' +
          '<div style="font-size:15.5px;font-weight:800;">📝 手排计划 · 教练模式</div>' +
          '<button onclick="fbCplClose()" aria-label="关闭" style="margin-left:auto;border:0;background:var(--bg,#f1f5f9);color:var(--text3,#64748b);width:30px;height:30px;border-radius:10px;font-size:15px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div id="cplBody" style="overflow-y:auto;padding:12px 14px;flex:1;"></div>' +
        '<div id="cplFoot" style="padding:10px 14px 14px;border-top:1px solid var(--border,#e2e8f0);flex:none;"></div>' +
      '</div>';
    document.body.appendChild(ov);
    renderEditor();
  };

  window.fbCplClose = function () {
    var ov = document.getElementById('cplOverlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    ED = null;
  };

  function metaText() {
    var GOALS = { muscle: '增肌', strength: '力量', cut: '减脂', shape: '塑形', cycling: '骑行力量' };
    var LV = { beginner: '新手', intermediate: '中级', advanced: '进阶' };
    var EQ = { gym: '健身房', dumbbell: '哑铃', bodyweight: '自重', band: '弹力带' };
    var m = ED.meta;
    return (GOALS[m.goal] || m.goal) + ' · ' + (LV[m.level] || m.level) + ' · ' + (EQ[m.equip] || m.equip);
  }

  function renderEditor() {
    if (!ED) return;
    var body = document.getElementById('cplBody');
    if (!body) return;
    var html = '';
    html += '<div style="font-size:11.5px;color:var(--text3,#64748b);line-height:1.6;background:var(--bg,#f1f5f9);border-radius:10px;padding:8px 10px;margin-bottom:10px;">' +
      '环境：<b>' + esc(metaText()) + '</b>（跟随当前计划，组数/次数留空 = 用计划默认值）。<br>' +
      '⚠️ 减载周和爬坡会照常作用在你排的组数/次数上 —— 你排骨架，系统管渐进。</div>';
    html += '<div style="margin-bottom:10px;"><input id="cplName" value="' + esc(ED.name) + '" placeholder="计划名称" oninput="fbCplUpdName(this.value)" style="width:100%;padding:9px 12px;border-radius:10px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text,#0f172a);font-size:14px;font-weight:700;"></div>';

    ED.days.forEach(function (d, di) {
      html += '<div style="border:1.5px solid var(--border,#e2e8f0);border-radius:12px;padding:10px;margin-bottom:10px;">';
      html += '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">' +
        '<input value="' + esc(d.name) + '" placeholder="Day ' + (di + 1) + ' 名称（如：推日）" oninput="fbCplUpdDayName(' + di + ',this.value)" style="flex:1;min-width:0;padding:7px 10px;border-radius:9px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text,#0f172a);font-size:13px;font-weight:700;">' +
        '<button onclick="fbCplDelDay(' + di + ')" title="删除这一天" aria-label="删除这一天" style="flex:none;border:0;background:rgba(239,68,68,0.10);color:#DC2626;width:30px;height:30px;border-radius:9px;font-size:13px;cursor:pointer;">🗑</button></div>';
      if (!d.exes.length) {
        html += '<div style="font-size:12px;color:var(--text3,#94a3b8);padding:6px 2px;">还没动作，点下面「➕ 加动作」从动作库选。</div>';
      }
      d.exes.forEach(function (ex, ei) {
        html += '<div style="display:flex;gap:6px;align-items:center;padding:6px 0;border-bottom:1px dashed var(--border,#e2e8f0);flex-wrap:wrap;">' +
          '<div style="flex:1;min-width:110px;font-size:12.5px;font-weight:700;color:var(--text,#0f172a);">' + esc(ex.n) + '</div>' +
          '<label style="font-size:10.5px;color:var(--text3,#64748b);">组</label>' +
          '<input type="number" inputmode="numeric" min="1" max="10" value="' + esc(ex.sets || '') + '" placeholder="默认" onchange="fbCplUpdEx(' + di + ',' + ei + ',\'sets\',this.value)" style="width:46px;padding:5px 6px;border-radius:8px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text,#0f172a);font-size:12px;text-align:center;">' +
          '<input value="' + esc(ex.reps || '') + '" placeholder="次数如 8-12次" onchange="fbCplUpdEx(' + di + ',' + ei + ',\'reps\',this.value)" style="width:92px;padding:5px 8px;border-radius:8px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text,#0f172a);font-size:12px;">' +
          '<input value="' + esc(ex.rest || '') + '" placeholder="休息如 90秒" onchange="fbCplUpdEx(' + di + ',' + ei + ',\'rest\',this.value)" style="width:80px;padding:5px 8px;border-radius:8px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text,#0f172a);font-size:12px;">' +
          '<button onclick="fbCplDelEx(' + di + ',' + ei + ')" title="移除" aria-label="移除动作" style="flex:none;border:0;background:var(--bg,#f1f5f9);color:var(--text3,#64748b);width:26px;height:26px;border-radius:8px;font-size:12px;cursor:pointer;">✕</button>' +
          '</div>';
      });
      html += '<button onclick="fbCplPickOpen(' + di + ')" style="margin-top:8px;width:100%;padding:8px;border-radius:9px;border:1.5px dashed var(--border,#cbd5e1);background:transparent;color:var(--primary,#6366f1);font-size:12.5px;font-weight:700;cursor:pointer;">➕ 加动作</button>';
      html += '</div>';
    });

    html += '<button onclick="fbCplAddDay()" style="width:100%;padding:10px;border-radius:11px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text2,#475569);font-size:13px;font-weight:700;cursor:pointer;">➕ 加一天</button>';
    body.innerHTML = html;

    var foot = document.getElementById('cplFoot');
    var st = tplOn() ? '<div style="font-size:11px;color:#059669;font-weight:700;margin-bottom:8px;">✅ 自定义计划已启用中 —— 保存会立即覆盖当前计划</div>' : '';
    foot.innerHTML = st +
      '<div style="display:flex;gap:8px;">' +
      (tplOn() ? '<button onclick="fbCplDeactivate()" style="flex:1;padding:12px;border-radius:12px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text2,#475569);font-size:13px;font-weight:700;cursor:pointer;">⏹ 停用，回智能计划</button>' : '') +
      '<button onclick="fbCplSave()" style="flex:2;padding:12px;border-radius:12px;border:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:14px;font-weight:800;cursor:pointer;">💾 保存并启用</button>' +
      '</div>';
  }

  window.fbCplUpdName = function (v) { if (ED) ED.name = String(v || '').trim(); };
  window.fbCplUpdDayName = function (di, v) { if (ED && ED.days[di]) ED.days[di].name = String(v || '').trim(); };
  window.fbCplUpdEx = function (di, ei, field, v) {
    if (!ED || !ED.days[di] || !ED.days[di].exes[ei]) return;
    var t = String(v == null ? '' : v).trim();
    if (field === 'sets') {
      var n = parseInt(t, 10);
      ED.days[di].exes[ei].sets = (n > 0 && n <= 10) ? n : '';
    } else {
      // reps/rest 是自由文本但要清洗: 去掉能截断 HTML 的字符(动作名同款教训)
      ED.days[di].exes[ei][field] = t.replace(/[<>"']/g, '').slice(0, 20);
    }
  };
  window.fbCplAddDay = function () {
    if (!ED) return;
    if (ED.days.length >= 7) { try { showToast('一周最多排 7 天'); } catch (e) {} return; }
    ED.days.push({ name: 'Day ' + (ED.days.length + 1), exes: [] });
    renderEditor();
  };
  window.fbCplDelDay = function (di) {
    if (!ED || ED.days.length <= 1) { try { showToast('至少留一天'); } catch (e) {} return; }
    ED.days.splice(di, 1);
    renderEditor();
  };
  window.fbCplDelEx = function (di, ei) {
    if (!ED || !ED.days[di]) return;
    ED.days[di].exes.splice(ei, 1);
    renderEditor();
  };

  // ---------- 动作选择器 ----------
  window.fbCplPickOpen = function (di) {
    _pickDay = di; _pickMuscle = '全部'; _pickKw = '';
    renderPicker();
  };
  // 「臀」不是 EXES 的部位值(臀类动作全归在「腿」里), 这里做关键词映射, 不动动作库数据:
  // 改 EXES 的 m 会影响自动排课和部位平衡卡, 代价远超收益(见 v178)
  // v179 补三类之前筛漏的: ①负重髋铰链(罗马尼亚/相扑/传统硬拉, m 分散在腿和背)
  // ②单腿蹲(保加利亚各版本, 臀参与远高于双腿蹲) ③髋外展(侧卧) 在康复池里, 单项捞回
  // 哑铃摆壶是髋铰链爆发, 主练臀/后链, 也放进来
  var CPL_HIP_RE = /臀|后踢|外展|侧卧抬腿|摆壶|硬拉|保加利亚|蚌|侧向走/;
  function pickerPool() {
    var pool = [];
    try { pool = (typeof EXES !== 'undefined') ? EXES.filter(function (e) { return e && e.n; }) : []; } catch (e) { pool = []; }
    var rawPool = pool; // 未剔康复的全池, 臀 tab 要把「髋外展(侧卧)」单独捞回来
    // 康复动作不进力量池: 教练手排是排训练, 泡沫轴放松/踝泵/深呼吸放进来全是噪音。
    // 想看就切「康复」tab(默认不显示)
    if (_pickMuscle !== '康复') {
      pool = pool.filter(function (e) { return e.m !== '康复'; });
    }
    if (_pickKw) pool = pool.filter(function (e) { return e.n.indexOf(_pickKw) >= 0; });
    if (_pickMuscle === '臀') {
      pool = rawPool.filter(function (e) {
        if (_pickKw && e.n.indexOf(_pickKw) < 0) return false;
        if (!CPL_HIP_RE.test(e.n)) return false;
        if (e.m === '腿' || e.m === '有氧' || e.m === '背') return true;
        // 康复池里只有髋外展(侧卧)是真正的臀中肌训练动作, 其余(放松/踝泵)不要
        return e.m === '康复' && /髋外展|臀/.test(e.n);
      });
    } else if (_pickMuscle && _pickMuscle !== '全部') {
      pool = pool.filter(function (e) { return e.m === _pickMuscle; });
    }
    // 器材筛选必须放在部位/关键词之后: 放在全池上算「够 8 个就不放开」会错判——
    // 全池 64 个 gym 动作够数, 但「臀」筛完只剩 2 个, 教练会以为库空了(实测踩过)
    if (ED && ED.meta && ED.meta.equip) {
      var eq = ED.meta.equip;
      var filtered = pool.filter(function (e) { return e.eq === eq; });
      // 筛完太空就放开器材限制(器材混合着练是常态, 别把教练卡死)
      pool = filtered.length >= 8 ? filtered : pool;
    }
    return pool;
  }
  function tabBtnsHtml() {
    var MUSCLES = ['全部', '臀', '腿', '胸', '背', '肩', '臂', '核心', '有氧', '康复'];
    return MUSCLES.map(function (m) {
      var on = m === _pickMuscle;
      return '<button onclick="fbCplTab(\'' + m + '\')" style="padding:5px 11px;border-radius:999px;border:1.5px solid ' + (on ? 'var(--primary,#6366f1)' : 'var(--border,#e2e8f0)') + ';background:' + (on ? 'rgba(99,102,241,0.10)' : 'transparent') + ';color:' + (on ? 'var(--primary,#6366f1)' : 'var(--text2,#475569)') + ';font-size:12px;font-weight:700;cursor:pointer;flex:none;">' + m + '</button>';
    }).join('');
  }
  function listHtml() {
    var pool = pickerPool();
    // 器材筛完不足 8 个时会放开兜底(见 pickerPool), 所以列表里可能混着别的器材。
    // 这里把「本器材」的排前面 + 每行标出器材, 教练一眼知道要什么家伙, 不至于排完才发现没法做
    var curEq = (ED && ED.meta && ED.meta.equip) || '';
    if (curEq) {
      pool = pool.slice().sort(function (a, b) {
        return (a.eq === curEq ? 0 : 1) - (b.eq === curEq ? 0 : 1);
      });
    }
    pool = pool.slice(0, 60);   // 上限 60 条防卡顿, 有搜索兜底
    var EQ_LABEL = { gym: '健身房', dumbbell: '哑铃', band: '弹力带', bodyweight: '徒手' };
    var list = pool.map(function (e) {
      var eqTxt = EQ_LABEL[e.eq] || e.eq || '';
      var off = curEq && e.eq !== curEq;   // 不是当前器材: 灰一点, 别喧宾夺主
      return '<div onclick="fbCplPick(\'' + esc(e.n).replace(/'/g, '&#39;') + '\')" style="display:flex;gap:8px;align-items:center;padding:9px 10px;border-bottom:1px solid var(--border,#e2e8f0);cursor:pointer;">' +
        '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:var(--text,#0f172a);' + (off ? 'opacity:.72;' : '') + '">' + esc(e.n) + '</div>' +
        '<div style="font-size:10.5px;color:var(--text3,#94a3b8);">' + esc(e.m || '') + ' · ' + esc(e.diff || '') + (eqTxt ? ' · ' + esc(eqTxt) : '') + '</div></div>' +
        '<div style="flex:none;color:var(--primary,#6366f1);font-size:16px;font-weight:800;">＋</div></div>';
    }).join('');
    return list || '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text3,#94a3b8);">没匹配的动作，换个关键词</div>';
  }
  // ⚠️ 这个只在「打开选择器」时走。搜索/切 tab 绝不能整个重建弹层:
  // 输入框会被销毁 → 打一个字焦点就没了(线上实测搜不了)。后续只刷 cplList/cplTabs。
  function renderPicker() {
    var old = document.getElementById('cplPick');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.id = 'cplPick';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,0.55);display:flex;align-items:flex-end;justify-content:center;';
    ov.innerHTML =
      '<div style="background:var(--card,#fff);color:var(--text,#0f172a);width:min(96vw,560px);max-height:78vh;border-radius:18px 18px 0 0;display:flex;flex-direction:column;">' +
        '<div style="padding:12px 14px 8px;border-bottom:1px solid var(--border,#e2e8f0);flex:none;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><div style="font-size:14px;font-weight:800;">选动作 → 加到 Day ' + (_pickDay + 1) + '</div>' +
          '<button onclick="fbCplPickClose()" style="margin-left:auto;border:0;background:var(--bg,#f1f5f9);color:var(--text3,#64748b);width:28px;height:28px;border-radius:9px;cursor:pointer;">✕</button></div>' +
          '<input id="cplSearch" placeholder="🔍 搜索动作名" oninput="fbCplSearch(this.value)" style="width:100%;padding:8px 12px;border-radius:9px;border:1.5px solid var(--border,#e2e8f0);background:var(--bg,#f1f5f9);color:var(--text,#0f172a);font-size:13px;">' +
          '<div id="cplTabs" style="display:flex;gap:6px;margin-top:8px;overflow-x:auto;padding-bottom:2px;">' + tabBtnsHtml() + '</div>' +
        '</div>' +
        '<div id="cplList" style="overflow-y:auto;flex:1;">' + listHtml() + '</div>' +
      '</div>';
    document.body.appendChild(ov);
  }
  function renderPickerList() {
    var el = document.getElementById('cplList');
    if (el) el.innerHTML = listHtml();
  }
  window.fbCplTab = function (m) {
    _pickMuscle = m;
    _pickKw = '';   // 换部位 = 清搜索, 框里的字和过滤状态必须同步(原来整层重建, 框清了但 _pickKw 还在偷偷过滤)
    var si = document.getElementById('cplSearch');
    if (si) si.value = '';
    var tb = document.getElementById('cplTabs');
    if (tb) tb.innerHTML = tabBtnsHtml();
    renderPickerList();
  };
  window.fbCplSearch = function (v) {
    _pickKw = String(v || '').trim();
    renderPickerList();   // 只刷列表, 输入框不动——焦点保得住, 中文输入法才打得了
  };
  window.fbCplPickClose = function () {
    var ov = document.getElementById('cplPick');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  };
  window.fbCplPick = function (name) {
    if (!ED || _pickDay < 0 || !ED.days[_pickDay]) return;
    var day = ED.days[_pickDay];
    // 同一天同名动作去重: 排两次同一个动作看着像 bug, 想加量请改组数
    for (var i = 0; i < day.exes.length; i++) {
      if (day.exes[i].n === name) { try { showToast('这天已经有「' + name + '」了，想加量直接改组数'); } catch (e) {} return; }
    }
    if (day.exes.length >= 10) { try { showToast('一天最多 10 个动作，再多恢复不过来'); } catch (e) {} return; }
    day.exes.push({ n: name, sets: baseSetsOf(), reps: '', rest: '' });
    window.fbCplPickClose();
    renderEditor();
  };

  // ---------- 保存 / 停用 ----------
  window.fbCplSave = function () {
    if (!ED) return;
    var days = [];
    for (var i = 0; i < ED.days.length; i++) {
      var d = ED.days[i];
      if (!d.exes.length) {
        try { showToast('「' + (d.name || ('Day' + (i + 1))) + '」一个动作都没有，先加动作'); } catch (e) {}
        return;
      }
      var exes = [];
      for (var j = 0; j < d.exes.length; j++) {
        var te = d.exes[j];
        exes.push({ n: te.n, sets: parseInt(te.sets, 10) || 0, reps: te.reps || '', rest: te.rest || '' });
      }
      days.push({ name: (d.name || ('Day ' + (i + 1))).slice(0, 24), exes: exes });
    }
    var t = {
      v: 1, active: true, name: (ED.name || '我的手排计划').slice(0, 30),
      meta: ED.meta, days: days, savedAt: Date.now()
    };
    writeTpl(t);
    window.fbCplClose();
    // ⚠️ 先摘掉旧快照的 _customTpl 标记, 否则 doGenerate 会复用上一版快照而不是新模板
    try { if (typeof lastPlan !== 'undefined' && lastPlan) lastPlan._customTpl = false; } catch (e) {}
    try {
      if (typeof doGenerate === 'function') doGenerate();
      else location.reload();
    } catch (e) { location.reload(); }
  };

  window.fbCplDeactivate = function () {
    var t = readTpl();
    if (t) { t.active = false; writeTpl(t); }
    window.fbCplClose();
    try {
      if (typeof doGenerate === 'function') doGenerate();
      else location.reload();
    } catch (e) { location.reload(); }
  };

  window.FB_CustomPlan = { version: '1.0.0', readTpl: readTpl };
})();

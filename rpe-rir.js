// ============ FitBuddy · RPE / RIR 换算 + 自动调节 (Autoregulation) ============
// 依赖: planner-core.js (trainingLog / computeE1RM / fbWeightStep / getLogUnit / fbLooksLikeDeload)
// 加载位置: pro-tools.js 之后(index.html)
//
// 这一块补的是「身体反馈 → 杠铃上的重量」这条链上缺的两段:
//
//   1) 换算: RPE 是主观强度分, RIR 是"还能再做几次" —— 其实是同一个数字的两种说法
//      (RIR = 10 − RPE)。以前 App 里只有 RPE 一个输入框, 用户填的时候得自己在脑子里
//      换算一遍"8 分到底算留了几次余量", 换算错了后面整条调节链就跟着错。
//
//   2) 当次自动调节: 已有的 fbCalcNextLoad 管的是"下一次训练用多重"(跨次),
//      这里管的是"这一组做完发现状态不对, 下一组立刻改多重"(当次/组间)。
//      这是 autoregulation 每天真正在用的那一半 —— 睡没睡好、今天状态如何,
//      只有站到杠铃前才知道, 几周前排的计划不可能知道。
//
// ⚠️ 口径纪律(这个项目里因为两套口径打架已经踩过三次):
//    · 1RM 一律走 computeE1RM(Epley), 这里不写第二份公式。
//    · 减载周记录一律跳过(fbLooksLikeDeload), 与 fbCalcNextLoad / getRPESuggestions 同口径 ——
//      减载周那个"RPE 5 很轻松"是轻重量造出来的假信号, 拿它当基准会授权加档。
//    · "下次训练用多重" 只有 fbCalcNextLoad 一个出口。这里不给跨次指令,
//      否则两张卡同屏报出两个不同的数字, 用户不知道该信哪个。
//      本卡只做: 换算 / 按目标 RPE 反推重量(阶梯) / 组间即时调节。
//
// ⚠️ 不新增存储 key: RIR 恒等于 10 − RPE, 存两份就一定会不一致。一律现算。
//    (项目纪律: 能推算出来的就不落盘, 见 persistence 那三层冗余的教训。)

// ============ 整卡开关 ============
// ⚠️ 默认关闭。这不是"功能没做完", 是**做完之后判定暂时不该露出来**, 理由有三条,
//    都是查代码查出来的硬事实, 不是猜测:
//
//  1) 这个模块的全部输入来自 trainingLog 里的 RPE 字段, 而打卡页那个 RPE 框
//     (planner-core.js:4483/4492) 是 —— **不预填、宽 44px、placeholder 明写「选填」**;
//     重量和次数都预填上次的, 唯独 RPE 要从零想。设计上它就是个额外动作,
//     所以**多数用户大概率没记 RPE**。没输入的东西摆在页面上就是空壳。
//
//  2) 更糟的是它对没数据的用户是**负价值**: 没记 RPE 时卡片照样渲染, 只多一行橙色
//     警告 + 一张按"默认留 2 次"糊出来的阶梯。占一屏、被警告、数字还没依据 ——
//     出门槛不显示都比这好。
//
//  3) 组间即时调节那段在移动端**场景不成立**: 组休 60~90 秒内要 解锁→切微信→找链接→
//     等加载→滚到进度页深处→输入→读结果, 健身房信号还常差。真做 autoregulation 的人
//     用纸笔或离线专业 App, 没人开网页算。
//
// ✅ 留下来的只有换算器, 而且**挪了位置**: 它不是分析工具, 是教学工具 ——
//    该待的地方是用户填 RPE 卡住的那一刻, 也就是打卡行 RPE 框旁边那个「?」
//    (fbShowRpeGuide)。放那儿它是**在给整个模块输血**(提升 RPE 填写率),
//    放在进度页深处只是教一个已经被困住的人。
//
// 🔄 什么时候开回来: 等打卡数据里 RPE 填写率上来了(FB_RPE_RIR_CFG 打开后先看 renders),
//    再决定处方阶梯要不要单独露出。**不要因为"代码都写好了"就开** —— 沉没成本不是理由。
var FB_RPE_RIR_CFG = {
  SHOW_CARD: false   // 整张「RPE · RIR 自动调节」卡是否出现在 Pro 区块
};

// ---- 换算表: RPE 与 RIR 是同一个刻度 ----
// 只列 5 分及以上: RPE 4 以下基本是热身/有氧, 不进正式组的调节计算。
var FB_RPE_SCALE = [
  { rpe: 10,   name: '力竭',   tip: '一个都多不了了' },
  { rpe: 9.5,  name: '极限',   tip: '也许还能蹭半个' },
  { rpe: 9,    name: '极重',   tip: '还能再做 1 次' },
  { rpe: 8.5,  name: '很重',   tip: '还能再做 1~2 次' },
  { rpe: 8,    name: '重',     tip: '还能再做 2 次' },
  { rpe: 7.5,  name: '偏重',   tip: '还能再做 2~3 次' },
  { rpe: 7,    name: '中等',   tip: '还能再做 3 次' },
  { rpe: 6.5,  name: '偏轻',   tip: '还能再做 3~4 次' },
  { rpe: 6,    name: '轻',     tip: '还能再做 4 次' },
  { rpe: 5,    name: '很轻',   tip: '还能再做 5 次' }
];

// RPE → RIR。反过来就是 RIR → RPE, 同一个函数传 rir 也行, 见 fbRirToRpe。
function fbRpeToRir(rpe) {
  var r = parseFloat(rpe);
  if (!isFinite(r)) return null;
  if (r < 5 || r > 10) return null;
  var rir = Math.round((10 - r) * 2) / 2;
  return rir < 0 ? 0 : rir;
}

function fbRirToRpe(rir) {
  var r = parseFloat(rir);
  if (!isFinite(r)) return null;
  if (r < 0 || r > 5) return null;
  var rpe = Math.round((10 - r) * 2) / 2;
  return rpe > 10 ? 10 : (rpe < 5 ? 5 : rpe);
}

// "还能再做几次"的人话。RIR 是 autoregulation 里最直观的一栏 ——
// 多数人报不准"几分累", 但报得准"还能再做两个"。
function fbRirText(rir) {
  if (rir === null || !isFinite(rir)) return '';
  if (rir <= 0) return '做到力竭，一下都多不了';
  if (rir < 1) return '勉强还能多蹭半个';
  return '做完还能再做 ' + rir + ' 次';
}

// 强度分区。颜色跟项目里其它卡保持一致(红=极限 橙=力量 绿=增肌 蓝=恢复)。
function fbRpeZone(rpe) {
  var r = parseFloat(rpe);
  if (!isFinite(r) || r < 5) return { name: '热身区', color: '#3B82F6', tip: '活动关节、找发力感，不算正式刺激' };
  if (r >= 9.5) return { name: '极限区', color: '#EF4444', tip: '接近或到达力竭，一周安排一两次就够' };
  if (r >= 8.5) return { name: '力量区', color: '#F59E0B', tip: '练绝对力量的主战场，恢复成本高' };
  if (r >= 7) return { name: '增肌区', color: '#22C55E', tip: '留 2~3 次余量，容量堆得起来、恢复也跟得上' };
  return { name: '恢复区', color: '#3B82F6', tip: '技术打磨、伤病期过渡用' };
}

// ---- 1RM 估算(RPE 法) ----
// 记了 RPE 的重量组其实等价于一次"没做完的力竭组": 实际做了 r 次, 还留 rir 次,
// 那么这一组的力竭次数就是 r + rir。把这个次数喂给 Epley 就能估 1RM ——
// 这比直接拿 r 次估准得多: 55kg×8@RPE8 按 8 次估是 69.7kg, 按 10 次(8+2)估是 73kg。
// ⚠️ Epley 在高次数会失真(超过 15 次的估算普遍虚高), 所以带上置信度, UI 上如实标注。
function fbE1RMFromRpe(weight, reps, rpe) {
  var w = parseFloat(weight), r = parseInt(reps, 10), p = parseFloat(rpe);
  if (!(w > 0) || !(r > 0)) return null;
  if (typeof computeE1RM !== 'function') return null;
  var rir = fbRpeToRir(p);
  if (rir === null) rir = 2;              // 没记 RPE 就按"留 2 次"这个常见保守口径
  var failReps = r + rir;
  if (failReps > 20) failReps = 20;       // 兜个上限, 免得高次数把 1RM 吹上天
  return {
    e1rm: computeE1RM(w, failReps),
    failReps: failReps,
    rir: rir,
    hadRpe: isFinite(p) && p > 0,
    confidence: failReps <= 10 ? 'high' : (failReps <= 15 ? 'mid' : 'low')
  };
}

// 反推: 已知 1RM, 想做 n 次并停在目标 RPE, 该上多重?
// 就是 Epley 的逆运算: w = e1RM / (1 + (n + rir) / 30)
function fbLoadForRpe(e1rm, reps, targetRpe) {
  if (!(e1rm > 0) || !(reps > 0)) return null;
  var rir = fbRpeToRir(targetRpe);
  if (rir === null) return null;
  return e1rm / (1 + (reps + rir) / 30);
}

function fbRpeConfText(c) {
  return c === 'high' ? '估算较准' : (c === 'mid' ? '仅供参考' : '次数偏高，估算偏差大');
}

// ---- 取"上一次作数的训练记录" ----
// 与 fbCalcNextLoad / getRPESuggestions 同口径: 跳过尾部连续的减载周记录。
function fbRpeLastEntry(exName) {
  if (typeof trainingLog === 'undefined' || !trainingLog) return null;
  var log = trainingLog[exName];
  if (!log || !log.length) return null;
  var i = log.length - 1;
  try {
    if (typeof fbLooksLikeDeload === 'function') {
      while (i > 0 && fbLooksLikeDeload(log, i, exName)) i--;
      if (fbLooksLikeDeload(log, i, exName)) return null;   // 整份日志只有减载记录
    }
  } catch (e) {}
  return log[i] || null;
}

// ---- 处方阶梯: 同一个次数下, 想练到不同 RPE 分别该挂多重 ----
// 这是 autoregulation 最核心的一张表。老做法是"计划写死 60kg×8", 于是
//   状态好的那天太轻(白练) / 状态差的那天太重(练崩);
// 改成"8 次 @RPE 8"之后, 同样的处方在不同状态下落到不同的重量上 —— 这才是活的程序。
// ⚠️ 返回 null 的情况(没日志 / 自重动作 / 没重量)一律由调用方决定怎么提示, 这里不抛错。
function fbRpeRungs(exName, targetReps) {
  var last = fbRpeLastEntry(exName);
  if (!last) return null;
  var w = parseFloat(last.weight) || 0;
  var r = parseInt(last.reps, 10) || 0;
  var p = parseFloat(last.rpe) || 0;
  if (!(w > 0) || !(r > 0)) return null;

  var est = fbE1RMFromRpe(w, r, p);
  if (!est || !(est.e1rm > 0)) return null;

  var reps = parseInt(targetReps, 10) > 0 ? parseInt(targetReps, 10) : r;
  var step = (typeof fbWeightStep === 'function') ? fbWeightStep(exName, w) : 2.5;
  if (!(step > 0)) step = 2.5;

  var rungs = [];
  var list = [7, 8, 9, 10];
  for (var i = 0; i < list.length; i++) {
    var rpe = list[i];
    var raw = fbLoadForRpe(est.e1rm, reps, rpe);
    if (!(raw > 0)) continue;
    // 安全夹: 单次偏离上次重量不超过 10%。e1RM 是估算值, 估偏了会给出离谱的处方,
    // 与其信算法不如信身体 —— 夹住是为了让"算错"的代价可控。
    var lo = w * 0.90, hi = w * 1.10;
    var kg = raw < lo ? lo : (raw > hi ? hi : raw);
    kg = Math.max(step, Math.round(kg / step) * step);
    rungs.push({
      rpe: rpe,
      rir: fbRpeToRir(rpe),
      kg: Math.round(kg * 10) / 10,
      reps: reps,
      isLast: (p > 0 && Math.abs(p - rpe) < 0.26)   // 上次实际就落在这档
    });
  }
  if (!rungs.length) return null;

  return {
    exName: exName,
    lastWeight: w,
    lastReps: r,
    lastRpe: p,
    e1rm: est.e1rm,
    confidence: est.confidence,
    hadRpe: est.hadRpe,
    targetReps: reps,
    step: step,
    rungs: rungs
  };
}

// ---- 组间即时调节: 这一组做完, 下一组改多重 ----
// 规则: 每偏离目标 RPE 一个单位 ≈ ±2.5% 重量(行业常用换算, 也和项目里
// "RPE 9 降一档" 的口径同量级)。
// ⚠️ 取整后如果跟当前重量一样, 强制挪一档 —— 否则会出现"建议: 还是 57.5kg"
// 这种等于没说的输出(2.5% × 57.5 = 1.44kg, 夹到 2.5 档就归零了)。
// ⚠️ 单次夹在 ±7.5% 内: 一组做完就大起大落, 通常是 RPE 报错了而不是状态真的差这么多。
function fbNextSetLoad(exName, curKg, curRpe, targetRpe) {
  var w = parseFloat(curKg), a = parseFloat(curRpe), t = parseFloat(targetRpe);
  if (!(w > 0) || !isFinite(a) || !isFinite(t)) return null;
  var delta = t - a;                                  // 正数=比目标轻松,可以加
  var pct = delta * 2.5;
  if (pct > 7.5) pct = 7.5;
  if (pct < -7.5) pct = -7.5;
  var step = (typeof fbWeightStep === 'function') ? fbWeightStep(exName, w) : 2.5;
  if (!(step > 0)) step = 2.5;

  var raw = w * (1 + pct / 100);
  var kg = Math.max(step, Math.round(raw / step) * step);
  if (Math.abs(delta) >= 0.5 && Math.abs(kg - w) < 1e-9) {
    kg = Math.max(step, kg + (delta > 0 ? step : -step));   // 强制动一档
  }
  if (Math.abs(kg - w) < 1e-9) {
    return { kg: w, delta: delta, changed: false, step: step,
             reason: '正好落在目标强度上，下一组重量不变' };
  }
  var dir = kg > w ? '加' : '降';
  var why;
  if (delta > 0) why = '这组比目标轻松 ' + delta + ' 分 → ' + dir + '到 ' + kg + 'kg';
  else why = '这组比目标吃力 ' + Math.abs(delta) + ' 分 → ' + dir + '到 ' + kg + 'kg';
  return { kg: kg, delta: delta, changed: true, step: step, reason: why };
}

// ---- 合并撞档的阶梯 ----
// ⚠️ 这不是为了好看, 是实测撞出来的真问题: 相邻 RPE 只差 1 个 RIR ≈ 2.5% 重量,
//    而 55kg 的 2.5% 是 1.375kg —— 夹到最小那片(2.5kg)之后归零,
//    于是 RPE 8 和 RPE 9 显示成同一个 55kg, 用户只会认为表坏了。
//
//    两种改法, 选了合并而不是"强行拉开":
//    ✗ 强制每档至少差一片: 55.0 / 56.4 会被推成 55 / 57.5, 四档推到底偏离真实估算
//      越来越远(52.5/55/57.5/60 vs 真实的 53.6/55/56.4/57.7) —— 假精确比不精确更糟。
//    ✓ 撞了就合并成一行「RPE 8–9 → 55kg」, 并直说原因: 这个重量上 1 分的差别
//      不到一片杠铃片, 靠加重量区分不了, 想上强度就多做一次。
//      这本来就是老练的人实际在用的做法, 只是以前没人把它写进处方里。
function fbRpeMergeRungs(rungs) {
  var out = [], i = 0;
  while (i < rungs.length) {
    var j = i;
    while (j + 1 < rungs.length && Math.abs(rungs[j + 1].kg - rungs[i].kg) < 1e-9) j++;
    var grp = rungs.slice(i, j + 1);
    var rpes = [], rirs = [], isLast = false, k;
    for (k = 0; k < grp.length; k++) {
      rpes.push(grp[k].rpe);
      rirs.push(grp[k].rir);
      if (grp[k].isLast) isLast = true;
    }
    out.push({
      kg: rungs[i].kg,
      reps: rungs[i].reps,
      rpes: rpes,
      rirs: rirs,
      isLast: isLast,
      merged: rpes.length > 1
    });
    i = j + 1;
  }
  return out;
}

// 合并档的 RIR 区间文案: RPE 越高 RIR 越低, 所以要倒过来说
function fbRpeRungRirText(rirs) {
  if (!rirs || !rirs.length) return '';
  if (rirs.length === 1) return fbRirText(rirs[0]);
  var hi = rirs[0], lo = rirs[rirs.length - 1], i;
  for (i = 0; i < rirs.length; i++) {
    if (rirs[i] > hi) hi = rirs[i];
    if (rirs[i] < lo) lo = rirs[i];
  }
  if (lo <= 0) return '从还能做 ' + hi + ' 次到力竭';
  return '做完还能再做 ' + lo + '~' + hi + ' 次';
}

// 合并档的标题: RPE 8 / RPE 8–9
function fbRpeRungTitle(rpes) {
  if (!rpes || !rpes.length) return 'RPE —';
  if (rpes.length === 1) return 'RPE ' + rpes[0];
  return 'RPE ' + rpes[0] + '–' + rpes[rpes.length - 1];
}

// ---- 有日志、且记了 RPE 的动作列表(给处方选择器用) ----
function fbRpeLoggedExes() {
  var out = [];
  if (typeof trainingLog === 'undefined' || !trainingLog) return out;
  Object.keys(trainingLog).forEach(function (k) {
    var last = fbRpeLastEntry(k);
    if (!last) return;
    if (!(parseFloat(last.weight) > 0) || !(parseInt(last.reps, 10) > 0)) return;
    out.push({ name: k, weight: parseFloat(last.weight), reps: parseInt(last.reps, 10), rpe: parseFloat(last.rpe) || 0 });
  });
  // ⚠️ 排序第一优先级不是"最近练过", 而是**有没有记 RPE**。
  //    实测: 只按日期排的话, 默认选中最近一次训练 —— 而那次常常没填 RPE,
  //    于是用户打开卡片看到的第一行是橙色警告「上次没记 RPE, 阶梯仅供参考」,
  //    整张阶梯还是按默认口径糊出来的。第一印象就废了。
  //    改成: 记了 RPE 的排前面(阶梯是真的), 同档内再按最近练过排。
  try {
    out.sort(function (a, b) {
      var ra = a.rpe > 0 ? 1 : 0, rb = b.rpe > 0 ? 1 : 0;
      if (ra !== rb) return rb - ra;
      var la = trainingLog[a.name] || [], lb = trainingLog[b.name] || [];
      return (parseFloat((lb[lb.length - 1] || {}).date) || 0) - (parseFloat((la[la.length - 1] || {}).date) || 0);
    });
  } catch (e) {}
  return out;
}

// ============ 换算器组件(可复用) ============
// ns = id 前缀。为什么非要这个前缀: 同一份换算器会出现在两个地方 ——
//   Pro 区块的卡片(ns='rr') 和 打卡页 RPE 旁边的「?」引导弹窗(ns='rac')。
//   写死一套 id 的话, 万一哪天两处同屏, 拖动一个另一个跟着动, 而且坏得很安静。
//
// 抽成函数是为了守一条纪律: **同一个东西绝不写两份**。两份就一定会分叉 ——
//   这个项目里因为两套口径各写一份已经踩过三次(1RM 公式、热身组算法、绑鞋tip)。
function fbRpeConverterHtml(ns, initRpe) {
  ns = ns || 'rr';
  // initRpe: 打开时就落在哪个分数上。打卡页「?」里会把用户已经填过的 RPE 带进来 ——
  //   他是回来核对/微调的, 每次都从 8 开始拖一遍等于没优化。
  var r0 = parseFloat(initRpe);
  if (!(r0 >= 5 && r0 <= 10)) r0 = 8;
  var i0 = fbRpeToRir(r0);
  if (i0 === null) i0 = 2;
  return '<div style="padding:12px;border-radius:12px;background:var(--bg);border:1px solid var(--border);">' +
    '<div style="display:flex;align-items:center;gap:9px;">' +
      '<span style="font-size:12px;color:var(--text2);min-width:30px;">RPE</span>' +
      '<input type="range" id="' + ns + 'Rpe" min="5" max="10" step="0.5" value="' + r0 + '" ' +
        'oninput="RpeRirUI.syncFromRpe(this.value,\'' + ns + '\')" style="flex:1;accent-color:var(--primary);" aria-label="RPE 强度分">' +
      '<span id="' + ns + 'RpeVal" style="font-size:13px;font-weight:800;color:var(--primary);min-width:26px;text-align:right;">' + r0 + '</span>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:9px;margin-top:7px;">' +
      '<span style="font-size:12px;color:var(--text2);min-width:30px;">RIR</span>' +
      '<input type="range" id="' + ns + 'Rir" min="0" max="5" step="0.5" value="' + i0 + '" ' +
        'oninput="RpeRirUI.syncFromRir(this.value,\'' + ns + '\')" style="flex:1;accent-color:var(--blue);" aria-label="剩余次数 RIR">' +
      '<span id="' + ns + 'RirVal" style="font-size:13px;font-weight:800;color:var(--blue);min-width:26px;text-align:right;">' + i0 + '</span>' +
    '</div>' +
    '<div id="' + ns + 'Big" style="margin-top:10px;font-size:14.5px;font-weight:800;color:var(--text);text-align:center;">' +
      'RPE 8 &nbsp;=&nbsp; 做完还能再做 2 次</div>' +
    '<div id="' + ns + 'Zone" style="margin-top:6px;text-align:center;">' +
      '<span style="display:inline-block;padding:3px 9px;border-radius:8px;background:#22C55E18;color:#22C55E;font-size:11.5px;font-weight:700;">增肌区</span>' +
      '<span style="font-size:11.5px;color:var(--text3);margin-left:7px;">留 2~3 次余量，容量堆得起来、恢复也跟得上</span></div>' +
    '<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:center;">两根滑块是同一个刻度，拖哪根另外一根都会跟过去</div>' +
  '</div>';
}

// ============ UI ============
var RpeRirUI = {
  _exes: null,
  _pick: 0,

  exes: function () {
    if (!RpeRirUI._exes) RpeRirUI._exes = fbRpeLoggedExes();
    return RpeRirUI._exes;
  },

  // 换算器: RPE 与 RIR 双向联动
  // ns: id 前缀, 见 fbRpeConverterHtml。不传就是 Pro 区块那张卡。
  syncFromRpe: function (v, ns) {
    ns = ns || 'rr';
    var rpe = parseFloat(v);
    var rir = fbRpeToRir(rpe);
    var rirEl = document.getElementById(ns + 'Rir');
    if (rirEl && rir !== null) rirEl.value = String(rir);
    RpeRirUI.paintConv(rpe, rir, ns);
  },
  syncFromRir: function (v, ns) {
    ns = ns || 'rr';
    var rir = parseFloat(v);
    var rpe = fbRirToRpe(rir);
    var rpeEl = document.getElementById(ns + 'Rpe');
    if (rpeEl && rpe !== null) rpeEl.value = String(rpe);
    RpeRirUI.paintConv(rpe, rir, ns);
  },
  paintConv: function (rpe, rir, ns) {
    ns = ns || 'rr';
    var big = document.getElementById(ns + 'Big');
    var zone = document.getElementById(ns + 'Zone');
    if (!big || !zone) return;
    // ⚠️ 滑块右边的数字必须在这里一起更新。原来只改了另一个滑块的 value,
    //    拖动时右边那个「8」是 HTML 里写死的初值, 永远不动 —— 实测拖动 RPE 到 10,
    //    大字已经写"做到力竭", 右边仍显示 8, 同一个位置两个数字打架。
    var rpeValEl = document.getElementById(ns + 'RpeVal');
    var rirValEl = document.getElementById(ns + 'RirVal');
    if (rpeValEl && rpe !== null && isFinite(rpe)) rpeValEl.textContent = String(rpe);
    if (rirValEl && rir !== null && isFinite(rir)) rirValEl.textContent = String(rir);
    if (rpe === null || !isFinite(rpe)) { big.textContent = '—'; zone.innerHTML = ''; return; }
    var z = fbRpeZone(rpe);
    big.innerHTML = 'RPE ' + rpe + ' &nbsp;=&nbsp; ' + fbRirText(rir);
    zone.innerHTML = '<span style="display:inline-block;padding:3px 9px;border-radius:8px;background:' + z.color + '18;color:' + z.color + ';font-size:11.5px;font-weight:700;">' + z.name + '</span>' +
      '<span style="font-size:11.5px;color:var(--text3);margin-left:7px;">' + z.tip + '</span>';
  },

  pick: function (idx) {
    RpeRirUI._pick = parseInt(idx, 10) || 0;
    // 下拉框和内部状态要同步: 光调 pick() 不改 select 的话, 框里还显示上一个动作
    // 而下面是新动作的阶梯 —— 用户会以为阶梯算错了。
    var sel = document.getElementById('rrEx');
    if (sel && String(sel.value) !== String(RpeRirUI._pick)) sel.value = String(RpeRirUI._pick);
    // 换动作时组间调节的预填必须跟着换(force=true), 否则会留上一个动作的重量:
    // 实测切到卧推后, 组间框里还填着深蹲的 100kg, 用户照着算就得到卧推 97.5kg ——
    // 数据串了比没预填更危险, 因为它看起来是有依据的。
    RpeRirUI.renderRungs(true);
  },

  renderRungs: function (forcePrefill) {
    var box = document.getElementById('rrRungs');
    if (!box) return;
    var exes = RpeRirUI.exes();
    if (!exes.length) {
      box.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:10px 0;">' +
        '还没有记过重量和 RPE。在计划页练完一组顺手填一下 RPE，这里就能反推出阶梯了。</div>';
      return;
    }
    var i = Math.min(RpeRirUI._pick, exes.length - 1);
    var cur = exes[i];
    var repsEl = document.getElementById('rrReps');
    // 切动作时 placeholder 要跟着变: 它是渲染卡片那一刻写死的, 不更新就会
    // 显示上一个动作的次数, 用户以为那是当前动作的默认值。
    if (repsEl && !repsEl.value) repsEl.placeholder = String(cur.reps);
    var reps = (repsEl && parseInt(repsEl.value, 10) > 0) ? parseInt(repsEl.value, 10) : cur.reps;
    var d = fbRpeRungs(cur.name, reps);
    if (!d) {
      box.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:10px 0;">数据不完整，算不出阶梯。</div>';
      return;
    }

    var h = '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">' +
      '<span style="font-size:12.5px;color:var(--text2);">上次 <b style="color:var(--text);">' + d.lastWeight + 'kg × ' + d.lastReps + '次</b>' +
      (d.lastRpe ? ' (RPE ' + d.lastRpe + ')' : ' <span style="color:var(--text3);">(没记 RPE)</span>') + '</span>' +
      '<span style="font-size:11.5px;color:var(--text3);">估 1RM ≈ ' + d.e1rm + 'kg · ' + fbRpeConfText(d.confidence) + '</span></div>';

    var groups = fbRpeMergeRungs(d.rungs);
    var anyMerged = false;
    groups.forEach(function (g) {
      // 合并档用中间的那一档定色, 免得 RPE 8–9 整行染成代表"极限"的橙红色
      var mid = g.rpes[Math.floor(g.rpes.length / 2)];
      var z = fbRpeZone(mid);
      var up = g.kg - d.lastWeight;
      var diffTxt = Math.abs(up) < 1e-9 ? '与上次相同'
        : (up > 0 ? '↑ ' + (Math.round(up * 10) / 10) + 'kg' : '↓ ' + (Math.round(-up * 10) / 10) + 'kg');
      if (g.merged) anyMerged = true;
      h += '<div style="display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:9px;margin-bottom:6px;' +
        'background:' + (g.isLast ? z.color + '12' : 'var(--bg)') + ';' +
        (g.isLast ? 'border:1px solid ' + z.color + '55;' : '') + '">' +
        '<span style="min-width:52px;font-size:13px;font-weight:800;color:' + z.color + ';">' + fbRpeRungTitle(g.rpes) + '</span>' +
        '<span style="min-width:64px;font-size:15px;font-weight:800;color:var(--text);">' + g.kg + 'kg</span>' +
        '<span style="font-size:11.5px;color:var(--text3);flex:1;">× ' + g.reps + '次 · ' + fbRpeRungRirText(g.rirs) + '</span>' +
        '<span style="font-size:11px;font-weight:700;color:' + (up > 0 ? '#22C55E' : (up < 0 ? '#EF4444' : 'var(--text3)')) + ';">' + diffTxt + '</span>' +
        '</div>';
    });

    // 撞档说明: 这是用户最容易困惑的一处, 与其让他自己琢磨为什么两档一样,
    // 不如直说 —— 顺便给出"那就多做一次"这个真正可行的替代手段。
    if (anyMerged) {
      h += '<div style="font-size:11.5px;color:var(--text3);margin-top:6px;line-height:1.55;">' +
        'ℹ️ 相邻两档显示同一个重量，是因为在这个重量上差 1 分 RPE 还不到一片杠铃片（' + d.step + 'kg）—— 加重量区分不开。想上强度就多做 1 次，或者干脆练到更低次数。</div>';
    }

    if (!d.hadRpe) {
      h += '<div style="font-size:11.5px;color:var(--amber);margin-top:6px;">' +
        '⚠️ 上次没记 RPE，阶梯是按"留 2 次"这个默认口径估的，仅供参考。</div>';
    }
    box.innerHTML = h;
    RpeRirUI.prefillSet(d, !!forcePrefill);
  },

  // 组间计算器: 默认把"上次那组"当成刚做完的第 1 组
  // force=true(换了动作) 就无条件覆盖; 否则只在空着时填, 免得把用户手输的值冲掉
  prefillSet: function (d, force) {
    var wEl = document.getElementById('rrSetKg');
    var rEl = document.getElementById('rrSetRpe');
    if (!wEl || !rEl) return;
    if (d && (force || !wEl.value)) wEl.value = d.lastWeight;
    if (d && (force || !rEl.value)) rEl.value = d.lastRpe || '';
    RpeRirUI.calcNextSet();
  },

  calcNextSet: function () {
    var out = document.getElementById('rrSetOut');
    if (!out) return;
    var wEl = document.getElementById('rrSetKg');
    var rEl = document.getElementById('rrSetRpe');
    var tEl = document.getElementById('rrSetTarget');
    var exes = RpeRirUI.exes();
    var exName = exes.length ? exes[Math.min(RpeRirUI._pick, exes.length - 1)].name : '';
    var w = parseFloat(wEl && wEl.value);
    var a = parseFloat(rEl && rEl.value);
    var t = parseFloat(tEl && tEl.value);
    if (!(w > 0) || !isFinite(a) || !isFinite(t)) {
      out.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:8px 0;">填三个数：这组多重、做完感觉几分累、本来想练到几分。</div>';
      return;
    }
    var r = fbNextSetLoad(exName, w, a, t);
    if (!r) { out.innerHTML = ''; return; }
    var color = !r.changed ? 'var(--text3)' : (r.kg > w ? '#22C55E' : '#EF4444');
    out.innerHTML = '<div style="padding:11px 13px;border-radius:10px;background:' + (r.changed ? color + '14' : 'var(--bg)') + ';">' +
      '<div style="font-size:16px;font-weight:800;color:' + color + ';">下一组 ' + r.kg + 'kg</div>' +
      '<div style="font-size:11.5px;color:var(--text3);margin-top:3px;">' + r.reason + '</div></div>';
  }
};

// 卡片 HTML。放在 Pro 区块「RPE 自调节建议」之后 —— 那张是自动出的结论,
// 这张是要人动手填的工具, 自动的排在前面。
function renderRpeRirCard() {
  // ⚠️ 整卡默认关, 理由见文件头 FB_RPE_RIR_CFG 那段注释(三条都是查代码查出来的事实, 不是猜测)。
  //    换算器没有跟着一起消失 —— 它已经挪到打卡页 RPE 框旁边的「?」引导里了,
  //    那才是用户真正卡住、需要它的那一刻。
  if (!FB_RPE_RIR_CFG.SHOW_CARD) return '';

  var exes = [];
  try { exes = fbRpeLoggedExes(); } catch (e) { exes = []; }

  var opts = '';
  exes.forEach(function (e, i) {
    opts += '<option value="' + i + '">' + e.name + '（' + e.weight + 'kg × ' + e.reps + '）' + (e.rpe ? '' : ' · 未记RPE') + '</option>';
  });

  var html = '<div class="progress-card"><div class="card-title">🎚 RPE · RIR 自动调节</div>' +
    '<div style="font-size:11.5px;color:var(--text3);margin-bottom:11px;">同一个刻度两种说法：RIR = 10 − RPE。用它把"今天状态"翻译成杠铃上该挂多重。</div>';

  // ---- 1. 换算器 ----
  // ⚠️ 与打卡页 RPE 旁「?」引导里那段是**同一个组件**(fbRpeConverterHtml), 只是 id 前缀不同。
  //    以后要改换算器只改那一处, 千万别回到这里再抄一遍 —— 两份就一定会分叉。
  html += fbRpeConverterHtml('rr');

  // ---- 2. 处方阶梯 ----
  html += '<div style="font-size:12.5px;font-weight:700;color:var(--text2);margin-bottom:7px;">📋 按上次记录反推 · 想练到几分就用多重</div>';
  if (!exes.length) {
    html += '<div style="font-size:12px;color:var(--text3);padding:6px 0 2px;">还没有带 RPE 的重量记录。练完一组在计划页填一下 RPE，这里会自己长出来。</div>';
  } else {
    html += '<div class="rm-input-row" style="margin-bottom:8px;">' +
      '<div class="form-group"><label>动作</label>' +
        '<select id="rrEx" class="text-input" style="height:42px;" onchange="RpeRirUI.pick(this.value)">' + opts + '</select></div>' +
      '<div class="form-group"><label>本次目标次数</label>' +
        '<input type="number" id="rrReps" class="text-input" inputmode="numeric" min="1" max="50" placeholder="' + exes[0].reps + '" oninput="RpeRirUI.renderRungs()" aria-label="目标次数"></div>' +
      '</div>' +
      '<div id="rrRungs"></div>';
  }

  // ---- 3. 组间即时调节 ----
  html += '<div style="font-size:12.5px;font-weight:700;color:var(--text2);margin:14px 0 7px;">🔁 组间调节 · 这组做完，下一组改多重</div>' +
    '<div style="display:flex;gap:7px;align-items:flex-end;margin-bottom:8px;">' +
      '<div style="flex:1;"><label style="font-size:11px;color:var(--text3);">这组重量(kg)</label>' +
        '<input type="number" id="rrSetKg" class="text-input" inputmode="decimal" step="0.5" min="0" placeholder="57.5" oninput="RpeRirUI.calcNextSet()" style="width:100%;" aria-label="本组重量"></div>' +
      '<div style="flex:1;"><label style="font-size:11px;color:var(--text3);">做完几分累</label>' +
        '<input type="number" id="rrSetRpe" class="text-input" inputmode="decimal" step="0.5" min="5" max="10" placeholder="9.5" oninput="RpeRirUI.calcNextSet()" style="width:100%;" aria-label="本组RPE"></div>' +
      '<div style="flex:1;"><label style="font-size:11px;color:var(--text3);">本来想练到</label>' +
        '<input type="number" id="rrSetTarget" class="text-input" inputmode="decimal" step="0.5" min="5" max="10" value="8" oninput="RpeRirUI.calcNextSet()" style="width:100%;" aria-label="目标RPE"></div>' +
    '</div>' +
    '<div id="rrSetOut"></div>' +
    '<div style="font-size:11px;color:var(--text3);margin-top:8px;line-height:1.55;">' +
      '每偏离目标 1 分 ≈ 调 2.5% 重量。组数越往后 RPE 自然会往上飘一点，不用一飘就降 —— 连续两组都超才算真的要退。</div>';

  html += '</div>';
  return html;
}

// 卡片渲染完再跑一次填充:卡片是 innerHTML 插进去的, 插完才存在 DOM,
// 所以首次渲染阶梯 / 组间结果要等插入之后。
window.fbRpeRirBoot = function () {
  if (!FB_RPE_RIR_CFG.SHOW_CARD) return;   // 卡没渲染, 下面那些 id 全都不存在, 别白找
  try { RpeRirUI._exes = null; } catch (e) {}
  try { RpeRirUI.renderRungs(); } catch (e) {}
  try { RpeRirUI.calcNextSet(); } catch (e) {}
};

// 供 ?prodiag=1 自检与控制台自测(不依赖 DOM, 可直接 node 跑)
if (typeof window !== 'undefined') {
  window.fbRpeToRir = fbRpeToRir;
  window.fbRirToRpe = fbRirToRpe;
  window.fbRirText = fbRirText;
  window.fbRpeZone = fbRpeZone;
  window.fbE1RMFromRpe = fbE1RMFromRpe;
  window.fbLoadForRpe = fbLoadForRpe;
  window.fbRpeRungs = fbRpeRungs;
  window.fbNextSetLoad = fbNextSetLoad;
  window.fbRpeLoggedExes = fbRpeLoggedExes;
  window.fbRpeMergeRungs = fbRpeMergeRungs;
  window.fbRpeRungTitle = fbRpeRungTitle;
  window.fbRpeRungRirText = fbRpeRungRirText;
  window.fbRpeConverterHtml = fbRpeConverterHtml;
  window.FB_RPE_RIR_CFG = FB_RPE_RIR_CFG;   // 控制台改 FB_RPE_RIR_CFG.SHOW_CARD=true 可临时开回来
  window.renderRpeRirCard = renderRpeRirCard;
}

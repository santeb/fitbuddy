/* FitBuddy 深链参数预选 (deeplink.js)
 *
 * 用途: 小红书文案 → 网站带参数深链, 打开自动预选目标/水平/天数/器械
 *   https://santeb.github.io/fitbuddy/?goal=fatloss&level=beginner&days=3&equip=dumbbell&utm_source=xhs
 *
 * 支持 goal 别名: fatloss/loseweight→cut, build/bulk→muscle, run→marathon ...
 * 优先级: URL 参数 > 上次计划(restoreLastPlan) > 默认值
 * 深链用户不弹首访引导(意图已明确), 并计入 onboarded
 * 参数用完即从地址栏清除(history.replaceState), 刷新不再覆盖用户的选择
 */
(function () {
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  if (!q) return;

  // 别名 → 站内 value
  var GOAL_ALIAS = {
    muscle: 'muscle', build: 'muscle', bulk: 'muscle', gain: 'muscle',
    strength: 'strength', power: 'strength',
    cut: 'cut', fatloss: 'cut', 'fat-loss': 'cut', loseweight: 'cut', weightloss: 'cut', slim: 'cut',
    cardio: 'cardio', heart: 'cardio', hiit: 'cardio',
    marathon: 'marathon', run: 'marathon', running: 'marathon', half: 'marathon'
  };
  var LEVEL_ALIAS = {
    beginner: 'beginner', novice: 'beginner', new: 'beginner', rookie: 'beginner',
    intermediate: 'intermediate', mid: 'intermediate', medium: 'intermediate',
    advanced: 'advanced', pro: 'advanced', expert: 'advanced', elite: 'advanced'
  };
  var EQUIP_ALIAS = {
    gym: 'gym', full: 'gym',
    dumbbell: 'dumbbell', home: 'dumbbell', 'dumbbell-home': 'dumbbell',
    bodyweight: 'bodyweight', none: 'bodyweight', body: 'bodyweight', zero: 'bodyweight'
  };

  var goal = GOAL_ALIAS[(q.get('goal') || '').toLowerCase()] || '';
  var level = LEVEL_ALIAS[(q.get('level') || '').toLowerCase()] || '';
  var equip = EQUIP_ALIAS[(q.get('equip') || '').toLowerCase()] || '';
  var days = parseInt(q.get('days'), 10);
  if (!(days >= 2 && days <= 6)) days = 0;

  if (!goal && !level && !equip && !days) return; // 无有效参数, 什么都不做

  // 1. 标记: 深链用户意图明确, 不弹首访引导
  window._deepLinked = true;
  try { localStorage.setItem('fitbuddy_onboarded', '1'); } catch (e) {}

  // 2. 预选表单 (本脚本在 planner-core 之后 defer 执行, 此时
  //    loadPrefs/restoreLastPlan 已同步跑完, 这里是最终覆盖)
  try {
    if (goal) {
      var g = document.querySelector('input[name="goal"][value="' + goal + '"]');
      if (g) g.checked = true;
    }
    if (level) {
      var l = document.querySelector('input[name="level"][value="' + level + '"]');
      if (l) l.checked = true;
    }
    if (equip) {
      var eq = document.querySelector('input[name="equip"][value="' + equip + '"]');
      if (eq) eq.checked = true;
    }
    if (days) {
      document.querySelectorAll('#daysGroup .chip').forEach(function (c) { c.classList.remove('active'); });
      var chip = document.querySelector('#daysGroup .chip[data-days="' + days + '"]');
      if (chip) chip.classList.add('active');
    }
    // 目标切换会显隐跑步器械/周期长度等分组
    if (typeof toggleEquip === 'function') toggleEquip();
  } catch (e) {}

  // 3. 滚到表单 + toast 告知预选结果
  var GOAL_NAME = { muscle: '增肌', strength: '力量', cut: '减脂', cardio: '心肺', marathon: '马拉松' };
  setTimeout(function () {
    try {
      var gGroup = document.getElementById('goalGroup');
      if (gGroup) gGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {}
    setTimeout(function () {
      if (typeof showToast === 'function') {
        var msg = goal ? ('✅ 已帮你选好「' + GOAL_NAME[goal] + '」，点下方按钮直接生成计划')
                       : '✅ 已按你的情况预选好，点下方按钮生成计划';
        showToast(msg);
      }
    }, 600);
  }, 300);

  // 4. 埋点: 来源 + 预选内容 (每篇文案一个 utm_campaign 就能分渠道统计)
  if (typeof track === 'function') {
    try {
      track('deeplink_visit', {
        goal: goal || '',
        level: level || '',
        days: days || '',
        equip: equip || '',
        utm_source: q.get('utm_source') || '',
        utm_campaign: q.get('utm_campaign') || ''
      });
    } catch (e) {}
  }

  // 5. 清掉地址栏参数, 刷新/分享时不再重复预选
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
})();

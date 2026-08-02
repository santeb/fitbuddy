// ============ FitBuddy 核心引擎 ============
// 本文件包含计划生成/渲染/进度追踪/营养计算/提醒系统UI
// 依赖 data-constants.js(必须先加载)

// 生产环境禁用 console.log(浏览器控制台执行 window._DEBUG=1 可重新启用)
(function(){ if (typeof window !== 'undefined' && !window._DEBUG) { var _noOp=function(){}; try{console.log=_noOp;}catch(e){} } })();

// 图表配置缓存(用于 resize 重绘)
window._chartConfigs = {};

// ============ 晨跑/夜跑进食时机切换 ============
function switchRunTiming(timingId, mode) {
  window._currentRunTime = mode; // 记住当前晨跑/夜跑模式,供 selectNutriDay 使用
  var container = document.getElementById(timingId);
  if (!container) return;

  var morningBtn = document.getElementById(timingId + '_morning');
  var eveningBtn = document.getElementById(timingId + '_evening');

  // 按钮高亮切换
  if (mode === 'morning') {
    morningBtn.style.background = 'linear-gradient(90deg,#FF6B35,#FF3E7F)';
    morningBtn.style.color = '#fff';
    eveningBtn.style.background = 'var(--bg)';
    eveningBtn.style.color = 'var(--text3)';
  } else {
    eveningBtn.style.background = 'linear-gradient(90deg,#FF6B35,#FF3E7F)';
    eveningBtn.style.color = '#fff';
    morningBtn.style.background = 'var(--bg)';
    morningBtn.style.color = 'var(--text3)';
  }

  // 更新进食时机
  var fg = FOOD_GUIDE.marathon;
  var timingData = (mode === 'morning') ? (fg.timingMorning || []) :
    (window._marathonTiming && window._marathonTiming[timingId]) || [];
  var html = '';
  timingData.forEach(function(t) {
    html += '<div style="font-size:12px;color:var(--text2);line-height:1.7;padding-left:14px;position:relative;">' +
      '<span style="position:absolute;left:0;">\u2022</span>' + t + '</div>';
  });
  container.innerHTML = html;

  // 更新示例食谱
  var mealsId = timingId.replace('_timing', '_meals');
  var mealsContainer = document.getElementById(mealsId);
  var params = window._marathonMealsParams && window._marathonMealsParams[mealsId];
  if (mealsContainer && params) {
    mealsContainer.innerHTML = renderDynamicMealPlan(
      params.nRest, params.goal, undefined,
      params.nTrain, params.dayCalBurns, params.nEasy,
      undefined, undefined, mode
    );
  }
}

function renderDynamicMealPlan(nRest, goal, isTrainingDay, nTrain, dayCalBurns, nEasy, longDay, dayLabel, runTime) {
  // 根据营养数据计算蛋白质/碳水乘数
  function calcMul(n) {
    if (!n) return { pMul: 1, cMul: 1 };
    var pMul = n.protein / 140;
    var cMul = n.carb / 250;
    pMul = Math.max(0.5, Math.min(2.2, pMul));
    cMul = Math.max(0.5, Math.min(2.2, cMul));
    return { pMul: pMul, cMul: cMul };
  }
  function sc(val, mul)  { return Math.round(val * mul / 5) * 5 || 5; }
  function scm(val, mul) { return Math.round(val * mul); }

  // 生成食谱数组(training: 是否训练日,n: 对应的营养数据,longDay: 马拉松长距离日)
  function makeMeals(training, n, longDay) {
    var mul = calcMul(n);
    var pMul = mul.pMul, cMul = mul.cMul;
    // runTime 来自外层 renderDynamicMealPlan 闭包
    if (goal === 'cut') {
      if (training) {
        return [
          {label:'早餐', items:'燕麦'+sc(45,cMul)+'g + 脱脂奶'+scm(200,pMul)+'ml + 蛋清3个 + 香蕉半根'},
          {label:'午餐(训前)', items:'糙米饭'+sc(90,cMul)+'g + 鸡胸肉'+sc(140,pMul)+'g + 西兰花250g'},
          {label:'晚餐(训后)', items:'红薯'+sc(100,cMul)+'g + 虾仁/龙利鱼'+sc(140,pMul)+'g + 菠菜250g + 橄榄油5g'}
        ];
      } else {
        return [
          {label:'早餐', items:'燕麦'+sc(35,cMul)+'g + 脱脂奶'+scm(180,pMul)+'ml + 蛋清3个 + 香蕉半根'},
          {label:'午餐', items:'糙米饭'+sc(80,cMul)+'g + 鸡胸肉'+sc(130,pMul)+'g + 西兰花250g'},
          {label:'晚餐', items:'红薯'+sc(100,cMul)+'g + 虾仁/龙利鱼'+sc(130,pMul)+'g + 菠菜250g'}
        ];
      }
    }
    if (goal === 'muscle' || goal === 'strength') {
      if (training) {
        return [
          {label:'早餐', items:'燕麦'+sc(55,cMul)+'g + 脱脂奶'+scm(250,pMul)+'ml + 水煮蛋2个 + 香蕉1根'},
          {label:'加餐1', items:'希腊酸奶'+sc(150,pMul)+'g + 蓝莓一小把'},
          {label:'午餐', items:'糙米饭'+sc(160,cMul)+'g + 鸡胸肉'+sc(160,pMul)+'g + 西兰花200g + 橄榄油5g'},
          {label:'训前加餐', items:'全麦面包1片 + 花生酱'+sc(10,pMul)+'g'},
          {label:'晚餐(训后)', items:'红薯'+sc(160,cMul)+'g + 三文鱼/瘦牛肉'+sc(130,pMul)+'g + 菠菜200g'},
          {label:'睡前', items:'牛奶'+scm(250,pMul)+'ml 或 酪蛋白粉1勺'}
        ];
      } else {
        return [
          {label:'早餐', items:'燕麦'+sc(45,cMul)+'g + 脱脂奶'+scm(200,pMul)+'ml + 水煮蛋2个 + 香蕉半根'},
          {label:'午餐', items:'糙米饭'+sc(130,cMul)+'g + 鸡胸肉'+sc(140,pMul)+'g + 西兰花200g'},
          {label:'加餐', items:'希腊酸奶'+sc(120,pMul)+'g + 蓝莓一小把'},
          {label:'晚餐', items:'红薯'+sc(130,cMul)+'g + 瘦肉'+sc(110,pMul)+'g + 菠菜200g'}
        ];
      }
    }
    // 马拉松专项
    if (goal === 'marathon') {
      var isEvening = runTime === 'evening';
      if (training) {
        if (longDay) {
          if (isEvening) {
            // 夜跑 - 长距离日
            return [
              {label:'早餐', items:'燕麦'+sc(60,cMul)+'g + 水煮蛋2个 + 香蕉1根 + 水300ml'},
              {label:'午餐(跑前3-4h)', items:'意面/米饭'+sc(200,cMul)+'g + 鸡胸肉/三文鱼'+sc(120,pMul)+'g + 西兰花200g + 橄榄油5g'},
              {label:'跑前加餐(跑前1h)', items:'香蕉1根 + 全麦面包1片 + 花生酱'+sc(10,pMul)+'g + 水200ml'},
              {label:'跑中补给', items:'能量胶1条/45min + 运动饮料200ml(LSD>15km时)'},
              {label:'跑后恢复(30min内)', items:'巧克力奶300ml + 香蕉1根 + 小面包1个'},
              {label:'晚餐(跑后正餐)', items:'米饭/面条'+sc(180,cMul)+'g + 虾仁/豆腐'+sc(110,pMul)+'g + 菠菜200g + 坚果10g'}
            ];
          } else {
            // 晨跑 - 长距离日(LSD/节奏跑 ≥800kcal):高碳水 + 跑中补给
            return [
              {label:'早餐(跑前2h)', items:'燕麦'+sc(80,cMul)+'g + 香蕉1根 + 蜂蜜1勺 + 水300ml'},
              {label:'跑中补给', items:'能量胶1条/45min + 运动饮料200ml(LSD>15km时)'},
              {label:'跑后恢复(30min内)', items:'巧克力奶300ml + 香蕉1根 + 小面包1个'},
              {label:'午餐', items:'意面/米饭'+sc(200,cMul)+'g + 鸡胸肉/三文鱼'+sc(120,pMul)+'g + 西兰花200g + 橄榄油5g'},
              {label:'加餐', items:'希腊酸奶'+sc(150,pMul)+'g + 蓝莓一小把 + 坚果10g'},
              {label:'晚餐', items:'米饭/面条'+sc(180,cMul)+'g + 虾仁/豆腐'+sc(110,pMul)+'g + 菠菜200g'}
            ];
          }
        } else {
          if (isEvening) {
            // 夜跑 - 轻松训练日
            return [
              {label:'早餐', items:'燕麦'+sc(50,cMul)+'g + 水煮蛋2个 + 香蕉1根 + 水200ml'},
              {label:'午餐(跑前3-4h)', items:'糙米饭'+sc(160,cMul)+'g + 鸡胸肉/鱼肉'+sc(120,pMul)+'g + 西兰花200g + 橄榄油5g'},
              {label:'跑前加餐(跑前1h)', items:'香蕉1根 + 全麦面包1片 + 水200ml'},
              {label:'跑后恢复', items:'巧克力奶250ml 或 蛋白粉+香蕉'},
              {label:'晚餐(跑后正餐)', items:'米饭/面条'+sc(150,cMul)+'g + 虾仁/豆腐'+sc(100,pMul)+'g + 菠菜200g'}
            ];
          } else {
            // 晨跑 - 轻松训练日(恢复跑/短距离 <800kcal)
            return [
              {label:'早餐(跑前1-2h)', items:'燕麦'+sc(60,cMul)+'g + 香蕉1根 + 水200ml'},
              {label:'跑后恢复', items:'巧克力奶250ml 或 蛋白粉+香蕉'},
              {label:'午餐', items:'糙米饭'+sc(160,cMul)+'g + 鸡胸肉/鱼肉'+sc(120,pMul)+'g + 西兰花200g + 橄榄油5g'},
              {label:'加餐', items:'全麦面包1片 + 花生酱'+sc(10,pMul)+'g + 香蕉半根'},
              {label:'晚餐', items:'米饭/面条'+sc(150,cMul)+'g + 虾仁/豆腐'+sc(100,pMul)+'g + 菠菜200g'}
            ];
          }
        }
      } else {
        return [
          {label:'早餐', items:'燕麦'+sc(60,cMul)+'g + 脱脂奶'+scm(200,pMul)+'ml + 水煮蛋2个 + 香蕉1根'},
          {label:'午餐', items:'糙米饭'+sc(150,cMul)+'g + 鸡胸肉/鱼肉'+sc(110,pMul)+'g + 西兰花200g + 橄榄油5g'},
          {label:'加餐', items:'全麦面包1片 + 花生酱'+sc(10,pMul)+'g + 香蕉半根'},
          {label:'晚餐', items:'面条/米饭'+sc(140,cMul)+'g + 虾仁/豆腐'+sc(100,pMul)+'g + 菠菜200g'}
        ];
      }
    }
    // 心肺 / 其他
    if (training) {
      return [
        {label:'早餐', items:'燕麦'+sc(65,cMul)+'g + 脱脂奶'+scm(250,pMul)+'ml + 水煮蛋2个 + 香蕉1根'},
        {label:'训前加餐', items:'全麦面包'+Math.max(1,Math.round(cMul))+'片 + 花生酱'+sc(10,pMul)+'g + 香蕉半根'},
        {label:'午餐', items:'糙米饭'+sc(160,cMul)+'g + 鸡胸肉/鱼肉'+sc(130,pMul)+'g + 西兰花200g'},
        {label:'训后加餐', items:'巧克力奶250ml 或 蛋白粉+香蕉'},
        {label:'晚餐', items:'面条/米饭'+sc(160,cMul)+'g + 虾仁/豆腐'+sc(110,pMul)+'g + 菠菜200g'}
      ];
    } else {
      return [
        {label:'早餐', items:'燕麦'+sc(55,cMul)+'g + 脱脂奶'+scm(200,pMul)+'ml + 水煮蛋2个 + 香蕉1根'},
        {label:'午餐', items:'糙米饭'+sc(140,cMul)+'g + 鸡胸肉/鱼肉'+sc(110,pMul)+'g + 西兰花200g'},
        {label:'晚餐', items:'面条/米饭'+sc(130,cMul)+'g + 虾仁/豆腐'+sc(90,pMul)+'g + 菠菜200g'}
      ];
    }
  }

  var html = '';
  // 马拉松专项:按跑量分层展示(休息日 + 轻松训练日 + 长距离日)
  if (goal === 'marathon' && (isTrainingDay === undefined || isTrainingDay === null) && dayCalBurns && dayCalBurns.length) {
    var LONG_BURN = 800; // kcal 分界线:≥800 为长距离日
    var hasLong = dayCalBurns.some(function(b){ return b >= LONG_BURN; });
    var hasEasy = dayCalBurns.some(function(b){ return b > 0 && b < LONG_BURN; });
    var restN = nRest;
    var trainN = nTrain || nRest;
    var easyN = nEasy || trainN; // 轻松训练日营养(碳水更低)

    html += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">';
    html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;">🍽️ 示例食谱(按跑量分层)</div>';

    // 休息日
    html += '<div style="margin-bottom:10px;">';
    html += '<div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:4px;">😴 休息日('+restN.protein+'g蛋白 / '+restN.carb+'g碳水 / '+restN.targetCal+'kcal)</div>';
    html += '<div style="font-size:12px;color:var(--text2);line-height:1.8;">';
    makeMeals(false, restN).forEach(function(m){ html += '<b>'+m.label+'</b>:'+m.items+'<br>'; });
    html += '</div></div>';

    // 轻松训练日(恢复跑/短距离)
    if (hasEasy) {
      html += '<div style="margin-bottom:10px;">';
      html += '<div style="font-size:12px;font-weight:600;color:#3B82F6;margin-bottom:4px;">🏃 轻松训练日·恢复跑/短距离('+easyN.protein+'g蛋白 / '+easyN.carb+'g碳水 / '+easyN.targetCal+'kcal)</div>';
      html += '<div style="font-size:12px;color:var(--text2);line-height:1.8;">';
      makeMeals(true, easyN, false).forEach(function(m){ html += '<b>'+m.label+'</b>:'+m.items+'<br>'; });
      html += '</div></div>';
    }

    // 长距离日(LSD/节奏跑)
    if (hasLong) {
      html += '<div style="margin-top:8px;">';
      html += '<div style="font-size:12px;font-weight:600;color:#EF4444;margin-bottom:4px;">🔥 长距离日·LSD/节奏跑('+trainN.protein+'g蛋白 / '+trainN.carb+'g碳水 / '+trainN.targetCal+'kcal)</div>';
      html += '<div style="font-size:12px;color:var(--text2);line-height:1.8;">';
      makeMeals(true, trainN, true).forEach(function(m){ html += '<b>'+m.label+'</b>:'+m.items+'<br>'; });
      html += '</div></div>';
    }

    // 如果只有一种训练日类型(全是长距离或全是短距离),补显示另一种作为参考
    if (!hasLong && !hasEasy) {
      html += '<div style="margin-bottom:10px;">';
      html += '<div style="font-size:12px;font-weight:600;color:var(--primary);margin-bottom:4px;">🏃 训练日('+trainN.protein+'g蛋白 / '+trainN.carb+'g碳水 / '+trainN.targetCal+'kcal)</div>';
      html += '<div style="font-size:12px;color:var(--text2);line-height:1.8;">';
      makeMeals(true, trainN, false).forEach(function(m){ html += '<b>'+m.label+'</b>:'+m.items+'<br>'; });
      html += '</div></div>';
    }

    html += '<div style="font-size:11px;color:var(--text3);margin-top:6px;">* 份量根据身体数据自动计算 · 长距离日≥800kcal消耗</div>';
    html += '</div>';
    return html;
  }
  // 默认展示两版(营养面板里)
  if (isTrainingDay === undefined || isTrainingDay === null) {
    var trainN = nTrain || nRest;
    var restN  = nRest;
    html += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">';
    html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;">🍽️ 示例食谱</div>';

    html += '<div style="margin-bottom:10px;">';
    html += '<div style="font-size:12px;font-weight:600;color:var(--primary);margin-bottom:4px;">🔥 训练日('+trainN.protein+'g蛋白 / '+trainN.carb+'g碳水)</div>';
    html += '<div style="font-size:12px;color:var(--text2);line-height:1.8;">';
    makeMeals(true, trainN).forEach(function(m){ html += '<b>'+m.label+'</b>:'+m.items+'<br>'; });
    html += '</div></div>';

    html += '<div style="margin-top:8px;">';
    html += '<div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:4px;">😴 休息日('+restN.protein+'g蛋白 / '+restN.carb+'g碳水)</div>';
    html += '<div style="font-size:12px;color:var(--text2);line-height:1.8;">';
    makeMeals(false, restN).forEach(function(m){ html += '<b>'+m.label+'</b>:'+m.items+'<br>'; });
    html += '</div></div>';

    html += '<div style="font-size:11px;color:var(--text3);margin-top:6px;">* 份量根据你的身体数据自动计算</div>';
    html += '</div>';
  } else {
    // 指定某一版(单日渲染)
    var n = isTrainingDay ? (nTrain || nRest) : nRest;
    var meals = makeMeals(isTrainingDay, n, longDay);
    var title;
    if (dayLabel) {
      title = dayLabel;
    } else if (isTrainingDay) {
      title = (goal === 'marathon' && longDay) ? '🔥 长距离日示例食谱' : '🔥 训练日示例食谱';
    } else {
      title = '😴 休息日示例食谱';
    }
    html += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">';
    html += '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;">'+title+'('+n.protein+'g蛋白 / '+n.carb+'g碳水 / '+n.targetCal+'kcal)</div>';
    html += '<div style="font-size:12px;color:var(--text2);line-height:1.8;">';
    meals.forEach(function(m){ html += '<b>'+m.label+'</b>:'+m.items+'<br>'; });
    html += '</div></div>';
  }
  return html;
}

var BADGE_COLORS = {"胸":["#FF6B35","#FFF0EB"],"背":["#3B82F6","#EFF6FF"],"腿":["#22C55E","#F0FDF4"],"肩":["#F59E0B","#FFFBEB"],"臂":["#EC4899","#FDF2F8"],"核心":["#8B5CF6","#F5F3FF"],"有氧":["#06B6D4","#ECFEFF"],"跑步":["#EF4444","#FEF2F2"],"康复":["#10B981","#ECFDF5"]};
var BADGE_TEXT = {"胸":"胸","背":"背","腿":"腿","肩":"肩","臂":"臂","核心":"芯","有氧":"氧","跑步":"跑","康复":"康"};
var MUSCLE_ORDER = ["腿","胸","背","肩","臂","核心","有氧","跑步","康复"];
var MUSCLE_LABELS = {腿:"腿部",胸:"胸部",背:"背部",肩:"肩部",臂:"手臂",核心:"核心",有氧:"有氧",跑步:"跑步"};

// ============ 深色模式 ============
function toggleTheme() {
  var cur = document.documentElement.getAttribute("data-theme");
  var next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "");
  var btn = document.getElementById("themeBtn");
  if (btn) { btn.textContent = next === "dark" ? "🌙" : "☀️"; btn.setAttribute("aria-pressed", next === "dark"); }
  localStorage.setItem("fitbuddy_theme", next);
}
function toggleEquip() {
  var goal = document.querySelector('input[name="goal"]:checked');
  var isMarathon = goal && goal.value === "marathon";
  document.getElementById("equipGroup").style.display = isMarathon ? "none" : "";
  document.getElementById("runEquipGroup").style.display = isMarathon ? "" : "none";
  // 马拉松默认每周4-6天,调整天数选项
  var chips = document.querySelectorAll('#daysGroup .chip');
  chips.forEach(function(c){ c.style.display = isMarathon && parseInt(c.dataset.days) < 4 ? "none" : ""; });
  // 确保至少选了4天
  if (isMarathon) {
    var activeChip = document.querySelector('#daysGroup .chip.active');
    if (activeChip && parseInt(activeChip.dataset.days) < 4) {
      var d4 = document.querySelector('#daysGroup .chip[data-days="4"]');
      if (d4) d4.classList.add("active");
      activeChip.classList.remove("active");
    }
  }
  savePrefs();
}
(function initTheme(){
  var saved = localStorage.getItem("fitbuddy_theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme","dark");
    document.getElementById("themeBtn").textContent = "🌙";
  }
})();

// 提醒系统在 doGenerate() 中初始化(提醒UI元素在计划生成区域)

// ============ 伤病/限制管理 ============
function saveInjury() {
  var chips = document.querySelectorAll('#injuryChips .chip.active');
  if (!chips.length) { clearInjury(); return; }
  var parts = [];
  chips.forEach(function(c){ parts.push(c.dataset.injury); });
  injuryFlag = { muscles: parts, note: document.getElementById('injuryNote').value.trim() };
  localStorage.setItem("fitbuddy_injury", JSON.stringify(injuryFlag));
  document.getElementById('injuryBody').style.display = 'none';
  document.getElementById('injuryToggleIcon').textContent = '▼';
  // 重新生成
  if (lastPlan) doGenerate();
}
function clearInjury() {
  injuryFlag = null;
  localStorage.removeItem("fitbuddy_injury");
  document.querySelectorAll('#injuryChips .chip').forEach(function(c){ c.classList.remove('active'); });
  document.getElementById('injuryNote').value = '';
  document.getElementById('injuryBody').style.display = 'none';
  document.getElementById('injuryToggleIcon').textContent = '▼';
  if (lastPlan) doGenerate();
}
// 检查动作是否被伤病标记跳过(改进版:部位映射 + 康复动作不过滤)
function isInjured(exName) {
  if (!injuryFlag || !injuryFlag.muscles || !injuryFlag.muscles.length) return false;
  // 找动作对象
  var exObj = null;
  for (var ei = 0; ei < EXES.length; ei++) {
    if (EXES[ei].n === exName) { exObj = EXES[ei]; break; }
  }
  if (!exObj) return false;
  // 康复动作永远不过滤
  if (exObj.m === '康复') return false;

  // 部位映射:伤病部位 → 需要跳过的动作部位
  var muscleMap = {
    '膝': ['腿'],
    '腰': ['背'],
    '肩': ['肩'],
    '腕': ['臂'],
    '踝': ['有氧']
  };
  // 关键词补充(某些动作名称含特定词,即使部位不对也要跳过)
  var keywordMap = {
    '膝': ['深蹲','箭步','腿举','跳跃','箱子跳','高抬腿','保加利亚','分腿蹲'],
    '腰': ['硬拉','健腹轮','超人'],
    '踝': ['跑步','跳绳','LSD','轻松跑','间歇跑','节奏跑','恢复跑','配速跑']
  };

  var skip = false;
  injuryFlag.muscles.forEach(function(m) {
    // 部位匹配
    if (muscleMap[m]) {
      muscleMap[m].forEach(function(mm) {
        if (exObj.m === mm) skip = true;
      });
    }
    // 关键词补充匹配
    if (keywordMap[m]) {
      keywordMap[m].forEach(function(kw) {
        if (exName.indexOf(kw) >= 0) skip = true;
      });
    }
  });
  return skip;
}

// ============ 周期管理 ============
function nextCycle() {
  currentCycle++;
  currentWeek = 1;
  if (lastPlan) {
    lastPlan.cycle = currentCycle;
    localStorage.setItem("fitbuddy_lastplan", JSON.stringify(lastPlan));
  }
  savePrefs();
  doGenerate();
}

// 标记本次打卡是否触发了自动跳周(防止 resetAllCheckmarks 冲突)
var _autoAdvanced = false;

// 训练打卡后自动检测:本周所有动作勾选完成 → 自动跳下一周
// 防止同周重复跳转：用 cycle+week 作为唯一标记，一旦跳过就不再跳
var _weekAdvancedKey = null; // 本次跳转的 cycle_week 标记

function checkAutoAdvanceWeek() {
  if (!lastPlan || !lastPlan.trainingDays) return;
  var goal = lastPlan.goal;
  var totalWeeks = goal === "marathon" ? 16 : 4;
  if (currentWeek >= totalWeeks) return;

  // 本周所有动作是否已勾选
  if (!checkWeekComplete()) return;

  // 防止同周重复跳转：用 cycle_week 做标记
  var advanceKey = currentCycle + "_" + currentWeek;
  if (_weekAdvancedKey === advanceKey) return; // 本周已经跳过
  _weekAdvancedKey = advanceKey;

  // 标记已跳转,防止 toggleDone 中的 resetAllCheckmarks 冲突
  _autoAdvanced = true;

  // 清理本周所有勾选标记（doneKey 包含 currentWeek，跳转后新周的 key 不同，但旧 key 残留会占空间）
  if (lastPlan && lastPlan.trainingDays) {
    for (var di = 0; di < lastPlan.trainingDays.length; di++) {
      var day = lastPlan.trainingDays[di];
      if (!day.exes) continue;
      for (var ei = 0; ei < day.exes.length; ei++) {
        localStorage.removeItem(doneKey("day_" + di + "_ex" + ei));
      }
    }
  }

  // 前进!
  currentWeek++;
  if (lastPlan) {
    lastPlan.week = currentWeek;
    localStorage.setItem("fitbuddy_lastplan", JSON.stringify(lastPlan));
  }
  savePrefs();

  // 延迟执行避免与勾选回调的 DOM 操作冲突
  var _cw = currentWeek;
  setTimeout(function(){ doGenerate(); }, 100);

  // 轻量 toast
  var t = document.createElement("div");
  t.style.cssText = "position:fixed;top:18px;left:50%;transform:translateX(-50%);background:#4F46E5;color:#fff;padding:10px 22px;border-radius:24px;font-size:14px;font-weight:700;z-index:999;box-shadow:0 4px 18px rgba(79,70,229,0.4);animation:fadeIn .3s ease;";
  t.textContent = "📅 第 " + (_cw-1) + " 周完成!自动进入第 " + _cw + " 周";
  document.body.appendChild(t);
  setTimeout(function(){ t.style.opacity = "0"; t.style.transition = "opacity .4s"; }, 2500);
  setTimeout(function(){ if (t.parentNode) t.remove(); }, 3000);
}

// ============ 动作替换 ============
var subTarget = null; // {dayIdx, exIdx, exName}
function openSubModal(dayIdx, exIdx, exName) {
  var ex = EXES.find(function(e){ return e.n === exName; });
  if (!ex) return;
  subTarget = {dayIdx:dayIdx, exIdx:exIdx, exName:exName};
  var muscle = ex.m;
  var level = lastPlan ? lastPlan.level : 'beginner';
  var equip = lastPlan ? lastPlan.equip : 'gym';
  var allowed = getExes(muscle, equip, level).filter(function(e){ return e.n !== exName && !isInjured(e.n); });
  if (!allowed.length) {
    alert('没有可用替代动作(相同肌群+设备+不触发伤病限制)');
    return;
  }
  var bc = BADGE_COLORS[muscle] || ["#888","#F5F5F5"];
  var bt = BADGE_TEXT[muscle] || (muscle ? muscle[0] : '?');
  var html = '<div class="sub-modal-title">🔄 替换「'+exName+'」</div>'+
    '<div class="sub-modal-sub">选择替代动作(同肌群 '+MUSCLE_LABELS[muscle]+')</div>';
  allowed.slice(0, 10).forEach(function(e, i){
    html += '<div class="sub-item" data-idx="'+i+'" data-name="'+e.n.replace(/'/g,"\\'")+'" onclick="selectSubItem(this,\''+e.n.replace(/'/g,"\\'")+'\')">'+
      '<div class="ex-badge" style="background:'+bc[1]+';color:'+bc[0]+';width:28px;height:28px;border-radius:8px;font-size:11px;">'+bt+'</div>'+
      '<div><div class="sub-item-name">'+e.n+'</div><div class="sub-item-meta">'+e.diff+' · '+e.desc+'</div></div>'+
    '</div>';
  });
  html += '<div class="sub-actions"><button class="sub-cancel" onclick="closeSubModal()">取消</button>'+
    '<button class="sub-confirm" id="subConfirmBtn" onclick="confirmSub()">确认替换</button></div>';
  document.getElementById('subModalBody').innerHTML = html;
  document.getElementById('subModal').classList.add('show');
}
var selectedSubName = '';
function selectSubItem(el, name) {
  document.querySelectorAll('#subModal .sub-item').forEach(function(x){ x.classList.remove('selected'); });
  el.classList.add('selected');
  selectedSubName = name;
}
function confirmSub() {
  if (!selectedSubName || !subTarget) return;
  // 更新 plan 并重新渲染
  if (lastPlan && lastPlan.trainingDays && lastPlan.trainingDays[subTarget.dayIdx] && lastPlan.trainingDays[subTarget.dayIdx].exes) {
    var newEx = EXES.find(function(e){ return e.n === selectedSubName; });
    if (newEx) {
      lastPlan.trainingDays[subTarget.dayIdx].exes[subTarget.exIdx] = newEx;
      localStorage.setItem("fitbuddy_lastplan", JSON.stringify(lastPlan));
    }
  }
  closeSubModal();
  _skipRebuild = true;
  doGenerate();
}
function closeSubModal() {
  document.getElementById('subModal').classList.remove('show');
  selectedSubName = '';
  subTarget = null;
}

// ============ 数据持久化加载 ============
function loadAllData() {
  try {
    var inj = localStorage.getItem("fitbuddy_injury");
    if (inj) { try { injuryFlag = JSON.parse(inj); updateInjuryUI(); } catch(e) {} }
  } catch(e) {}
  try {
    var log = localStorage.getItem("fitbuddy_trainlog");
    if (log) { try { trainingLog = JSON.parse(log); } catch(e) {} }
  } catch(e) {}
  try {
    var shoes = localStorage.getItem("fitbuddy_shoes");
    if (shoes) { try { shoeList = JSON.parse(shoes); } catch(e) {} }
  } catch(e) {}
  try {
    var planRaw = localStorage.getItem("fitbuddy_lastplan");
    var plan = planRaw ? JSON.parse(planRaw) : null;
    if (plan && plan.goal && plan.trainingDays) {
      lastPlan = plan;
      if (plan.cycle) currentCycle = plan.cycle;
      if (plan.week) currentWeek = plan.week;
    }
  } catch(e) { console.warn('fitbuddy_lastplan 解析失败,数据已重置'); localStorage.removeItem('fitbuddy_lastplan'); }
  try {
    var paces = localStorage.getItem("fitbuddy_marathon_paces");
    if (paces) { try { window._marathonPaces = JSON.parse(paces); } catch(e) {} }
  } catch(e) {}
}
function updateInjuryUI() {
  if (!injuryFlag) return;
  document.querySelectorAll('#injuryChips .chip').forEach(function(c){
    if (injuryFlag.muscles && injuryFlag.muscles.indexOf(c.dataset.injury) >= 0) c.classList.add('active');
  });
  document.getElementById('injuryNote').value = injuryFlag.note || '';
}

// ============ 核心函数 ============
function getExes(muscle, equip, level) {
  var diffRank = {"初级":1,"中级":2,"高级":3};
  var eqRank = {};
  if (equip === "gym") eqRank = {gym:0, dumbbell:1, bodyweight:2};
  else if (equip === "dumbbell") eqRank = {dumbbell:0, bodyweight:1, gym:2};
  else eqRank = {bodyweight:0, dumbbell:1, gym:2};
  var allowed = {beginner:["初级"], intermediate:["初级","中级"], advanced:["初级","中级","高级"]};
  var levelAllowed = allowed[level] || ["初级"];
  var filtered = EXES.filter(function(e) {
    if (e.m !== muscle) return false;
    if (levelAllowed.indexOf(e.diff) < 0) return false;
    if (equip === "gym") return true;
    if (equip === "dumbbell") return e.eq === "dumbbell" || e.eq === "bodyweight";
    if (equip === "bodyweight") return e.eq === "bodyweight";
    return true;
  });
  filtered.sort(function(a,b){
    var da = diffRank[a.diff] || 0, db = diffRank[b.diff] || 0;
    if (level === "advanced") { var t = da; da = db; db = t; }
    if (da !== db) return da - db;
    var ea = (eqRank[a.eq] !== undefined) ? eqRank[a.eq] : 9;
    var eb = (eqRank[b.eq] !== undefined) ? eqRank[b.eq] : 9;
    return ea - eb;
  });
  return filtered;
}

function pickExes(arr, count, weekOffset) {
  if (!arr || !arr.length) return [];
  var off = weekOffset || 0;
  // 按周轮换:将数组旋转 off 位,让不同周选不同动作
  var rotated = arr.slice(off % arr.length).concat(arr.slice(0, off % arr.length));
  return rotated.slice(0, Math.min(count, rotated.length));
}

function getFullBody(equip, level, goal, weekOffset) {
  var muscles = goal === "cardio" ? ["腿","胸","背","核心","有氧"] : ["腿","胸","背","肩","核心"];
  var list = [];
  muscles.forEach(function(m){
    var ex = getExes(m, equip, level);
    if (ex.length) {
      var picked = pickExes(ex, 1, weekOffset);
      if (picked && picked[0]) list.push(picked[0]);
    }
  });
  return list;
}

function dedup(arr) {
  var seen = {};
  return arr.filter(function(e){ if(!e||seen[e.n])return false; seen[e.n]=true; return true; });
}

// ============ 日程安排 ============
function getSchedule(days) {
  var names = ["周一","周二","周三","周四","周五","周六","周日"];
  var trainingIdx;
  if      (days === 2) trainingIdx = [0, 3];
  else if (days === 3) trainingIdx = [0, 2, 4];
  else if (days === 4) trainingIdx = [0, 1, 3, 4];
  else if (days === 5) trainingIdx = [0, 1, 2, 3, 4];
  else if (days === 6) trainingIdx = [0, 1, 2, 3, 4, 5];
  else                 trainingIdx = [0, 1, 2, 3, 4, 5, 6];
  return names.map(function(name, i) {
    return { day: name, isTraining: trainingIdx.indexOf(i) >= 0 };
  });
}

// ============ 营养计算 ============
// dayCalBurn: 当天训练消耗(kcal),0=休息日,>0=训练日
function calcNutrition(weight, height, age, gender, goal, dayCalBurn) {
  if (!weight || !height || !age) return null;
  var bmr = gender === "male"
    ? 10*weight + 6.25*height - 5*age + 5
    : 10*weight + 6.25*height - 5*age - 161;
  var tdee = bmr * 1.55;
  // 训练日:TDEE + 运动消耗
  var isTrainingDay = dayCalBurn && dayCalBurn > 0;
  var activityCal = isTrainingDay ? dayCalBurn : 0;
  var targetCal, protein, carb, fat;
  if (goal === "muscle") {
    // 增肌:休息日4.0,训练日4.0~6.0(每300kcal+1,封顶+2)
    targetCal = tdee + (isTrainingDay ? 300 + activityCal : 200);
    protein = weight * 2.0; carb = weight * (isTrainingDay ? 4.0 + Math.min(activityCal / 300, 2) : 4.0); fat = weight * 1;
  }
  else if (goal === "strength") {
    // 力量:休息日4.0,训练日4.0~5.5(每300kcal+1,封顶+1.5)
    targetCal = tdee + (isTrainingDay ? 200 + activityCal : 100);
    protein = weight * 1.8; carb = weight * (isTrainingDay ? 4.0 + Math.min(activityCal / 300, 1.5) : 4.0); fat = weight * 1;
  }
  else if (goal === "cut") {
    // 减脂:休息日2.0,训练日2.0~3.0(每400kcal+1,封顶+1)
    targetCal = tdee + (isTrainingDay ? -200 + activityCal : -450);
    protein = weight * 1.8; carb = weight * (isTrainingDay ? 2.0 + Math.min(activityCal / 400, 1) : 2.0); fat = weight * 0.8;
  }
  else if (goal === "marathon") {
    // 马拉松:休息日5.0,训练日5.0~9.0(每300kcal+1,封顶+4)
    targetCal = tdee + (isTrainingDay ? 200 + activityCal : 100);
    protein = weight * 1.4;
    carb = weight * (isTrainingDay ? 5 + Math.min(activityCal / 300, 4) : 5);
    fat = weight * 1;
  }
  else if (goal === "cardio") {
    // 心肺:休息日4.5,训练日4.5~6.5(每300kcal+1,封顶+2)
    targetCal = tdee + (isTrainingDay ? 100 + activityCal : 0);
    protein = weight * 1.4; carb = weight * (isTrainingDay ? 4.5 + Math.min(activityCal / 300, 2) : 4.5); fat = weight * 1;
  }
  else {
    targetCal = tdee + activityCal;
    protein = weight * 1.4; carb = weight * (isTrainingDay ? 3.0 + Math.min(activityCal / 300, 1) : 3.0); fat = weight * 0.8;
  }
  // 保证最低摄入
  targetCal = Math.max(targetCal, 1200);
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee),
    targetCal: Math.round(targetCal),
    protein: Math.round(protein),
    carb: Math.round(carb),
    fat: Math.round(fat),
    isTrainingDay: isTrainingDay,
    dayCalBurn: dayCalBurn || 0
  };
}

// 估算单个训练日的运动消耗(kcal)
function estimateDayCalBurn(day, goal, weight, level) {
  if (!day.exes || !weight) return 0;
  var total = 0;
  // 过滤伤病动作
  var exes = day.exes.filter(function(ex){ return !ex._injured; });
  if (goal === "marathon") {
    // 跑步:体重kg × 距离km ≈ 消耗kcal
    var fallbackDist = {beginner:5, intermediate:8, advanced:10}[level] || 5;
    exes.forEach(function(ex) {
      var dist = 0;
      var m1 = ex.n.match(/(\d+\.?\d*)\s*km/i);           // "LSD 12km"
      var m2 = ex.n.match(/(\d+)\s*x\s*(\d+)\s*m/i);      // "6×800m"
      var m3 = ex.n.match(/(\d+)-(\d+)\s*km/i);           // "6-8km" → 取均值
      if (m1) dist = parseFloat(m1[1]);
      else if (m2) dist = parseInt(m2[1]) * parseInt(m2[2]) / 1000;
      else if (m3) dist = (parseFloat(m3[1]) + parseFloat(m3[2])) / 2;
      else dist = fallbackDist; // 无显式距离时按水平兜底
      total += Math.round(weight * dist);
    });
  } else if (goal === "cardio") {
    exes.forEach(function(ex) {
      if (ex.m === "有氧") {
        var m = ex.n.match(/(\d+\.?\d*)\s*km/i);
        if (m) total += Math.round(weight * parseFloat(m[1]));
        else total += {beginner:350, intermediate:450, advanced:600}[level] || 400;
      }
    });
  } else {
    // 力量训练:按水平和动作数估算
    var baseBurn = {beginner:280, intermediate:380, advanced:500}[level] || 300;
    var exCount = exes.length;
    total = Math.round(baseBurn + exCount * 20); // 每个动作约20kcal额外
  }
  return total;
}

// ============ 周期/伤病/跑鞋/训练日志 状态 ============
var currentWeek = 1;
var currentCycle = 1;
var lastPlan = null;
var _skipRebuild = false; // 动作替换后跳过buildPlan
// 伤病标记:{muscle:"膝", skipSquat:true, note:""} 或 null
var injuryFlag = null;
// 训练日志:{exName: [{date, weight, reps, rpe}]}
var trainingLog = {};
// 跑鞋数据:[{name, startDate, totalKm, retired}]
var shoeList = [];

// ============ 今日训练提醒 ============
function updateTodayBanner() {
  var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
  var banner = document.getElementById("todayBanner");
  if (!plan || !plan.trainingDays || plan.trainingDays.length === 0) { banner.style.display = "none"; return; }

  var today = new Date();
  var dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
  var todayName = dayNames[today.getDay()];
  var dateStr = (today.getMonth()+1)+'月'+today.getDate()+'日 '+todayName;

  // 简单匹配:根据训练天数找今天该练什么
  var daysPerWeek = plan.trainingDays.length;
  var weekday = today.getDay(); // 0=周日
  // 把周日=0 映射成计划里的"休息日"或"第N天"
  var traindayIdx = -1;
  if (plan.schedule) {
    for (var si = 0; si < plan.schedule.length; si++) {
      if (plan.schedule[si].day.indexOf(todayName) >= 0) {
        traindayIdx = si; break;
      }
    }
  }
  // fallback:按顺序轮
  if (traindayIdx < 0) {
    var seed = (today.getFullYear()*10000 + (today.getMonth()+1)*100 + today.getDate());
    traindayIdx = seed % plan.trainingDays.length;
  }

  var dayData = plan.trainingDays[traindayIdx] || plan.trainingDays[0];
  var isRest = !dayData || dayData.length === 0 || (dayData.exes && dayData.exes.length === 0);

  if (isRest) {
    document.getElementById("bannerDate").textContent = dateStr;
    document.getElementById("bannerTitle").textContent = '😴 今天是休息日';
    document.getElementById("bannerSub").textContent = '好好恢复,明天继续';
  } else {
    var exNames = (dayData.exes || []).slice(0,3).map(function(e){ return e.n; }).join('、');
    var totalEx = (dayData.exes || []).length;
    document.getElementById("bannerDate").textContent = dateStr;
    document.getElementById("bannerTitle").textContent = '🏋️ 今日训练:' + (dayData.title || ('第'+(traindayIdx+1)+'练'));
    document.getElementById("bannerSub").textContent = exNames + (totalEx > 3 ? ' 等'+totalEx+'个动作' : '');
  }
  banner.style.display = "";
}
function scrollToPlan() {
  var el = document.getElementById("planResult");
  if (el) el.scrollIntoView({behavior:"smooth", block:"start"});
}

// ============ 计划生成 ============
// 页面初始化时恢复上次计划(不操作按钮,不显示 Loading)
function renderRestoredPlan() {
  if (!lastPlan || !lastPlan.trainingDays) return;
  // 恢复表单参数(让 UI 状态一致)
  try {
    var gEl = document.querySelector('input[name="goal"][value="'+lastPlan.goal+'"]');
    if (gEl) gEl.checked = true;
    var lEl = document.querySelector('input[name="level"][value="'+lastPlan.level+'"]');
    if (lEl) lEl.checked = true;
    var dEl = document.querySelector('input[name="days"][value="'+lastPlan.days+'"]');
    if (dEl) dEl.checked = true;
    var eEl = document.querySelector('input[name="equip"][value="'+lastPlan.equip+'"]');
    if (eEl) eEl.checked = true;
    if (lastPlan.cycle) currentCycle = lastPlan.cycle;
  } catch(e) {}
  // 复用 doGenerate 的核心逻辑(同步渲染)
  var goal  = lastPlan.goal;
  var level = lastPlan.level;
  var days  = lastPlan.days;
  var equip = lastPlan.equip;
  var trainingDays = lastPlan.trainingDays;
  var schedule = lastPlan.schedule || getSchedule(days);
  var cfg = CONFIGS[level] || CONFIGS.beginner;
  var goalCfg = cfg[goal] || cfg.muscle;
  // 伤病过滤
  trainingDays.forEach(function(day){ if (day.exes) day.exes.forEach(function(ex){ delete ex._injured; }); });
  if (injuryFlag && injuryFlag.muscles && injuryFlag.muscles.length) {
    trainingDays.forEach(function(day){ if (day.exes) day.exes.forEach(function(ex){ if (isInjured(ex.n)) ex._injured = true; }); });
  }
  // 直接用 _skipRebuild 机制复用 trainingDays,不重新生成
  _skipRebuild = true;
  doGenerateInternal(goal, level, days, equip, trainingDays, schedule, cfg, goalCfg);
}

// 渲染伤病横幅
function renderInjuryBanner() {
  if (!injuryFlag || !injuryFlag.muscles || !injuryFlag.muscles.length) return '';
  var parts = injuryFlag.muscles;
  var desc = parts.join('、') + '不适';
  var note = injuryFlag.note ? '<br><span style="font-size:11px;opacity:0.8;">💬 '+injuryFlag.note+'</span>' : '';
  return '<div class="injury-banner">'+
    '<div>⚠️ 已标记:<b>'+desc+'</b> - 相关训练动作已跳过'+note+'</div>'+
    '<button class="inj-clear" onclick="clearInjury()">✕ 清除</button></div>';
}

// 渲染康复动作推荐卡片
function renderRecoveryCard() {
  if (!injuryFlag || !injuryFlag.muscles || !injuryFlag.muscles.length) return '';
  // 伤病部位 → 康复动作名关键词
  var recoveryMap = {
    '膝': ['直腿抬高','靠墙静蹲','踝关节泵','髋外展'],
    '腰': ['猫牛式','死虫式','鸟狗式','骨盆倾斜'],
    '肩': ['肩部环绕','墙面滑行','肩部外旋','门框拉伸'],
    '腕': ['手腕屈伸','手指展开','前臂旋转'],
    '踝': ['脚踝字母','提踵','脚踝环绕']
  };
  var selected = [];
  injuryFlag.muscles.forEach(function(m) {
    if (recoveryMap[m]) {
      recoveryMap[m].forEach(function(kw) {
        EXES.forEach(function(ex) {
          if (ex.m === '康复' && ex.n.indexOf(kw) >= 0 && selected.indexOf(ex.n) < 0) {
            selected.push(ex.n);
          }
        });
      });
    }
  });
  if (!selected.length) return '';
  var html = '<div class="recovery-card">'+
    '<div class="recovery-title">💊 康复动作推荐</div>'+
    '<div class="recovery-sub">以下动作安全温和,适合当前阶段进行</div>'+
    '<div class="recovery-exes">';
  selected.forEach(function(n) {
    var ex = EXES.find(function(e){ return e.n === n; });
    var tip = ex ? ex.tips : '';
    html += '<div class="recovery-ex" title="'+tip+'" style="cursor:pointer;" onclick="showEx(\''+n.replace(/'/g,"\\'")+'\')">'+n+'</div>';
  });
  html += '</div></div>';
  return html;
}

// doGenerate 内部核心渲染逻辑(抽取出来,初始化和恢复都可以用)
function doGenerateInternal(goal, level, days, equip, trainingDays, schedule, cfg, goalCfg) {
  if (!trainingDays || !Array.isArray(trainingDays) || trainingDays.length === 0) {
    trainingDays = [{day:"第1天",isTraining:true,exes:[{n:"深蹲",m:"腿",p:"腿",s:"初级",eq:"gym",diff:"初级",desc:"徒手深蹲",tips:"脚跟贴地",vid:"aclHkVaku9U",_exId:"squat"}]}];
  }
  var goalNames  = {muscle:"增肌",strength:"力量",cut:"减脂",cardio:"心肺",marathon:"马拉松"};
  var levelNames = {beginner:"新手 🌱",intermediate:"中级 ⚡",advanced:"进阶 🔥"};
  var equipNames = {gym:"健身房 🏟️",dumbbell:"哑铃+自重 🏠",bodyweight:"仅自重 🤸",outdoor:"户外路跑 🌳",treadmill:"跑步机 🖥️"};
  var wkInfo = WEEK_INFO[(currentWeek - 1) % 4];
  // 心肺目标:使用心肺专用周期化配置覆盖 wkInfo 和 goalCfg
  var cardioWeekCfg = null;
  if (goal === 'cardio' && typeof CARDIO_WEEK_CONFIG !== 'undefined') {
    cardioWeekCfg = CARDIO_WEEK_CONFIG[(currentWeek - 1) % 4];
    wkInfo = {note: cardioWeekCfg.note, deload: cardioWeekCfg.deload, weightAdjust: cardioWeekCfg.weightAdjust};
    // 覆盖 goalCfg 中的心肺参数为周特定值
    var baseDuration = parseInt(goalCfg.totalDuration) || 30;
    var weekDuration = Math.max(10, Math.round(baseDuration * cardioWeekCfg.durationPct));
    goalCfg = Object.assign({}, goalCfg, {
      totalDuration: weekDuration + '分钟',
      hiitPerSet: cardioWeekCfg.hiitPerSet,
      intensity: cardioWeekCfg.intensity,
      rpe: cardioWeekCfg.rpe
    });
  }
  var warmup = getWarmup(level, goal);
  var tips = GOAL_TIPS[goal] || [];
  var nutrition = null;
  try {
    var weight = parseFloat(document.getElementById('bodyWeight').value) || 0;
    var height = parseFloat(document.getElementById('bodyHeight').value) || 0;
    var age = parseInt(document.getElementById('bodyAge').value) || 0;
    var gender = document.querySelector('input[name="gender"]:checked');
    if (gender) gender = gender.value;
    // 分别算休息日和训练日的营养数据
    var restBurn = 0;
    var maxBurn  = dayCalBurns && dayCalBurns.length ? Math.max.apply(null, dayCalBurns) : 0;
    nutrition = calcNutrition(weight, height, age, gender || 'male', goal, restBurn);
    // 用最大训练日消耗作为训练日营养参考
    var nutritionTrain = maxBurn > 0 ? calcNutrition(weight, height, age, gender || 'male', goal, maxBurn) : null;
    // 马拉松:额外计算轻松训练日营养(用轻松日的平均消耗,与长距离日区分)
    var nutritionEasy = null;
    if (goal === 'marathon' && dayCalBurns && dayCalBurns.length) {
      var easyBurns = dayCalBurns.filter(function(b){ return b > 0 && b < 800; });
      var avgEasyBurn = easyBurns.length ? easyBurns.reduce(function(a,b){return a+b;},0) / easyBurns.length : 0;
      if (avgEasyBurn > 0) {
        nutritionEasy = calcNutrition(weight, height, age, gender || 'male', goal, avgEasyBurn);
      }
    }
  } catch(e) {}
  try {
  var html = "";
  var intensityStr = goal === "marathon" ? "LSD最长 " + goalCfg.longRunMax + "km" : goalCfg.intensity;
  // 马拉松:动态计算实际周跑量,覆盖静态配置
  if (goal === "marathon" && trainingDays) {
    var actualKm = calcMarathonWeekKm(trainingDays);
    if (actualKm) goalCfg = Object.assign({}, goalCfg, {_weekKm: actualKm});
  }
  html += renderSummary(goalNames[goal], levelNames[level], equipNames[equip], days, goalCfg, cfg.sets, intensityStr, goal);
  var isLastWeek = goal === "marathon" ? (currentWeek >= 16) : (currentWeek >= 4);
  if (isLastWeek) {
    html += '<div class="cycle-banner"><div class="cycle-info">🔄 当前:第'+currentCycle+'周期 · 第'+currentWeek+'周'+
      '<br><span style="font-size:11px;font-weight:400;">'+(goal==='marathon'?'16周计划已完成,可重新开始或调整目标':(currentCycle>=3?'已进行3个周期,建议调整目标或增加训练天数':'建议增加重量5%,开始新周期'))+'</span></div>'+
      '<button class="cycle-btn" onclick="nextCycle()">▶ 下一周期</button></div>';
  } else {
    html += '<div style="font-size:11px;color:var(--text3);margin-bottom:12px;text-align:center;">第 '+currentCycle+' 周期 · 第 '+currentWeek+' 周</div>';
  }
  // 周选择器 + 进度面板
  html += renderWeekBar(goal);
  if (goal === "marathon") {
    html += renderMarathonProgress(wkInfo, goalCfg, level, cfg);
  } else {
    html += renderWeekInfo(wkInfo);
  }
  // 伤病横幅 + 康复动作推荐
  html += renderInjuryBanner();
  html += renderRecoveryCard();
  // 训练要点
  html += renderTipsBanner(tips);
  // 运动消耗:用体重+目标+水平的正确算法(而非逐动作瞎估)
  var userWeight = parseFloat(document.getElementById('bodyWeight').value) || 70;
  var dayCalBurns = trainingDays.map(function(day){
    return estimateDayCalBurn(day, goal, userWeight, level);
  });
  // 营养建议面板(仅填了身体数据时显示)
  if (nutrition && nutrition.targetCal) {
    var avgTrainBurn = 0, maxTrainBurn = 0;
    if (dayCalBurns && dayCalBurns.length) {
      avgTrainBurn = Math.round(dayCalBurns.reduce(function(a,b){return a+b;},0) / dayCalBurns.length);
      maxTrainBurn = Math.max.apply(null, dayCalBurns);
    }
    // 存储营养上下文,供 chip 切换时重新渲染食谱
    _lastNutriCtx = { weight: weight, height: height, age: age, gender: gender || 'male', goal: goal,
                      nRest: nutrition, nTrain: nutritionTrain, nEasy: nutritionEasy, dayCalBurns: dayCalBurns };
    html += renderNutrition(nutrition, goal, avgTrainBurn, maxTrainBurn, schedule, trainingDays, dayCalBurns, nutritionTrain, nutritionEasy);
  }
  var trainSchedule = schedule.filter(function(s){ return s.isTraining; });
  // 心肺目标:按周调整 HIIT 组数
  var cardioSets = cfg.sets;
  if (cardioWeekCfg) {
    cardioSets = Math.max(2, cfg.sets + cardioWeekCfg.hiitRoundsAdjust);
  }
  trainingDays.forEach(function(day, i){
    var di = trainSchedule[i] || {day:"第"+(i+1)+"天", isTraining:true};
    var daySets = goal === 'cardio' ? cardioSets : cfg.sets;
    html += renderDayCard(di.day, day, daySets, goalCfg, warmup, wkInfo, goal, dayCalBurns[i] || 0, cfg, i);
  });
  var restDays = schedule.filter(function(s){ return !s.isTraining; });
  if (restDays.length) {
    var restTipsArr = REST_TIPS[goal] || [];
    html += '<div class="rest-day"><div class="rest-icon">😴</div><div><div class="rest-text-title">'+
      restDays.map(function(r){return r.day;}).join(" / ")+' · 休息日</div>'+
      '<div class="rest-text-sub">充分恢复,保证睡眠 7-9 小时</div>'+
      '<div class="rest-tips">'+ restTipsArr.map(function(t){return "• "+t;}).join("<br>") +'</div></div></div>';
  }
  html += '<div style="text-align:center;margin:16px 0;">'+
    '<button class="btn-generate" style="background:var(--card);color:var(--text);border:1.5px solid var(--border);box-shadow:none;font-size:13px;padding:10px 24px;width:auto;display:inline-flex;" onclick="exportPlan()">'+
    '🖨 打印/导出计划</button></div>';
  // 🐉 健身精灵宠物
  html += '<div id="petArea">' + (typeof renderPetCard === 'function' ? renderPetCard() : '') + '</div>';
  document.getElementById("planResult").innerHTML = html;
  updateTodayBanner();
  } catch(renderErr) {
    document.getElementById("planResult").innerHTML = '<div style="background:var(--card);border-radius:16px;padding:24px;text-align:center;color:var(--text);">'
      + '<div style="font-size:32px;margin-bottom:8px;">\u26a0\ufe0f</div>'
      + '<div style="font-size:15px;font-weight:700;">\u751f\u6210\u8ba1\u5212\u51fa\u9519</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:8px;">' + (renderErr.message || String(renderErr)) + '</div>'
      + '</div>';
  }
}

// ============ 训练提醒系统 ============

  // 加载提醒设置并初始化 UI
  function initReminderUI() {
    var rem = JSON.parse(localStorage.getItem("fitbuddy_reminder") || "null");
    var toggle = document.getElementById("reminderToggle");
    var settings = document.getElementById("reminderSettings");
    var timeInput = document.getElementById("reminderTime");
    var notifBtn = document.getElementById("notifPermBtn");
    var notifStatus = document.getElementById("notifStatus");
    if (!toggle) return;

    if (rem && rem.enabled) {
      toggle.checked = true;
      settings.style.display = "";
      if (timeInput && rem.time) timeInput.value = rem.time;
      updateNotifButton();
    } else {
      toggle.checked = false;
      settings.style.display = "none";
    }

    // 初始化训练日提示
    updateReminderTrainDays();
    // 检查是否该提醒
    checkReminder();
    // 确保提醒设置同步到 IndexedDB(SW 可读)
    if (rem && rem.enabled) syncReminderToIDB(rem);
  }

  // 更新通知权限按钮状态
  function updateNotifButton() {
    var notifBtn = document.getElementById("notifPermBtn");
    var notifStatus = document.getElementById("notifStatus");
    if (!("Notification" in window)) {
      if (notifStatus) notifStatus.textContent = "浏览器不支持通知";
      return;
    }
    if (Notification.permission === "granted") {
      if (notifBtn) notifBtn.style.display = "none";
      if (notifStatus) notifStatus.innerHTML = "🔔 浏览器通知已开启";
    } else if (Notification.permission === "denied") {
      if (notifBtn) notifBtn.style.display = "none";
      if (notifStatus) notifStatus.innerHTML = "⚠️ 通知被拒绝,请在浏览器设置中开启";
    } else {
      if (notifBtn) {
        notifBtn.style.display = "";
        notifBtn.textContent = "🔔 开启浏览器通知";
      }
      if (notifStatus) notifStatus.textContent = "开启通知可在后台提醒你训练";
    }
  }

  // 请求浏览器通知权限
  function requestNotifPermission() {
    if (!("Notification" in window)) {
      alert("你的浏览器不支持网页通知功能");
      return;
    }
    Notification.requestPermission(function(result) {
      updateNotifButton();
      if (result === "granted") {
        // 立即发送一条测试通知
        try {
          new Notification("FitBuddy 训练提醒已开启!", {
            body: "每天 " + (document.getElementById("reminderTime") || {}).value + " 我会提醒你训练 💪",
            icon: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23FF6B35"/><text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">🏋️</text></svg>')
          });
        } catch(e) {}
      }
    });
  }

  // 保存提醒设置
  function saveReminderSettings() {
    var enabled = document.getElementById("reminderToggle").checked;
    var time = document.getElementById("reminderTime").value || "20:00";
    var rem = { enabled: enabled, time: time, snoozedUntil: null };
    localStorage.setItem("fitbuddy_reminder", JSON.stringify(rem));
    document.getElementById("reminderSettings").style.display = enabled ? "" : "none";
    updateNotifButton();
    updateReminderTrainDays();
    if (enabled) scheduleNextReminder();

    // 同步到 IndexedDB,让 SW 在后台也能读取
    syncReminderToIDB(rem);
  }

  // 同步提醒设置到 IndexedDB(SW 可访问)
  function syncReminderToIDB(settings) {
    try {
      var dbReq = indexedDB.open("fitbuddy_reminder_db", 1);
      dbReq.onerror = function() {};
      dbReq.onupgradeneeded = function(e) {
        try { e.target.result.createObjectStore("settings", { keyPath: "key" }); } catch(ex) {}
      };
      dbReq.onsuccess = function(e) {
        try {
          var tx = e.target.result.transaction("settings", "readwrite");
          var store = tx.objectStore("settings");
          store.put({ key: "reminder", enabled: settings.enabled, time: settings.time });
        } catch(ex) {}
      };
    } catch(e) {}
  }

  // 主动通知 SW 发送系统通知
  function notifySWNotification(title, body) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: title,
        body: body
      });
    }
  }

  // 更新提醒训练日提示
  function updateReminderTrainDays() {
    var el = document.getElementById("reminderTrainDays");
    if (!el) return;
    var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
    if (!plan || !plan.schedule) { el.textContent = ""; return; }
    var trainDays = plan.schedule.filter(function(s){ return s.isTraining; }).map(function(s){ return s.day; });
    if (trainDays.length) {
      el.textContent = "📅 训练日:" + trainDays.join("、");
    } else {
      el.textContent = "";
    }
  }

  // 检查是否该显示提醒
  function checkReminder() {
    var rem = JSON.parse(localStorage.getItem("fitbuddy_reminder") || "null");
    if (!rem || !rem.enabled) return;

    var now = new Date();
    var [h, m] = (rem.time || "20:00").split(":").map(Number);
    var remindDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    var diff = now - remindDate; // ms
    var diffMin = diff / 60000; // minutes

    // 如果已延后,忽略
    if (rem.snoozedUntil) {
      var snoozeUntil = new Date(rem.snoozedUntil);
      if (now < snoozeUntil) return;
    }

    // 在提醒时间±30分钟内,且今天还没提醒过
    if (diffMin >= -30 && diffMin <= 30) {
      var todayKey = "fitbuddy_reminder_shown_" + now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();
      if (localStorage.getItem(todayKey)) return; // 今天已提醒过
      localStorage.setItem(todayKey, "1");
      showReminderBanner();
      // 尝试发送浏览器通知
      sendNotification();
    }
  }

  // 显示 App 内提醒横幅
  function showReminderBanner() {
    var banner = document.getElementById("reminderBanner");
    if (!banner) return;
    var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
    var title = "🔔 该训练啦!";
    var sub = "今天还有训练等着你,加油!";

    if (plan && plan.schedule) {
      var dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
      var todayName = dayNames[new Date().getDay()];
      for (var i = 0; i < plan.schedule.length; i++) {
        if (plan.schedule[i].day.indexOf(todayName) >= 0) {
          if (!plan.schedule[i].isTraining) {
            title = "😴 今天是休息日";
            sub = "好好恢复,明天继续!";
          } else {
            var dayData = plan.trainingDays[i];
            if (dayData && dayData.exes && dayData.exes.length) {
              var exNames = dayData.exes.slice(0,2).map(function(e){ return e.n; }).join("、");
              title = "🏋️ " + (plan.schedule[i].day || "今天") + " 训练";
              sub = exNames + (dayData.exes.length > 2 ? " 等" + dayData.exes.length + "个动作" : "");
            }
          }
          break;
        }
      }
    }

    document.getElementById("reminderBannerTitle").textContent = title;
    document.getElementById("reminderBannerSub").textContent = sub;
    banner.style.display = "";
    // 5秒后自动消失(用户可点击"稍后"再延后)
    banner._autoHide = setTimeout(function(){
      banner.style.display = "none";
    }, 8000);
  }

  // 发送浏览器通知(双通道:直接API + SW后台)
  function sendNotification() {
    var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
    var title = "FitBuddy - 该训练啦!💪";
    var body = "今天还有训练等着你!打开 FitBuddy 开始打卡 💪";
    if (plan && plan.goal) {
      var goalNames = {muscle:"增肌",strength:"力量",cut:"减脂",cardio:"心肺",marathon:"马拉松"};
      body = "你的" + (goalNames[plan.goal] || plan.goal) + "训练等你来!打开 FitBuddy 打卡 💪";
    }

    // 通道1:直接 Notification API(App 打开时)
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: body,
          tag: "fitbuddy-reminder",
          requireInteraction: true,
          icon: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23FF6B35"/><text y=".9em" font-size="60" text-anchor="middle" x="50" fill="white">🏋️</text></svg>')
        });
      } catch(e) {}
    }

    // 通道2:通过 Service Worker 发送(即使 App 没打开也能推)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title: title,
        body: body
      });
    }
  }

  // 稍后提醒(延后30分钟)
  function snoozeReminder() {
    var banner = document.getElementById("reminderBanner");
    if (banner) {
      banner.style.display = "none";
      if (banner._autoHide) clearTimeout(banner._autoHide);
    }
    var rem = JSON.parse(localStorage.getItem("fitbuddy_reminder") || "null") || {enabled:true, time:"20:00"};
    var snoozeUntil = new Date(Date.now() + 30 * 60000); // 30分钟后
    rem.snoozedUntil = snoozeUntil.toISOString();
    localStorage.setItem("fitbuddy_reminder", JSON.stringify(rem));
    // 清除今天的"已提醒"标记,让30分钟后还能再提醒
    var todayKey = "fitbuddy_reminder_shown_" + new Date().getFullYear() + "-" + (new Date().getMonth()+1) + "-" + new Date().getDate();
    localStorage.removeItem(todayKey);
  }

  // 跳转到训练计划
  function goToTraining() {
    var banner = document.getElementById("reminderBanner");
    if (banner) {
      banner.style.display = "none";
      if (banner._autoHide) clearTimeout(banner._autoHide);
    }
    var planEl = document.getElementById("planResult");
    if (planEl) planEl.scrollIntoView({behavior:"smooth", block:"start"});
  }

  // 调度下次提醒(基于 setTimeout,只能在页面存活期间有效)
  function scheduleNextReminder() {
    var rem = JSON.parse(localStorage.getItem("fitbuddy_reminder") || "null");
    if (!rem || !rem.enabled) return;
    var now = new Date();
    var [h, m] = (rem.time || "20:00").split(":").map(Number);
    var nextRemind = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (nextRemind <= now) nextRemind.setDate(nextRemind.getDate() + 1); // 推到明天
    var delay = nextRemind - now;
    // 最多等待24小时
    if (delay > 0 && delay < 86400000) {
      setTimeout(function(){
        showReminderBanner();
        sendNotification();
        scheduleNextReminder(); // 重新调度明天
      }, delay);
    }
  }

function doGenerate() {
  var btn = document.getElementById("genBtn");
  if (btn) {
    btn.classList.add("loading");
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;"></span> 正在生成...';
    document.getElementById("planResult").innerHTML = '<div class="loading-overlay"><div class="spinner"></div><div class="loading-text">正在生成你的专属计划...</div></div>';
  }

  // 保存用户资料(用于热量计算)
  (function saveProfile() {
    var prof = {};
    try { prof = JSON.parse(localStorage.getItem("fitbuddy_profile") || "{}"); } catch(e) {}
    var w = parseFloat(document.getElementById('bodyWeight').value);
    if (w && w >= 30 && w <= 200) prof.weight = w;
    var h = parseFloat(document.getElementById('bodyHeight').value);
    if (h && h >= 120 && h <= 250) prof.height = h;
    var a = parseInt(document.getElementById('bodyAge').value);
    if (a && a >= 10 && a <= 100) prof.age = a;
    var g = document.querySelector('input[name="gender"]:checked');
    if (g) prof.gender = g.value;
    localStorage.setItem("fitbuddy_profile", JSON.stringify(prof));
  })();

  _trackStat('gens');

  try {
      savePrefs();
      var goalEl = document.querySelector('input[name="goal"]:checked');
      var goal = goalEl ? goalEl.value : "muscle";
      var levelEl = document.querySelector('input[name="level"]:checked');
      var level = levelEl ? levelEl.value : "beginner";
      var activeChip = document.querySelector('#daysGroup .chip.active');
      var days  = activeChip ? parseInt(activeChip.dataset.days) : 4;
      var equipEl = document.querySelector('input[name="equip"]:checked');
      var equip = goal === "marathon"
        ? (document.querySelector('input[name="runEquip"]:checked') || {}).value || "outdoor"
        : (equipEl ? equipEl.value : "gym");

      var cfg = CONFIGS[level] || CONFIGS.beginner;
      var goalCfg = cfg[goal] || cfg.muscle;

      var schedule = getSchedule(days);
      var weekOffset = goal === "marathon" ? (currentWeek - 1) : getWeekOffset(((currentWeek - 1) % 4) + 1);
      var trainingDays;
      if (_skipRebuild && lastPlan && lastPlan.trainingDays) {
        trainingDays = lastPlan.trainingDays;
        _skipRebuild = false;
      } else {
        trainingDays = buildPlan(goal, level, days, equip, cfg, goalCfg, weekOffset);
      }
      // 伤病过滤
      trainingDays.forEach(function(day){ if (day.exes) day.exes.forEach(function(ex){ delete ex._injured; }); });
      if (injuryFlag && injuryFlag.muscles && injuryFlag.muscles.length) {
        trainingDays.forEach(function(day){ if (day.exes) day.exes.forEach(function(ex){ if (isInjured(ex.n)) ex._injured = true; }); });
      }
      // 保存到 lastPlan
      lastPlan = { goal:goal, level:level, days:days, equip:equip, trainingDays:trainingDays, schedule:schedule, date:Date.now(), week: currentWeek };
      if (currentCycle) lastPlan.cycle = currentCycle;
      // 保存用户年龄,用于心率 Zone 计算
      var ageVal = parseInt(document.getElementById('bodyAge').value) || 0;
      if (ageVal) lastPlan.age = ageVal;
      localStorage.setItem("fitbuddy_lastplan", JSON.stringify(lastPlan));
      // 调用核心渲染
      doGenerateInternal(goal, level, days, equip, trainingDays, schedule, cfg, goalCfg);
    } catch(e) {
      console.error("生成计划出错:", e);
      if (btn) {
        btn.classList.remove("loading");
        btn.innerHTML = '生成计划';
      }
      document.getElementById("planResult").innerHTML =
        '<div style="background:var(--card);border-radius:16px;padding:24px;text-align:center;">'+
        '<div style="font-size:32px;margin-bottom:8px;">⚠️</div>'+
        '<div style="font-size:15px;font-weight:700;">生成出错</div>'+
        '<div style="font-size:13px;color:var(--text3);margin-top:4px;">'+e.message+'</div></div>';
    }
    if (btn) {
      btn.classList.remove("loading");
      btn.innerHTML = "✨ 生成我的计划";
    }
  initReminderUI();
  }

function buildPlan(goal, level, days, equip, cfg, goalCfg, weekOffset) {
  var trainingDays = [];
  if (goal === "muscle") trainingDays = buildMusclePlan(level, days, equip, weekOffset);
  else if (goal === "strength") trainingDays = buildStrengthPlan(level, days, equip, weekOffset);
  else if (goal === "cut") trainingDays = buildCutPlan(level, days, equip, weekOffset);
  else if (goal === "cardio") trainingDays = buildCardioPlan(level, days, equip, weekOffset);
  else if (goal === "marathon") trainingDays = buildMarathonPlan(level, days, equip, weekOffset);
  trainingDays.forEach(function(day){
    if (!day.exes || day.exes.length === 0) day.exes = getFullBody(equip, level, goal, weekOffset);
    day.exes = dedup(day.exes).filter(function(e){ return !!e; });
  });
  return trainingDays;
}

function buildMusclePlan(level, days, equip, wOff) {
  var exCnt = level === "beginner" ? 3 : level === "intermediate" ? 4 : 5;
  if (days <= 3) {
    var arr = [];
    for (var i=0; i<days; i++) arr.push({name:"全身训练 Day"+(i+1), exes:getFullBody(equip, level, "muscle", wOff)});
    return arr;
  }
  if (days === 4) {
    return [
      {name:"胸·肩·三头(推)", exes: dedup(pickExes(getExes("胸",equip,level),2,wOff).concat(pickExes(getExes("肩",equip,level),2,wOff)).concat(pickExes(getExes("臂",equip,level).filter(function(e){return e.n.indexOf("三头")>=0||e.n.indexOf("臂屈伸")>=0||e.n.indexOf("下压")>=0;}),1,wOff)))},
      {name:"腿(前)·核心", exes: dedup(pickExes(getExes("腿",equip,level),exCnt,wOff).concat(pickExes(getExes("核心",equip,level),1,wOff)))},
      {name:"背·二头(拉)", exes: dedup(pickExes(getExes("背",equip,level),3,wOff).concat(pickExes(getExes("臂",equip,level).filter(function(e){return e.n.indexOf("二头")>=0||e.n.indexOf("弯举")>=0;}),2,wOff)))},
      {name:"腿(后链)·核心", exes: dedup(pickExes(getExes("腿",equip,level).filter(function(e){return e.n.indexOf("硬拉")>=0||e.n.indexOf("弯举")>=0||e.n.indexOf("保加利亚")>=0||e.n.indexOf("单腿")>=0;}),2,wOff).concat(pickExes(getExes("腿",equip,level),1,wOff)).concat(pickExes(getExes("核心",equip,level),2,wOff)))}
    ];
  }
  var plan = [
    {name:"推(胸·肩·三头)", exes: dedup(pickExes(getExes("胸",equip,level),2,wOff).concat(pickExes(getExes("肩",equip,level),2,wOff)).concat(pickExes(getExes("臂",equip,level).filter(function(e){return e.n.indexOf("三头")>=0||e.n.indexOf("下压")>=0||e.n.indexOf("臂屈伸")>=0;}),1,wOff)))},
    {name:"拉(背·二头)", exes: dedup(pickExes(getExes("背",equip,level),3,wOff).concat(pickExes(getExes("臂",equip,level).filter(function(e){return e.n.indexOf("二头")>=0||e.n.indexOf("弯举")>=0;}),2,wOff)))},
    {name:"腿·核心", exes: dedup(pickExes(getExes("腿",equip,level),4,wOff).concat(pickExes(getExes("核心",equip,level),1,wOff)))}
  ];
  if (days >= 5) {
    plan.push({name:"推(强化)", exes: dedup(pickExes(getExes("胸",equip,level),2,wOff+1).concat(pickExes(getExes("肩",equip,level),1,wOff+1)).concat(pickExes(getExes("臂",equip,level).filter(function(e){return e.n.indexOf("三头")>=0||e.n.indexOf("下压")>=0;}),1,wOff+1)))});
    plan.push({name:"拉(强化)", exes: dedup(pickExes(getExes("背",equip,level),3,wOff+1).concat(pickExes(getExes("核心",equip,level),1,wOff+1)))});
  }
  if (days >= 6) {
    plan.push({name:"腿(强化)", exes: dedup(pickExes(getExes("腿",equip,level),3,wOff+1).concat(pickExes(getExes("核心",equip,level),1,wOff+1)))});
  }
  return plan;
}

function buildStrengthPlan(level, days, equip, wOff) {
  var sq = getExes("腿",equip,level).filter(function(e){return e.n.indexOf("深蹲")>=0||e.n.indexOf("腿举")>=0;});
  var bp = getExes("胸",equip,level).filter(function(e){return e.n.indexOf("卧推")>=0||e.n.indexOf("俯卧撑")>=0;});
  var rw = getExes("背",equip,level).filter(function(e){return e.n.indexOf("划船")>=0||e.n.indexOf("引体")>=0||e.n.indexOf("下拉")>=0;});
  var pr = getExes("肩",equip,level).filter(function(e){return e.n.indexOf("肩推")>=0||e.n.indexOf("推举")>=0;});
  var dl = getExes("腿",equip,level).filter(function(e){return e.n.indexOf("硬拉")>=0;});
  var core = getExes("核心",equip,level);
  var tri = getExes("臂",equip,level).filter(function(e){return e.n.indexOf("三头")>=0||e.n.indexOf("下压")>=0;});
  var bic = getExes("臂",equip,level).filter(function(e){return e.n.indexOf("弯举")>=0;});
  if (days <= 3) {
    var names = ["全身力量 A","全身力量 B","全身力量 C"];
    return Array.from({length:days},function(_,i){
      return {name:names[i]||"全身力量 "+(i+1), exes:dedup(
        pickExes(sq,1,wOff).concat(
        pickExes(bp,1,wOff+i)).concat(
        pickExes(rw,1,wOff+i)).concat(
        pickExes(core,1,wOff))
      )};
    });
  }
  var plan = [
    {name:"深蹲日 + 辅助", exes: dedup(pickExes(sq,2,wOff).concat(pickExes(bp,1,wOff)).concat(pickExes(core,1,wOff)))},
    {name:"推(卧推)+ 辅助", exes: dedup(pickExes(bp,2,wOff).concat(pickExes(pr,1,wOff)).concat(pickExes(tri,1,wOff)))},
    {name:"硬拉日 + 辅助", exes: dedup(pickExes(dl.length?dl:getExes("腿",equip,level),2,wOff).concat(pickExes(rw,1,wOff)).concat(pickExes(core,1,wOff)))}
  ];
  if (days >= 4) plan.push({name:"拉(划船/引体)+ 辅助", exes: dedup(pickExes(rw,2,wOff).concat(pickExes(bic,1,wOff)).concat(pickExes(core,1,wOff)))});
  if (days >= 5) plan.push({name:"上肢力量综合", exes: dedup(pickExes(bp,1,wOff+1).concat(pickExes(pr,2,wOff+1)).concat(pickExes(rw,1,wOff+1)))});
  if (days >= 6) plan.push({name:"下肢 + 核心专项", exes: dedup(pickExes(sq,2,wOff+1).concat(pickExes(core,2,wOff+1)))});
  return plan;
}

function buildCutPlan(level, days, equip, wOff) {
  var plan = [];
  for (var i=0; i<days; i++) {
    if (i % 2 === 0) {
      var exes = getFullBody(equip, level, "muscle", wOff);
      var cardio = getExes("有氧",equip,level);
      exes.push(pickExes(cardio,1,wOff)[0] || {n:"跳绳",m:"有氧",eq:"bodyweight",diff:"初级",desc:"",tips:"",vid:""});
      plan.push({name:"力量+有氧 " + (Math.floor(i/2)+1), exes: dedup(exes)});
    } else {
      var cardExes = getExes("有氧",equip,level);
      var picked2 = pickExes(cardExes,2,wOff);
      plan.push({name:"有氧专项 " + (Math.floor(i/2)+1), exes: picked2.length ? picked2 : [{n:"慢跑/快走",m:"有氧",eq:"bodyweight",diff:"初级",desc:"",tips:"",vid:""}]});
    }
  }
  return plan;
}

function buildCardioPlan(level, days, equip, wOff) {
  // LISS:低强度持续有氧(初级动作),每次选2-3个
  var liss = getExes("有氧",equip,level).filter(function(e){return e.diff==="初级";});
  // HIIT:高强度间歇(中级+高级动作),每次选3-4个
  var hiit = getExes("有氧",equip,level).filter(function(e){return e.diff==="中级"||e.diff==="高级";});
  var str = getFullBody(equip,level,"cardio",wOff);
  var plan = [];
  for (var i=0; i<days; i++) {
    var mod = i % 3;
    if (mod === 0) {
      // LISS 日:2-3个低强度动作组合
      var lissCnt = Math.min(3, liss.length);
      var lissExes = pickExes(liss, lissCnt, wOff + i);
      if (!lissExes.length) lissExes = [{n:"慢跑/快走",m:"有氧",eq:"bodyweight",diff:"初级",desc:"",tips:"",vid:""}];
      plan.push({name:"LISS 有氧", exes: lissExes});
    } else if (mod === 1) {
      // HIIT 日:3-4个高强度动作循环
      var hiitCnt = Math.min(4, hiit.length);
      var hiitExes = pickExes(hiit, hiitCnt, wOff + i);
      if (!hiitExes.length) hiitExes = [{n:"波比跳",m:"有氧",eq:"bodyweight",diff:"中级",desc:"",tips:"",vid:""}];
      plan.push({name:"HIIT 有氧", exes: hiitExes});
    } else {
      // 力量+有氧日:全身力量 + 1个LISS收尾
      plan.push({name:"力量+有氧", exes: dedup(str.concat(pickExes(liss,1,wOff + i)))});
    }
  }
  return plan;
}

// ============ 马拉松训练计划 ============
function buildMarathonPlan(level, days, equip, wOff) {
  // wOff = currentWeek - 1 (0~15),表示实际周数偏移
  var week = wOff + 1; // 当前第几周(1-16)
  var cfg = CONFIGS[level] && CONFIGS[level].marathon ? CONFIGS[level].marathon : CONFIGS.beginner.marathon;
  var runEnv = equip === "treadmill" ? "(跑步机)" : "";

  // ── 阶段判断 ──────────────────────────────────
  // 基础期1-4 / 强化期5-8 / 巅峰期9-12 / 减量期13-16
  var phase = week <= 4 ? "base" : week <= 8 ? "build" : week <= 12 ? "peak" : "taper";
  var phaseWeek = ((week - 1) % 4) + 1; // 阶段内第几周(1-4)

  // ── LSD距离:线性递进,减量期回退 ──────────────
  var lsdBase = {beginner:12, intermediate:20, advanced:24}[level] || 12;
  var lsdInc  = {beginner:2, intermediate:1.5, advanced:1.3}[level] || 2;
  var lsdMax  = cfg.longRunMax;
  var lsdDist;
  if (phase === "taper") {
    // 减量期:从巅峰值按 60%→50%→40%→30% 缩减
    var peakLsd = Math.min(lsdBase + 11 * lsdInc, lsdMax);
    var taperRate = [0.6, 0.5, 0.4, 0.3][phaseWeek - 1] || 0.4;
    lsdDist = Math.round(peakLsd * taperRate);
  } else {
    lsdDist = Math.min(Math.round(lsdBase + (week - 1) * lsdInc), lsdMax);
  }

  // ── 轻松跑距离:随周期递进 ───────────────────────
  // 基础期偏短,强化/巅峰递增,减量期缩减
  var easyBase = {beginner:6, intermediate:8, advanced:10}[level] || 6;
  var easyInc  = {beginner:0.5, intermediate:0.5, advanced:0.5}[level] || 0.5;
  var easyKm;
  if (phase === "taper") {
    easyKm = easyBase; // 减量期回到基础值
  } else {
    easyKm = Math.round((easyBase + (week - 1) * easyInc) * 2) / 2; // 每周+0.5km,保留0.5精度
    easyKm = Math.min(easyKm, easyBase + 6); // 最多增加6km
  }
  var easyKmHigh = easyKm + 2;
  var easyDist = easyKm + "-" + easyKmHigh + "km";

  // 中距离轻松跑(6天计划用)
  var midKm = Math.round(easyKm * 1.5);
  var midDist = midKm + "-" + (midKm + 2) + "km";

  // ── 节奏跑距离:随周期递进 ───────────────────────
  var tempoBase = {beginner:5, intermediate:8, advanced:10}[level] || 5;
  var tempoKm;
  if (phase === "base") {
    tempoKm = tempoBase; // 基础期不做节奏跑,用有氧跑代替
  } else if (phase === "taper") {
    tempoKm = tempoBase + 1;
  } else {
    tempoKm = Math.min(tempoBase + Math.floor((week - 5) * 0.5), tempoBase + 5);
  }
  var tempoDist = tempoKm + "-" + (tempoKm + 2) + "km";

  // ── 间歇规格:强化期入门→巅峰期升级 ─────────────
  var intervalSpec;
  if (phase === "build") {
    intervalSpec = {beginner:"5×400m (间歇200m慢跑)", intermediate:"5×800m (间歇400m慢跑)", advanced:"6×800m (间歇400m慢跑)"}[level] || "5×400m";
  } else if (phase === "peak") {
    intervalSpec = {beginner:"6×400m (间歇200m慢跑)", intermediate:"6×1000m (间歇400m慢跑)", advanced:"8×1000m (间歇400m慢跑)"}[level] || "6×400m";
  } else {
    // base/taper 不做标准间歇,用快跑组代替
    intervalSpec = {beginner:"4×400m (轻松间歇)", intermediate:"4×800m (轻松间歇)", advanced:"5×800m (轻松间歇)"}[level] || "4×400m";
  }

  // ── 恢复跑距离 ──────────────────────────────────
  var recBase = {beginner:4, intermediate:6, advanced:8}[level] || 4;
  var recKm = phase === "taper" ? recBase - 1 : recBase;
  var recDist = recKm + "-" + (recKm + 1) + "km";

  // ── 生成跑步训练日数据 ──────────────────────────
  function mkRun(name, distance, pace, effort, desc, tips) {
    var zoneInfo = getZoneForRunType(name);
    return {
      n: name + " " + distance + runEnv,
      m: "跑步", eq: equip, diff: effort,
      desc: desc, tips: tips, pace: pace, isMarathon: true,
      zone: zoneInfo.zone,
      zoneDesc: zoneInfo.desc,
      zoneColor: zoneInfo.color
    };
  }

  // ── 按阶段决定训练结构 ─────────────────────────────────────────────
  // 基础期(1-4):轻松跑为主,无正式间歇,第3周加入短节奏
  // 强化期(5-8):加入间歇跑,节奏跑强度提升
  // 巅峰期(9-12):高密度,LSD最长,加入配速跑模拟比赛
  // 减量期(13-16):跑量缩减,保持神经激活,充分储能
  var plan = [];

  if (days === 4) {
    if (phase === "base") {
      plan = [
        {name:"轻松跑 (有氧基础)", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "建立有氧基础,保持能正常交谈的配速", "心率控制 Zone 2,不要追配速")]},
        {name:"有氧跑 (稍快)", exes:[mkRun("有氧跑", (easyKm+1)+"-"+(easyKmHigh+1)+"km", cfg.easyPace+"/km", "初级",
          phaseWeek >= 3 ? "基础期后段,加入短节奏感" : "持续有氧,提升跑步经济性",
          phaseWeek >= 3 ? "后半段提速1-2分钟/km感受节奏,不要全力" : "比轻松跑快15-20秒/km,保持流畅呼吸")]},
        {name:"轻松跑 (中距离)", exes:[mkRun("轻松跑", midDist, cfg.easyPace+"/km", "初级", "拉长有氧积累,为LSD打基础", "全程轻松,心率不超过最大心率75%")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "本周核心训练,建立耐力基础", "跑前吃碳水,带水,全程比轻松跑再慢30秒/km")]}
      ];
    } else if (phase === "build") {
      plan = [
        {name:"轻松跑", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "恢复+有氧基础", "轻松热身,为周中高强度训练蓄力")]},
        {name:"间歇跑", exes:[mkRun("间歇跑", intervalSpec, cfg.intervalPace+"/km", "高级", "速度训练,提升最大摄氧量(VO2max)", "充分热身2km,每组间慢跑恢复,跑完冷身1km")]},
        {name:"节奏跑", exes:[mkRun("节奏跑", tempoDist, cfg.tempoPace+"/km", "中级", "乳酸阈值训练,提升持续高速能力", "\"舒适地困难\"--能说短语但不能聊天,匀速")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "周末长距离,提升耐力和脂肪供能能力", "带水/能量胶,跑前吃碳水,享受过程")]}
      ];
    } else if (phase === "peak") {
      plan = [
        {name:"轻松跑", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "积极恢复,保持跑量积累", "心率 Zone 2,为高强度训练日蓄力")]},
        {name:"间歇跑 (升级)", exes:[mkRun("间歇跑", intervalSpec, cfg.intervalPace+"/km", "高级", "巅峰期速度训练,强化比赛节奏感", "热身2km,全力完成每组,组间完全恢复再跑下一组")]},
        {name:"配速跑 (比赛模拟)", exes:[mkRun("配速跑", tempoDist, cfg.tempoPace+"/km", "高级", "模拟比赛后半段配速,建立配速感", "以目标比赛配速匀速完成,感受心理和生理双重压力")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "本周期LSD峰值,接近全程距离", "全程补给充分,跑后拉伸30分钟,记录心率和配速数据")]}
      ];
    } else { // taper
      plan = [
        {name:"轻松跑 (Taper)", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "减量期保持节奏感,不要过度休息", "感觉太轻松是正常的,相信训练积累")]},
        {name:"短间歇 (激活)", exes:[mkRun("间歇", intervalSpec, cfg.easyPace+"/km", "中级", "神经激活,保持速度感,强度降低", "组数减少,重点保持腿部轻快感,配速不要超过轻松跑上限")]},
        {name:"目标配速跑", exes:[mkRun("配速跑", (tempoKm)+"-"+(tempoKm+1)+"km", cfg.tempoPace+"/km", "中级", "感受比赛配速,建立信心", "全程目标配速,感受\"这个配速我能维持42km\"")]},
        {name:"短LSD (最后长跑)", exes:[mkRun("LSD", lsdDist+"km", cfg.longRunPace+"/km", "初级", "减量期长跑,储备信心而非消耗", "轻松完成,不要累,为比赛日储存糖原")]}
      ];
    }
  } else if (days === 5) {
    if (phase === "base") {
      plan = [
        {name:"轻松跑 A", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "建立每日跑量习惯", "不追速度,享受跑步")]},
        {name:"有氧跑 (稍快)", exes:[mkRun("有氧跑", (easyKm+1)+"-"+(easyKmHigh+1)+"km", cfg.easyPace+"/km", "初级",
          phaseWeek >= 3 ? "开始加入节奏感知训练" : "稍快于轻松跑,有氧能力提升",
          phaseWeek >= 3 ? "后段1-2km提速,感受节奏" : "比轻松跑快15-20秒/km")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "积极恢复,消除疲劳", "随时可以停下来走,心率不超过最大心率60%")]},
        {name:"轻松跑 B (中距离)", exes:[mkRun("轻松跑", midDist, cfg.easyPace+"/km", "初级", "拉长有氧积累", "匀速,保持Zone 2心率")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "周末核心长跑", "跑前补碳水,带能量胶,感受长时间持续运动")]}
      ];
    } else if (phase === "build") {
      plan = [
        {name:"轻松跑", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "恢复+有氧基础", "轻松不费力")]},
        {name:"间歇跑", exes:[mkRun("间歇跑", intervalSpec, cfg.intervalPace+"/km", "高级", "速度训练日", "充分热身2km + 冷身1km")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "主动恢复", "不看配速,只管舒服")]},
        {name:"节奏跑", exes:[mkRun("节奏跑", tempoDist, cfg.tempoPace+"/km", "中级", "赛前模拟配速感", "目标马拉松配速或略快")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "本周最重要的训练", "带水和能量胶,配速稳定")]}
      ];
    } else if (phase === "peak") {
      plan = [
        {name:"轻松跑", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "积极恢复,维持跑量", "Zone 2,为后续高强度蓄力")]},
        {name:"间歇跑 (升级)", exes:[mkRun("间歇跑", intervalSpec, cfg.intervalPace+"/km", "高级", "巅峰期速度训练", "热身充分,每组全力,组间完全恢复")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "间歇后积极恢复", "超轻松,活动腿部")]},
        {name:"配速跑", exes:[mkRun("配速跑", tempoDist, cfg.tempoPace+"/km", "高级", "比赛配速模拟", "目标配速匀速完成,建立配速肌肉记忆")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "LSD峰值训练", "全程补给,跑后充分恢复")]}
      ];
    } else { // taper
      plan = [
        {name:"轻松跑 (Taper)", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "减量期轻松维持", "感觉很轻松是正常的")]},
        {name:"短间歇 (激活)", exes:[mkRun("间歇", intervalSpec, cfg.easyPace+"/km", "中级", "保持速度感", "组数减少,强度保持,配速不超轻松跑")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "积极恢复", "随时可以走")]},
        {name:"目标配速跑", exes:[mkRun("配速跑", tempoKm+"-"+(tempoKm+1)+"km", cfg.tempoPace+"/km", "中级", "感受比赛配速,建立信心", "感受\"我能跑42km\"")]},
        {name:"短LSD", exes:[mkRun("LSD", lsdDist+"km", cfg.longRunPace+"/km", "初级", "减量期最后长跑", "轻松跑完,不消耗,储存糖原")]}
      ];
    }
  } else {
    // 兜底:days>=6 或其他非标准天数,按6天计划处理
    // 实际场景中马拉松UI已限制为4-6天,此处仅防异常数据
    if (phase === "base") {
      plan = [
        {name:"轻松跑 A", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "新周期开始,有氧热身", "不追速度")]},
        {name:"有氧跑 (稍快)", exes:[mkRun("有氧跑", (easyKm+1)+"-"+(easyKmHigh+1)+"km", cfg.easyPace+"/km", "初级",
          phaseWeek >= 3 ? "加入节奏感知,后段提速" : "比轻松跑快15-20秒/km", "保持流畅呼吸")]},
        {name:"轻松跑 B (中距离)", exes:[mkRun("轻松跑", midDist, cfg.easyPace+"/km", "初级", "中等距离有氧积累", "保持Zone 2心率,匀速")]},
        {name:"有氧跑 C", exes:[mkRun("有氧跑", easyDist, cfg.easyPace+"/km", "初级", "连续跑量积累", "轻松完成,下周开始加量")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "赛前放松", "超级轻松,为LSD蓄力")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "本周关键训练", "长距离慢跑,享受过程")]}
      ];
    } else if (phase === "build") {
      plan = [
        {name:"轻松跑", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "恢复+有氧积累", "为新的一周热身")]},
        {name:"间歇跑", exes:[mkRun("间歇跑", intervalSpec, cfg.intervalPace+"/km", "高级", "速度训练日", "充分热身,记录每组分段时间")]},
        {name:"轻松跑 (中距离)", exes:[mkRun("轻松跑", midDist, cfg.easyPace+"/km", "初级", "中距离有氧跑", "保持Zone 2,匀速推进")]},
        {name:"节奏跑", exes:[mkRun("节奏跑", tempoDist, cfg.tempoPace+"/km", "中级", "乳酸阈值巩固", "马拉松配速或略快")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "赛前放松", "超级轻松,为明天LSD蓄力")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "本周关键训练", "长距离慢跑,模拟比赛后半程感觉")]}
      ];
    } else if (phase === "peak") {
      plan = [
        {name:"轻松跑", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "积极恢复,维持跑量", "Zone 2")]},
        {name:"间歇跑 (升级)", exes:[mkRun("间歇跑", intervalSpec, cfg.intervalPace+"/km", "高级", "巅峰期速度强化", "热身充分,每组全力,记录时间")]},
        {name:"轻松跑 (中距离)", exes:[mkRun("轻松跑", midDist, cfg.easyPace+"/km", "初级", "中距离有氧积累", "匀速,Zone 2")]},
        {name:"配速跑 (比赛模拟)", exes:[mkRun("配速跑", tempoDist, cfg.tempoPace+"/km", "高级", "全程比赛配速模拟", "感受比赛心理,匀速完成")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "高强度后积极恢复", "超轻松,为LSD蓄力")]},
        {name:"LSD 长距离", exes:[mkRun("LSD 长距离", lsdDist+"km", cfg.longRunPace+"/km", "中级", "巅峰LSD,本计划最长距离", "全程补给,跑后拉伸,记录心率配速数据")]}
      ];
    } else { // taper
      plan = [
        {name:"轻松跑 (Taper)", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "减量维持,不要过度休息", "轻松就好,不要强迫自己跑快")]},
        {name:"短间歇 (激活)", exes:[mkRun("间歇", intervalSpec, cfg.easyPace+"/km", "中级", "激活神经系统,保持速度感", "组数减少,强度保持,配速不超轻松跑上限")]},
        {name:"轻松跑 (短距离)", exes:[mkRun("轻松跑", easyDist, cfg.easyPace+"/km", "初级", "保持跑步习惯", "轻松愉快")]},
        {name:"目标配速跑", exes:[mkRun("配速跑", tempoKm+"-"+(tempoKm+1)+"km", cfg.tempoPace+"/km", "中级", "感受比赛配速,建立信心", "\"这个配速跑42km没问题\"")]},
        {name:"恢复跑", exes:[mkRun("恢复跑", recDist, "非常轻松", "初级", "最后放松,储备能量", "跑完拉伸,补充碳水")]},
        {name:"短LSD", exes:[mkRun("LSD", lsdDist+"km", cfg.longRunPace+"/km", "初级", "减量期最后长跑,储备信心", "轻松跑,不要消耗,为比赛日储存糖原")]}
      ];
    }
  }
  return plan;
}


// ============ 渲染函数 ============
// 计算马拉松训练日实际周跑量(解析动作名称中的距离)
function calcMarathonWeekKm(trainingDays) {
  if (!trainingDays || !trainingDays.length) return null;
  var total = 0;
  trainingDays.forEach(function(day) {
    if (!day.exes) return;
    day.exes.forEach(function(ex) {
      var n = ex.n;
      // 区间距离 "6-8km" → 取中值
      var rangeMatch = n.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*km/i);
      if (rangeMatch) { total += (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2; return; }
      // 单距离 "12km"(排除间歇规格如 5×400m)
      var singleMatch = n.match(/(\d+(?:\.\d+)?)\s*km\b/i);
      if (singleMatch && n.indexOf('\u00D7') < 0) { total += parseFloat(singleMatch[1]); return; }
      // 间歇规格 "6×400m" → 取总跑量 + 热身冷身估算 4km
      var intMatch = n.match(/(\d+)\s*\u00D7\s*(\d+)\s*m/i);
      if (intMatch) total += (parseInt(intMatch[1]) * parseInt(intMatch[2]) / 1000) + 4;
    });
  });
  return Math.round(total);
}

function renderSummary(goalName, levelName, equipName, days, goalCfg, sets, intensity, goal) {
  var presTag;
  if (goal === "marathon") {
    presTag = "周跑量 " + (goalCfg._weekKm != null ? goalCfg._weekKm : goalCfg.weeklyKms) + "km";
  } else if (goalCfg.totalDuration) {
    presTag = goalCfg.totalDuration + ' 总时长';
  } else {
    presTag = sets + '组 x ' + goalCfg.reps;
  }
  return '<div class="summary-card">'+
    '<div class="summary-label">你的专属计划已生成</div>'+
    '<div class="summary-title">'+goalName+' · '+days+'天/周</div>'+
    '<div class="summary-tags">'+
      '<span class="summary-tag">'+levelName+'</span>'+
      '<span class="summary-tag">'+equipName+'</span>'+
      '<span class="summary-tag">'+presTag+'</span>'+
      '<span class="summary-tag">'+intensity+'</span>'+
      (goalCfg.rest && goalCfg.rest !== '-' ? '<span class="summary-tag">休息 '+goalCfg.rest+'</span>' : '')+
    '</div></div>';
}

function renderWeekBar(goal) {
  var isMarathon = goal === "marathon";
  var totalWeeks = isMarathon ? 16 : 4;
  var html = '<div class="week-bar">';
  if (isMarathon) {
    MARATHON_PHASES.forEach(function(phase){
      var pActive = phase.weeks.indexOf(currentWeek) >= 0;
      html += '<span style="flex-shrink:0;padding:8px 6px;font-size:11px;font-weight:600;color:'+phase.color+';border-left:2px solid '+(pActive?phase.color:'transparent')+';margin-right:2px;">'+phase.name+'</span>';
      phase.weeks.forEach(function(w){
        html += '<div class="week-btn'+(w===currentWeek?' active':'')+'" style="padding:6px 9px;font-size:11px;min-width:32px;text-align:center;'+(w===currentWeek?'':'')+'" onclick="setWeek('+w+')">'+w+'</div>';
      });
    });
  } else {
    var wrappedWeek = ((currentWeek - 1) % totalWeeks) + 1;
    for (var i=1; i<=totalWeeks; i++) {
      html += '<div class="week-btn'+(i===wrappedWeek?' active':'')+'" onclick="setWeek('+i+')">第'+i+'周</div>';
    }
  }
  html += '</div>';
  return html;
}

function renderWeekInfo(wk) {
  var displayWeek = ((currentWeek - 1) % 4) + 1;
  var icon = wk.deload ? "🔄" : "📈";
  var adjustLabel = (lastPlan && lastPlan.goal === 'cardio') ? '强度调整' : '重量调整';
  return '<div class="week-info">'+icon+' <strong>第'+displayWeek+'周</strong> - '+wk.note+
    ' <span style="float:right;font-weight:700;">'+adjustLabel+': '+wk.weightAdjust+'</span></div>';
}

function renderMarathonProgress(wkInfo, goalCfg, level, currentCfg) {
  // 找到当前阶段
  var currentPhase = MARATHON_PHASES.find(function(p){ return p.weeks.indexOf(currentWeek)>=0; }) || MARATHON_PHASES[0];
  // LSD 显示与 buildMarathonPlan 保持一致:线性递进,减量期缩减
  var lsdBase = {beginner:12, intermediate:20, advanced:24}[level] || 12;
  var lsdInc  = {beginner:2, intermediate:1.5, advanced:1.3}[level] || 2;
  var lsdMax  = goalCfg.longRunMax;
  var phase = currentWeek <= 4 ? "base" : currentWeek <= 8 ? "build" : currentWeek <= 12 ? "peak" : "taper";
  var phaseWeek = ((currentWeek - 1) % 4) + 1;
  var lsdNow;
  if (phase === "taper") {
    var peakLsd = Math.min(lsdBase + 11 * lsdInc, lsdMax);
    var taperRate = [0.6, 0.5, 0.4, 0.3][phaseWeek - 1] || 0.4;
    lsdNow = Math.round(peakLsd * taperRate);
  } else {
    lsdNow = Math.min(Math.round(lsdBase + (currentWeek - 1) * lsdInc), lsdMax);
  }
  // 阶段描述
  var phaseDesc = {base:"有氧基础建立", build:"速度+耐力强化", peak:"跑量峰值冲刺", taper:"Taper 储能备战"}[phase] || "";

  var html = '<div class="week-info" style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-left:4px solid '+currentPhase.color+';">'+
    '🏃 <strong>第'+currentWeek+'周 - '+currentPhase.name+'</strong>'+
    ' <span style="float:right;font-weight:700;">LSD: '+lsdNow+'km / 目标 '+goalCfg.longRunMax+'km</span>'+
    '<div style="margin-top:6px;font-size:11px;color:var(--text3);">'+(MARATHON_WEEK_NOTES[currentWeek]||'')+
    ' · <strong>'+phaseDesc+'</strong> · 周跑量 '+(goalCfg._weekKm != null ? goalCfg._weekKm : goalCfg.weeklyKms)+'km</div></div>';

  // 配速计算器
  html += '<div class="pace-calc" id="paceCalc">'+
    '<div class="pace-calc-header" onclick="document.getElementById(\'paceCalc\').classList.toggle(\'open\')">'+
      '<span>⏱ 配速计算器</span><span class="plan-day-toggle">▼</span>'+
    '</div>'+
    '<div class="pace-calc-body">'+
      '<div style="font-size:12px;color:var(--text3);margin-bottom:8px;">输入目标完赛时间,自动计算各训练配速</div>'+
      '<div class="input-row" style="gap:8px;">'+
        '<input type="number" class="text-input" id="paceH" placeholder="时" min="2" max="6" value="4" style="flex:1;">'+
        '<span style="line-height:42px;color:var(--text2);">:</span>'+
        '<input type="number" class="text-input" id="paceM" placeholder="分" min="0" max="59" value="30" style="flex:1;">'+
        '<button class="btn-generate" style="flex:2;padding:10px;font-size:13px;margin-top:0;" onclick="event.stopPropagation();renderPaceResult()">计算配速</button>'+
      '</div>'+
      '<div id="paceResult" style="margin-top:10px;"></div>'+
    '</div></div>';

  return html;
}

function renderNutrition(n, goal, avgTrainBurn, maxTrainBurn, schedule, trainingDays, dayCalBurns, nTrain, nEasy) {
  var goalNote = goal === "muscle" ? "热量盈余" : goal === "cut" ? "热量缺口" : goal === "marathon" ? "碳水优先" : "维持热量";
  var fg = FOOD_GUIDE[goal] || FOOD_GUIDE.muscle;
  var restCal = n.targetCal;
  var trainCal = nTrain ? nTrain.targetCal : (restCal + avgTrainBurn);
  var trainProtein = nTrain ? nTrain.protein : n.protein;
  var trainCarb    = nTrain ? nTrain.carb    : n.carb;

  // 构建日程列表(训练日×星期几+名称+消耗)
  var nutriDays = [];
  if (schedule && trainingDays && dayCalBurns) {
    var ti = 0;
    schedule.forEach(function(s) {
      if (s.isTraining && ti < trainingDays.length) {
        nutriDays.push({
          label: s.day,        // "周一"
          name: trainingDays[ti].name,
          burn: dayCalBurns[ti]
        });
        ti++;
      }
    });
  }
  var nutriPanelId = "nutri_" + Math.random().toString(36).substr(2,6);

  var html = '<div class="nutrition-card" id="'+nutriPanelId+'">'+
    '<div class="nutrition-title">🍎 营养建议</div>'+
    '<div class="nutrition-grid">'+
      '<div class="nutrition-item"><div class="nutrition-label">每日目标热量</div><div class="nutrition-value">'+restCal+'<span class="nutrition-unit"> kcal</span></div></div>'+
      '<div class="nutrition-item"><div class="nutrition-label">蛋白质</div><div class="nutrition-value">'+n.protein+'<span class="nutrition-unit"> g/天</span></div></div>'+
      '<div class="nutrition-item"><div class="nutrition-label">碳水</div><div class="nutrition-value">'+n.carb+'<span class="nutrition-unit"> g/天</span></div></div>'+
      '<div class="nutrition-item"><div class="nutrition-label">脂肪</div><div class="nutrition-value">'+n.fat+'<span class="nutrition-unit"> g/天</span></div></div>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--text3);margin-top:8px;">基础代谢 '+n.bmr+' kcal · 日常消耗 '+n.tdee+' kcal · '+goalNote+'</div>';

  // 训练日动态热量 + 日程选择器
  if (nutriDays.length > 0) {
    html += '<div class="nutri-dynamic" style="margin-top:10px;padding:10px 12px;background:var(--bg);border-radius:10px;">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'+
        '<span style="font-size:12px;font-weight:600;color:var(--text);">🔥 训练日 / 😴 休息日 热量对比</span>'+
        '<span style="font-size:11px;color:var(--text3);">点击日程切换食谱</span></div>';

    // 日程 chip 条
    html += '<div class="nutri-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">';
    // 默认:平均
    html += '<span class="nutri-chip active" data-ni="-1" data-rest="'+restCal+'" data-train="'+trainCal+'" onclick="selectNutriDay(\''+nutriPanelId+'\',-1,'+restCal+','+trainCal+')" style="font-size:11px;padding:5px 8px;border-radius:14px;cursor:pointer;background:var(--primary);color:#fff;font-weight:600;">📊 平均</span>';
    nutriDays.forEach(function(nd, i) {
      var ndTrainCal = nTrain ? nTrain.targetCal : (restCal + nd.burn);
      html += '<span class="nutri-chip" data-ni="'+i+'" data-burn="'+nd.burn+'" data-name="'+nd.label+' '+nd.name+'" data-rest="'+restCal+'" data-train="'+ndTrainCal+'" onclick="selectNutriDay(\''+nutriPanelId+'\','+i+','+restCal+','+ndTrainCal+')" style="font-size:11px;padding:5px 8px;border-radius:14px;cursor:pointer;border:1px solid var(--border);color:var(--text2);">'+
        nd.label+' <span style="font-size:10px;opacity:0.8;">'+nd.name+'</span> 🔥'+nd.burn+'</span>';
    });
    html += '</div>';

    // 热量数字(动态更新):训练日 ← → 休息日
    html += '<div style="display:flex;gap:8px;">'+
      '<div class="nutri-train-val" style="flex:1;text-align:center;padding:8px 4px;background:var(--card);border-radius:8px;transition:all 0.2s;">'+
        '<div style="font-size:22px;font-weight:800;color:'+(goal==='cut'?'#22C55E':'#3B82F6')+';" id="'+nutriPanelId+'_trainCal">'+trainCal+'</div>'+
        '<div style="font-size:10px;color:var(--text3);" id="'+nutriPanelId+'_trainLabel">训练日 kcal</div></div>'+
      '<div style="display:flex;align-items:center;font-size:18px;color:var(--border);">→</div>'+
      '<div style="flex:1;text-align:center;padding:8px 4px;background:var(--card);border-radius:8px;">'+
        '<div style="font-size:22px;font-weight:800;color:var(--text2);" id="'+nutriPanelId+'_restCal">'+restCal+'</div>'+
        '<div style="font-size:10px;color:var(--text3);">休息日 kcal</div></div></div>'+
      (maxTrainBurn > avgTrainBurn ? '<div style="font-size:10px;color:var(--text3);margin-top:6px;">💡 训练日额外消耗已计入热量,LSD日多补碳水</div>' : '')+
      '</div>';
  }

  // 食物建议区
  var foodSections = [
    {label:"🥩 蛋白质来源", items:fg.protein, color:"#EF4444"},
    {label:"🍚 碳水来源",   items:fg.carb,    color:"#F59E0B"},
    {label:"🥑 脂肪来源",   items:fg.fat,     color:"#22C55E"},
    {label:"🍪 加餐/零食",  items:fg.snack,   color:"#8B5CF6"}
  ];

  html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">'+
    '<div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px;">🛒 具体吃什么</div>';

  foodSections.forEach(function(sec){
    html += '<div style="margin-bottom:8px;">'+
      '<span style="font-size:11px;font-weight:700;color:'+sec.color+';display:inline-block;min-width:90px;">'+sec.label+'</span>'+
      '<span style="font-size:12px;color:var(--text2);">'+sec.items.join(" · ")+'</span>'+
    '</div>';
  });

  // 进食时机
  html += '</div>'+
    '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-size:13px;font-weight:700;color:var(--text);">⏰ 进食时机</div>';

  // 马拉松目标:晨跑/夜跑切换
  if (goal === 'marathon' && fg.timingMorning) {
    var timingId = nutriPanelId + '_timing';
    html += '<div style="display:flex;gap:0;border-radius:10px;overflow:hidden;border:1px solid var(--border);">'+
      '<button id="'+timingId+'_morning" onclick="switchRunTiming(\''+timingId+'\',\'morning\')" style="padding:5px 14px;font-size:12px;font-weight:700;border:none;cursor:pointer;background:linear-gradient(90deg,#FF6B35,#FF3E7F);color:#fff;">🌅 晨跑</button>'+
      '<button id="'+timingId+'_evening" onclick="switchRunTiming(\''+timingId+'\',\'evening\')" style="padding:5px 14px;font-size:12px;font-weight:700;border:none;cursor:pointer;background:var(--bg);color:var(--text3);">🌙 夜跑</button>'+
    '</div>';

    // 默认显示晨跑
    html += '</div>';
    html += '<div id="'+timingId+'">';
    fg.timingMorning.forEach(function(t){
      html += '<div style="font-size:12px;color:var(--text2);line-height:1.7;padding-left:14px;position:relative;">'+
        '<span style="position:absolute;left:0;">•</span>'+t+'</div>';
    });
    html += '</div>';

    // 存储夜跑数据供切换使用(直接在JS中赋值,不依赖innerHTML中的script标签)
    if (!window._marathonTiming) window._marathonTiming = {};
    window._marathonTiming[timingId] = fg.timingEvening;
  } else {
    // 非马拉松目标:保持原逻辑
    html += '</div>';
    if (fg.timing) {
      fg.timing.forEach(function(t){
        html += '<div style="font-size:12px;color:var(--text2);line-height:1.7;padding-left:14px;position:relative;">'+
          '<span style="position:absolute;left:0;">•</span>'+t+'</div>';
      });
    } else if (fg.timingMorning) {
      fg.timingMorning.forEach(function(t){
        html += '<div style="font-size:12px;color:var(--text2);line-height:1.7;padding-left:14px;position:relative;">'+
          '<span style="position:absolute;left:0;">•</span>'+t+'</div>';
      });
    }
  }

  // 动态示例食谱:训练日 + 休息日 两版(包裹容器,供 chip 切换时动态替换)
  var mealsId = nutriPanelId + '_meals';
  html += '<div id="'+mealsId+'">';
  html += renderDynamicMealPlan(n, goal, undefined, nTrain, dayCalBurns, nEasy, undefined, undefined, 'morning');
  html += '</div>';

  // 马拉松目标:存储渲染参数,供晨跑/夜跑切换时重新渲染食谱(直接在JS中赋值,不依赖innerHTML中的script标签)
  if (goal === 'marathon') {
    if (!window._marathonMealsParams) window._marathonMealsParams = {};
    window._marathonMealsParams[mealsId] = {nRest:n, goal:goal, nTrain:nTrain, dayCalBurns:dayCalBurns, nEasy:nEasy};
  }

  html += '</div></div>';
  return html;
}

// 营养面板日程切换:存储上次生成的营养上下文
var _lastNutriCtx = null;

// 营养面板日程切换
// restCal: 休息日热量,trainCal: 训练日热量(用于默认展示)
function selectNutriDay(panelId, idx, restCal, trainCal) {
  var panel = document.getElementById(panelId);
  if (!panel) return;
  // 更新 chip 样式
  var chips = panel.querySelectorAll('.nutri-chip');
  chips.forEach(function(c){
    var ni = parseInt(c.getAttribute('data-ni'));
    if (ni === idx) { c.style.background='var(--primary)'; c.style.color='#fff'; c.style.border='none'; c.style.fontWeight='600'; }
    else { c.style.background=''; c.style.color=''; c.style.border='1px solid var(--border)'; c.style.fontWeight=''; }
  });
  // 更新热量值和标签
  var trainEl = document.getElementById(panelId+'_trainCal');
  var restEl  = document.getElementById(panelId+'_restCal');
  var labelEl = document.getElementById(panelId+'_trainLabel');
  if (!trainEl || !restEl || !labelEl) return;

  var totalTrainBurn = 0, label = '训练日 kcal';
  if (idx < 0) {
    // 平均:统计所有日程的 data-train / data-rest
    var sumTrain = 0, sumRest = 0, cnt = 0;
    chips.forEach(function(c){
      var t = parseInt(c.getAttribute('data-train')) || 0;
      var r = parseInt(c.getAttribute('data-rest'))  || 0;
      if (t) { sumTrain += t; cnt++; }
      if (r) { sumRest  += r; }
    });
    totalTrainBurn = cnt ? Math.round(sumTrain / cnt) : (trainCal || 0);
    var totalRestBurn  = cnt ? Math.round(sumRest  / cnt) : (restCal  || 0);
    if (restEl)  restEl.textContent  = totalRestBurn;
    label = '平均训练日';
  } else {
    // 指定日程
    var selChip = panel.querySelector('.nutri-chip[data-ni="'+idx+'"]');
    totalTrainBurn = parseInt(selChip ? selChip.getAttribute('data-train') : 0) || (trainCal || 0);
    var selRest = parseInt(selChip ? selChip.getAttribute('data-rest')  : 0) || (restCal  || 0);
    if (restEl) restEl.textContent = selRest;
    label = (selChip ? selChip.getAttribute('data-name') : '') || '训练日';
  }
  trainEl.textContent = totalTrainBurn;
  labelEl.textContent = label;

  // 联动刷新示例食谱
  var mealsEl = document.getElementById(panelId + '_meals');
  if (!mealsEl || !_lastNutriCtx) return;
  var ctx = _lastNutriCtx;
  var rt = window._currentRunTime || 'morning'; // 读取当前晨跑/夜跑模式
  if (idx < 0) {
    // 平均:恢复默认多版本展示(休息日+训练日 / 马拉松三档)
    mealsEl.innerHTML = renderDynamicMealPlan(ctx.nRest, ctx.goal, undefined, ctx.nTrain, ctx.dayCalBurns, ctx.nEasy, undefined, undefined, rt);
  } else {
    // 指定日程:按该日消耗重新计算营养并渲染单日食谱
    var selChip2 = panel.querySelector('.nutri-chip[data-ni="'+idx+'"]');
    var burn = parseInt(selChip2 ? selChip2.getAttribute('data-burn') : 0) || 0;
    var dayName = (selChip2 ? selChip2.getAttribute('data-name') : '') || '';
    var isTraining = burn > 0;
    var dayN = isTraining
      ? calcNutrition(ctx.weight, ctx.height, ctx.age, ctx.gender, ctx.goal, burn)
      : ctx.nRest;
    if (!dayN) return;
    var isLong = burn >= 800;
    var dayLabel = dayName ? (isTraining ? '🔥 ' + dayName : '😴 ' + dayName) : null;
    mealsEl.innerHTML = renderDynamicMealPlan(dayN, ctx.goal, isTraining, dayN, null, null, isLong, dayLabel, rt);
  }
}

function renderTipsBanner(tips) {
  if (!tips.length) return '';
  return '<div class="tips-banner">'+
    '<div class="tips-banner-title">💡 训练要点</div>'+
    '<ul>'+tips.map(function(t){return '<li>'+t+'</li>';}).join('')+'</ul></div>';
}

// 用 planId 做 key 前缀,防止不同计划/周次间勾选串号
function doneKey(id) {
  var pid = (lastPlan && lastPlan.goal)
    ? (lastPlan.goal + '_' + lastPlan.level + '_' + lastPlan.days + '_c' + (lastPlan.cycle || currentCycle) + '_w' + (lastPlan.week || currentWeek))
    : 'none';
  return 'fitbuddy_done_' + pid + '_' + id;
}

// 💓 根据年龄计算心率 Zone 区间(用于马拉松跑步训练日展示)
// Zone 1: 50-60% | Zone 2: 60-70% | Zone 3: 70-80% | Zone 4: 80-90% | Zone 5: 90-100%
function getHeartRateZones(age) {
  var maxHR = 220 - (age || 30); // 默认30岁
  return {
    zone1: [Math.round(maxHR * 0.50), Math.round(maxHR * 0.60)],
    zone2: [Math.round(maxHR * 0.60), Math.round(maxHR * 0.70)],
    zone3: [Math.round(maxHR * 0.70), Math.round(maxHR * 0.80)],
    zone4: [Math.round(maxHR * 0.80), Math.round(maxHR * 0.90)],
    zone5: [Math.round(maxHR * 0.90), maxHR],
    maxHR: maxHR
  };
}

// 根据训练类型返回对应的 Zone 名称和中英文描述
function getZoneForRunType(runName) {
  // runName: "轻松跑 6-8km" / "LSD 长距离 12km" 等
  if (runName.indexOf('轻松跑') >= 0 || runName.indexOf('恢复跑') >= 0 || runName.indexOf('有氧跑') >= 0) {
    return { zone: 'Zone 2', desc: '有氧基础', color: '#22C55E' };
  }
  if (runName.indexOf('LSD') >= 0 || runName.indexOf('长距离') >= 0) {
    return { zone: 'Zone 2-3', desc: '长距离耐力', color: '#3B82F6' };
  }
  if (runName.indexOf('节奏跑') >= 0 || runName.indexOf('配速跑') >= 0) {
    return { zone: 'Zone 3-4', desc: '乳酸阈值', color: '#F97316' };
  }
  if (runName.indexOf('间歇') >= 0) {
    return { zone: 'Zone 4-5', desc: '速度/VO2max', color: '#EF4444' };
  }
  if (runName.indexOf('冲刺') >= 0) {
    return { zone: 'Zone 5', desc: '神经激活', color: '#DC2626' };
  }
  return { zone: 'Zone 2-3', desc: '有氧', color: '#3B82F6' };
}

// 🧤 根据当天训练肌肉群推荐动态热身动作
function getWarmupExercises(muscles) {
  var mapping = {
    '腿': [
      {n:'踝关节绕环', dur:'各方向30秒,激活脚踝'},
      {n:'膝关节屈伸', dur:'30秒,预热膝盖'},
      {n:'髋关节画圈', dur:'各方向30秒,打开髋部'},
      {n:'弓步转体', dur:'每侧5次,拉伸髋屈肌'}
    ],
    '胸': [
      {n:'肩关节绕环', dur:'前后各30秒,预热肩膀'},
      {n:'胸部开合', dur:'30秒,激活胸肌'},
      {n:'墙壁俯卧撑', dur:'10-15次,预热胸部'}
    ],
    '背': [
      {n:'肩关节绕环', dur:'前后各30秒'},
      {n:'猫牛式', dur:'10次,激活脊柱'},
      {n:'手臂摆动', dur:'前后30秒,打开肩关节'}
    ],
    '肩': [
      {n:'肩关节绕环', dur:'前后各30秒'},
      {n:'肩部摆动', dur:'前后左右各30秒'},
      {n:'颈部活动', dur:'轻柔转动30秒'}
    ],
    '臂': [
      {n:'肩关节绕环', dur:'前后各30秒'},
      {n:'肘关节活动', dur:'屈伸30秒'},
      {n:'手腕活动', dur:'绕环各30秒'}
    ],
    '核心': [
      {n:'腰部转体', dur:'左右各10次'},
      {n:'死虫式预备', dur:'激活核心肌群'},
      {n:'平板支撑预备', dur:'10秒 x 2组'}
    ],
    '全身': [
      {n:'全身关节激活', dur:'各关节30秒'},
      {n:'原地踏步', dur:'1分钟,提升心率'},
      {n:'开合跳', dur:'30秒,全身预热'}
    ]
  };
  var all = [];
  muscles.forEach(function(m) {
    var key = m;
    // 肌肉群归一化
    if (key === '胸' || key === 'chest') key = '胸';
    else if (key === '背' || key === 'back') key = '背';
    else if (key === '肩' || key === 'shoulder') key = '肩';
    else if (key === '臂' || key === '三头' || key === '二头' || key === 'arm') key = '臂';
    else if (key === '核心' || key === '腹' || key === 'core') key = '核心';
    else if (key === '腿' || key === 'leg') key = '腿';
    else if (key === '全身' || key === 'full') key = '全身';
    if (mapping[key]) {
      mapping[key].forEach(function(ex) {
        if (all.every(function(a) { return a.n !== ex.n; })) all.push(ex);
      });
    }
  });
  // 去重后仍为空,返回通用热身
  if (!all.length) all = mapping['全身'];
  // 最多返回4个热身动作,避免过长
  return all.slice(0, 4);
}

function renderDayCard(dayLabel, day, sets, goalCfg, warmup, wkInfo, goal, dayCalBurn, levelCfg, dayIdx) {
  // dayIdx:训练日在 trainingDays 中的索引,用于生成确定性 id(刷新后勾选状态可恢复)
  var exCount = day.exes ? day.exes.length : 0;
  var dayId = "day_" + (dayIdx >= 0 ? dayIdx : Math.random().toString(36).substr(2,9));
  var isMarathon = goal === "marathon";

  // 心肺目标:根据训练日类型计算正确的处方显示
  var presDisplay = sets + '组 x ' + goalCfg.reps;
  if (goal === 'cardio') {
    if (day.name.indexOf('LISS') >= 0) {
      presDisplay = goalCfg.totalDuration + ' ' + (goalCfg.lissPerSet || '持续进行');
    } else if (day.name.indexOf('HIIT') >= 0) {
      presDisplay = sets + '组 x ' + (goalCfg.hiitPerSet || '30秒工作+30秒休息');
    } else {
      presDisplay = '力量 ' + sets + '组 + 有氧';
    }
  }

  var metaText = isMarathon ? "1次训练" : (exCount + '个动作');
  if (dayCalBurn) metaText += ' · 🔥~'+dayCalBurn+'kcal';

  var html = '<div class="plan-day" id="'+dayId+'">'+
    '<div class="plan-day-header" onclick="toggleDay(\''+dayId+'\')">'+
      '<span class="plan-day-name">'+dayLabel+' · '+day.name+'</span>'+
      '<div class="plan-day-right"><span class="plan-day-meta">'+metaText+'</span><span class="plan-day-toggle">▼</span></div>'+
    '</div><div class="plan-day-body">';

  // 🧤 动态热身动作推荐(可点击看GIF)- 放在热身组前面
  if (!isMarathon && day.exes && day.exes.length) {
    var dayMuscles = [];
    day.exes.forEach(function(ex) { if (dayMuscles.indexOf(ex.m) < 0 && ex.m !== '有氧') dayMuscles.push(ex.m); });
    if (dayMuscles.length) {
      var wmExes = getWarmupExercises(dayMuscles);
      html += '<div class="warmup-section" style="background:#FFF7ED;"><div class="warmup-title" style="color:#F97316;">🧤 推荐热身</div>';
      wmExes.forEach(function(wm) {
        html += '<div class="warmup-item" style="color:#F97316;cursor:pointer;" onclick="event.stopPropagation();showEx(\''+wm.n+'\')">• '+wm.n+' - '+wm.dur+'</div>';
      });
      html += '</div>';
    }
  }

  // 🔥 热身组
  if (warmup && warmup.type === "lift" && exCount > 0) {
    html += '<div class="warmup-section"><div class="warmup-title">🔥 热身组</div>';
    (warmup.sets || []).forEach(function(w){
      html += '<div class="warmup-item">'+w.s+'组 x '+w.r+' ('+w.i+') - '+w.n+'</div>';
    });
    html += '</div>';
  } else if (warmup && warmup.type === "run") {
    html += '<div class="warmup-section" style="background:#EFF6FF;margin-bottom:0;">'+
      '<div class="warmup-title" style="color:#3B82F6;">🦵 跑前热身</div>';
    warmup.warmup.forEach(function(w){ html += '<div class="warmup-item" style="color:#3B82F6;opacity:0.85;">• '+w+'</div>'; });
    html += '</div>'+
      '<div class="warmup-section" style="background:#F0FDF4;margin-top:6px;">'+
      '<div class="warmup-title" style="color:#22C55E;">🧘 跑后冷身</div>';
    warmup.cooldown.forEach(function(c){ html += '<div class="warmup-item" style="color:#22C55E;opacity:0.85;">• '+c+'</div>'; });
    html += '</div>';
  }

  if (day.exes) {
    day.exes.forEach(function(ex, idx){
      var bc = BADGE_COLORS[ex.m] || ["#888","#F5F5F5"];
      var bt = BADGE_TEXT[ex.m] || (ex.m ? ex.m[0] : '?');
      var checkId = dayId + "_ex" + idx;
      var done = localStorage.getItem(doneKey(checkId)) === "1";
      var isInjuredEx = ex._injured || false;

      // 马拉松专属处方显示
      var exPrescriptionHtml;
      var distData = "";
      var isLiftEx = !isMarathon && ex.m !== '有氧'; // 力量动作(有重量/次数概念)
      var isBodyweight = ex.eq === "bodyweight";     // 纯自重动作不显示重量输入

      if (isMarathon && ex.isMarathon) {
        // 提取距离:支持 "12km"、"6-8km"、"6×800m" 三种格式(与 estimateDayCalBurn 一致)
        var dist = 0;
        var m1 = ex.n.match(/(\d+\.?\d*)\s*km/i);
        var m2 = ex.n.match(/(\d+)\s*x\s*(\d+)\s*m/i);
        var m3 = ex.n.match(/(\d+)-(\d+)\s*km/i);
        if (m1) dist = parseFloat(m1[1]);
        else if (m2) dist = parseInt(m2[1]) * parseInt(m2[2]) / 1000;
        else if (m3) dist = (parseFloat(m3[1]) + parseFloat(m3[2])) / 2;
        if (dist > 0) distData = ' data-dist="'+dist+'"';
        // 优先使用用户自定义配速
        var exPace = ex.pace || '-';
        if (window._marathonPaces) {
          var en = ex.n;
          if (en.indexOf('\u95F4\u6B47') >= 0) exPace = window._marathonPaces.interval + '/km';
          else if (en.indexOf('LSD') >= 0 || en.indexOf('\u957F\u8DDD\u79BB') >= 0) exPace = window._marathonPaces.lsdMin + '-' + window._marathonPaces.lsdMax + '/km';
          else if (en.indexOf('\u8282\u594F') >= 0) exPace = window._marathonPaces.tempoMin + '-' + window._marathonPaces.tempoMax + '/km';
          else if (en.indexOf('\u914D\u901F') >= 0) exPace = window._marathonPaces.marathon + '/km';
          else exPace = window._marathonPaces.easyMin + '-' + window._marathonPaces.easyMax + '/km';
        }
        // 计算心率 Zone 具体数值
        var userAge = parseInt((lastPlan && lastPlan.age) || document.getElementById('bodyAge').value || 30);
        var hrZones = getHeartRateZones(userAge);
        var zoneLabel = ex.zone || 'Zone 2-3';
        var zoneColor = ex.zoneColor || '#3B82F6';
        // 根据 zoneLabel 取对应心率区间
        var zoneHR = '';
        if (zoneLabel === 'Zone 2') zoneHR = hrZones.zone2[0] + '-' + hrZones.zone2[1] + ' bpm';
        else if (zoneLabel === 'Zone 2-3') zoneHR = hrZones.zone2[0] + '-' + hrZones.zone3[1] + ' bpm';
        else if (zoneLabel === 'Zone 3-4') zoneHR = hrZones.zone3[0] + '-' + hrZones.zone4[1] + ' bpm';
        else if (zoneLabel === 'Zone 4-5') zoneHR = hrZones.zone4[0] + '-' + hrZones.zone5[1] + ' bpm';
        else if (zoneLabel === 'Zone 5') zoneHR = hrZones.zone5[0] + '-' + hrZones.zone5[1] + ' bpm';
        else zoneHR = hrZones.zone2[0] + '-' + hrZones.zone3[1] + ' bpm';

        exPrescriptionHtml =
          '<div class="ex-sets">🏃 配速 ' + exPace + '</div>'+
          '<div style="display:inline-block;font-size:11px;font-weight:600;color:'+zoneColor+';background:'+zoneColor+'18;padding:2px 8px;border-radius:8px;margin:3px 0 2px 0;">' + zoneLabel + ' <span style="font-weight:400;opacity:0.8;">(' + zoneHR + ')</span></div>'+
          '<div style="font-size:11px;color:var(--text2);margin-top:2px;">' + (ex.zoneDesc || '') + ' · ' + (ex.tips || '') + '</div>';
      } else if (goal === 'cardio' && ex.m === '有氧') {
        var cdDist = 0;
        var cm1 = ex.n.match(/(\d+\.?\d*)\s*km/i);
        var cm2 = ex.n.match(/(\d+)\s*x\s*(\d+)\s*m/i);
        if (cm1) cdDist = parseFloat(cm1[1]);
        else if (cm2) cdDist = parseInt(cm2[1]) * parseInt(cm2[2]) / 1000;
        if (cdDist > 0) distData = ' data-dist="'+cdDist+'"';
        exPrescriptionHtml = '<div class="ex-sets">'+presDisplay+'</div>'+
          '<div class="ex-intensity">'+goalCfg.intensity+'</div>'+'<span class="rpe-badge">'+goalCfg.rpe+'</span>'+
          (goalCfg.rest && goalCfg.rest !== '-' ? '<button class="rest-btn" onclick="event.stopPropagation();startRestTimer(\''+goalCfg.rest+'\')">⏱ '+goalCfg.rest+'</button>' : '');
      } else if (ex.m === '有氧') {
        // 非心肺目标中的有氧动作 - 显示时长,不显示组×次
        var cardioCfg = (levelCfg && levelCfg.cardio) || {totalDuration:"30分钟", lissPerSet:"持续进行", rest:"30秒", intensity:"心率 Zone 2", rpe:"RPE 5-6"};
        exPrescriptionHtml = '<div class="ex-sets">🫁 ' + (cardioCfg.totalDuration || '有氧') + ' · ' + (cardioCfg.lissPerSet || '持续进行') + '</div>'+
          '<div class="ex-intensity">' + cardioCfg.intensity + '</div><span class="rpe-badge">' + (cardioCfg.rpe || '') + '</span>'+
          (cardioCfg.rest && cardioCfg.rest !== '-' ? '<button class="rest-btn" onclick="event.stopPropagation();startRestTimer(\''+cardioCfg.rest+'\')">⏱ '+cardioCfg.rest+'</button>' : '');
      } else {
        exPrescriptionHtml =
          '<div class="ex-sets">'+presDisplay+'</div>'+
          '<div class="ex-intensity">'+goalCfg.intensity+'</div>'+'<span class="rpe-badge">'+goalCfg.rpe+'</span>'+
          (goalCfg.rest && goalCfg.rest !== '-' ? '<button class="rest-btn" onclick="event.stopPropagation();startRestTimer(\''+goalCfg.rest+'\')">⏱ '+goalCfg.rest+'</button>' : '');
      }

      // 渐进超负荷:上次记录
      var lastLog = isLiftEx ? getLastLog(ex.n) : null;
      var lastLogHtml = '';
      if (lastLog) {
        if (isBodyweight) {
          // 自重动作只显示次数
          if (lastLog.reps) lastLogHtml = '<span class="prog-last">📋 上次:'+lastLog.reps+'次'+(lastLog.rpe?' (RPE'+lastLog.rpe+')':'')+'</span>';
        } else {
          if (lastLog.weight || lastLog.reps) {
            lastLogHtml = '<span class="prog-last">📋 上次:'+(lastLog.weight?lastLog.weight+'kg × ':'')+lastLog.reps+'次'+(lastLog.rpe?' (RPE'+lastLog.rpe+')':'')+'</span>';
          }
        }
      }

      // 渐进超负荷输入(力量动作)
      var progInputsHtml = '';
      if (isLiftEx) {
        var progId = checkId + '_prog';
        if (isBodyweight) {
          progInputsHtml = '<div class="prog-row" id="'+progId+'">'+
            '<span class="prog-label">次数</span><input type="number" class="prog-input" placeholder="次" min="1" max="50" onchange="logProg(\''+ex.n.replace(/'/g,"\\'")+'\',\''+progId+'\')">'+
            '<span class="prog-label">RPE</span><input type="number" class="prog-input" placeholder="1-10" min="1" max="10" onchange="logProg(\''+ex.n.replace(/'/g,"\\'")+'\',\''+progId+'\')" style="width:44px;">'+
            lastLogHtml +
            '</div>';
        } else {
          progInputsHtml = '<div class="prog-row" id="'+progId+'">'+
            '<span class="prog-label">重量</span><input type="number" class="prog-input" placeholder="kg" step="0.5" min="0" onchange="logProg(\''+ex.n.replace(/'/g,"\\'")+'\',\''+progId+'\')" onfocus="this.select()">'+
            '<span class="prog-label">次数</span><input type="number" class="prog-input" placeholder="次" min="1" max="50" onchange="logProg(\''+ex.n.replace(/'/g,"\\'")+'\',\''+progId+'\')">'+
            '<span class="prog-label">RPE</span><input type="number" class="prog-input" placeholder="1-10" min="1" max="10" onchange="logProg(\''+ex.n.replace(/'/g,"\\'")+'\',\''+progId+'\')" style="width:44px;">'+
            lastLogHtml +
            '</div>';
        }
      }

      // 替换按钮(非马拉松的力量动作)
      var subBtnHtml = '';
      if (isLiftEx && !isInjuredEx) {
        // 找到该动作在 trainingDays 中的索引
        var di = -1;
        if (lastPlan && lastPlan.trainingDays) {
          lastPlan.trainingDays.forEach(function(d, didx){
            if (d.exes) {
              d.exes.forEach(function(e, eidx){
                if (e.n === ex.n && didx === (lastPlan.schedule ? lastPlan.schedule.filter(function(s){return s.isTraining;}).indexOf(lastPlan.schedule.filter(function(s){return s.isTraining;})[didx]) : -1)) {
                  // simplified: use checkId
                }
              });
            }
          });
        }
        subBtnHtml = '<button class="sub-btn" onclick="event.stopPropagation();openSubModalForEx(\''+ex.n.replace(/'/g,"\\'")+'\')" title="替换动作">🔄</button>';
      }

      var injuryClass = isInjuredEx ? ' injury-skipped' : '';

      html += '<div class="ex-row'+(done?' done':'')+injuryClass+'" id="'+checkId+'"'+distData+'>'+
        '<div class="ex-check'+(done?' done':'')+(isInjuredEx?' injury-skipped':'')+'" onclick="'+(!isInjuredEx?'toggleDone(\''+checkId+'\')':'')+'">'+(done?'✓':(isInjuredEx?'⚠':''))+'</div>'+
        '<div class="ex-left" onclick="'+(!isInjuredEx?'showEx(\''+ex.n.replace(/'/g,"\\'")+'\')':'')+'">'+
          '<div class="ex-badge" style="background:'+bc[1]+';color:'+bc[0]+';">'+bt+'</div>'+
          '<div><div class="ex-name">'+ex.n+(isInjuredEx?' ⚠️':'')+'</div><div class="ex-diff">'+ex.diff+(isInjuredEx?' · 已跳过(伤病限制)':'')+'</div></div>'+subBtnHtml+
        '</div>'+
        '<div class="ex-prescription" onclick="'+(!isInjuredEx?'showEx(\''+ex.n.replace(/'/g,"\\'")+'\')':'')+'">'+exPrescriptionHtml+'</div>'+
      '</div>';

      // 渐进超负荷输入(在 ex-row 之后,力量动作专属)
      if (progInputsHtml && !isInjuredEx) {
        html += '<div style="padding:0 14px 8px;border-bottom:1px solid var(--border);">' + progInputsHtml + '</div>';
      }
    });
  }
  // 训练备注 + 用户笔记
  var noteId = dayId + "_note";
  var savedNote = localStorage.getItem("fitbuddy_note_" + goal + "_w" + currentWeek + "_" + day.name) || "";
  html += '<div style="padding:8px 0;border-top:1px solid var(--border);">'+
    (goalCfg.note && !isMarathon ? '<div style="font-size:12px;color:var(--amber);margin-bottom:6px;">📝 '+goalCfg.note+'</div>' : '')+
    '<input type="text" class="text-input note-input" id="'+noteId+'" placeholder="💬 添加训练笔记(感觉、重量变化、备注...)" value="'+(savedNote||'')+'" '+
    'onchange="saveNote(\''+noteId+'\',\''+goal+'\','+currentWeek+',\''+(day.name||"").replace(/'/g,"\\'")+'\')" '+
    'onblur="saveNote(\''+noteId+'\',\''+goal+'\','+currentWeek+',\''+(day.name||"").replace(/'/g,"\\'")+'\')" '+
    'style="font-size:12px;padding:8px 10px;background:var(--bg);border:none;">'+
    '</div>';
  html += '</div></div>';
  return html;
}

// ============ 折叠/完成/计时器 ============
function toggleDay(id) {
  document.getElementById(id).classList.toggle("collapsed");
}
function saveNote(noteId, goal, week, dayName) {
  var el = document.getElementById(noteId);
  if (!el) return;
  var val = el.value.trim();
  var key = "fitbuddy_note_" + goal + "_w" + week + "_" + dayName;
  if (val) localStorage.setItem(key, val);
  else localStorage.removeItem(key);
}

// ============ 渐进超负荷记录 ============
function saveTrainingLog(exName, weight, reps, rpeVal) {
  if (!exName) return;
  if (!trainingLog[exName]) trainingLog[exName] = [];
  var entry = { date: new Date().toISOString().slice(0,10), weight: parseFloat(weight)||0, reps: parseInt(reps)||0, rpe: parseInt(rpeVal)||0 };
  trainingLog[exName].push(entry);
  if (trainingLog[exName].length > 50) trainingLog[exName] = trainingLog[exName].slice(-50);
  localStorage.setItem("fitbuddy_trainlog", JSON.stringify(trainingLog));
}

// 从输入框读取并保存渐进超负荷数据
function logProg(exName, progId) {
  var row = document.getElementById(progId);
  if (!row) return;
  var inputs = row.querySelectorAll('input');
  var weight = inputs[0] ? inputs[0].value : '';
  var reps = inputs[1] ? inputs[1].value : '';
  var rpe = inputs[2] ? inputs[2].value : '';
  if (!weight && !reps && !rpe) return;
  saveTrainingLog(exName, weight, reps, rpe);
}

// 动作替换入口(找到 dayIdx/exIdx 然后打开替换弹窗)
function openSubModalForEx(exName) {
  if (!lastPlan || !lastPlan.trainingDays) return;
  for (var di=0; di<lastPlan.trainingDays.length; di++) {
    var day = lastPlan.trainingDays[di];
    if (!day.exes) continue;
    for (var ei=0; ei<day.exes.length; ei++) {
      if (day.exes[ei].n === exName) {
        openSubModal(di, ei, exName);
        return;
      }
    }
  }
  alert('未找到该动作,请重新生成计划后重试');
}

function getLastLog(exName) {
  if (!trainingLog[exName] || !trainingLog[exName].length) return null;
  return trainingLog[exName][trainingLog[exName].length-1];
}

function getProgressionHistory(exName) {
  return trainingLog[exName] || [];
}

// ============ CSV 导出 ============
function exportCSV() {
  var rows = [['日期','动作','重量(kg)','次数','RPE']];
  Object.keys(trainingLog).forEach(function(exName){
    trainingLog[exName].forEach(function(e){
      rows.push([e.date, exName, e.weight||'', e.reps||'', e.rpe||'']);
    });
  });
  if (rows.length <= 1) { alert('暂无训练数据可导出'); return; }
  var csv = rows.map(function(r){
    return r.map(function(cell){
      var s = String(cell);
      if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',');
  }).join('\n');
  var blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'FitBuddy_训练记录_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ============ 生成分享图(训练成果卡片)============
function generateShareImage() {
  _trackStat('shares');
  var hist = JSON.parse(localStorage.getItem("fitbuddy_history") || "[]");
  if (hist.length === 0) { alert('暂无训练数据,完成训练后再来生成分享图吧!'); return; }
  var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
  var goalName = plan ? ({muscle:'增肌',strength:'力量',cut:'减脂',cardio:'心肺',marathon:'马拉松'})[plan.goal] || '健身' : '健身';
  var levelName = plan ? ({beginner:'入门',intermediate:'进阶',advanced:'高手'})[plan.level] || '' : '';
  var totalSessions = new Set(hist.map(function(h){ return h.date; })).size;
  var totalSets = hist.reduce(function(s,h){ return s + (h.count||h.sets||1); }, 0);
  var topEx = Object.keys(trainingLog).sort(function(a,b){
    return (trainingLog[b]||[]).length - (trainingLog[a]||[]).length;
  }).slice(0,3);
  // 连续打卡
  var dateSet = new Set(hist.map(function(h){ return h.date; }));
  var today = new Date().toISOString().slice(0,10);
  var streak = 0;
  var check = new Date(today);
  if (!dateSet.has(today) && hist.length > 0) {
    check = new Date(today); check.setDate(check.getDate()-1);
  }
  while (dateSet.has(check.toISOString().slice(0,10))) {
    streak++; check.setDate(check.getDate()-1);
  }
  // 精灵信息
  var petInfo = (typeof petGetSpecies === 'function') ? petGetSpecies() : null;
  var petSprite = '';
  if (petInfo && typeof petGetDays === 'function') {
    var pd = petGetDays(petInfo.speciesId);
    var spu = PET_SPECIES ? PET_SPECIES[petInfo.speciesId] : null;
    if (spu) {
      var pstg = spu.stages.findIndex(function(s,i){ return i<spu.stages.length-1?pd<spu.stages[i+1].need:true; });
      if (pstg<0) pstg=0;
      petSprite = (spu && spu.stages[pstg]) ? spu.stages[pstg].emoji : '';
    }
  }

  var canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  var ctx = canvas.getContext('2d');
  var W = 1080, H = 1920;

  // 背景 - 深色高级感
  var grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1A1A2E'); grad.addColorStop(0.5, '#16213E'); grad.addColorStop(1, '#0F3460');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // 光斑装饰
  ctx.globalAlpha = 0.06; ctx.fillStyle = '#FF6B35';
  ctx.beginPath(); ctx.arc(W*0.85, H*0.05, 250, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(W*0.1, H*0.2, 180, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#8B5CF6';
  ctx.beginPath(); ctx.arc(W*0.9, H*0.6, 200, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  // 顶部区域 - 大标题
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.font = 'bold 900 64px sans-serif';
  ctx.fillText('🏋️ FitBuddy', W/2, 130);
  ctx.font = 'bold 700 36px sans-serif'; ctx.globalAlpha = 0.9;
  ctx.fillText('我的训练成果', W/2, 195);
  ctx.globalAlpha = 1;

  // 目标&水平标签
  ctx.font = '500 26px sans-serif';
  var tagW = ctx.measureText(goalName + ' · ' + levelName).width + 60;
  ctx.fillStyle = 'rgba(255,107,53,0.2)';
  ctx.beginPath();
  ctx.roundRect(W/2-tagW/2, 220, tagW, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#FF6B35'; ctx.font = '600 26px sans-serif';
  ctx.fillText(goalName + ' · ' + levelName, W/2, 252);

  // 分隔线
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 290); ctx.lineTo(W-80, 290); ctx.stroke();

  // === 四大核心数据 ===
  var bigData = [
    {val: totalSessions, unit: '次训练', icon: '📅', color: '#FF6B35'},
    {val: totalSets, unit: '组完成', icon: '💪', color: '#3B82F6'},
    {val: streak, unit: '天连签', icon: '🔥', color: '#F59E0B'},
    {val: hist.length, unit: '条记录', icon: '📊', color: '#22C55E'}
  ];

  ctx.textAlign = 'center';
  bigData.forEach(function(d, i){
    var cx = 80 + (i%2+0.5)*((W-160)/2);
    var cy = 390 + Math.floor(i/2)*220;
    // 卡片背景
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(cx-((W-160)/2-20)/2, cy-20, (W-160)/2-20, 190, 20);
    ctx.fill();
    // 图标
    ctx.font = '48px sans-serif'; ctx.fillText(d.icon, cx, cy+45);
    // 数字
    ctx.fillStyle = d.color; ctx.font = 'bold 900 72px sans-serif';
    ctx.fillText(d.val, cx, cy+115);
    // 单位
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '500 24px sans-serif';
    ctx.fillText(d.unit, cx, cy+152);
  });

  // 分隔线
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(80, 850); ctx.lineTo(W-80, 850); ctx.stroke();

  // 最常练动作
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff'; ctx.font = 'bold 700 30px sans-serif';
  ctx.fillText('💪 最常练的动作', 80, 910);

  topEx.forEach(function(exName, i){
    var log = trainingLog[exName] || [];
    var lastW = log.length > 0 ? (log[log.length-1].weight||0) : 0;
    var y = 950 + i*80;
    // 序号圆圈
    var colors = ['#FF6B35','#3B82F6','#22C55E'];
    ctx.fillStyle = colors[i];
    ctx.beginPath(); ctx.arc(140, y+12, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = 'bold 700 28px sans-serif'; ctx.fillText(i+1, 140, y+23);
    // 动作名
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    ctx.font = '600 28px sans-serif'; ctx.fillText(exName, 185, y+16);
    // 最近重量
    ctx.font = '500 22px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(log.length + '次记录', 185, y+48);
    if (lastW > 0) {
      ctx.textAlign = 'right';
      ctx.fillText(lastW + 'kg', W-80, y+16);
    }
    ctx.textAlign = 'left';
  });

  // 分割线
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(80, 1190); ctx.lineTo(W-80, 1190); ctx.stroke();

  // 精灵区域
  if (petSprite) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = 'bold 700 30px sans-serif';
    ctx.fillText('🐾 我的健身伙伴', 80, 1250);
    ctx.textAlign = 'center';
    ctx.font = '120px sans-serif';
    ctx.fillText(petSprite, W/2, 1380);
    if (spu) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '500 24px sans-serif';
      ctx.fillText(spu.name + ' · ' + spu.stages[pstg].name + ' · 已训练' + pd + '天', W/2, 1420);
    }
  }

  // 底部装饰线
  var bottomY = petSprite ? 1500 : 1280;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.moveTo(80, bottomY); ctx.lineTo(W-80, bottomY); ctx.stroke();

  // 训练周期
  var dates = hist.map(function(h){ return h.date; }).sort();
  ctx.textAlign = 'center';
  ctx.font = '400 22px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('训练周期  ' + dates[0] + ' ~ ' + dates[dates.length-1], W/2, bottomY + 50);

  // 品牌区
  ctx.font = 'bold 700 36px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText('你的训练,你的节奏 💪', W/2, bottomY + 120);
  ctx.font = '500 24px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('FitBuddy · 免费健身计划生成器', W/2, bottomY + 162);
  ctx.font = '400 20px sans-serif';
  ctx.fillText('扫码试试?用浏览器打开就能用!', W/2, bottomY + 198);

  // 底部装饰圆点
  ctx.globalAlpha = 0.3;
  for (var dot = 0; dot < 5; dot++) {
    ctx.fillStyle = ['#FF6B35','#3B82F6','#22C55E','#F59E0B','#8B5CF6'][dot];
    ctx.beginPath(); ctx.arc(W/2-120+dot*60, bottomY+250, 10, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 水印
  ctx.textAlign = 'center'; ctx.font = '400 18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText('fitbuddy.app', W/2, H-40);

  // 生成图片 + 弹窗预览
  canvas.toBlob(function(blob){
    var url = URL.createObjectURL(blob);
    showSharePreview(url, blob);
  }, 'image/png');
}

// 分享预览弹窗(支持下载/复制/WebShare)
function showSharePreview(imageUrl, blob) {
  var overlay = document.createElement('div');
  overlay.id = 'sharePreviewOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  var html = '<img src="'+imageUrl+'" style="max-height:65vh;max-width:90%;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.5);margin-bottom:20px;" id="sharePreviewImg">';
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">';
  html += '<button onclick="downloadShareImg()" style="padding:14px 32px;border-radius:16px;background:linear-gradient(90deg,#FF6B35,#FF3E7F);color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;">💾 保存图片</button>';
  html += '<button onclick="copyShareImg()" style="padding:14px 32px;border-radius:16px;background:linear-gradient(90deg,#3B82F6,#2563EB);color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;">📋 复制图片</button>';
  if (navigator.share) {
    html += '<button onclick="shareImgToSocial()" style="padding:14px 32px;border-radius:16px;background:linear-gradient(90deg,#22C55E,#16A34A);color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;">📱 分享到社交平台</button>';
  }
  html += '</div>';
  html += '<button onclick="document.getElementById(\'sharePreviewOverlay\').remove()" style="margin-top:16px;padding:10px 24px;border-radius:14px;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">关闭</button>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  // 存储 blob 供后续使用
  overlay._shareBlob = blob;
  overlay._shareUrl = imageUrl;
}

function downloadShareImg() {
  var overlay = document.getElementById('sharePreviewOverlay');
  if (!overlay || !overlay._shareUrl) return;
  var a = document.createElement('a');
  a.href = overlay._shareUrl;
  a.download = 'FitBuddy_训练成果_' + new Date().toISOString().slice(0,10) + '.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function copyShareImg() {
  var overlay = document.getElementById('sharePreviewOverlay');
  if (!overlay || !overlay._shareBlob) return;
  try {
    navigator.clipboard.write([
      new ClipboardItem({'image/png': overlay._shareBlob})
    ]).then(function(){
      var toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10002;background:#22C55E;color:#fff;padding:14px 28px;border-radius:16px;font-size:15px;font-weight:700;';
      toast.textContent = '✅ 已复制图片,可粘贴到聊天/朋友圈!';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.remove(); }, 2500);
    }).catch(function(){
      alert('复制失败,请使用"保存图片"后手动分享');
    });
  } catch(e) {
    alert('浏览器不支持图片复制,请使用"保存图片"后手动分享');
  }
}

function shareImgToSocial() {
  var overlay = document.getElementById('sharePreviewOverlay');
  if (!overlay || !overlay._shareBlob) return;
  navigator.share({
    files: [new File([overlay._shareBlob], 'FitBuddy训练成果.png', {type:'image/png'})],
    title: 'FitBuddy 训练成果',
    text: '🏋️ 来看看我的 FitBuddy 训练成果吧!你的训练,你的节奏 💪'
  }).catch(function(){});
}

// ============ 导出训练日记(可打印 HTML)============
function exportDiary() {
  _trackStat('shares');
  var hist = JSON.parse(localStorage.getItem("fitbuddy_history") || "[]");
  var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
  if (hist.length === 0) { alert('暂无训练数据可导出'); return; }

  // 按天分组
  var byDay = {};
  hist.forEach(function(h){
    var d = h.date;
    if (!byDay[d]) byDay[d] = {items:[], totalSets:0};
    byDay[d].items.push(h);
    byDay[d].totalSets += h.count || h.sets || 1;
  });
  var dates = Object.keys(byDay).sort();
  var totalSessions = dates.length;
  var totalSets = hist.reduce(function(s,h){ return s + (h.count||h.sets||1); }, 0);

  var planName = plan ? ({
    muscle:'增肌', strength:'力量', cut:'减脂', cardio:'心肺', marathon:'马拉松'
  })[plan.goal] || '训练' : '训练';

  var html = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>FitBuddy 训练日记 - '+planName+'</title>'+
    '<style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;max-width:720px;margin:0 auto;padding:30px 20px;color:#333;line-height:1.8;}'+
    'h1{text-align:center;color:#FF6B35;font-size:24px;margin-bottom:4px;}h1 small{font-size:14px;color:#999;display:block;}'+
    '.summary{text-align:center;margin:20px 0;padding:16px;background:#FFF5F0;border-radius:12px;font-size:14px;}'+
    '.summary span{margin:0 16px;font-weight:600;}'+
    '.day{margin:20px 0;padding:16px;border:1px solid #eee;border-radius:10px;page-break-inside:avoid;}'+
    '.day h3{font-size:16px;color:#FF6B35;border-bottom:2px solid #FF6B35;padding-bottom:6px;margin:0 0 12px;}'+
    '.day .meta{font-size:12px;color:#999;margin-bottom:8px;}'+
    'table{width:100%;border-collapse:collapse;font-size:13px;}th,td{padding:8px 6px;text-align:center;border-bottom:1px solid #eee;}'+
    'th{background:#FAFAFA;font-weight:600;color:#555;}'+
    '.footer{text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;}'+
    '@media print{body{padding:0;}'+
    '.footer{border:none;}}</style></head><body>'+
    '<h1>📖 FitBuddy 训练日记<small>'+planName+'计划 · '+new Date().toISOString().slice(0,10)+' 导出</small></h1>'+
    '<div class="summary">'+
      '<span>🏋️ '+totalSessions+' 次训练</span>'+
      '<span>📊 '+totalSets+' 组动作</span>'+
      '<span>📅 '+dates[0]+' ~ '+dates[dates.length-1]+'</span>'+
    '</div>';

  dates.forEach(function(d){
    var day = byDay[d];
    var dayName = ['日','一','二','三','四','五','六'][new Date(d).getDay()];
    html += '<div class="day"><h3>📅 '+d+' 周'+dayName+'</h3>'+
      '<div class="meta">完成 '+day.items.length+' 个动作 · 共 '+day.totalSets+' 组</div>'+
      '<table><thead><tr><th>动作</th><th>重量(kg)</th><th>次数</th><th>RPE</th></tr></thead><tbody>';
    day.items.forEach(function(ex){
      html += '<tr><td>'+ex.name+'</td>'+
        '<td>'+(ex.weight||'-')+'</td>'+
        '<td>'+(ex.reps||'-')+'</td>'+
        '<td>'+(ex.rpe||'-')+'</td></tr>';
    });
    html += '</tbody></table></div>';
  });

  html += '<div class="footer">由 FitBuddy 健身助手生成 · 免费周期化训练计划 · Made with 🧡</div>'+
    '<script>window.onload=function(){window.print();}<\/script></body></html>';

  var blob = new Blob(['\uFEFF'+html], {type:'text/html;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var w = window.open(url, '_blank');
  if (!w) {
    // 弹窗被拦截,尝试下载
    var a = document.createElement('a');
    a.href = url;
    a.download = 'FitBuddy_训练日记_' + new Date().toISOString().slice(0,10) + '.html';
    a.click();
  }
  URL.revokeObjectURL(url);
}

// ============ 进度图表(Canvas)============
function drawChart(canvasId, data, opts) {
  // 保存配置用于 resize 重绘
  window._chartConfigs[canvasId] = { type:'chart', data:data, opts:opts };
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  var W = rect.width, H = rect.height;
  ctx.clearRect(0,0,W,H);

  var pad = {top:20, right:20, bottom:40, left:50};
  var cw = W - pad.left - pad.right;
  var ch = H - pad.top - pad.bottom;

  // 背景
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--card').trim() || '#fff';
  ctx.fillRect(0,0,W,H);

  // 网格
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border').trim() || '#EBEBEB';
  ctx.lineWidth = 0.5;
  var ySteps = 4;
  for (var i=0; i<=ySteps; i++) {
    var y = pad.top + (ch / ySteps) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke();
  }

  // Y轴标签
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text3').trim() || '#999';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  var yMax = opts.yMax || Math.max.apply(null, data.map(function(d){return d.v;}).concat([1]));
  yMax = Math.ceil(yMax * 1.1);
  for (var i=0; i<=ySteps; i++) {
    var val = Math.round(yMax - (yMax / ySteps) * i);
    var y = pad.top + (ch / ySteps) * i;
    ctx.fillText(val, pad.left-6, y+3);
  }

  // X轴标签
  ctx.textAlign = 'center';
  var maxLabels = Math.min(data.length, Math.floor(cw / 50));
  var step = Math.max(1, Math.ceil(data.length / maxLabels));
  for (var i=0; i<data.length; i+=step) {
    var x = pad.left + (cw / (data.length-1 || 1)) * i;
    ctx.fillText(data[i].l, x, H-pad.bottom+16);
  }

  // 数据线
  if (opts.type === 'line') {
    ctx.strokeStyle = opts.color || '#FF6B35';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach(function(d, i){
      var x = pad.left + (cw / (data.length-1 || 1)) * i;
      var y = pad.top + ch - (d.v / yMax * ch);
      if (i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // 数据点
    ctx.fillStyle = opts.color || '#FF6B35';
    data.forEach(function(d, i){
      var x = pad.left + (cw / (data.length-1 || 1)) * i;
      var y = pad.top + ch - (d.v / yMax * ch);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
    });
  } else if (opts.type === 'bar') {
    var barW = Math.min(30, cw / data.length * 0.7);
    data.forEach(function(d, i){
      var x = pad.left + (cw / (data.length-1 || 1)) * i - barW/2;
      var barH = (d.v / yMax * ch);
      var y = pad.top + ch - barH;
      ctx.fillStyle = opts.color || '#FF6B35';
      ctx.fillRect(x, y, barW, barH);
      // 柱顶标签
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#1A1A2E';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.v, x+barW/2, y-4);
    });
  }

  // 标题
  if (opts.title) {
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#1A1A2E';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(opts.title, pad.left, 16);
  }
}

// ============ 环形图(部位分布等)============
function drawDonutChart(canvasId, segments) {
  // 保存配置用于 resize 重绘
  window._chartConfigs[canvasId] = { type:'donut', segments:segments };
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  var W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);

  var total = segments.reduce(function(s, seg){ return s + seg.value; }, 0);
  if (total === 0) return;

  var cx = W / 2, cy = H / 2;
  var outerR = Math.min(W, H) / 2 - 10;
  var innerR = outerR * 0.5;

  var startAngle = -Math.PI / 2;
  segments.forEach(function(seg){
    var sliceAngle = (seg.value / total) * Math.PI * 2;
    // 扇形
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    // 白色分割线
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 环形内部文字标签
    var pct = Math.round(seg.value / total * 100);
    if (pct >= 6) {
      var midAngle = startAngle + sliceAngle / 2;
      var labelR = (outerR + innerR) / 2;
      var lx = cx + Math.cos(midAngle) * labelR;
      var ly = cy + Math.sin(midAngle) * labelR;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct + '%', lx, ly);
    }

    startAngle += sliceAngle;
  });

  // 中心文字:总次数
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#1A1A2E';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total + '次', cx, cy - 4);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text3').trim() || '#999';
  ctx.fillText('总训练', cx, cy + 12);
}

// ============ 图表 Resize 重绘 ============
window.redrawAllCharts = function() {
  var configs = window._chartConfigs || {};
  Object.keys(configs).forEach(function(canvasId) {
    var cfg = configs[canvasId];
    if (!cfg) return;
    if (cfg.type === 'chart') {
      drawChart(canvasId, cfg.data, cfg.opts);
    } else if (cfg.type === 'donut') {
      drawDonutChart(canvasId, cfg.segments);
    }
  });
};

// ============ 跑鞋里程 ============
function addShoe() {
  var name = prompt('跑鞋名称(如:Nike Vaporfly 3):');
  if (!name || !name.trim()) return;
  var startDate = prompt('开始使用日期(YYYY-MM-DD):', new Date().toISOString().slice(0,10));
  if (!startDate) return;
  shoeList.push({ name: name.trim(), startDate: startDate, totalKm: 0, retired: false });
  saveShoes();
  if (document.getElementById('page-prog').classList.contains('active')) renderProgress();
}

function logShoeKm(idx) {
  var km = parseFloat(prompt('本次跑步距离(km):'));
  if (!km || km <= 0) return;
  shoeList[idx].totalKm += km;
  saveShoes();
  if (document.getElementById('page-prog').classList.contains('active')) renderProgress();
}

function retireShoe(idx) {
  shoeList[idx].retired = !shoeList[idx].retired;
  saveShoes();
  if (document.getElementById('page-prog').classList.contains('active')) renderProgress();
}

function deleteShoe(idx) {
  if (!confirm('确定删除「'+shoeList[idx].name+'」吗?')) return;
  shoeList.splice(idx, 1);
  saveShoes();
  if (document.getElementById('page-prog').classList.contains('active')) renderProgress();
}

function saveShoes() {
  localStorage.setItem("fitbuddy_shoes", JSON.stringify(shoeList));
}

// 检测本周所有动作是否全部勾选
function checkWeekComplete() {
  if (!lastPlan || !lastPlan.trainingDays) return false;
  for (var di = 0; di < lastPlan.trainingDays.length; di++) {
    var day = lastPlan.trainingDays[di];
    if (!day.exes || day.exes.length === 0) continue;
    for (var ei = 0; ei < day.exes.length; ei++) {
      if (localStorage.getItem(doneKey("day_" + di + "_ex" + ei)) !== "1") return false;
    }
  }
  return lastPlan.trainingDays.some(function(d){ return d.exes && d.exes.length > 0; }); // 至少有一个训练日
}

// 清空所有勾选并刷新UI
function resetAllCheckmarks() {
  if (!lastPlan || !lastPlan.trainingDays) return;
  for (var di = 0; di < lastPlan.trainingDays.length; di++) {
    var day = lastPlan.trainingDays[di];
    if (!day.exes) continue;
    for (var ei = 0; ei < day.exes.length; ei++) {
      localStorage.removeItem(doneKey("day_" + di + "_ex" + ei));
    }
  }
  document.querySelectorAll('.ex-check.done').forEach(function(el){ el.classList.remove('done'); el.innerHTML = ''; });
  document.querySelectorAll('.ex-row.done').forEach(function(el){ el.classList.remove('done'); });
  showToast('🎉 本周全部完成!勾选已刷新,下周继续加油!');
}

function toggleDone(id) {
  _autoAdvanced = false; // 每次打卡前重置跳周标记
  var el = document.getElementById(id);
  if (!el) { console.warn('toggleDone: el not found for id='+id); return; }
  var check = el.querySelector(".ex-check");
  var isDone = check.classList.contains("done");
  if (!isDone) _trackStat('done');

  // 获取动作信息(用于训练记录联动)
  var exName = "";
  var exDiff = "";
  var exM = "";
  var nameEl = el.querySelector(".ex-name");
  if (nameEl) exName = nameEl.textContent.replace(/⚠️/g, "").trim();
  var diffEl = el.querySelector(".ex-diff");
  if (diffEl) exDiff = diffEl.textContent.replace(/· 已跳过(伤病限制)/g, "").trim();
  if (exName) {
    for (var ei = 0; ei < EXES.length; ei++) {
      if (EXES[ei].n === exName) { exM = EXES[ei].m; break; }
    }
  }
  var dist = parseFloat(el.getAttribute("data-dist")) || 0;
  // [DEBUG] console.log('toggleDone:', isDone ? '取消勾选' : '勾选', 'exName='+exName, 'exDiff='+exDiff, 'dist='+dist);

  if (isDone) {
    // 取消勾选:从训练记录中移除该动作
    check.classList.remove("done"); check.innerHTML = "";
    el.classList.remove("done");
    localStorage.removeItem(doneKey(id));

    var today = new Date().toISOString().slice(0,10);
    var hist = JSON.parse(localStorage.getItem("fitbuddy_history") || "[]");
    var found = hist.find(function(h){ return h.date === today; });
    if (found) {
      // 减少计数
      found.count = Math.max(0, (found.count||0) - 1);
      // 移除动作名
      if (exName && found.exercises) {
        var idx = found.exercises.indexOf(exName);
        if (idx >= 0) found.exercises.splice(idx, 1);
      }
      // 减去热量
      if (exDiff) {
        var cal = estimateCalories(exDiff, exM, dist);
        found.calories = Math.max(0, (found.calories||0) - cal);
      }
      // 如果计数归零且没有跑步距离,删除当天记录
      if (found.count <= 0 && !found.distance) {
        hist = hist.filter(function(h){ return h.date !== today; });
      }
      localStorage.setItem("fitbuddy_history", JSON.stringify(hist));
    }
    // [DEBUG] console.log('toggleDone: 取消勾选后训练记录', {date:today, count:found?found.count:0, exercises:found?found.exercises:[], calories:found?found.calories:0});
    // 同步更新完成动作统计(取消勾选时递减)
    _stats.done = Math.max(0, (_stats.done||0) - 1);
    _saveStats();
    // [DEBUG] console.log('toggleDone: 更新完成动作统计', _stats.done);
    // 同步更新进度页的完成动作数
    if (document.getElementById('page-prog').classList.contains('active')) renderProgress();
  } else {
    check.classList.add("done"); check.innerHTML = "✓";
    el.classList.add("done");
    localStorage.setItem(doneKey(id), "1");
    // 记录训练历史(动作信息已在上方获取)
    recordHistory(dist, exName, exDiff, exM);
    // 马拉松/跑步:自动提示记录跑鞋里程
    if (dist > 0 && shoeList.length > 0) {
      var activeShoes = shoeList.filter(function(s){ return !s.retired; });
      if (activeShoes.length === 1) {
        shoeList[shoeList.indexOf(activeShoes[0])].totalKm += dist;
        saveShoes();
      } else if (activeShoes.length > 1) {
        var shoeNames = activeShoes.map(function(s,i){ return (i+1)+'. '+s.name+' ('+Math.round(s.totalKm)+'km)'; }).join('\n');
        var choice = prompt('选择跑鞋记录 '+dist+'km:\n'+shoeNames+'\n输入编号(按取消跳过):');
        if (choice) {
          var idx = parseInt(choice) - 1;
          if (idx >= 0 && idx < activeShoes.length) {
            var realIdx = shoeList.indexOf(activeShoes[idx]);
            shoeList[realIdx].totalKm += dist;
            saveShoes();
          }
        }
      }
    }
    // 🎮 游戏化:更新连续打卡/成就
    afterTrainingDone();
    // 🔄 检测本周全部完成 → 自动刷新勾选(跳过已由 autoAdvance 处理的情况)
    if (!_autoAdvanced && checkWeekComplete()) {
      setTimeout(resetAllCheckmarks, 1200);
    }
  }
}

var timerInterval = null;
var timerSeconds = 0;
function startRestTimer(restStr) {
  var sec;
  if (restStr.indexOf("分钟") >= 0) {
    sec = (parseInt(restStr) || 1) * 60; // "2分钟" → 120秒
  } else {
    sec = parseInt(restStr) || 60; // "60秒" → 60秒
  }
  if (sec < 10) sec = 60;
  timerSeconds = sec;
  document.getElementById("timerNum").textContent = timerSeconds;
  document.getElementById("timerOverlay").classList.add("show");
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(function(){
    timerSeconds--;
    if (timerSeconds <= 0) {
      stopTimer();
      return;
    }
    document.getElementById("timerNum").textContent = timerSeconds;
  }, 1000);
}
function addTime(sec) {
  timerSeconds += sec;
  document.getElementById("timerNum").textContent = timerSeconds;
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  timerPaused = false;
  document.getElementById("timerOverlay").classList.remove("show");
}

// ============ 周期切换 ============
function setWeek(w) {
  currentWeek = w;
  doGenerate();
}

// ============ 动作库(带筛选)============
var libPartFilter = "all";
var libDiffFilter = "all";
var libEquipFilter = "all";

document.querySelectorAll("#partFilter .filter-chip").forEach(function(c){
  c.addEventListener("click", function(){
    document.querySelectorAll("#partFilter .filter-chip").forEach(function(x){ x.classList.remove("active"); });
    c.classList.add("active");
    libPartFilter = c.dataset.part;
    renderLib();
  });
});

document.querySelectorAll("#diffFilter .filter-chip").forEach(function(c){
  c.addEventListener("click", function(){
    document.querySelectorAll("#diffFilter .filter-chip").forEach(function(x){ x.classList.remove("active"); });
    c.classList.add("active");
    libDiffFilter = c.dataset.diff;
    renderLib();
  });
});
document.querySelectorAll("#equipFilter .filter-chip").forEach(function(c){
  c.addEventListener("click", function(){
    document.querySelectorAll("#equipFilter .filter-chip").forEach(function(x){ x.classList.remove("active"); });
    c.classList.add("active");
    libEquipFilter = c.dataset.eq;
    renderLib();
  });
});

var _renderLibTimer = null;  // Debounce timer for search

function renderLibDebounced() {
  if (_renderLibTimer !== null) clearTimeout(_renderLibTimer);
  _renderLibTimer = setTimeout(function() { renderLib(); }, 300);
}

function renderLib() {
  if (typeof EXES === 'undefined' || !EXES || !EXES.length) {
    console.warn('EXES 未加载，动作库无法渲染');
    return;
  }
  var q = (document.getElementById("searchEx").value||"").trim().toLowerCase();
  var list = EXES.filter(function(e){
    if (q && e.n.toLowerCase().indexOf(q) < 0 && e.desc.indexOf(q) < 0) return false;
    if (libPartFilter !== "all" && e.m !== libPartFilter) return false;
    if (libDiffFilter !== "all" && e.diff !== libDiffFilter) return false;
    if (libEquipFilter !== "all" && e.eq !== libEquipFilter) return false;
    return true;
  });
  var grouped = {};
  MUSCLE_ORDER.forEach(function(m){ grouped[m]=[]; });
  list.forEach(function(e){ if(grouped[e.m]) grouped[e.m].push(e); });
  var html = "";
  MUSCLE_ORDER.forEach(function(m){
    if (!grouped[m].length) return;
    var bc = BADGE_COLORS[m]||["#888","#F5F5F5"];
    var bt = BADGE_TEXT[m]||(m ? m[0] : '?');
    html += '<div class="muscle-section"><div class="muscle-label">'+(MUSCLE_LABELS[m]||m)+'</div>';
    grouped[m].forEach(function(e){
      var diffColor = e.diff==="初级"?"#22C55E":e.diff==="中级"?"#F59E0B":"#EF4444";
      var eqText = e.eq==="gym"?"健身房":e.eq==="dumbbell"?"哑铃":e.eq==="outdoor"?"户外路跑":e.eq==="treadmill"?"跑步机":"自重";
      var gifFile = GIF_MAP[e.n];
      var thumbHtml = '';
      if (gifFile) {
        var gid2 = 'thumb_'+Math.abs(e.n.hashCode ? e.n.hashCode() : e.n.split('').reduce(function(a,c){return((a<<5)-a)+c.charCodeAt(0);},0));
        thumbHtml = '<div class="lib-thumb-wrap" onclick="showEx(\''+e.n.replace(/'/g,"\\'")+'\');event.stopPropagation();">' +
          '<div class="lib-thumb-skeleton" id="sk_'+gid2+'">'+bt+'</div>' +
          '<img class="lib-thumb-img" id="im_'+gid2+'" src="exercise-gifs/'+gifFile+'" alt="'+e.n+'" loading="lazy" onload="this.classList.remove(\'loading\');document.getElementById(\x27sk_'+gid2+'\x27).style.display=\x27none\x27;" onerror="this.style.display=\x27none\x27;document.getElementById(\x27sk_'+gid2+'\x27).style.display=\x27flex\x27;">' +
          '</div>';
      }
      html += '<div class="lib-item" onclick="showEx(\''+e.n.replace(/'/g,"\\'")+'\')">'+ 
        thumbHtml +
        '<div class="ex-badge no-thumb" style="background:'+bc[1]+';color:'+bc[0]+';margin-right:10px;flex-shrink:0;">'+bt+'</div>'+
        '<div class="lib-item-left">'+ 
          '<div class="lib-item-name">'+e.n+(e._custom?' <span style="font-size:10px;background:var(--primary);color:#fff;padding:1px 6px;border-radius:4px;margin-left:4px;vertical-align:middle;">自定义</span>':'')+'</div>'+
          '<div class="lib-item-meta">'+ 
            '<span class="diff-dot" style="background:'+diffColor+';"></span>'+
            '<span>'+e.diff+'</span>'+
            '<span class="eq-badge">'+eqText+'</span>'+
            (e.desc?'<span style="margin-left:4px;">· '+e.desc+'</span>':'')+
          '</div></div>'+
        (e._custom?'<button class="lib-del-btn" onclick="event.stopPropagation();deleteCustomEx(\''+e.n.replace(/'/g,"\\'")+'\')" title="删除" aria-label="删除自定义动作">🗑</button>':'')+
        '<div class="lib-item-arrow">›</div></div>';
    });
    html += '</div>';
  });
  if (!html) html = '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:14px;">没有找到相关动作</div>';
  document.getElementById("libList").innerHTML = html;
}

// ============ 动作详情弹窗(GIF动图 + B站备选)============
function showEx(name) {
  var ex = EXES.find(function(e){ return e.n===name; });
  if (!ex) return;
  var bc = BADGE_COLORS[ex.m]||["#888","#F5F5F5"];
  var bt = BADGE_TEXT[ex.m]||(ex.m ? ex.m[0] : '?');
  var diffColor = ex.diff==="初级"?"#22C55E":ex.diff==="中级"?"#F59E0B":"#EF4444";
  var eqText = ex.eq==="gym"?"健身房":ex.eq==="dumbbell"?"哑铃":ex.eq==="outdoor"?"户外路跑":ex.eq==="treadmill"?"跑步机":"自重";

  // GIF动图(优先)
  var gifFile = GIF_MAP[name];
  var mediaHtml = '';
  if (gifFile) {
    var gid = 'gif_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
    mediaHtml = '<div class="modal-section-title">🎬 动作示范</div>'+
      '<div class="gif-container" id="'+gid+'">'+
        '<div class="gif-skeleton"></div>'+
        '<img class="gif-img loading" src="exercise-gifs/'+gifFile+'" alt="'+name+'" onload="this.classList.remove(\'loading\');this.previousElementSibling.style.display=\'none\'" onerror="this.previousElementSibling.innerHTML=\'<div style=text-align:center;padding:40px;color:var(--text3)>⚠️ GIF加载失败</div>\'">'+
      '</div>'+
      '<div style="text-align:center;margin-top:4px;">'+
        '<a class="gif-bilibili-link" href="https://search.bilibili.com/all?keyword='+encodeURIComponent(name+' 教学示范')+'" target="_blank">📺 B站搜更多教程 →</a>'+
      '</div>';
  } else {
    var searchUrl = "https://search.bilibili.com/all?keyword=" + encodeURIComponent(name + " 教学示范");
    mediaHtml = '<div class="modal-section-title">📹 教学视频</div>'+
      '<a class="video-link" href="'+searchUrl+'" target="_blank">📺 在 B站 搜索「'+name+'」教学视频</a>';
  }

  var html = '<div class="modal-handle"></div>'+
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'+
      '<div class="ex-badge" style="background:'+bc[1]+';color:'+bc[0]+';width:38px;height:38px;border-radius:10px;font-size:15px;">'+bt+'</div>'+
      '<div><div class="modal-title">'+ex.n+'</div>'+
        '<div style="display:flex;gap:6px;margin-top:3px;">'+
          '<span style="background:'+diffColor+'22;color:'+diffColor+';font-size:12px;font-weight:700;padding:2px 8px;border-radius:8px;">'+ex.diff+'</span>'+
          '<span style="background:var(--bg);color:var(--text2);font-size:12px;padding:2px 8px;border-radius:8px;">'+eqText+'</span>'+
        '</div></div></div>'+
    (ex.desc?'<div class="modal-desc">'+ex.desc+'</div>':'')+
    (ex.tips?'<div class="modal-section-title">✅ 动作要点</div><div class="tips-card">'+ex.tips+'</div>':'')+
    mediaHtml+
    (ex._custom?'<div style="margin-top:16px;text-align:center;"><button class="btn-generate" style="background:#EF4444;width:100%;" onclick="deleteCustomEx(\''+ex.n.replace(/'/g,"\\'")+'\');closeModal();">🗑 删除此自定义动作</button></div>':'');
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modal").classList.add("show");
}
// ============ 热量具象化 ============
var FOOD_EQUIVALENTS = [
  {name:'碗米饭', emoji:'🍚', kcal:174},
  {name:'个汉堡', emoji:'🍔', kcal:250},
  {name:'杯奶茶', emoji:'🧋', kcal:380},
  {name:'包薯片', emoji:'🍟', kcal:540},
  {name:'瓶啤酒', emoji:'🍺', kcal:215},
  {name:'个甜甜圈', emoji:'🍩', kcal:290},
  {name:'片披萨', emoji:'🍕', kcal:285},
  {name:'根香蕉', emoji:'🍌', kcal:105},
  {name:'个鸡蛋', emoji:'🥚', kcal:78},
  {name:'碗拉面', emoji:'🍜', kcal:450},
  {name:'块蛋糕', emoji:'🍰', kcal:350},
  {name:'个炸鸡腿', emoji:'🍗', kcal:250}
];

function getFoodEquivalents(kcal) {
  if (!kcal || kcal < 50) return [];
  var candidates = FOOD_EQUIVALENTS.map(function(f){
    return {name:f.name, emoji:f.emoji, count:Math.max(1,Math.round(kcal / f.kcal)), raw: f.kcal};
  }).filter(function(f){ return f.count >= 1 && f.count <= 12; });
  candidates.sort(function(a,b){
    var sa = Math.abs(a.count - 3), sb = Math.abs(b.count - 3);
    return sa - sb;
  });
  var picked = [], used = {};
  for (var i = 0; i < candidates.length && picked.length < 3; i++) {
    if (!used[candidates[i].name]) { picked.push(candidates[i]); used[candidates[i].name] = true; }
  }
  return picked;
}

function renderFoodEquivalent(kcal) {
  var eqs = getFoodEquivalents(kcal);
  if (!eqs.length) return '';
  var html = '<div class="food-equivalent">'+
    '<div class="food-eq-title">🔥 这相当于消耗了:</div>'+
    '<div class="food-eq-row">';
  eqs.forEach(function(eq){
    html += '<div class="food-eq-item"><span class="food-emoji">'+eq.emoji+'</span>'+
      '<span class="food-count">'+eq.count+'</span> '+eq.name+'</div>';
  });
  html += '</div>';
  var taglines = [
    '省下一顿欺骗餐的热量!', '今天的汗没白流 💪', '吃得爽一时,练得爽一整天',
    '这就是你不吃夜宵的理由 ✨', '每一卡都是你的勋章', '想想这杯奶茶,值了!'
  ];
  html += '<div class="food-eq-tagline">'+taglines[Math.floor(Math.random()*taglines.length)]+'</div></div>';
  return html;
}

// ============ 每周训练总结 ============
function showWeeklySummary() {
  var hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]');
  var plan = JSON.parse(localStorage.getItem('fitbuddy_lastplan') || 'null');
  var now = new Date();
  var dayOfWeek = now.getDay() || 7;
  var monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  var weekDays = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d.toISOString().slice(0,10));
  }
  var weekHist = hist.filter(function(h) { return weekDays.indexOf(h.date) >= 0; });
  var trainedDays = new Set(weekHist.map(function(h) { return h.date; }));
  var totalSets = weekHist.reduce(function(s, h) { return s + (h.count || 0); }, 0);
  var totalCal = weekHist.reduce(function(s, h) { return s + (h.calories || 0); }, 0);

  var streak = 0;
  var checkDate = new Date(now);
  for (var s = 0; s < 90; s++) {
    var ds = checkDate.toISOString().slice(0,10);
    var found = hist.filter(function(h) { return h.date === ds; });
    if (found.length === 0) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  var goalName = plan ? ({muscle:'增肌',strength:'力量',cut:'减脂',cardio:'心肺',marathon:'马拉松'})[plan.goal] || '健身' : '健身';
  var html = '<div class="weekly-summary">'+
    '<h3 style="text-align:center;margin-bottom:16px;">📊 本周训练总结</h3>'+
    '<div class="weekly-stat-row"><span>本周训练天数</span><span class="weekly-stat-val">'+trainedDays.size+' 天</span></div>'+
    '<div class="weekly-stat-row"><span>完成动作组数</span><span class="weekly-stat-val">'+totalSets+' 组</span></div>'+
    '<div class="weekly-stat-row"><span>估算消耗热量</span><span class="weekly-stat-val">'+Math.round(totalCal)+' kcal</span></div>'+
    (Math.round(totalCal) > 0 ? renderFoodEquivalent(Math.round(totalCal)) : '') +
    '<div class="weekly-stat-row"><span>当前目标</span><span class="weekly-stat-val">'+goalName+'</span></div>'+
    '<div class="weekly-stat-row"><span>连续训练 🔥</span><span class="weekly-stat-val">'+streak+' 天</span></div>'+
    '<div style="text-align:center;margin-top:16px;">'+
      '<button onclick="closeModal()" style="padding:10px 32px;border-radius:12px;background:var(--primary);color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;">知道了</button>'+
    '</div></div>';
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
  document.getElementById("modalBody").innerHTML = "";
}

// ============ 进度页 ============
// 估算单动作消耗热量(与 estimateDayCalBurn 口径对齐)
function estimateCalories(diff, m, dist) {
  // 获取体重(所有公式共用)
  var weight = 70;
  try {
    var prof = JSON.parse(localStorage.getItem("fitbuddy_profile") || "{}");
    if (prof.weight && prof.weight > 30) weight = prof.weight;
  } catch(e) {}

  // 跑步/有氧带距离:体重×距离(马拉松/心肺目标)
  if (dist && dist > 0) {
    return Math.round(weight * dist);
  }

  // 获取当前目标与水平,用于后续分支
  var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
  var level = (plan && plan.level) || 'beginner';

  // 有氧动作(无显式距离):按水平估算,对齐 estimateDayCalBurn 心肺分支
  if (m === '有氧') {
    return {beginner:350, intermediate:450, advanced:600}[level] || 350;
  }

  // 力量训练:对齐 estimateDayCalBurn 的 baseBurn + exCount*20 公式
  // 按动作数均摊,使单日总和与计划页预估一致
  var goal = (plan && plan.goal) || '';
  var baseBurn = {beginner:280, intermediate:380, advanced:500}[level] || 300;
  var exCount = 5; // 默认
  if (plan && plan.trainingDays) {
    var totalEx = 0, dayCount = 0;
    plan.trainingDays.forEach(function(d) {
      if (d.exes && d.exes.length > 0) { totalEx += d.exes.length; dayCount++; }
    });
    if (dayCount > 0) exCount = Math.round(totalEx / dayCount);
  }
  var dayTotal = Math.round(baseBurn + exCount * 20);
  return Math.round(dayTotal / exCount);
}

function recordHistory(dist, exName, exDiff, exM) {
  var hist = JSON.parse(localStorage.getItem("fitbuddy_history") || "[]");
  var today = new Date().toISOString().slice(0,10);
  var found = hist.find(function(h){ return h.date === today; });

  // 计算本次动作热量(跑步用距离,力量用MET)
  var thisCal = (exName && exDiff) ? estimateCalories(exDiff, exM, dist) : 0;

  if (found) {
    found.count = (found.count||0)+1;
    if (dist) found.distance = (found.distance||0) + dist;
    if (exName) {
      if (!found.exercises) found.exercises = [];
      found.exercises.push(exName);
      // 去重(同一动作可能多次打卡)
      found.exercises = found.exercises.filter(function(v,i,a){ return a.indexOf(v)===i; });
    }
    if (thisCal) found.calories = (found.calories||0) + thisCal;
  } else {
    var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
    var rec = {date:today, count:1, distance:dist||0};
    if (exName) rec.exercises = [exName];
    if (thisCal) rec.calories = thisCal;
    if (plan && plan.goal) rec.goal = plan.goal;
    hist.push(rec);
  }
  if (hist.length > 90) hist = hist.slice(-90);
  localStorage.setItem("fitbuddy_history", JSON.stringify(hist));
  // [DEBUG] console.log('recordHistory: saved', {date:today, count:found?(found.count||0)+1:1, exercises:found?(found.exercises||[]):[exName], calories:found?(found.calories||0)+thisCal:thisCal});
  // 自动跳周检测
  checkAutoAdvanceWeek();
}

function renderProgress() {
  var hist = JSON.parse(localStorage.getItem("fitbuddy_history") || "[]");
  var plan = JSON.parse(localStorage.getItem("fitbuddy_lastplan") || "null");
  var isRunning = plan && (plan.goal === "marathon" || plan.goal === "cardio");
  var html = '<div style="display:flex;gap:8px;margin-bottom:16px;">'+
    '<button onclick="showWeeklySummary()" style="flex:1;padding:10px;border-radius:12px;background:var(--primary);color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;">📊 本周总结</button>'+
    '<button onclick="exportCSV()" style="flex:1;padding:10px;border-radius:12px;background:var(--bg);color:var(--text);border:1.5px solid var(--border);font-size:14px;font-weight:600;cursor:pointer;">📋 导出CSV</button></div>';

  // 本周统计(周一为一周开始)
  var today = new Date();
  var dayOfWeek = today.getDay() || 7;
  var monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  monday.setHours(0,0,0,0);
  var weekCount = 0, weekDist = 0, weekCal = 0;
  hist.forEach(function(h){
    var d = new Date(h.date + "T00:00:00");
    if (d >= monday && d <= today) {
      weekCount += h.count;
      weekDist += (h.distance || 0);
      weekCal += (h.calories || 0);
    }
  });
  var daysThisWeek = plan ? plan.days : 0;

  if (isRunning) {
    var wkTarget = plan && plan.goal === "marathon" ? 4 : 3;
    var pct = wkTarget > 0 ? Math.min(100, Math.round(weekCount / wkTarget * 100)) : 0;
    html += '<div class="progress-card">'+
      '<div class="card-title">📊 本周跑步进度</div>'+
      '<div class="progress-stat"><span class="progress-stat-label">完成训练次数</span><span class="progress-stat-value">'+weekCount+' / '+wkTarget+' 次</span></div>'+
      '<div class="progress-stat"><span class="progress-stat-label">周跑量</span><span class="progress-stat-value">'+Math.round(weekDist)+' km</span></div>'+
      '<div class="progress-stat"><span class="progress-stat-label">估算消耗热量</span><span class="progress-stat-value">'+Math.round(weekCal)+' kcal</span></div>'+
      '<div style="margin-top:10px;"><div style="font-size:12px;color:var(--text3);margin-bottom:4px;">频次完成度</div>'+
      '<div class="progress-bar"><div class="progress-bar-fill" style="width:'+pct+'%;"></div></div>'+
      '<div style="font-size:12px;color:var(--text3);margin-top:4px;">'+pct+'%</div></div>'+
      (Math.round(weekCal) > 0 ? renderFoodEquivalent(Math.round(weekCal)) : '') + '</div>';
  } else {
    var totalExPerWeek = 0;
    if (plan && plan.trainingDays) {
      plan.trainingDays.forEach(function(day){
        totalExPerWeek += (day.exes ? day.exes.length : 0);
      });
    }
    var targetSets = totalExPerWeek > 0 ? totalExPerWeek * (plan && plan.level === 'advanced' ? 5 : plan && plan.level === 'intermediate' ? 4 : 3) : daysThisWeek * 15;
    var pct = targetSets > 0 ? Math.min(100, Math.round(weekCount / targetSets * 100)) : 0;
    html += '<div class="progress-card">'+
      '<div class="card-title">📊 本周进度</div>'+
      '<div class="progress-stat"><span class="progress-stat-label">已完成动作组数</span><span class="progress-stat-value">'+weekCount+'</span></div>'+
      '<div class="progress-stat"><span class="progress-stat-label">估算消耗热量</span><span class="progress-stat-value">'+Math.round(weekCal)+' kcal</span></div>'+
      '<div style="margin-top:10px;"><div style="font-size:12px;color:var(--text3);margin-bottom:4px;">完成度</div>'+
      '<div class="progress-bar"><div class="progress-bar-fill" style="width:'+pct+'%;"></div></div>'+
      '<div style="font-size:12px;color:var(--text3);margin-top:4px;">'+pct+'%</div></div>'+
      (Math.round(weekCal) > 0 ? renderFoodEquivalent(Math.round(weekCal)) : '') + '</div>';
  }

  // 图表:跑量趋势(跑步目标)或训练频次(举铁目标)
  if (hist.length >= 2) {
    html += '<div class="progress-card"><div class="card-title">📈 '+(isRunning?'跑量趋势':'训练频次趋势')+'</div>'+
      '<div class="chart-wrap"><canvas id="chartVolume" style="width:100%;height:200px;"></canvas></div></div>';
  }

  // 图表:热量消耗趋势
  var hasCalories = hist.some(function(h){ return h.calories && h.calories > 0; });
  if (hist.length >= 2 && hasCalories) {
    html += '<div class="progress-card"><div class="card-title">🔥 热量消耗趋势</div>'+
      '<div class="chart-wrap"><canvas id="chartCalories" style="width:100%;height:200px;"></canvas></div></div>';
  }

  // 图表:部位训练分布(环形图)
  // 构建动作名→部位映射
  var exMuscleMap = {};
  EXES.forEach(function(ex){ exMuscleMap[ex.n] = ex.m; });
  var muscleCount = {};
  hist.forEach(function(h){
    if (h.exercises) {
      h.exercises.forEach(function(en){
        var m = exMuscleMap[en] || '';
        if (m) muscleCount[m] = (muscleCount[m] || 0) + 1;
      });
    }
  });
  var muscleSegments = MUSCLE_ORDER.filter(function(m){ return muscleCount[m]; }).map(function(m){
    return {label: MUSCLE_LABELS[m]||m, value: muscleCount[m], color: (BADGE_COLORS[m]||['#999'])[0]};
  });
  var hasMuscleDist = muscleSegments.length >= 2;
  if (hasMuscleDist) {
    html += '<div class="progress-card"><div class="card-title">🎯 部位训练分布</div>'+
      '<div class="chart-wrap"><canvas id="chartMuscle" style="width:100%;height:230px;"></canvas></div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;justify-content:center;">'+
      muscleSegments.map(function(seg){
        return '<span style="font-size:11px;color:var(--text2);">'+
          '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:'+seg.color+';margin-right:4px;"></span>'+
          seg.label+' '+seg.value+'次</span>';
      }).join('')+
      '</div></div>';
  }

  // 图表:力量进步曲线(有训练日志时)
  // 自重动作不画重量趋势(如俯卧撑、引体向上等),无意义
  var chartExNames = Object.keys(trainingLog).filter(function(k){
    if (BODYWEIGHT_EX_NAMES.has(k)) return false;
    if (trainingLog[k].length < 2) return false;
    var maxW = 0;
    trainingLog[k].forEach(function(e){ maxW = Math.max(maxW, e.weight||0); });
    return maxW > 0;
  });
  if (chartExNames.length > 0) {
    var topEx = chartExNames.slice(0, 3);
    topEx.forEach(function(exName, chi){
      html += '<div class="progress-card"><div class="card-title">💪 '+exName+' 重量趋势</div>'+
        '<div class="chart-wrap"><canvas id="chartEx'+chi+'" style="width:100%;height:200px;"></canvas></div></div>';
    });
  }

  // 图表:训练量走势(从训练日志聚合每日总容量 weight×reps)
  var volByDate = {};
  Object.keys(trainingLog).forEach(function(exName){
    trainingLog[exName].forEach(function(e){
      if (e.weight && e.reps) {
        volByDate[e.date] = (volByDate[e.date] || 0) + (e.weight * e.reps);
      }
    });
  });
  var volDates = Object.keys(volByDate).sort();
  if (volDates.length >= 2) {
    html += '<div class="progress-card"><div class="card-title">📊 训练量走势</div>'+
      '<div class="chart-wrap"><canvas id="chartVolumeTrend" style="width:100%;height:200px;"></canvas></div></div>';
  }

  // 跑鞋里程
  var activeShoes = shoeList.filter(function(s){ return !s.retired; });
  var retiredShoes = shoeList.filter(function(s){ return s.retired; });
  html += '<div class="progress-card"><div class="card-title" style="justify-content:space-between;">'+
    '<span>👟 跑鞋追踪</span>'+
    '<button class="export-btn" style="font-size:11px;padding:4px 10px;border:none;background:var(--primary-light);color:var(--primary);" onclick="addShoe()">+ 添加跑鞋</button></div>';
  if (shoeList.length === 0) {
    html += '<div style="font-size:12px;color:var(--text3);text-align:center;padding:12px;">还没有跑鞋记录,点击上方按钮添加</div>';
  }
  activeShoes.forEach(function(shoe, i){
    var realIdx = shoeList.indexOf(shoe);
    var pctKm = Math.min(100, Math.round(shoe.totalKm / 800 * 100));
    var barClass = shoe.totalKm > 700 ? 'danger' : shoe.totalKm > 500 ? 'warn' : 'good';
    var status = shoe.totalKm > 700 ? '⚠ 接近寿命上限' : shoe.totalKm > 500 ? '⚡ 已过半程' : '✅ 状态良好';
    html += '<div class="shoe-card">'+
      '<div class="shoe-info">'+
        '<div class="shoe-name">'+shoe.name+' <span style="font-size:10px;font-weight:400;color:var(--text3);">'+shoe.startDate+' 起用</span></div>'+
        '<div class="shoe-km">'+Math.round(shoe.totalKm)+' km / 600-800km 建议更换 · '+status+'</div>'+
        '<div class="shoe-bar-wrap"><div class="shoe-bar-fill '+barClass+'" style="width:'+pctKm+'%;"></div></div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:4px;">'+
        '<button class="shoe-btn" onclick="logShoeKm('+realIdx+')">+里程</button>'+
        '<button class="shoe-btn" onclick="retireShoe('+realIdx+')" style="color:#F59E0B;">'+(shoe.retired?'恢复':'退役')+'</button>'+
        '<button class="shoe-btn" onclick="deleteShoe('+realIdx+')" style="color:#EF4444;">删除</button>'+
      '</div></div>';
  });
  if (retiredShoes.length) {
    html += '<div style="font-size:12px;font-weight:600;color:var(--text3);margin-top:10px;">已退役</div>';
    retiredShoes.forEach(function(shoe, i){
      html += '<div class="shoe-card" style="opacity:0.5;border-left-color:#999;">'+
        '<div class="shoe-info"><div class="shoe-name">👟 '+shoe.name+'</div>'+
        '<div class="shoe-km">累计 '+Math.round(shoe.totalKm)+' km</div></div></div>';
    });
  }
  html += '</div>';

  // 历史记录
  html += '<div class="progress-card"><div class="card-title">📅 训练记录</div>';
  if (hist.length === 0) {
    html += '<div class="history-empty">还没有训练记录<br>完成动作后会自动记录 📝</div>';
  } else {
    hist.slice(-14).reverse().forEach(function(h){
      var exercises = h.exercises || [];
      var valParts = [];
      if (exercises.length) valParts.push(exercises.length + ' 项');
      if (h.calories) valParts.push(h.calories + ' kcal');
      if (h.distance) valParts.push(Math.round(h.distance) + 'km');
      var valText = valParts.length ? valParts.join(' · ') : h.count + ' 组';
      var exList = '';
      if (exercises.length) {
        var showEx = exercises.slice(0, 3).join('、');
        if (exercises.length > 3) showEx += '...';
        exList = '<div style="font-size:11px;color:var(--text3);margin-top:3px;line-height:1.5;">'+showEx+'</div>';
      }
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--border);">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;">'+
          '<span class="progress-stat-label" style="margin-bottom:0;">'+h.date+'</span>'+
          '<span class="progress-stat-value" style="font-size:12px;">'+valText+'</span>'+
        '</div>'+
        exList +
        '</div>';
    });
  }
  if (hist.length > 0) {
    html += '<button class="clear-btn" onclick="clearHistory()">🗑 清除所有记录</button>';
  }
  html += '</div>';

  // 统计面板
  var st = JSON.parse(localStorage.getItem('fitbuddy_stats') || '{}');
  html += '<div class="progress-card"><div class="card-title">📈 使用统计</div>'+
    '<div class="progress-stat"><span class="progress-stat-label">🏠 总访问</span><span class="progress-stat-value">'+(st.pv||0)+' 次</span></div>'+
    '<div class="progress-stat"><span class="progress-stat-label">✨ 生成计划</span><span class="progress-stat-value">'+(st.gens||0)+' 次</span></div>'+
    '<div class="progress-stat"><span class="progress-stat-label">✅ 完成动作</span><span class="progress-stat-value">'+(st.done||0)+' 次</span></div>'+
    '<div class="progress-stat"><span class="progress-stat-label">📚 动作库浏览</span><span class="progress-stat-value">'+(st.libs||0)+' 次</span></div>'+
    '<div class="progress-stat"><span class="progress-stat-label">🖨 导出次数</span><span class="progress-stat-value">'+(st.shares||0)+' 次</span></div>'+
    '<div class="progress-stat"><span class="progress-stat-label">📅 首次使用</span><span class="progress-stat-value">'+(st.firstVisit||'今天')+'</span></div>'+
    '</div>';

  // CSV 导出 + 训练日记 + 分享图
  html += '<div style="text-align:center;margin:16px 0;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">'+
    '<button class="export-btn" onclick="exportCSV()">📥 导出数据 CSV</button>'+
    '<button class="export-btn" style="color:var(--primary);border-color:var(--primary);" onclick="exportDiary()">📖 导出训练日记</button>'+
    '<button class="export-btn" style="color:#8B5CF6;border-color:#8B5CF6;" onclick="generateShareImage()">📸 生成分享图</button></div>';

  // 📏 身体数据记录
  var bodyLog = getBodyLog();
  var latestBody = bodyLog.length > 0 ? bodyLog[bodyLog.length - 1] : {};
  html += '<div class="progress-card"><div class="card-title" style="justify-content:space-between;">'+
    '<span>📏 身体数据记录</span>'+
    '<button class="export-btn" style="font-size:11px;padding:4px 10px;border:none;background:var(--primary-light);color:var(--primary);" onclick="document.getElementById(\'bodyLogForm\').style.display=document.getElementById(\'bodyLogForm\').style.display===\'none\'?\'block\':\'none\';">+ 记录今日</button></div>'+
    '<div id="bodyLogForm" style="display:none;margin:10px 0;padding:12px;background:var(--bg);border-radius:12px;">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'+
        '<div><label style="font-size:11px;color:var(--text3);">日期</label><input type="date" id="bodyLogDate" value="'+new Date().toISOString().slice(0,10)+'" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
        '<div><label style="font-size:11px;color:var(--text3);">体重 (kg)</label><input type="number" id="bodyLogWeight" step="0.1" placeholder="70.5" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
        '<div><label style="font-size:11px;color:var(--text3);">体脂率 (%)</label><input type="number" id="bodyLogFat" step="0.1" placeholder="20.0" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
        '<div><label style="font-size:11px;color:var(--text3);">腰围 (cm)</label><input type="number" id="bodyLogWaist" step="0.1" placeholder="80" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
        '<div><label style="font-size:11px;color:var(--text3);">胸围 (cm)</label><input type="number" id="bodyLogChest" step="0.1" placeholder="95" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
        '<div><label style="font-size:11px;color:var(--text3);">臀围 (cm)</label><input type="number" id="bodyLogHip" step="0.1" placeholder="95" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
        '<div><label style="font-size:11px;color:var(--text3);">臂围 (cm)</label><input type="number" id="bodyLogArm" step="0.1" placeholder="35" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
        '<div><label style="font-size:11px;color:var(--text3);">大腿围 (cm)</label><input type="number" id="bodyLogThigh" step="0.1" placeholder="55" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--card);color:var(--text);"></div>'+
      '</div>'+
      '<button onclick="saveBodyLogEntry()" style="width:100%;padding:8px;border-radius:10px;background:var(--primary);color:#fff;border:none;font-size:14px;font-weight:600;cursor:pointer;">保存记录</button>'+
    '</div>';
  // 最新数据展示
  if (latestBody.weight || latestBody.bodyFat) {
    html += '<div style="display:flex;gap:12px;margin:10px 0;flex-wrap:wrap;">';
    if (latestBody.weight) html += '<div style="padding:8px 14px;background:var(--primary-light);border-radius:10px;font-size:13px;"><b>体重</b> <span style="font-weight:700;color:var(--primary);">'+latestBody.weight+'kg</span> <span style="font-size:11px;color:var(--text3);">'+latestBody.date+'</span></div>';
    if (latestBody.bodyFat) html += '<div style="padding:8px 14px;background:#F0FDF4;border-radius:10px;font-size:13px;"><b>体脂</b> <span style="font-weight:700;color:#22C55E;">'+latestBody.bodyFat+'%</span></div>';
    if (latestBody.waist) html += '<div style="padding:8px 14px;background:#EFF6FF;border-radius:10px;font-size:13px;"><b>腰围</b> <span style="font-weight:700;color:#3B82F6;">'+latestBody.waist+'cm</span></div>';
    html += '</div>';
  }
  // 体重曲线图
  if (bodyLog.filter(function(e){return e.weight;}).length >= 2) {
    html += '<div class="chart-wrap"><canvas id="chartWeight" style="width:100%;height:200px;"></canvas></div>';
  }
  // 体脂曲线图
  if (bodyLog.filter(function(e){return e.bodyFat;}).length >= 2) {
    html += '<div class="chart-wrap"><canvas id="chartBodyFat" style="width:100%;height:200px;"></canvas></div>';
  }
  // 历史记录(最近8条)
  if (bodyLog.length > 0) {
    html += '<div style="margin-top:10px;max-height:200px;overflow-y:auto;">';
    bodyLog.slice(-8).reverse().forEach(function(e) {
      var parts = [];
      if (e.weight) parts.push(e.weight + 'kg');
      if (e.bodyFat) parts.push(e.bodyFat + '%');
      if (e.waist) parts.push('腰' + e.waist + 'cm');
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">'+
        '<span style="color:var(--text2);">'+e.date+'</span>'+
        '<span>'+parts.join(' / ')+'</span>'+
        '<button onclick="deleteBodyLogEntry(\''+e.date+'\')" style="background:none;border:none;color:#EF4444;font-size:12px;cursor:pointer;">删除</button></div>';
    });
    html += '</div>';
  }
  html += '</div>';

  // 🔥 训练热力图
  html += renderHeatmapHTML(hist);

  // 🏅 成就系统 + 等级
  html += renderGamificationHTML(hist);

  document.getElementById("progContent").innerHTML = html;

  // 渲染图表(延迟以确保 canvas 已插入 DOM)
  setTimeout(function(){
    if (hist.length >= 2) {
      var chartData = hist.map(function(h){ return {l:h.date.slice(5), v: isRunning ? Math.round(h.distance||0) : h.count}; });
      drawChart('chartVolume', chartData, {type:isRunning?'bar':'bar', color:isRunning?'#3B82F6':'#FF6B35', yMax:0, title:''});
    }
    var chartExNames2 = Object.keys(trainingLog).filter(function(k){
      if (BODYWEIGHT_EX_NAMES.has(k)) return false;
      if (trainingLog[k].length < 2) return false;
      var maxW = 0;
      trainingLog[k].forEach(function(e){ maxW = Math.max(maxW, e.weight||0); });
      return maxW > 0;
    });
    chartExNames2.slice(0, 3).forEach(function(exName, chi){
      var log = trainingLog[exName];
      if (!log || log.length < 2) return;
      var cd = log.map(function(e){ return {l:e.date.slice(5), v:e.weight||0}; });
      var colors = ['#FF6B35','#3B82F6','#22C55E'];
      drawChart('chartEx'+chi, cd, {type:'line', color:colors[chi]||'#8B5CF6', yMax:0, title:''});
    });
    // 渲染热量消耗趋势
    if (hist.length >= 2 && hasCalories) {
      var calData = hist.map(function(h){ return {l:h.date.slice(5), v: Math.round(h.calories||0)}; });
      drawChart('chartCalories', calData, {type:'bar', color:'#F59E0B', yMax:0, title:''});
    }
    // 渲染部位训练分布
    if (hasMuscleDist) {
      drawDonutChart('chartMuscle', muscleSegments);
    }
    // 渲染训练量走势
    if (volDates.length >= 2) {
      var volData = volDates.map(function(d){ return {l: d.slice(5), v: Math.round(volByDate[d]/100)*100}; });
      drawChart('chartVolumeTrend', volData, {type:'bar', color:'#8B5CF6', yMax:0, title:''});
    }
    // 渲染身体数据图表
    renderBodyLogChart('chartWeight', 'weight', '#FF6B35', '体重');
    renderBodyLogChart('chartBodyFat', 'bodyFat', '#22C55E', '体脂');
  }, 200);
}

// ============ 身体数据记录(体重/体脂/围度)============
var BODY_LOG_KEY = 'fitbuddy_bodylog';

function getBodyLog() {
  try { return JSON.parse(localStorage.getItem(BODY_LOG_KEY) || '[]'); } catch(e) { return []; }
}

function saveBodyLogEntry() {
  var date = document.getElementById('bodyLogDate').value || new Date().toISOString().slice(0,10);
  var weight = parseFloat(document.getElementById('bodyLogWeight').value) || 0;
  var bodyFat = parseFloat(document.getElementById('bodyLogFat').value) || 0;
  var chest = parseFloat(document.getElementById('bodyLogChest').value) || 0;
  var waist = parseFloat(document.getElementById('bodyLogWaist').value) || 0;
  var hip = parseFloat(document.getElementById('bodyLogHip').value) || 0;
  var arm = parseFloat(document.getElementById('bodyLogArm').value) || 0;
  var thigh = parseFloat(document.getElementById('bodyLogThigh').value) || 0;
  if (!weight && !bodyFat && !waist) { alert('请至少填写体重、体脂率或腰围中的一项'); return; }
  var log = getBodyLog();
  // 同一天只保留一条记录(覆盖)
  var idx = log.findIndex(function(e) { return e.date === date; });
  var entry = { date: date };
  if (weight) entry.weight = weight;
  if (bodyFat) entry.bodyFat = bodyFat;
  if (chest) entry.chest = chest;
  if (waist) entry.waist = waist;
  if (hip) entry.hip = hip;
  if (arm) entry.arm = arm;
  if (thigh) entry.thigh = thigh;
  if (idx >= 0) log[idx] = entry; else log.push(entry);
  log.sort(function(a,b) { return a.date < b.date ? -1 : 1; });
  localStorage.setItem(BODY_LOG_KEY, JSON.stringify(log));
  renderProgress();
}

function deleteBodyLogEntry(date) {
  if (!confirm('确定删除 ' + date + ' 的记录?')) return;
  var log = getBodyLog().filter(function(e) { return e.date !== date; });
  localStorage.setItem(BODY_LOG_KEY, JSON.stringify(log));
  renderProgress();
}

function renderBodyLogChart(canvasId, dataKey, color, label) {
  var log = getBodyLog();
  var points = log.filter(function(e) { return e[dataKey]; }).map(function(e) {
    return { l: e.date.slice(5), v: e[dataKey] };
  });
  if (points.length < 2) return;
  // 延迟确保 canvas 已渲染
  setTimeout(function() {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    drawChart(canvasId, points, { type: 'line', color: color, yMax: 0, title: '' });
    // 在 canvas 上叠加最新数值标注
    var ctx = canvas.getContext('2d');
    var latest = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label + ' ' + latest.v + (dataKey === 'weight' ? 'kg' : dataKey === 'bodyFat' ? '%' : 'cm'), canvas.width - 10, 20);
  }, 300);
}

var _clearPending = false;
function clearHistory() {
  if (!_clearPending) {
    _clearPending = true;
    var btn = document.querySelector('.clear-btn');
    if (btn) {
      btn.textContent = '⚠ 再次点击确认清除';
      btn.style.background = '#FEE2E2';
      btn.style.borderColor = '#EF4444';
    }
    setTimeout(function(){ _clearPending = false; if (btn) { btn.textContent = '🗑 清除所有记录'; btn.style.background = ''; btn.style.borderColor = ''; } }, 3000);
    return;
  }
  _clearPending = false;
  localStorage.removeItem("fitbuddy_history");
  Object.keys(localStorage).filter(function(k){ return k.indexOf("fitbuddy_done_")===0; }).forEach(function(k){ localStorage.removeItem(k); });
  renderProgress();
}

function exportPlan() {
  _trackStat('shares');
  // 展开所有折叠的卡片
  document.querySelectorAll(".plan-day.collapsed").forEach(function(el){ el.classList.remove("collapsed"); });
  // 隐藏导出按钮
  var btns = document.querySelectorAll("#planResult > div:last-child");
  if (btns.length) btns[btns.length-1].style.display = "none";
  window.print();
  // 恢复
  setTimeout(function(){
    if (btns.length) btns[btns.length-1].style.display = "";
  }, 500);
}

// ============ 记住用户选择 ============
function savePrefs() {
  var goal = document.querySelector('input[name="goal"]:checked');
  var equipEl = document.querySelector('input[name="equip"]:checked');
  var runEquipEl = document.querySelector('input[name="runEquip"]:checked');
  var daysChip = document.querySelector('#daysGroup .chip.active');
  var levelEl = document.querySelector('input[name="level"]:checked');
  var genderEl = document.querySelector('input[name="gender"]:checked');
  var prefs = {
    goal: goal ? goal.value : "muscle",
    level: levelEl ? levelEl.value : "beginner",
    days: daysChip ? parseInt(daysChip.dataset.days) : 4,
    equip: equipEl ? equipEl.value : "gym",
    runEquip: runEquipEl ? runEquipEl.value : "outdoor",
    gender: genderEl ? genderEl.value : "male",
    weight: document.getElementById('bodyWeight').value,
    height: document.getElementById('bodyHeight').value,
    age: document.getElementById('bodyAge').value,
    cycle: currentCycle,
    week: currentWeek
  };
  localStorage.setItem("fitbuddy_prefs", JSON.stringify(prefs));
}

function loadPrefs() {
  var saved = localStorage.getItem("fitbuddy_prefs");
  if (!saved) return;
  try {
    var p = JSON.parse(saved);
    if (p.goal) { var el = document.querySelector('input[name="goal"][value="'+p.goal+'"]'); if (el) el.checked = true; }
    if (p.level) { var el = document.querySelector('input[name="level"][value="'+p.level+'"]'); if (el) el.checked = true; }
    if (p.equip) { var el = document.querySelector('input[name="equip"][value="'+p.equip+'"]'); if (el) el.checked = true; }
    if (p.runEquip) {
      var re = document.querySelector('input[name="runEquip"][value="'+p.runEquip+'"]');
      if (re) re.checked = true;
    }
    if (p.gender) { var el = document.querySelector('input[name="gender"][value="'+p.gender+'"]'); if (el) el.checked = true; }
    if (p.days) {
      document.querySelectorAll('#daysGroup .chip').forEach(function(c){ c.classList.remove("active"); });
      var chip = document.querySelector('#daysGroup .chip[data-days="'+p.days+'"]');
      if (chip) chip.classList.add("active");
    }
    if (p.weight) document.getElementById('bodyWeight').value = p.weight;
    if (p.height) document.getElementById('bodyHeight').value = p.height;
    if (p.age) document.getElementById('bodyAge').value = p.age;
    if (p.cycle) currentCycle = p.cycle;
    if (p.week) currentWeek = p.week;
  } catch(e) {}
}

// ============ Tab 切换 & 初始化 ============
function switchTab(btn) {
  document.querySelectorAll(".tab-btn").forEach(function(b){
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
    b.setAttribute("tabindex", "-1");
  });
  document.querySelectorAll(".page").forEach(function(p){ p.classList.remove("active"); });
  btn.classList.add("active");
  btn.setAttribute("aria-selected", "true");
  btn.setAttribute("tabindex", "0");
  var tab = btn.dataset.tab;
  document.getElementById(tab).classList.add("active");
  if (tab === "page-lib") { renderLib(); _trackStat('libs'); }
  if (tab === "page-prog") renderProgress();
  if (tab === "page-community") { renderCommunity(); checkFirstVisitGuide(); }
  if (tab === "page-donate") { _trackStat('donate'); }
  if (tab === "page-plan") {
    updateReminderTrainDays();
    checkReminder();
  }
}

// 无障碍:Tab 键盘导航(左右方向键切换 Tab)
document.querySelectorAll('[role="tablist"]').forEach(function(tablist){
  tablist.addEventListener('keydown', function(e){
    var tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    var cur = tabs.findIndex(function(t){ return t === document.activeElement; });
    if (cur === -1) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      var next = tabs[(cur + 1) % tabs.length];
      next.focus(); next.click();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      var prev = tabs[(cur - 1 + tabs.length) % tabs.length];
      prev.focus(); prev.click();
    } else if (e.key === 'Home') {
      e.preventDefault();
      tabs[0].focus(); tabs[0].click();
    } else if (e.key === 'End') {
      e.preventDefault();
      tabs[tabs.length - 1].focus(); tabs[tabs.length - 1].click();
    }
  });
});

document.querySelectorAll("#daysGroup .chip").forEach(function(c){
  c.addEventListener("click", function(){
    document.querySelectorAll("#daysGroup .chip").forEach(function(x){ x.classList.remove("active"); });
    c.classList.add("active");
  });
});

// 伤病 chip 点击
document.querySelectorAll("#injuryChips .chip").forEach(function(c){
  c.addEventListener("click", function(){
    c.classList.toggle("active");
  });
});

// 初始化
// 启动时清理可能损坏的 JSON localStorage 键
(function _cleanBadStorage(){
  var keys = ['fitbuddy_lastplan','fitbuddy_history','fitbuddy_trainlog','fitbuddy_shoes',
    'fitbuddy_reminder','fitbuddy_profile','fitbuddy_prefs','fitbuddy_achievements',
    'fitbuddy_marathon_paces','fitbuddy_stats','fitbuddy_injury'];
  keys.forEach(function(k){
    var raw = localStorage.getItem(k);
    if (raw === 'undefined' || raw === 'NaN' || raw === 'null') {
      localStorage.removeItem(k);
      console.warn('[FitBuddy] 清理损坏的 localStorage 键:', k, '(值:', raw, ')');
      return;
    }
    if (raw) {
      try { JSON.parse(raw); } catch(e) {
        localStorage.removeItem(k);
        console.warn('[FitBuddy] 清理无法解析的 localStorage 键:', k);
      }
    }
  });
})();

loadAllData();
loadPrefs();
toggleEquip();
mergeCustomExes();
renderLib();

// 如果有上次生成的计划,直接渲染 HTML(用 doGenerateInternal,不触发按钮 Loading)
// 延迟到 DOMContentLoaded 后执行，确保 pets.js 等后续脚本已加载
function restoreLastPlan() {
  if (!lastPlan || !lastPlan.goal || !lastPlan.trainingDays) return;
  try {
    // 恢复表单 UI
    var _rg = document.querySelector('input[name="goal"][value="'+lastPlan.goal+'"]');
    if (_rg) _rg.checked = true;
    var _rl = document.querySelector('input[name="level"][value="'+lastPlan.level+'"]');
    if (_rl) _rl.checked = true;
    var _rd = document.querySelector('input[name="days"][value="'+lastPlan.days+'"]');
    if (_rd) _rd.checked = true;
    var _re = document.querySelector('input[name="equip"][value="'+lastPlan.equip+'"]');
    if (_re) _re.checked = true;
    if (lastPlan.cycle) currentCycle = lastPlan.cycle;
    // 直接渲染,不操作按钮
    var _cfg = CONFIGS[lastPlan.level] || CONFIGS.beginner;
    var _goalCfg = _cfg[lastPlan.goal] || _cfg.muscle;
    doGenerateInternal(lastPlan.goal, lastPlan.level, lastPlan.days, lastPlan.equip,
      lastPlan.trainingDays, lastPlan.schedule || getSchedule(lastPlan.days), _cfg, _goalCfg);
  } catch(e) { console.error('恢复计划失败:', e); }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', restoreLastPlan);
} else {
  restoreLastPlan();
}
updateTodayBanner();

// 页面完全加载后,如果沒有计划则显示欢迎提示
window.addEventListener('load', function() {
  var planResult = document.getElementById("planResult");
  if (planResult && !planResult.innerHTML.trim()) {
    planResult.innerHTML = '<div class="loading-overlay"><div style="font-size:48px;margin-bottom:12px;">🥚</div><div class="loading-text">选择目标、水平和天数,点击「生成我的计划」开始训练,顺便领养你的健身精灵!</div></div>';
  }
  updateHeaderStreak();
});

// ============ 游戏化系统:等级、成就、连签 ============
function getLocalDate() {
  var d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

var LEVELS = [
  { icon: '🥚', name: '新手铁匠', min: 0, max: 2 },
  { icon: '🥉', name: '青铜武士', min: 3, max: 6 },
  { icon: '🥈', name: '白银骑士', min: 7, max: 13 },
  { icon: '🥇', name: '黄金战神', min: 14, max: 29 },
  { icon: '💎', name: '钻石传说', min: 30, max: 49 },
  { icon: '👑', name: '冠军王者', min: 50, max: 999 }
];

var ACHIEVEMENTS = [
  { id: 'streak_3',  cat: '🔥 连续打卡', icon: '🔥', name: '三日之火', desc: '连续训练3天' },
  { id: 'streak_7',  cat: '🔥 连续打卡', icon: '🔥', name: '七日之焰', desc: '连续训练7天' },
  { id: 'streak_14', cat: '🔥 连续打卡', icon: '🔥', name: '两周坚持', desc: '连续训练14天' },
  { id: 'streak_21', cat: '🔥 连续打卡', icon: '🔥', name: '习惯养成', desc: '连续训练21天' },
  { id: 'streak_30', cat: '🔥 连续打卡', icon: '🔥', name: '月度战士', desc: '连续训练30天' },
  { id: 'streak_50', cat: '🔥 连续打卡', icon: '🔥', name: '半百之王', desc: '连续训练50天' },
  { id: 'streak_100',cat: '🔥 连续打卡', icon: '🔥', name: '百炼成钢', desc: '连续训练100天' },
  { id: 'first_train',cat: '💪 训练次数', icon: '💪', name: '初次启程', desc: '完成首次训练' },
  { id: 'train_10',   cat: '💪 训练次数', icon: '💪', name: '十次磨练', desc: '累计完成10次训练' },
  { id: 'train_50',   cat: '💪 训练次数', icon: '💪', name: '五十战记', desc: '累计完成50次训练' },
  { id: 'train_100',  cat: '💪 训练次数', icon: '💪', name: '百战之躯', desc: '累计完成100次训练' },
  { id: 'ex_10',      cat: '🔍 探索发现', icon: '🔍', name: '动作达人', desc: '解锁10个不同动作' },
  { id: 'equip_3',    cat: '🔍 探索发现', icon: '🔍', name: '全能战士', desc: '使用过3种不同器械训练' },
  { id: 'pet_evolve3',cat: '🐉 精灵伙伴', icon: '🐉', name: '精灵进化', desc: '精灵达到第3阶段' },
  { id: 'pet_max',    cat: '🐉 精灵伙伴', icon: '🐉', name: '终极形态', desc: '精灵达到最终形态' },
  { id: 'hidden_pet', cat: '🐉 精灵伙伴', icon: '🦄', name: '幻光降临', desc: '解锁隐藏款精灵' }
];

function getAchievements() {
  try { return JSON.parse(localStorage.getItem('fitbuddy_achievements') || '[]'); }
  catch(e) { return []; }
}
function saveAchievements(ach) {
  try { localStorage.setItem('fitbuddy_achievements', JSON.stringify(ach)); } catch(e) {}
}

function getStreakData() {
  var hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]');
  var dates = Object.keys(hist.reduce(function(acc,h){ acc[h.date]=true; return acc; },{}));
  dates.sort();
  var streak = 0;
  if (dates.length) {
    var today = new Date(); today.setHours(0,0,0,0);
    var yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    var lastDate = new Date(dates[dates.length-1]+'T00:00:00');
    if (lastDate.getTime() >= yesterday.getTime()) {
      streak = 1;
      for (var i = dates.length-2; i >= 0; i--) {
        var prev = new Date(dates[i]+'T00:00:00');
        var next = new Date(dates[i+1]+'T00:00:00');
        var diff = (next - prev) / 86400000;
        if (diff <= 2) { streak++; } else { break; }
      }
    }
  }
  return streak;
}

function getTotalTrainDays() {
  var hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]');
  return new Set(hist.map(function(h){ return h.date; })).size;
}

function getLevel() {
  var total = getTotalTrainDays();
  for (var i = LEVELS.length-1; i >= 0; i--) {
    if (total >= LEVELS[i].min) return i;
  }
  return 0;
}

function getLevelProgress() {
  var total = getTotalTrainDays();
  var lv = getLevel();
  var cur = LEVELS[lv];
  var nxt = LEVELS[Math.min(lv + 1, LEVELS.length - 1)];
  var progress;
  if (lv === LEVELS.length - 1) {
    progress = 100;
  } else {
    progress = Math.min(100, Math.round(((total - cur.min) / (cur.max - cur.min + 1)) * 100));
  }
  return { cur: cur, nxt: nxt, total: total, progress: progress };
}

function updateStreak() {
  var streak = getStreakData();
  try { localStorage.setItem('fitbuddy_streak', streak); } catch(e) {}
  return streak;
}

function checkAchievements() {
  var earned = getAchievements();
  var streak = getStreakData();
  var hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]');

  var uniqueExes = {};
  var equips = {};
  var totalSessions = 0;
  for (var j = 0; j < hist.length; j++) {
    totalSessions++;
    var h = hist[j];
    if (h.name) uniqueExes[h.name] = true;
    for (var k = 0; k < EXES.length; k++) {
      if (EXES[k].n === h.name) { equips[EXES[k].eq] = true; break; }
    }
  }
  var exCount = Object.keys(uniqueExes).length;
  var eqCount = Object.keys(equips).length;

  var newBadges = [];
  function unlock(id) {
    if (earned.indexOf(id) < 0) {
      earned.push(id);
      for (var a = 0; a < ACHIEVEMENTS.length; a++) {
        if (ACHIEVEMENTS[a].id === id) { newBadges.push(ACHIEVEMENTS[a]); break; }
      }
    }
  }

  if (streak >= 3) unlock('streak_3');
  if (streak >= 7) unlock('streak_7');
  if (streak >= 14) unlock('streak_14');
  if (streak >= 21) unlock('streak_21');
  if (streak >= 30) unlock('streak_30');
  if (streak >= 50) unlock('streak_50');
  if (streak >= 100) unlock('streak_100');
  if (totalSessions >= 1) unlock('first_train');
  if (totalSessions >= 10) unlock('train_10');
  if (totalSessions >= 50) unlock('train_50');
  if (totalSessions >= 100) unlock('train_100');
  if (exCount >= 10) unlock('ex_10');
  if (eqCount >= 3) unlock('equip_3');

  if (newBadges.length > 0) {
    saveAchievements(earned);
    for (var b = 0; b < newBadges.length; b++) {
      showAchievementToast(newBadges[b]);
    }
  }
}

function showAchievementToast(ach) {
  var toast = document.createElement('div');
  toast.id = '__ach_toast_tmp';
  var existing = document.getElementById('__ach_toast_tmp');
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:10001;' +
    'background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;padding:14px 22px;border-radius:16px;' +
    'box-shadow:0 8px 32px rgba(0,0,0,0.3);font-size:14px;font-weight:700;text-align:center;' +
    'animation:achPop 0.5s ease-out;pointer-events:none;max-width:260px;';
  toast.innerHTML = '🏆 成就解锁!<br><span style="font-size:16px;">' + ach.icon + ' ' + ach.name + '</span><br><span style="font-size:11px;opacity:0.85;">' + ach.desc + '</span>';
  document.body.appendChild(toast);
  setTimeout(function(){ if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3500);
}

function updateHeaderStreak() {
  var streak = getStreakData();
  var lv = getLevel();
  var streakEl = document.getElementById('headerStreak');
  var streakNum = document.getElementById('streakNum');
  var levelEl = document.getElementById('headerLevel');
  if (streakEl && streakNum) {
    streakEl.style.display = streak > 0 ? 'inline-flex' : 'none';
    streakNum.textContent = streak;
  }
  if (levelEl) {
    levelEl.style.display = 'inline-flex';
    if (LEVELS[lv]) levelEl.textContent = LEVELS[lv].icon + ' ' + LEVELS[lv].name;
  }
}

// ============ 简易统计模块 ============
var _stats;
try {
  _stats = JSON.parse(localStorage.getItem('fitbuddy_stats') || '');
} catch(e) { _stats = null; }
if (!_stats || typeof _stats !== 'object' || Array.isArray(_stats)) {
  _stats = {pv:0, gens:0, done:0, libs:0, shares:0, sessions:[]};
  try { localStorage.setItem('fitbuddy_stats', JSON.stringify(_stats)); } catch(e) {}
}
_stats.pv++;
if (!_stats.firstVisit) _stats.firstVisit = new Date().toISOString().slice(0,10);
_stats.lastVisit = new Date().toISOString();
// 记录会话
var _today = new Date().toISOString().slice(0,10);
var _lastSession = _stats.sessions[_stats.sessions.length-1];
if (!_lastSession || _lastSession.date !== _today) {
  _stats.sessions.push({date:_today,count:1});
  if (_stats.sessions.length > 90) _stats.sessions.shift();
} else {
  _lastSession.count++;
}
function _trackStat(key) { if(!_stats||typeof _stats!=='object') return; _stats[key] = (_stats[key]||0)+1; _saveStats(); }
function _saveStats() { try { localStorage.setItem('fitbuddy_stats', JSON.stringify(_stats)); } catch(e) {} }
_saveStats();

// 导出时自动补全 og:url(根据当前访问域名)
(function(){
  var ogUrl = document.querySelector('meta[property="og:url"]');
  var ogImage = document.querySelector('meta[property="og:image"]');
  if (ogUrl && ogUrl.getAttribute('content') === '') {
    ogUrl.setAttribute('content', location.origin + location.pathname.replace(/\/$/, ''));
    if (ogImage) ogImage.setAttribute('content', location.origin + '/exercise-images/og-image.png');
  }
})();

// ============ 计时器增强:FAB + 预设 + 暂停 + 音效 ============
function openTimerFab() {
  document.getElementById("timerOverlay").classList.add("show");
  // 默认选中60秒预设
  var presets = document.querySelectorAll("#timerPresets .timer-preset");
  presets.forEach(function(p){ p.classList.remove("active"); });
  var def = document.querySelector('#timerPresets [onclick*="60"]');
  if (def) def.classList.add("active");
  startRestTimerCustom(60);
}

function startRestTimerCustom(sec) {
  // 高亮当前预设
  var presets = document.querySelectorAll("#timerPresets .timer-preset");
  presets.forEach(function(p){ p.classList.remove("active"); });
  var target = document.querySelector('#timerPresets [onclick*="'+sec+'"]');
  if (target) target.classList.add("active");

  timerSeconds = sec;
  timerPaused = false;
  document.getElementById("timerOverlay").classList.add("show");
  document.getElementById("timerNum").textContent = timerSeconds;
  document.getElementById("timerPauseBtn").textContent = "⏸ 暂停";
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(function(){
    timerSeconds--;
    if (timerSeconds <= 0) {
      stopTimer();
      playTimerBeep();
      return;
    }
    document.getElementById("timerNum").textContent = timerSeconds;
  }, 1000);
}

var timerPaused = false;
function pauseTimer() {
  var btn = document.getElementById("timerPauseBtn");
  if (!timerInterval && !timerPaused) {
    // 恢复
    timerPaused = false;
    btn.textContent = "⏸ 暂停";
    timerInterval = setInterval(function(){
      timerSeconds--;
      if (timerSeconds <= 0) { stopTimer(); playTimerBeep(); return; }
      document.getElementById("timerNum").textContent = timerSeconds;
    }, 1000);
  } else {
    // 暂停
    timerPaused = true;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    btn.textContent = "▶ 继续";
  }
}

function playTimerBeep() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    gain.gain.value = 0.3;
    var now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.setValueAtTime(0, now + 0.15);
    osc.frequency.setValueAtTime(880, now + 0.2);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.setValueAtTime(0, now + 0.35);
    osc.frequency.setValueAtTime(1100, now + 0.4);
    gain.gain.setValueAtTime(0.3, now + 0.4);
    gain.gain.setValueAtTime(0, now + 0.6);
    osc.start(now); osc.stop(now + 0.65);
  } catch(e) {}
}

// ============ 数据导出 / 导入 / 重置 ============
function exportData() {
  var data = {};
  var keys = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k.indexOf("fitbuddy_") === 0) {
      try { data[k] = JSON.parse(localStorage.getItem(k)); }
      catch(e) { data[k] = localStorage.getItem(k); }
      keys.push(k);
    }
  }
  data._exportKeys = keys;
  data._exportTime = new Date().toISOString();
  data._exportVersion = "1.1";

  var blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "FitBuddy_backup_" + new Date().toISOString().slice(0,10) + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("✅ 数据已导出!共 " + keys.length + " 条记录");
}

function importData(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast("❌ 文件过大(最大 10MB)"); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var raw = e.target.result;
      if (raw.length > 10 * 1024 * 1024) { showToast("❌ 文件内容过大"); return; }
      var data = JSON.parse(raw);

      // 验证:必须是对象且包含 FitBuddy 特征 key
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        showToast("❌ 无效的备份文件格式");
        return;
      }

      var validPrefixes = ["fitbuddy_", "fb_"];
      var hasFitBuddyKey = Object.keys(data).some(function(k) {
        return validPrefixes.some(function(p) { return k.indexOf(p) === 0; });
      });
      if (!hasFitBuddyKey && !data._exportKeys) {
        showToast("❌ 未识别的 FitBuddy 备份文件");
        return;
      }

      var keys = data._exportKeys || Object.keys(data).filter(function(k) {
        return validPrefixes.some(function(p) { return k.indexOf(p) === 0; });
      });
      if (!keys.length) { showToast("❌ 备份文件中无有效数据"); return; }

      var count = 0;
      keys.forEach(function(k) {
        try {
          if (typeof k !== "string" || k.length > 100) return;
          var val = data[k];
          if (val === undefined || val === null) return;
          if (typeof val === "function" || typeof val === "symbol") return;
          var strVal = (typeof val === "object") ? JSON.stringify(val) : String(val);
          if (strVal.length > 2 * 1024 * 1024) return; // 单条数据限制 2MB
          localStorage.setItem(k, strVal);
          count++;
        } catch(e2) {}
      });

      showToast("✅ 已恢复 " + count + " 条数据,刷新页面生效");
      setTimeout(function(){ location.reload(); }, 2000);
    } catch(e) {
      showToast("❌ 文件格式错误,请选择 FitBuddy 备份文件");
    }
  };
  reader.readAsText(file);
  input.value = "";
}

function resetAllData() {
  if (!confirm("⚠️ 确定要清除所有训练数据吗?\n\n这将删除:训练记录、宠物进度、成就徽章、设置等\n\n此操作不可撤销!")) return;
  if (!confirm("再次确认:真的要删除所有数据吗?")) return;

  var keys = [];
  for (var i = localStorage.length - 1; i >= 0; i--) {
    var k = localStorage.key(i);
    if (k.indexOf("fitbuddy_") === 0) {
      keys.push(k);
      localStorage.removeItem(k);
    }
  }
  showToast("🔄 已清除 " + keys.length + " 条数据,即将刷新...");
  setTimeout(function(){ location.reload(); }, 1500);
}

function showToast(msg) {
  var t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = "position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:#1A1A2E;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:500;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:fadeIn 0.2s ease;max-width:90vw;text-align:center;";
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3000);
}

// ============ 1RM 极限重量计算器 ============
var rmFormula = "epley";
function switchRMFormula(f, btn) {
  rmFormula = f;
  var btns = document.querySelectorAll("#rmCalc .rm-actions button");
  btns.forEach(function(b){ b.classList.remove("active"); });
  btn.classList.add("active");
  calc1RM();
}

function calc1RM() {
  var w = parseFloat(document.getElementById("rmWeight").value);
  var r = parseInt(document.getElementById("rmReps").value);
  var res = document.getElementById("rmResult");
  if (!w || !r || w <= 0 || r < 1) { res.style.display = "none"; return; }
  if (r > 15) r = 15;

  var rm;
  if (rmFormula === "brzycki") {
    rm = w * (36 / (37 - r));
  } else {
    rm = w * (1 + r / 30);
  }
  rm = Math.round(rm * 10) / 10;

  document.getElementById("rmValue").textContent = rm + " kg";
  document.getElementById("rmFormulaLabel").textContent = (rmFormula === "brzycki" ? "Brzycki" : "Epley") + " 公式估算";
  document.getElementById("rm50").textContent = Math.round(rm * 0.5 * 10) / 10 + " kg";
  document.getElementById("rm60").textContent = Math.round(rm * 0.6 * 10) / 10 + " kg";
  document.getElementById("rm70").textContent = Math.round(rm * 0.7 * 10) / 10 + " kg";
  document.getElementById("rm80").textContent = Math.round(rm * 0.8 * 10) / 10 + " kg";
  document.getElementById("rm85").textContent = Math.round(rm * 0.85 * 10) / 10 + " kg";
  document.getElementById("rm90").textContent = Math.round(rm * 0.9 * 10) / 10 + " kg";
  document.getElementById("rm95").textContent = Math.round(rm * 0.95 * 10) / 10 + " kg";
  res.style.display = "block";
}



// PWA Install Prompt (lifecycle event listener at top level)
var _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  window._deferredPrompt = e;
  var btn = document.getElementById('installBtn');
  if (btn) { btn.style.display = 'inline-block'; btn.style.opacity = '1'; }
});
window.addEventListener('appinstalled', function() {
  window._deferredPrompt = null;
  var btn = document.getElementById('installBtn');
  if (btn) btn.style.display = 'none';
});

// ============ 热身组计算器 ============
function calcWarmupSets() {
  var w = parseFloat(document.getElementById('warmupTargetWeight').value);
  var res = document.getElementById('warmupResult');
  if (!w || w <= 0) { res.style.display = 'none'; return; }

  var barWeight = parseFloat(document.getElementById('barWeightSelect').value) || 20;
  var perSide = Math.max(0, (w - barWeight) / 2);
  if (perSide < 0) perSide = 0;

  var steps = [
    { pct: 0,   reps: 8, label: '空杆' },
    { pct: 0.5, reps: 5, label: '50%' },
    { pct: 0.7, reps: 3, label: '70%' },
    { pct: 0.85,reps: 1, label: '85%' }
  ];

  var html = '<div class="warmup-result-title">🎯 目标: ' + w + 'kg</div>';
  html += '<div class="warmup-steps">';
  steps.forEach(function(s, i) {
    var sw = Math.round(w * s.pct * 10) / 10;
    if (s.pct === 0) sw = barWeight;
    var sidePlates = Math.max(0, (sw - barWeight) / 2);
    html += '<div class="warmup-step">' +
      '<div class="warmup-step-num">' + (i+1) + '</div>' +
      '<div class="warmup-step-info">' +
        '<div class="warmup-step-weight">' + (s.pct === 0 ? '空杆' : s.label) + ' ' + sw + 'kg</div>' +
        '<div class="warmup-step-reps">' + s.reps + ' 次</div>' +
        '<div class="warmup-step-plate">每侧 +' + (sidePlates > 0 ? sidePlates + 'kg' : '0') + '</div>' +
      '</div></div>';
  });
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--text3);margin-top:8px;text-align:center;">杠铃杆: ' + barWeight + 'kg · 每组间休息 60-90 秒</div>';
  res.innerHTML = html;
  res.style.display = 'block';
}

// ============ 杠铃片计算器 ============
var STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

function calcPlates() {
  var w = parseFloat(document.getElementById('plateTargetWeight').value);
  var res = document.getElementById('plateResult');
  if (!w || w <= 0) { res.style.display = 'none'; return; }

  var barWeight = parseFloat(document.getElementById('plateBarWeight').value) || 20;
  var plateWeight = w - barWeight;
  if (plateWeight <= 0) {
    res.innerHTML = '<div style="color:var(--text3);text-align:center;padding:12px;">目标重量需大于杠铃杆重量 (' + barWeight + 'kg)</div>';
    res.style.display = 'block';
    return;
  }
  var perSide = plateWeight / 2;
  var remaining = perSide;
  var plates = [];
  STANDARD_PLATES.forEach(function(p) {
    while (remaining >= p - 0.01) {
      plates.push(p);
      remaining = Math.round((remaining - p) * 100) / 100;
    }
  });

  // Group by plate size
  var grouped = {};
  plates.forEach(function(p) { grouped[p] = (grouped[p]||0) + 1; });

  var html = '<div class="plate-result-title">🎯 目标: ' + w + 'kg (每侧 ' + perSide + 'kg)</div>';
  html += '<div class="plate-visual">';

  // Bar
  html += '<div class="plate-bar">━━ ' + barWeight + 'kg 杠铃杆 ━━</div>';

  // Left side plates
  html += '<div class="plate-side">';
  Object.keys(grouped).sort(function(a,b){ return parseFloat(b)-parseFloat(a); }).forEach(function(p) {
    var count = grouped[p];
    var color = getPlateColor(parseFloat(p));
    for (var i = 0; i < count; i++) {
      html += '<div class="plate-disc" style="background:' + color + ';">' + p + '</div>';
    }
  });
  html += '</div>';

  html += '<div class="plate-center">⚖</div>';

  // Right side plates (mirror)
  html += '<div class="plate-side">';
  Object.keys(grouped).sort(function(a,b){ return parseFloat(b)-parseFloat(a); }).forEach(function(p) {
    var count = grouped[p];
    var color = getPlateColor(parseFloat(p));
    for (var i = 0; i < count; i++) {
      html += '<div class="plate-disc" style="background:' + color + ';">' + p + '</div>';
    }
  });
  html += '</div>';

  html += '</div>';

  // Summary
  html += '<div class="plate-summary">';
  html += '<div>杠铃杆: ' + barWeight + 'kg</div>';
  Object.keys(grouped).sort(function(a,b){ return parseFloat(b)-parseFloat(a); }).forEach(function(p) {
    html += '<div>' + p + 'kg 片 × ' + grouped[p] * 2 + ' (每侧 ' + grouped[p] + ')</div>';
  });
  html += '<div style="font-weight:700;margin-top:4px;">总计: ' + w + 'kg</div>';
  html += '</div>';

  res.innerHTML = html;
  res.style.display = 'block';
}

function getPlateColor(w) {
  if (w >= 25) return '#EF4444';
  if (w >= 20) return '#3B82F6';
  if (w >= 15) return '#F59E0B';
  if (w >= 10) return '#22C55E';
  if (w >= 5) return '#8B5CF6';
  return '#6B7280';
}

// ============ 自定义动作库 ============
function getCustomExes() {
  try { return JSON.parse(localStorage.getItem('fitbuddy_customex') || '[]'); } catch(e) { return []; }
}

function saveCustomExes(arr) {
  localStorage.setItem('fitbuddy_customex', JSON.stringify(arr));
}

function mergeCustomExes() {
  if (typeof EXES === 'undefined' || !EXES) return;
  var customs = getCustomExes();
  if (!customs.length) return;
  customs.forEach(function(c) {
    var exists = EXES.find(function(e){ return e.n === c.n; });
    if (!exists && c.n) {
      EXES.push({
        n: c.n,
        m: c.m || '核心',
        diff: c.diff || '初级',
        eq: c.eq || 'bodyweight',
        desc: c.desc || '',
        tips: c.tips || '',
        _custom: true
      });
    }
  });
}

function openAddExModal() {
  var html = '<div class="modal-handle"></div>' +
    '<div class="modal-title">➕ 添加自定义动作</div>' +
    '<div style="padding:0 4px;">' +
    '<div class="form-group" style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;">动作名称</label>' +
    '<input type="text" class="text-input" id="customExName" placeholder="如:绳索夹胸" style="width:100%;margin-top:4px;"></div>' +
    '<div class="form-group" style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;">训练部位</label>' +
    '<select class="text-input" id="customExMuscle" style="width:100%;margin-top:4px;">' +
    MUSCLE_ORDER.map(function(m){ return '<option value="'+m+'">'+(MUSCLE_LABELS[m]||m)+'</option>'; }).join('') +
    '</select></div>' +
    '<div class="form-group" style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;">难度</label>' +
    '<select class="text-input" id="customExDiff" style="width:100%;margin-top:4px;">' +
    '<option value="初级">初级</option><option value="中级">中级</option><option value="高级">高级</option></select></div>' +
    '<div class="form-group" style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;">设备</label>' +
    '<select class="text-input" id="customExEq" style="width:100%;margin-top:4px;">' +
    '<option value="gym">健身房</option><option value="dumbbell">哑铃</option><option value="bodyweight">自重</option></select></div>' +
    '<div class="form-group" style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;">动作描述（选填）</label>' +
    '<input type="text" class="text-input" id="customExDesc" placeholder="简要描述" style="width:100%;margin-top:4px;"></div>' +
    '<div class="form-group" style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;">动作要点（选填）</label>' +
    '<textarea class="text-input" id="customExTips" placeholder="动作要点提示" style="width:100%;margin-top:4px;min-height:60px;resize:vertical;"></textarea></div>' +
    '<button class="btn-generate" style="width:100%;margin-top:8px;" onclick="saveCustomEx()">✅ 保存动作</button>' +
    '</div>';
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('show');
}

function saveCustomEx() {
  var name = (document.getElementById('customExName').value || '').trim();
  if (!name) { showToast('⚠️ 请输入动作名称'); return; }
  var customs = getCustomExes();
  if (customs.find(function(c){ return c.n === name; })) {
    showToast('⚠️ 已存在同名动作');
    return;
  }
  customs.push({
    n: name,
    m: document.getElementById('customExMuscle').value,
    diff: document.getElementById('customExDiff').value,
    eq: document.getElementById('customExEq').value,
    desc: (document.getElementById('customExDesc').value || '').trim(),
    tips: (document.getElementById('customExTips').value || '').trim(),
    _custom: true,
    date: Date.now()
  });
  saveCustomExes(customs);
  mergeCustomExes();
  closeModal();
  renderLib();
  showToast('✅ 动作「' + name + '」已添加');
}

function deleteCustomEx(name) {
  if (!confirm('确定删除自定义动作「' + name + '」吗?')) return;
  var customs = getCustomExes().filter(function(c){ return c.n !== name; });
  saveCustomExes(customs);
  // Remove from EXES
  if (typeof EXES !== 'undefined' && EXES) {
    var idx = EXES.findIndex(function(e){ return e.n === name; });
    if (idx >= 0 && EXES[idx]._custom) EXES.splice(idx, 1);
  }
  renderLib();
  showToast('🗑 已删除「' + name + '」');
}

// ============ RPE 自调节系统 ============
function getRPESuggestions(exName) {
  var log = trainingLog[exName];
  if (!log || log.length < 1) return null;
  var last = log[log.length - 1];
  var rpe = last.rpe || 0;
  if (rpe <= 0) return null;

  var suggestion = null;
  if (rpe >= 9) {
    suggestion = { type: 'reduce', text: '上次 RPE ' + rpe + '，状态吃力，建议降 5% 重量或 -1 次', color: '#EF4444' };
  } else if (rpe >= 8) {
    suggestion = { type: 'maintain', text: '上次 RPE ' + rpe + '，接近极限，保持当前重量', color: '#F59E0B' };
  } else if (rpe <= 5) {
    suggestion = { type: 'increase', text: '上次 RPE ' + rpe + '，状态轻松，可加 2.5% 重量或 +1 次', color: '#22C55E' };
  } else if (rpe <= 6) {
    suggestion = { type: 'slight_increase', text: '上次 RPE ' + rpe + '，有余力，可尝试 +1 次', color: '#3B82F6' };
  }
  return suggestion;
}

function getRPEBadgeHtml(exName) {
  var s = getRPESuggestions(exName);
  if (!s) return '';
  return '<div style="font-size:11px;color:' + s.color + ';background:' + s.color + '15;padding:3px 8px;border-radius:8px;margin-top:4px;display:inline-block;">💡 ' + s.text + '</div>';
}

// ============ 减载周自动化 ============
function isDeloadWeek() {
  if (!lastPlan) return false;
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem('fitbuddy_prefs') || '{}'); } catch(e) {}
  if (prefs.deload === false) return false; // user disabled
  // Every 4th week in a cycle
  return currentWeek > 0 && currentWeek % 4 === 0;
}

function getDeloadMultiplier() {
  return isDeloadWeek() ? 0.6 : 1.0;
}

function renderDeloadBanner() {
  if (!isDeloadWeek()) return '';
  return '<div style="background:linear-gradient(135deg,#8B5CF6 0%,#6366F1 100%);color:#fff;border-radius:12px;padding:12px 16px;margin-bottom:12px;text-align:center;">' +
    '<div style="font-size:15px;font-weight:700;">🧘 减载周 · 第' + currentWeek + '周</div>' +
    '<div style="font-size:12px;opacity:0.9;margin-top:4px;">训练量降低 40%，让身体恢复 · 这是变强的关键</div>' +
    '</div>';
}

// ============ 智能补课重排 ============
function checkMissedDays() {
  if (!lastPlan || !lastPlan.trainingDays || !lastPlan.schedule) return null;
  var today = new Date();
  var dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
  var todayName = dayNames[today.getDay()];

  var trainSchedule = lastPlan.schedule.filter(function(s){ return s.isTraining; });
  if (!trainSchedule.length) return null;

  // Check if today is a training day that hasn't been completed
  var todayIsTraining = false;
  var todayIdx = -1;
  for (var i = 0; i < lastPlan.schedule.length; i++) {
    if (lastPlan.schedule[i].day.indexOf(todayName) >= 0) {
      todayIsTraining = lastPlan.schedule[i].isTraining;
      todayIdx = i;
      break;
    }
  }
  if (!todayIsTraining || todayIdx < 0) return null;

  // Check if today's training is already done
  var day = lastPlan.trainingDays[todayIdx];
  if (!day || !day.exes || !day.exes.length) return null;

  var allDone = true;
  for (var ei = 0; ei < day.exes.length; ei++) {
    if (localStorage.getItem(doneKey('day_' + todayIdx + '_ex' + ei)) !== '1') {
      allDone = false;
      break;
    }
  }
  if (allDone) return null; // Already done

  // Check if yesterday was a training day and was missed
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  var yName = dayNames[yesterday.getDay()];
  for (var j = 0; j < lastPlan.schedule.length; j++) {
    if (lastPlan.schedule[j].day.indexOf(yName) >= 0 && lastPlan.schedule[j].isTraining) {
      var yDay = lastPlan.trainingDays[j];
      if (yDay && yDay.exes && yDay.exes.length) {
        var yDone = true;
        for (var k = 0; k < yDay.exes.length; k++) {
          if (localStorage.getItem(doneKey('day_' + j + '_ex' + k)) !== '1') {
            yDone = false;
            break;
          }
        }
        if (!yDone) {
          return { missedDayIdx: j, missedDayName: lastPlan.schedule[j].day };
        }
      }
    }
  }
  return null;
}

function renderMissedDayBanner() {
  var missed = checkMissedDays();
  if (!missed) return '';
  return '<div style="background:#FFF7ED;border:1px solid #F97316;border-radius:12px;padding:12px 16px;margin-bottom:12px;">' +
    '<div style="font-size:14px;font-weight:700;color:#F97316;">⏰ 昨日训练未完成</div>' +
    '<div style="font-size:12px;color:var(--text2);margin-top:4px;">' + missed.missedDayName + ' 的训练还没打卡</div>' +
    '<button class="btn-generate" style="margin-top:8px;font-size:13px;padding:8px 16px;width:auto;" onclick="rescheduleMissedDay(' + missed.missedDayIdx + ')">📋 顺延到今天</button>' +
    '</div>';
}

function rescheduleMissedDay(missedIdx) {
  if (!lastPlan || !lastPlan.trainingDays) return;
  var today = new Date();
  var dayNames = ['周日','周一','周二','周三','周四','周五','周六'];
  var todayName = dayNames[today.getDay()];

  // Find today's index
  var todayIdx = -1;
  for (var i = 0; i < lastPlan.schedule.length; i++) {
    if (lastPlan.schedule[i].day.indexOf(todayName) >= 0) {
      todayIdx = i;
      break;
    }
  }
  if (todayIdx < 0) { showToast('❌ 无法找到今日训练日'); return; }

  // Merge missed exercises into today's plan
  var missedDay = lastPlan.trainingDays[missedIdx];
  var todayDay = lastPlan.trainingDays[todayIdx];

  if (!missedDay || !missedDay.exes) return;

  if (todayDay && todayDay.exes) {
    // Add missed exercises to today
    missedDay.exes.forEach(function(ex) {
      var exists = todayDay.exes.find(function(e){ return e.n === ex.n; });
      if (!exists) todayDay.exes.push(ex);
    });
  } else {
    lastPlan.trainingDays[todayIdx] = { name: '补课日', exes: missedDay.exes.slice() };
  }

  // Clear missed day's checkmarks
  for (var ei = 0; ei < missedDay.exes.length; ei++) {
    localStorage.removeItem(doneKey('day_' + missedIdx + '_ex' + ei));
  }

  // Mark missed day as rest
  if (lastPlan.schedule[missedIdx]) {
    lastPlan.schedule[missedIdx].isTraining = false;
  }

  localStorage.setItem('fitbuddy_lastplan', JSON.stringify(lastPlan));
  showToast('✅ 已将昨日动作顺延到今天');
  setTimeout(function(){ doGenerate(); }, 800);
}

// ============ 部位疲劳监控 ============
function checkMuscleFatigue() {
  var hist = [];
  try { hist = JSON.parse(localStorage.getItem('fitbuddy_history') || '[]'); } catch(e) { return null; }
  if (!hist.length) return null;

  var today = new Date();
  var muscleByDay = {};

  for (var d = 0; d < 3; d++) {
    var checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - d);
    var dateStr = checkDate.toISOString().slice(0, 10);
    var h = hist.find(function(x){ return x.date === dateStr; });
    if (h && h.exercises && h.exercises.length) {
      h.exercises.forEach(function(exName) {
        var ex = (typeof EXES !== 'undefined' && EXES) ? EXES.find(function(e){ return e.n === exName; }) : null;
        var m = ex ? ex.m : '';
        if (m && m !== '有氧') {
          if (!muscleByDay[m]) muscleByDay[m] = 0;
          muscleByDay[m]++;
        }
      });
      // Mark which days had this muscle
      // If trained 3 consecutive days, it's fatigue
      if (d < 3) {
        // Count consecutive days
      }
    }
  }

  // Check for muscles trained 2+ of last 3 days
  var warnings = [];
  Object.keys(muscleByDay).forEach(function(m) {
    if (muscleByDay[m] >= 2) {
      warnings.push({ muscle: m, count: muscleByDay[m] });
    }
  });

  if (!warnings.length) return null;
  return warnings;
}

function renderFatigueWarning() {
  var warnings = checkMuscleFatigue();
  if (!warnings) return '';
  var html = '<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:12px;padding:10px 14px;margin-bottom:10px;">' +
    '<div style="font-size:13px;font-weight:700;color:#D97706;">⚠️ 部位疲劳提醒</div>';
  warnings.forEach(function(w) {
    html += '<div style="font-size:12px;color:var(--text2);margin-top:4px;">' +
      (MUSCLE_LABELS[w.muscle] || w.muscle) + ' 近3天训练 ' + w.count + ' 次，建议今天换部位' +
    '</div>';
  });
  html += '</div>';
  return html;
}

// ============ 周期化日历视图 ============
function renderCycleCalendar() {
  if (!lastPlan) return '';
  var goal = lastPlan.goal;
  var totalWeeks = goal === 'marathon' ? 16 : 4;
  var html = '<div class="progress-card"><div class="card-title">📅 周期化日历</div>';
  html += '<div class="cycle-calendar">';

  for (var w = 1; w <= totalWeeks; w++) {
    var isCurrent = w === currentWeek;
    var isDeload = (w % 4 === 0);
    var isCompleted = w < currentWeek;
    var intensityPct;
    if (goal === 'marathon') {
      // Marathon: progressive then taper
      if (w <= 12) intensityPct = 40 + (w / 12) * 40; // 40% to 80%
      else if (w <= 14) intensityPct = 85;
      else intensityPct = w === 15 ? 60 : 30; // taper
    } else {
      // 4-week cycle: week 1=60%, 2=70%, 3=80%, 4=deload 50%
      var weekInCycle = ((w - 1) % 4) + 1;
      intensityPct = [60, 70, 80, 50][weekInCycle - 1];
    }

    var color;
    if (isDeload) color = '#8B5CF6';
    else if (intensityPct >= 80) color = '#EF4444';
    else if (intensityPct >= 70) color = '#F59E0B';
    else color = '#22C55E';

    var opacity = isCompleted ? 1 : (isCurrent ? 1 : 0.4);
    var border = isCurrent ? '2px solid #FF6B35' : '2px solid transparent';

    html += '<div class="cycle-cell" style="opacity:' + opacity + ';border:' + border + ';" title="第' + w + '周 ' + Math.round(intensityPct) + '%强度">' +
      '<div class="cycle-cell-num" style="color:' + color + ';">' + w + '</div>' +
      '<div class="cycle-cell-bar" style="background:' + color + ';height:' + (intensityPct * 0.35) + 'px;"></div>' +
      (isDeload ? '<div style="font-size:8px;color:#8B5CF6;">减载</div>' : '') +
    '</div>';
  }

  html += '</div>';
  // Legend
  html += '<div style="display:flex;gap:12px;margin-top:10px;justify-content:center;flex-wrap:wrap;">' +
    '<span style="font-size:11px;color:var(--text2);"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#22C55E;margin-right:3px;"></span>中强度</span>' +
    '<span style="font-size:11px;color:var(--text2);"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#F59E0B;margin-right:3px;"></span>高强度</span>' +
    '<span style="font-size:11px;color:var(--text2);"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#EF4444;margin-right:3px;"></span>峰值</span>' +
    '<span style="font-size:11px;color:var(--text2);"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#8B5CF6;margin-right:3px;"></span>减载周</span>' +
  '</div>';
  html += '</div>';
  return html;
}

// ============ 渐进超负荷趋势分析 ============
function renderProgressionAnalysis() {
  var exNames = Object.keys(trainingLog).filter(function(k){
    if (BODYWEIGHT_EX_NAMES.has(k)) return false;
    return trainingLog[k].length >= 2;
  });
  if (!exNames.length) return '';

  var html = '<div class="progress-card"><div class="card-title">📈 渐进超负荷分析</div>';
  html += '<div style="display:flex;flex-direction:column;gap:12px;">';

  exNames.slice(0, 5).forEach(function(exName) {
    var log = trainingLog[exName];
    if (!log || log.length < 2) return;
    var first = log[0];
    var last = log[log.length - 1];
    var firstVol = (first.weight || 0) * (first.reps || 0);
    var lastVol = (last.weight || 0) * (last.reps || 0);
    var growth = firstVol > 0 ? Math.round((lastVol / firstVol - 1) * 100) : 0;
    var growthColor = growth > 0 ? '#22C55E' : (growth < 0 ? '#EF4444' : '#999');

    // Calculate estimated 1RM progression
    var first1RM = first.weight * (1 + (first.reps || 1) / 30);
    var last1RM = last.weight * (1 + (last.reps || 1) / 30);
    var rmGrowth = first1RM > 0 ? Math.round((last1RM / first1RM - 1) * 100) : 0;

    html += '<div style="background:var(--bg);border-radius:10px;padding:10px 12px;">' +
      '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">' + exName + '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);">' +
        '<span>起点: ' + (first.weight || 0) + 'kg×' + (first.reps || 0) + '</span>' +
        '<span>当前: ' + (last.weight || 0) + 'kg×' + (last.reps || 0) + '</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;margin-top:4px;">' +
        '<span style="font-size:12px;font-weight:600;color:' + growthColor + ';">📊 训练量 ' + (growth > 0 ? '+' : '') + growth + '%</span>' +
        '<span style="font-size:12px;font-weight:600;color:' + (rmGrowth > 0 ? '#22C55E' : '#999') + ';">💪 估算1RM ' + (rmGrowth > 0 ? '+' : '') + rmGrowth + '%</span>' +
      '</div>' +
    '</div>';
  });

  html += '</div></div>';
  return html;
}

// ============ FitBuddy 社区系统 ============
// 包含 AI训练者 / 排行榜 / 收藏库 / 成就徽章
// 依赖 planner-core.js + pets.js

// 获取每日挑战训练者（基于今天日期确定）
function getDailyTrainer() {
  var trainers = getTrainers();
  var today = new Date().toISOString().slice(0, 10);
  var idx = communityHash(today) % trainers.length;
  return trainers[idx];
}

// 检查今日每日挑战是否已完成
function isDailyDone() {
  return localStorage.getItem('fitbuddy_daily_done') === new Date().toISOString().slice(0, 10);
}

function markDailyDone() {
  localStorage.setItem('fitbuddy_daily_done', new Date().toISOString().slice(0, 10));
}

// 计算用户排名数据
function getUserRankData() {
  var info = petGetSpecies();
  var sp = PET_SPECIES[info.speciesId];
  var days = petGetDays(info.speciesId);
  var stage = sp.stages.findIndex(function(s, i) {
    return i < sp.stages.length - 1 ? days < sp.stages[i+1].need : true;
  });
  if (stage < 0) stage = 0;
  var stageData = sp.stages[stage];
  var stageMult = [0.4, 1.0, 1.8, 3.0, 5.0][stage];
  var power = Math.floor((8 + days * 4) * stageMult);
  var stats = petGetStats();
  var records = JSON.parse(localStorage.getItem('fitbuddy_battle_records') || '[]');
  var userWins = records.filter(function(r) { return r.result === 'win'; }).length;

  return {
    id: 'user',
    name: '我',
    speciesId: info.speciesId,
    speciesName: sp.name,
    element: sp.element,
    days: days,
    stage: stage,
    stageEmoji: stageData.emoji,
    stageName: stageData.name,
    wins: userWins,
    losses: records.length - userWins,
    power: power,
    hp: Math.floor((25 + days * 6) * (1 + stage * 0.5)),
    isUser: true
  };
}

// 生成排行榜（用户 + 所有AI训练者，按战斗力排序）
function getLeaderboard() {
  var trainers = getTrainers().map(function(t) { t.isUser = false; return t; });
  var user = getUserRankData();
  var all = [user].concat(trainers);
  all.sort(function(a, b) { return b.power - a.power; });
  return all.slice(0, 10);
}

// ============ 渲染社区大厅 ============
function renderCommunity() {
  var container = document.getElementById('communityContent');
  if (!container) return;

  var trainers = getTrainers();
  var daily = getDailyTrainer();
  var board = getLeaderboard();
  var dailyDone = isDailyDone();
  var userInfo = petGetSpecies();
  var userDays = petGetDays(userInfo.speciesId);
  var userHatched = userDays >= 3;

  var html = '';

  // === 每日挑战 ===
  html += '<div class="daily-challenge">';
  html += '<div class="dc-header">⚡ 今日挑战对手</div>';
  html += '<div style="display:flex;align-items:center;gap:14px;">';
  html += '<div class="dc-pet">' + daily.stageEmoji + '</div>';
  html += '<div style="flex:1;">';
  html += '<div class="dc-name">' + daily.name + '</div>';
  html += '<div style="font-size:12px;opacity:0.85;">「' + (daily.catchphrase || '今天也要加油！') + '」</div>';
  html += '<div style="font-size:11px;opacity:0.55;margin-top:2px;">训练 ' + daily.days + '天 · 战力 ' + daily.power + ' · ' + (daily.specialty || '综合训练') + '</div>';
  html += '</div></div>';
  if (dailyDone) {
    html += '<div class="dc-done">✅ 今日已完成挑战！明天再来~</div>';
  } else if (!userHatched) {
    html += '<div class="dc-done" style="color:#F59E0B;">🥚 你的精灵还没孵化呢！先训练3天再来~</div>';
  } else {
    html += '<div style="margin-top:10px;display:flex;gap:8px;">';
    html += '<button class="dc-btn" onclick="petChallengeDaily()" style="flex:1;">⚔️ 挑战</button>';
    html += '<button class="dc-btn" onclick="showTrainerProfile(\'' + daily.id + '\')" style="flex:1;background:rgba(255,255,255,0.15);">📋 档案</button>';
    html += '</div>';
  }
  html += '</div>';

  // === 排行榜 ===
  html += '<div class="card"><div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">';
  html += '<span>🏆 训练者排行榜</span>';
  html += '<button onclick="shareMyRank()" style="font-size:11px;padding:5px 14px;border-radius:12px;background:linear-gradient(90deg,#FF6B35,#FF3E7F);color:#fff;border:none;font-weight:600;cursor:pointer;">📤 分享我的战绩</button>';
  html += '</div>';
  html += '<div class="rank-list">';
  for (var i = 0; i < board.length; i++) {
    var r = board[i];
    var isMe = r.isUser;
    html += '<div class="rank-row' + (isMe ? ' is-me' : '') + '">';
    html += '<div class="rank-num">' + (i + 1) + '</div>';
    html += '<div class="rank-pet">' + r.stageEmoji + '</div>';
    html += '<div class="rank-info">';
    html += '<div class="rank-name">' + (isMe ? '⭐ ' : '') + r.name + '</div>';
    html += '<div class="rank-detail">' + r.speciesName + ' · ' + r.stageName + ' · ' + r.days + '天训练</div>';
    html += '</div>';
    html += '<div class="rank-score"><div class="rs-val">' + r.power + '</div><div class="rs-unit">战力</div></div>';
    html += '</div>';
  }
  html += '</div></div>';

  // === 训练者广场 ===
  html += '<div class="card"><div class="card-title">👥 训练者广场 <span style="font-size:11px;font-weight:400;color:var(--text3);">（点击查看档案）</span></div>';
  html += '<div class="trainer-grid">';
  for (var t = 0; t < trainers.length; t++) {
    var tr = trainers[t];
    html += '<div class="trainer-card" onclick="showTrainerProfile(\'' + tr.id + '\')">';
    html += '<span class="tc-pet">' + tr.stageEmoji + '</span>';
    html += '<div class="tc-name">' + tr.name + '</div>';
    html += '<div style="font-size:10px;opacity:0.5;margin-bottom:2px;font-style:italic;">「' + (tr.catchphrase || '') + '」</div>';
    html += '<div class="tc-info">' + tr.speciesName + ' · ' + tr.stageName + '</div>';
    html += '<div class="tc-info">' + tr.days + '天 · 战力' + tr.power + '</div>';
    html += '<div class="tc-info">' + tr.wins + '胜/' + tr.losses + '负</div>';
    html += '<span class="tc-challenge" onclick="event.stopPropagation();petChallengeTrainer(\'' + tr.id + '\')">⚔️ 切磋</span>';
    html += '</div>';
  }
  html += '</div></div>';

  // === 加入训练群 ===
  html += '<div class="join-group-card" onclick="showGroupQR()">';
  html += '<div class="jgc-icon">🤝</div>';
  html += '<div class="jgc-body">';
  html += '<div class="jgc-title">加入 FitBuddy 训练营</div>';
  html += '<div class="jgc-desc">扫码加微信，拉你进群一起打卡、互相监督</div>';
  html += '</div>';
  html += '<div class="jgc-arrow">›</div>';
  html += '</div>';

  container.innerHTML = html;
}

function getQRCodeFallback() {
  return '<div style="text-align:center;padding:24px 12px;"><div style="font-size:40px;margin-bottom:8px;">📷</div><div style="font-size:12px;color:#999;line-height:1.6;">二维码加载失败<br>请先搜索微信号添加<br><strong style="color:#FF6B35;font-size:15px;display:inline-block;margin-top:6px;">wxid_hjlzzrtdbfsy12</strong></div></div>';
}

// ============ 加微信拉群弹窗 ============
// 微信群二维码7天过期，改用个人微信二维码（不过期）+ 手动拉群
function showGroupQR() {
  var overlay = document.createElement('div');
  overlay.id = 'groupQROverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9998;display:flex;align-items:center;justify-content:center;animation:petEvo 0.3s ease-out;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  var html = '<div style="background:var(--card);border-radius:20px;max-width:340px;width:90%;text-align:center;overflow:hidden;">';
  html += '<div style="padding:24px 24px 16px;">';
  html += '<div style="font-size:28px;margin-bottom:8px;">🤝</div>';
  html += '<div style="font-size:18px;font-weight:900;color:var(--text);margin-bottom:4px;">FitBuddy 训练营</div>';
  html += '<div style="font-size:13px;color:var(--text2);">扫码加微信，拉你进训练群</div>';
  html += '</div>';

  // 个人微信二维码 — 填满整个框，加载失败显示 fallback
  html += '<div style="width:100%;height:280px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;">';
  html += '<img src="exercise-images/wechat-qr.png" alt="微信二维码" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'; this.parentElement.innerHTML = getQRCodeFallback();" />';
  html += '</div>';

  html += '<div style="padding:0 20px 20px;">';
  html += '<div style="font-size:11px;color:var(--text3);margin:14px 0;line-height:1.6;">';
  html += '· 加微信后拉你进训练群<br>';
  html += '· 每天打卡互相监督<br>';
  html += '· 新功能内测优先体验';
  html += '</div>';
  html += '<button onclick="copyGroupWechat()" style="width:100%;padding:12px;border-radius:12px;background:linear-gradient(90deg,#FF6B35,#FF3E7F);color:#fff;font-size:15px;font-weight:700;border:none;cursor:pointer;margin-bottom:8px;">📋 复制微信号</button>';
  html += '<button onclick="document.getElementById(\'groupQROverlay\').remove();" style="width:100%;padding:10px;border-radius:12px;background:var(--bg);color:var(--text3);font-size:14px;border:none;cursor:pointer;">以后再说</button>';
  html += '</div>';

  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

// 复制微信号
function copyGroupWechat() {
  var wechatId = 'wxid_hjlzzrtdbfsy12';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(wechatId).then(function() {
      showToast('微信号已复制：' + wechatId);
    });
  } else {
    var textarea = document.createElement('textarea');
    textarea.value = wechatId;
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); showToast('微信号已复制：' + wechatId); } catch(e) {}
    document.body.removeChild(textarea);
  }
}

// ============ 训练者档案弹窗 ============
function showTrainerProfile(trainerId) {
  var trainers = getTrainers();
  var trainer = null;
  for (var i = 0; i < trainers.length; i++) {
    if (trainers[i].id === trainerId) { trainer = trainers[i]; break; }
  }
  if (!trainer) return;

  var spu = PET_SPECIES[trainer.speciesId];
  var elChart = TYPE_CHART[trainer.element];

  var overlay = document.createElement('div');
  overlay.id = 'trainerProfileOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9998;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  var styleEmojis = { '硬汉':'🦾','元气少女':'✨','憨厚猛男':'🦍','高冷优雅':'🐱','热血中二':'⚡','女强人':'💪','自由散漫':'🌬️','专注执着':'🎯','禅意疗愈':'🧘','狂妄霸气':'👹','武士道':'🥋','神秘文艺':'🌙','学院派':'🔬','极端自律':'⏰','飒爽自信':'💃','卷王学霸':'📚','专注冷峻':'⚡','阳光温暖':'☀️','街头酷炫':'🏗️','搞笑担当':'🤣' };
  var styleEmoji = styleEmojis[trainer.style] || '💪';

  var tipsHtml = '';
  if (trainer.tips) {
    tipsHtml = '<div style="margin-top:10px;">';
    trainer.tips.forEach(function(tip){
      tipsHtml += '<div style="font-size:12px;color:var(--text2);padding:6px 0;border-bottom:1px solid var(--border);">💡 ' + tip + '</div>';
    });
    tipsHtml += '</div>';
  }

  var html = '<div style="background:var(--card);border-radius:20px;padding:20px;max-width:380px;width:92%;max-height:85vh;overflow-y:auto;animation:petEvo 0.3s ease-out;">';

  // 头部
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:72px;">' + trainer.stageEmoji + '</div>';
  html += '<div style="font-size:24px;font-weight:900;color:var(--text);">' + trainer.name + '</div>';
  html += '<div style="font-size:13px;color:var(--text3);margin-top:4px;">' + styleEmoji + ' ' + (trainer.style || '') + ' · ' + (trainer.specialty || '综合训练') + '</div>';
  html += '<div style="font-size:14px;color:var(--primary);margin-top:6px;font-style:italic;">「' + (trainer.catchphrase || '') + '」</div>';
  html += '</div>';

  // 精灵信息
  html += '<div style="background:var(--bg);border-radius:14px;padding:12px 16px;margin:14px 0;">';
  html += '<div style="display:flex;justify-content:space-around;text-align:center;">';
  html += '<div><div style="font-size:22px;font-weight:900;color:' + (elChart?elChart.color:'#FF6B35') + ';">' + (spu?spu.name:'') + '</div><div style="font-size:10px;color:var(--text3);">精灵</div></div>';
  html += '<div><div style="font-size:22px;font-weight:900;">' + trainer.stageName + '</div><div style="font-size:10px;color:var(--text3);">阶段</div></div>';
  html += '<div><div style="font-size:22px;font-weight:900;">' + trainer.days + '</div><div style="font-size:10px;color:var(--text3);">训练天</div></div>';
  html += '</div>';
  html += '<div style="display:flex;justify-content:space-around;text-align:center;margin-top:8px;">';
  html += '<div><div style="font-size:20px;font-weight:900;color:#FF6B35;">' + trainer.power + '</div><div style="font-size:10px;color:var(--text3);">战力</div></div>';
  html += '<div><div style="font-size:20px;font-weight:900;color:#3B82F6;">' + trainer.wins + '</div><div style="font-size:10px;color:var(--text3);">胜利</div></div>';
  html += '<div><div style="font-size:20px;font-weight:900;color:#EF4444;">' + trainer.losses + '</div><div style="font-size:10px;color:var(--text3);">失败</div></div>';
  html += '</div>';
  html += '</div>';

  // 训练建议
  if (tipsHtml) {
    html += '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;">💬 ' + trainer.name.slice(0, trainer.name.indexOf(' ')>0?trainer.name.indexOf(' '):4) + '的训练建议</div>';
    html += tipsHtml;
  }

  // 操作按钮
  html += '<div style="display:flex;gap:10px;margin-top:16px;">';
  html += '<button onclick="document.getElementById(\'trainerProfileOverlay\').remove();petChallengeTrainer(\'' + trainer.id + '\')" style="flex:1;padding:12px;border-radius:14px;background:linear-gradient(90deg,#FF6B35,#FF3E7F);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;">⚔️ 切磋</button>';
  html += '<button onclick="document.getElementById(\'trainerProfileOverlay\').remove()" style="flex:1;padding:12px;border-radius:14px;background:rgba(255,255,255,0.1);color:var(--text);border:1px solid var(--border);font-size:14px;font-weight:600;cursor:pointer;">关闭</button>';
  html += '</div>';

  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

// ============ 分享我的排名 ============
function shareMyRank() {
  var user = getUserRankData();
  var board = getLeaderboard();
  var myRank = 0;
  for (var i = 0; i < board.length; i++) {
    if (board[i].isUser) { myRank = i + 1; break; }
  }

  var shareText = '🏆 FitBuddy 训练者排行榜\n\n' +
    '🔥 我的排名：第 ' + myRank + ' 名\n' +
    '🐾 精灵：' + user.speciesName + ' · ' + user.stageName + '\n' +
    '⚔️ 战力：' + user.power + '\n' +
    '📅 训练：' + user.days + '天\n' +
    '🏅 战绩：' + user.wins + '胜/' + user.losses + '负\n\n' +
    '快来 FitBuddy 和我一起训练吧！💪\n' +
    '免费健身计划生成器，打开浏览器就能用~';

  // 尝试分享
  if (navigator.share) {
    navigator.share({
      title: 'FitBuddy 我的训练排名',
      text: shareText
    }).catch(function(){
      copyRankText(shareText);
    });
  } else {
    copyRankText(shareText);
  }
}

function copyRankText(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);

    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10002;background:#22C55E;color:#fff;padding:14px 28px;border-radius:16px;font-size:15px;font-weight:700;text-align:center;';
    toast.textContent = '✅ 已复制战绩！\n可以发给好友炫耀了~';
    document.body.appendChild(toast);
    setTimeout(function(){ toast.remove(); }, 2500);
  } catch(e) {
    alert('分享文案：\n\n' + text);
  }
}

// ============ 挑战 AI 训练者 ============
function petChallengeTrainer(trainerId, isDaily) {
  isDaily = isDaily || false;
  var trainers = getTrainers();
  var enemy = null;
  for (var i = 0; i < trainers.length; i++) {
    if (trainers[i].id === trainerId) { enemy = trainers[i]; break; }
  }
  if (!enemy) return;

  var info = petGetSpecies();
  var myId = info.speciesId;
  var mySp = PET_SPECIES[myId];
  var myDays = petGetDays(myId);
  var myStage = mySp.stages.findIndex(function(s, i) {
    return i < mySp.stages.length - 1 ? myDays < mySp.stages[i+1].need : true;
  });
  if (myStage < 0) myStage = 0;

  // 蛋不能出战
  if (myStage < 1) {
    alert('你的精灵还没孵化呢！先训练3天再来切磋吧~');
    return;
  }

  var myStageMult = [0.4, 1.0, 1.8, 3.0, 5.0][myStage];
  var myAtk = Math.floor((8 + myDays * 4) * myStageMult);
  var myHp = Math.floor((25 + myDays * 6) * (1 + myStage * 0.5));
  var myStageData = mySp.stages[myStage];
  var myEl = TYPE_CHART[mySp.element];
  var enEl = TYPE_CHART[enemy.element];

  // 元素克制
  var adv = 1.0;
  if (enEl.strong === mySp.element) adv = 0.6;
  else if (enEl.weak === mySp.element) adv = 1.4;
  var advNote = adv > 1 ? '(克制对方！)' : adv < 1 ? '(被对方克制…)' : '';

  // 创建对战弹窗
  var overlay = document.createElement('div');
  overlay.id = 'communityBattleOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9998;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  var html = '<div style="background:var(--card);border-radius:20px;padding:20px;max-width:360px;width:90%;text-align:center;animation:petEvo 0.3s ease-out;">';
  html += '<div style="font-size:20px;font-weight:900;color:var(--text);margin-bottom:2px;">⚔️ 训练者对战</div>';
  html += '<div style="font-size:12px;color:var(--text3);margin-bottom:4px;">你挑战了 ' + enemy.name + '！</div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">火🔥→草🌿→雷⚡→冰❄️→火🔥</div>';

  // 对战双方
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0;">';
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:44px;">' + myStageData.emoji + '</div>';
  html += '<div style="font-size:11px;font-weight:700;">我</div>';
  html += '<div style="font-size:10px;color:var(--text3);">' + myEl.emoji + ' 战力' + myAtk + '</div>';
  html += '<div style="font-size:10px;color:var(--text3);">HP ' + myHp + '</div>';
  html += '</div>';
  html += '<div style="font-size:28px;color:var(--text3);">⚡VS⚡</div>';
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:44px;">' + enemy.stageEmoji + '</div>';
  html += '<div style="font-size:11px;font-weight:700;">' + enemy.name + '</div>';
  html += '<div style="font-size:10px;color:var(--text3);">' + enEl.emoji + ' 战力' + enemy.power + '</div>';
  html += '<div style="font-size:10px;color:var(--text3);">HP ' + enemy.hp + '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div id="communityBattleLog" style="background:var(--bg);border-radius:12px;padding:10px;margin:8px 0;min-height:36px;font-size:12px;color:var(--text2);text-align:center;line-height:1.6;"></div>';
  html += '<div id="communityBattleResult" style="display:none;font-size:18px;font-weight:900;margin:8px 0;"></div>';
  html += '<button id="communityBattleCloseBtn" style="display:none;margin-top:6px;padding:10px 28px;border-radius:16px;background:var(--primary);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;" onclick="document.getElementById(\'communityBattleOverlay\').remove()">👌 知道了</button>';
  html += '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  // 确保震动动画
  if (!document.getElementById('communityBattleShake')) {
    var s = document.createElement('style');
    s.id = 'communityBattleShake';
    s.textContent = '@keyframes cbShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}.cb-shake{animation:cbShake 0.3s ease-in-out;}';
    document.head.appendChild(s);
  }

  // 战斗逻辑
  var logEl = document.getElementById('communityBattleLog');
  var resultEl = document.getElementById('communityBattleResult');
  var closeBtn = document.getElementById('communityBattleCloseBtn');
  var myHP = myHp, enHP = enemy.hp;
  var log = [];

  function doRound(n) {
    if (n > 3 || myHP <= 0 || enHP <= 0) {
      finishBattle();
      return;
    }
    var myDmg = Math.floor((myAtk + Math.floor(Math.random() * 9) - 4) * adv);
    var enDmg = Math.floor((enemy.power + Math.floor(Math.random() * 9) - 4) / adv);
    if (myDmg < 1) myDmg = 1;
    if (enDmg < 1) enDmg = 1;
    enHP -= myDmg; myHP -= enDmg;
    log.push('第' + n + '回合：你对' + enemy.name + '造成 ' + myDmg + ' 点伤害，受到 ' + enDmg + ' 点伤害');
    logEl.innerHTML = log.join('<br>');

    // 震动动画
    var cards = overlay.querySelectorAll('div[style]');
    overlay.querySelectorAll('.cb-shake').forEach(function(c){ c.classList.remove('cb-shake'); });
    var petDivs = overlay.querySelectorAll('div[style*="font-size:44px"]');
    if (petDivs.length >= 2) { petDivs[0].classList.add('cb-shake'); petDivs[1].classList.add('cb-shake'); }

    setTimeout(function(){ doRound(n + 1); }, 900);
  }

  function finishBattle() {
    var myWin = enHP <= 0 && myHP > 0;
    var draw = (myHP <= 0 && enHP <= 0) || (!myWin && enHP <= 0 && myHP <= 0);
    if (myHP <= 0 && enHP > 0) myWin = false;

    resultEl.style.display = 'block';
    if (myWin) {
      resultEl.innerHTML = '🎉 你打败了 ' + enemy.name + '！';
      resultEl.style.color = '#22C55E';
      saveBattleRecord(true, enemy);
    } else if (draw) {
      resultEl.innerHTML = '🤝 平局！都是高手！';
      resultEl.style.color = '#F59E0B';
      saveBattleRecord('draw', enemy);
    } else {
      resultEl.innerHTML = '💔 你输给了 ' + enemy.name + '…继续训练吧！';
      resultEl.style.color = '#EF4444';
      saveBattleRecord(false, enemy);
    }
    closeBtn.style.display = 'inline-block';
    if (isDaily) markDailyDone();
    // 刷新社区页面
    setTimeout(function(){ renderCommunity(); }, 500);
  }

  doRound(1);
}

// 保存对战记录
function saveBattleRecord(myWin, enemy) {
  var records = JSON.parse(localStorage.getItem('fitbuddy_battle_records') || '[]');
  records.push({
    date: new Date().toISOString().slice(0, 10),
    result: myWin === true ? 'win' : myWin === 'draw' ? 'draw' : 'lose',
    enemyName: enemy.name,
    enemyPet: enemy.speciesName,
    enemyPower: enemy.power,
    isTrainer: true
  });
  if (records.length > 20) records = records.slice(-20);
  localStorage.setItem('fitbuddy_battle_records', JSON.stringify(records));

  // 也更新排行榜中该训练者的战绩
  var trainers = getTrainers();
  for (var i = 0; i < trainers.length; i++) {
    if (trainers[i].id === enemy.id) {
      if (myWin === true || myWin === 'win') trainers[i].losses++;
      else if (!myWin || myWin === false) trainers[i].wins++;
      break;
    }
  }
  localStorage.setItem('fitbuddy_trainers', JSON.stringify(trainers));
}

// 每日挑战
function petChallengeDaily() {
  var daily = getDailyTrainer();
  petChallengeTrainer(daily.id, true);
}

// 会话开始前刷新训练者（让每日挑战有变化）
(function initCommunity() {
  // 每天重新生成一次训练者列表
  var lastGen = localStorage.getItem('fitbuddy_trainers_date');
  var today = new Date().toISOString().slice(0, 10);
  if (lastGen !== today) {
    generateTrainers();
    localStorage.setItem('fitbuddy_trainers_date', today);
  }
})();

// ============ 野外精灵探索与捕捉系统 ============

// 探索冷却时间（分钟）
var EXPLORE_COOLDOWN = 15;

// 野生精灵遭遇概率配置
var WILD_ENCOUNTER = {
  chance: 0.72, // 72% 遭遇率
  species: [ // 遭遇池，权重决定出现频率（可训练5种 + 野外专属3种）
    { id: 'fireDragon', weight: 24 },
    { id: 'frostWolf', weight: 22 },
    { id: 'thunderTiger', weight: 16 },
    { id: 'jadeDeer', weight: 12 },
    { id: 'phantomUnicorn', weight: 6 },
    { id: 'abyssalJellyfish', weight: 8, wildOnly: true },   // 🌊 野外专属
    { id: 'rockTurtle', weight: 6, wildOnly: true },         // ⛰️ 野外专属
    { id: 'shadowBat', weight: 6, wildOnly: true }           // 🦇 野外专属
  ],
  // 阶段分布：阶段1最常见
  stageWeights: [0, 75, 18, 5, 2], // 蛋/阶段1/2/3/4
  // 捕捉基础成功率（按稀有度）
  catchBase: { common: 55, rare: 40, epic: 30, hidden: 18 },
  // 剩余HP加成（每剩余1%HP +0.3%成功率，最高+15%）
  hpBonus: 0.3,
  hpBonusMax: 15
};

// 检查探索冷却
function exploreCooldownLeft() {
  var last = localStorage.getItem('fitbuddy_explore_time');
  if (!last) return 0;
  var elapsed = (Date.now() - parseInt(last)) / 60000; // 分钟
  return Math.max(0, EXPLORE_COOLDOWN - elapsed);
}

function exploreSetCooldown() {
  localStorage.setItem('fitbuddy_explore_time', Date.now().toString());
}

// 生成一只野生精灵
function generateWildSpirit() {
  // 按权重选择物种
  var pool = [];
  for (var i = 0; i < WILD_ENCOUNTER.species.length; i++) {
    var s = WILD_ENCOUNTER.species[i];
    for (var w = 0; w < s.weight; w++) pool.push(s.id);
  }
  var speciesId = pool[Math.floor(Math.random() * pool.length)];
  var sp = PET_SPECIES[speciesId];

  // 按分布决定阶段（跳过蛋阶段）
  var stagePool = [];
  for (var st = 1; st < WILD_ENCOUNTER.stageWeights.length; st++) {
    for (var sw = 0; sw < WILD_ENCOUNTER.stageWeights[st]; sw++) stagePool.push(st);
  }
  var stage = stagePool[Math.floor(Math.random() * stagePool.length)];
  var stageData = sp.stages[stage];

  // 计算战力
  var stageMult = [0.4, 1.0, 1.8, 3.0, 5.0][stage];
  var virtualDays = sp.stages[stage].need + Math.floor(Math.random() * 10);
  var power = Math.round((8 + virtualDays * 4) * stageMult);
  var hp = Math.round((25 + virtualDays * 6) * (1 + stage * 0.5));

  // 计算捕捉难度
  var rarityKey = 'common';
  if (sp.rarity === '稀有') rarityKey = 'rare';
  else if (sp.rarity === '史诗') rarityKey = 'epic';
  else if (sp.rarity === '隐藏') rarityKey = 'hidden';
  var catchRate = WILD_ENCOUNTER.catchBase[rarityKey];

  return {
    id: 'wild_' + Date.now(),
    speciesId: speciesId,
    speciesName: sp.name,
    speciesEmoji: sp.speciesEmoji,
    element: sp.element,
    rarity: sp.rarity,
    rarityKey: rarityKey,
    stage: stage,
    stageEmoji: stageData.emoji,
    stageName: stageData.name,
    power: power,
    hp: hp,
    maxHp: hp,
    catchRate: catchRate,
    theme: sp.theme
  };
}

// 当前遭遇的野生精灵（临时）
var _currentWildSpirit = null;

// ============ 探索触发 ============
function triggerWildExplore() {
  // 检查精灵是否孵化
  var info = petGetSpecies();
  var userDays = petGetDays(info.speciesId);
  if (userDays < 3) {
    alert('你的精灵还没孵化呢！先训练3天再来探索吧~');
    return;
  }

  // 检查冷却
  var cd = exploreCooldownLeft();
  if (cd > 0) {
    var mins = Math.ceil(cd);
    alert('探索需要休息！' + mins + ' 分钟后再来吧 🌿');
    return;
  }

  // 震动动画
  var exploreBtn = document.getElementById('wildExploreCard');
  if (exploreBtn) {
    exploreBtn.classList.add('wild-exploring');
    setTimeout(function(){ exploreBtn.classList.remove('wild-exploring'); }, 600);
  }

  // 设置冷却
  exploreSetCooldown();

  // 滚动骰子动画（1.5秒后出结果）
  setTimeout(function() {
    var roll = Math.random();
    if (roll < WILD_ENCOUNTER.chance) {
      // 遭遇野生精灵！
      var wild = generateWildSpirit();
      _currentWildSpirit = wild;
      showWildEncounter(wild);
    } else {
      // 什么都没发现
      showExploreNothing();
    }
  }, 1500);
}

// 显示"什么都没发现"
function showExploreNothing() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  overlay.innerHTML = '<div style="background:#1A1A2E;border-radius:20px;padding:30px 20px;max-width:320px;width:90%;text-align:center;animation:petEvo 0.3s ease-out;">' +
    '<div style="font-size:60px;margin-bottom:10px;">🌿</div>' +
    '<div style="font-size:18px;font-weight:900;color:#6EE7B7;margin-bottom:6px;">什么都没发现…</div>' +
    '<div style="font-size:13px;color:#94A3B8;margin-bottom:16px;">这片草丛很安静，再试试别的方向吧！</div>' +
    '<button onclick="this.parentElement.parentElement.remove();renderCommunity();" style="padding:10px 28px;border-radius:16px;background:linear-gradient(90deg,#059669,#10B981);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;">👌 好的</button>' +
    '</div>';

  document.body.appendChild(overlay);
}

// 显示野生精灵遭遇弹窗
function showWildEncounter(wild) {
  var overlay = document.createElement('div');
  overlay.id = 'wildEncounterOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  var rarityColors = { '普通': '#6B7280', '稀有': '#3B82F6', '史诗': '#8B5CF6', '隐藏': '#F472B6' };
  var elEmoji = TYPE_CHART[wild.element] ? TYPE_CHART[wild.element].emoji : '❓';

  overlay.innerHTML = '<div class="wild-encounter-card">' +
    '<div class="wec-rarity" style="background:' + (rarityColors[wild.rarity] || '#6B7280') + '33;color:' + (rarityColors[wild.rarity] || '#fff') + ';">' + wild.rarity + '</div>' +
    '<span class="wec-emoji">' + wild.stageEmoji + '</span>' +
    '<div class="wec-name">野生 ' + wild.speciesName + '</div>' +
    '<div class="wec-info">' + wild.stageName + ' · ' + elEmoji + ' ' + wild.element + '</div>' +
    '<div class="wec-stats">' +
      '<div>⚔️ 战力 <b>' + wild.power + '</b></div>' +
      '<div>❤️ HP <b>' + wild.hp + '</b></div>' +
      '<div>🎯 捕获率 <b>' + wild.catchRate + '%</b></div>' +
    '</div>' +
    '<div class="wec-actions">' +
      '<button class="wec-btn wec-fight" onclick="petBattleWild()">⚔️ 战斗捕捉</button>' +
      '<button class="wec-btn wec-flee" onclick="wildFlee()">🏃 逃跑</button>' +
    '</div>' +
    '</div>';

  document.body.appendChild(overlay);
}

// 逃跑
function wildFlee() {
  var overlay = document.getElementById('wildEncounterOverlay');
  if (overlay) overlay.remove();
  _currentWildSpirit = null;
  renderCommunity();
}

// ============ 与野生精灵战斗 ============
function petBattleWild() {
  var wild = _currentWildSpirit;
  if (!wild) return;

  var overlay = document.getElementById('wildEncounterOverlay');
  if (overlay) overlay.remove();

  var info = petGetSpecies();
  var myId = info.speciesId;
  var mySp = PET_SPECIES[myId];
  var myDays = petGetDays(myId);
  var myStage = mySp.stages.findIndex(function(s, i) {
    return i < mySp.stages.length - 1 ? myDays < mySp.stages[i+1].need : true;
  });
  if (myStage < 0) myStage = 0;
  var myStageMult = [0.4, 1.0, 1.8, 3.0, 5.0][myStage];
  var myAtk = Math.floor((8 + myDays * 4) * myStageMult);
  var myHp = Math.floor((25 + myDays * 6) * (1 + myStage * 0.5));
  var myStageData = mySp.stages[myStage];

  // 元素克制
  var adv = 1.0;
  var enEl = TYPE_CHART[wild.element];
  if (enEl.strong === mySp.element) adv = 0.6;
  else if (enEl.weak === mySp.element) adv = 1.4;
  var advNote = adv > 1 ? '(克制对方！)' : adv < 1 ? '(被对方克制…)' : '';
  var myEl = TYPE_CHART[mySp.element];

  // 创建对战弹窗
  var battleOverlay = document.createElement('div');
  battleOverlay.id = 'wildBattleOverlay';
  battleOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;';
  battleOverlay.addEventListener('click', function(ev){ if(ev.target===battleOverlay) battleOverlay.remove(); });

  var html = '<div style="background:linear-gradient(135deg,#1A1A2E,#16213E,#0F3460);border:3px solid #6EE7B7;border-radius:20px;padding:20px;max-width:360px;width:90%;text-align:center;color:#fff;animation:petEvo 0.3s ease-out;">';
  html += '<div style="font-size:11px;opacity:0.7;letter-spacing:1px;margin-bottom:4px;">🌿 遭遇了野生精灵！</div>';
  html += '<div style="font-size:20px;font-weight:900;margin-bottom:2px;">⚡ ' + mySp.name + ' VS 野生' + wild.speciesName + '</div>';
  html += '<div style="font-size:11px;opacity:0.7;margin-bottom:6px;">火🔥→草🌿→雷⚡→冰❄️→火🔥 ' + advNote + '</div>';

  // 对战双方
  html += '<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0;">';
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:44px;">' + myStageData.emoji + '</div>';
  html += '<div style="font-size:11px;font-weight:700;">我</div>';
  html += '<div style="font-size:10px;opacity:0.7;">' + myEl.emoji + ' 战力' + myAtk + '</div>';
  html += '<div style="font-size:10px;opacity:0.7;">HP ' + myHp + '</div>';
  html += '</div>';
  html += '<div style="font-size:24px;opacity:0.6;">⚡VS⚡</div>';
  html += '<div style="text-align:center;">';
  html += '<div style="font-size:44px;">' + wild.stageEmoji + '</div>';
  html += '<div style="font-size:11px;font-weight:700;">野生' + wild.speciesName + '</div>';
  html += '<div style="font-size:10px;opacity:0.7;">' + enEl.emoji + ' 战力' + wild.power + '</div>';
  html += '<div style="font-size:10px;opacity:0.7;">HP ' + wild.hp + '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div id="wildBattleLog" style="background:rgba(255,255,255,0.08);border-radius:12px;padding:10px;margin:8px 0;min-height:36px;font-size:12px;opacity:0.85;text-align:center;line-height:1.6;"></div>';
  html += '<div id="wildBattleResult" style="display:none;font-size:18px;font-weight:900;margin:8px 0;"></div>';
  html += '<div id="wildBattleActions" style="display:none;margin-top:10px;"></div>';
  html += '</div>';

  battleOverlay.innerHTML = html;
  document.body.appendChild(battleOverlay);

  // 战斗逻辑
  var logEl = document.getElementById('wildBattleLog');
  var resultEl = document.getElementById('wildBattleResult');
  var actionsEl = document.getElementById('wildBattleActions');
  var myHP = myHp, enHP = wild.hp;
  var log = [];

  function doRound(n) {
    if (n > 3 || myHP <= 0 || enHP <= 0) {
      finishWildBattle();
      return;
    }
    var myDmg = Math.floor((myAtk + Math.floor(Math.random() * 9) - 4) * adv);
    var enDmg = Math.floor((wild.power + Math.floor(Math.random() * 9) - 4) / adv);
    if (myDmg < 1) myDmg = 1;
    if (enDmg < 1) enDmg = 1;
    enHP -= myDmg; myHP -= enDmg;
    log.push('第' + n + '回合：你对野生' + wild.speciesName + '造成 ' + myDmg + ' 伤，受到 ' + enDmg + ' 伤');
    logEl.innerHTML = log.join('<br>');

    // 震动动画
    var petDivs = battleOverlay.querySelectorAll('div[style*="font-size:44px"]');
    petDivs.forEach(function(d){ d.classList.add('cb-shake'); });
    setTimeout(function(){ petDivs.forEach(function(d){ d.classList.remove('cb-shake'); }); }, 300);

    setTimeout(function(){ doRound(n + 1); }, 900);
  }

  function finishWildBattle() {
    var myWin = enHP <= 0 && myHP > 0;
    var draw = (myHP <= 0 && enHP <= 0) || (!myWin && enHP <= 0 && myHP <= 0);
    if (myHP <= 0 && enHP > 0) myWin = false;

    // 更新野生精灵剩余HP
    wild.hp = Math.max(0, enHP);

    resultEl.style.display = 'block';
    actionsEl.style.display = 'block';

    if (myWin) {
      resultEl.innerHTML = '🎉 你打败了野生' + wild.speciesName + '！';
      resultEl.style.color = '#22C55E';
      actionsEl.innerHTML = '<button onclick="attemptCatchWild()" style="padding:12px 32px;border-radius:20px;background:linear-gradient(90deg,#F59E0B,#F97316);color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;margin:4px;">🎯 捕捉它！</button>' +
        '<button onclick="wildBattleClose()" style="padding:10px 24px;border-radius:20px;background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.3);font-size:13px;font-weight:700;cursor:pointer;margin:4px;">😢 放生</button>';
    } else if (draw) {
      resultEl.innerHTML = '🤝 平局！野生精灵趁机逃走了…';
      resultEl.style.color = '#F59E0B';
      actionsEl.innerHTML = '<button onclick="wildBattleClose()" style="padding:10px 28px;border-radius:16px;background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.3);font-size:14px;font-weight:700;cursor:pointer;">👌 知道了</button>';
    } else {
      resultEl.innerHTML = '💔 你被野生' + wild.speciesName + '打败了…';
      resultEl.style.color = '#EF4444';
      actionsEl.innerHTML = '<button onclick="wildBattleClose()" style="padding:10px 28px;border-radius:16px;background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.3);font-size:14px;font-weight:700;cursor:pointer;">😢 继续训练</button>';
    }
  }

  doRound(1);
}

// 关闭战斗弹窗
function wildBattleClose() {
  var overlay = document.getElementById('wildBattleOverlay');
  if (overlay) overlay.remove();
  _currentWildSpirit = null;
  renderCommunity();
}

// ============ 捕捉精灵 ============
function attemptCatchWild() {
  var wild = _currentWildSpirit;
  if (!wild) return;

  // 隐藏结果区，显示捕捉动画
  var resultEl = document.getElementById('wildBattleResult');
  var actionsEl = document.getElementById('wildBattleActions');
  var logEl = document.getElementById('wildBattleLog');
  if (resultEl) resultEl.style.display = 'none';
  if (actionsEl) actionsEl.style.display = 'none';

  // 计算实际捕捉率
  var hpRatio = wild.hp / wild.maxHp;
  var hpBonus = Math.min(Math.round(hpRatio * WILD_ENCOUNTER.hpBonus * 100), WILD_ENCOUNTER.hpBonusMax);
  var finalCatchRate = Math.min(wild.catchRate + hpBonus, 75); // 上限75%

  if (logEl) {
    logEl.innerHTML = '<div style="font-size:28px;margin:8px 0;">🏐</div>' +
      '<div style="font-size:13px;opacity:0.8;">正在尝试捕捉…捕捉率 <b>' + finalCatchRate + '%</b></div>';
  }

  var catchBall = document.createElement('div');
  catchBall.className = 'catch-ball';
  catchBall.textContent = '🏐';
  catchBall.style.cssText = 'font-size:54px;display:block;margin:8px auto;transition:all 0.3s;';
  if (logEl) {
    logEl.appendChild(catchBall);
  }

  // 震动3次动画
  var shakeCount = 0;
  function doShake() {
    shakeCount++;
    catchBall.classList.remove('catch-shaking');
    void catchBall.offsetWidth;
    catchBall.classList.add('catch-shaking');
  }

  // 第1次震动
  setTimeout(function(){ doShake(); }, 400);
  // 第2次震动
  setTimeout(function(){ doShake(); }, 1300);
  // 第3次震动
  setTimeout(function(){ doShake(); }, 2200);

  // 结果判定（3秒后）
  setTimeout(function() {
    var caught = Math.random() * 100 < finalCatchRate;
    var resultEl = document.getElementById('wildBattleResult');
    var actionsEl = document.getElementById('wildBattleActions');
    if (resultEl) resultEl.style.display = 'block';
    if (actionsEl) actionsEl.style.display = 'block';

    if (caught) {
      catchBall.classList.add('catch-success');
      catchBall.textContent = '✅';
      if (resultEl) {
        resultEl.innerHTML = '🎉 捕捉成功！野生' + wild.speciesName + ' 加入你的收藏！';
        resultEl.style.color = '#22C55E';
      }
      // 存入收藏库
      saveToCollection(wild);
    } else {
      catchBall.classList.add('catch-escaped');
      if (resultEl) {
        resultEl.innerHTML = '💨 捕捉失败！野生' + wild.speciesName + ' 逃走了…';
        resultEl.style.color = '#EF4444';
      }
    }

    if (actionsEl) {
      if (caught) {
        actionsEl.innerHTML = '<button onclick="shareCatchResult()" style="padding:10px 24px;border-radius:16px;background:linear-gradient(90deg,#EC4899,#DB2777);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;margin:4px;">📤 分享</button>' +
          '<button onclick="wildBattleClose()" style="padding:10px 24px;border-radius:16px;background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.3);font-size:14px;font-weight:700;cursor:pointer;margin:4px;">👌 知道了</button>';
      } else {
        actionsEl.innerHTML = '<button onclick="wildBattleClose()" style="padding:10px 28px;border-radius:16px;background:rgba(255,255,255,0.15);color:#fff;border:1.5px solid rgba(255,255,255,0.3);font-size:14px;font-weight:700;cursor:pointer;">👌 知道了</button>';
      }
    }
  }, 3200);
}

// ============ 分享功能 ============
function shareCatchResult() {
  var wild = _currentWildSpirit;
  if (!wild) return;

  // 先关闭战斗弹窗
  var battleOverlay = document.getElementById('wildBattleOverlay');
  if (battleOverlay) battleOverlay.remove();

  // 显示分享弹窗
  showShareCard(wild);
}

function showShareCard(wild) {
  var overlay = document.createElement('div');
  overlay.id = 'shareCardOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10001;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) { overlay.remove(); renderCommunity(); } });

  var rarityColors = { '普通': '#6B7280', '稀有': '#3B82F6', '史诗': '#8B5CF6', '隐藏': '#F472B6' };
  var elEmoji = TYPE_CHART[wild.element] ? TYPE_CHART[wild.element].emoji : '❓';
  var today = new Date().toISOString().slice(0, 10);

  // 分享文案
  var shareText = '🏋️ FitBuddy 野外探索！\n' +
    '我捕捉到了一只野生 ' + wild.speciesName + '（' + wild.stageName + '）！\n' +
    '稀有度：' + wild.rarity + '\n' +
    '战力：' + wild.power + ' ⚔️  生命：' + wild.maxHp + ' ❤️\n' +
    '元素：' + elEmoji + ' ' + wild.element + '\n' +
    '捕捉日期：' + today + '\n\n' +
    '快来 FitBuddy 训练，你的精灵也在等你！💪';

  var html = '<div style="background:linear-gradient(135deg,#1A1A2E,#16213E,#0F3460);border:2px solid #6EE7B7;border-radius:20px;padding:24px 20px;max-width:380px;width:92%;text-align:center;color:#fff;animation:petEvo 0.3s ease-out;max-height:90vh;overflow-y:auto;">';

  // 分享预览卡片
  html += '<div style="font-size:11px;opacity:0.5;letter-spacing:1px;margin-bottom:4px;">📤 分享你的战利品</div>';
  html += '<div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:20px 16px;margin:10px 0;">';
  html += '<span style="font-size:64px;display:block;animation:wildFloat 1.5s ease-in-out infinite;">' + wild.stageEmoji + '</span>';
  html += '<div style="font-size:22px;font-weight:900;margin:4px 0;">' + wild.speciesName + '</div>';
  html += '<div class="wec-rarity" style="display:inline-block;padding:3px 12px;border-radius:12px;font-size:11px;font-weight:700;background:' + (rarityColors[wild.rarity] || '#6B7280') + '33;color:' + (rarityColors[wild.rarity] || '#fff') + ';">' + wild.rarity + '</div>';
  html += '<div style="font-size:13px;opacity:0.8;margin-top:6px;">' + wild.stageName + ' · ' + elEmoji + ' ' + wild.element + '</div>';
  html += '<div style="display:flex;justify-content:center;gap:16px;margin-top:10px;font-size:12px;">';
  html += '<div>⚔️ 战力 <b>' + wild.power + '</b></div>';
  html += '<div>❤️ HP <b>' + wild.maxHp + '</b></div>';
  html += '</div>';
  html += '<div style="font-size:10px;opacity:0.5;margin-top:8px;">捕捉于 ' + today + '</div>';
  html += '</div>';

  // 分享按钮区
  html += '<div style="margin-top:14px;">';

  // Web Share API（移动端）
  html += '<button onclick="shareToSocial()" id="shareSocialBtn" style="padding:11px 24px;border-radius:16px;background:linear-gradient(90deg,#EC4899,#DB2777);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;margin:4px 6px;">📱 分享到社交平台</button>';

  // 复制文案
  html += '<button onclick="copyShareText()" style="padding:11px 24px;border-radius:16px;background:linear-gradient(90deg,#3B82F6,#2563EB);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;margin:4px 6px;">📋 复制分享文案</button>';

  // 关闭
  html += '<div style="margin-top:12px;">';
  html += '<button onclick="document.getElementById(\'shareCardOverlay\').remove();renderCommunity();" style="padding:8px 24px;border-radius:14px;background:rgba(255,255,255,0.1);color:#fff;border:1.5px solid rgba(255,255,255,0.2);font-size:13px;font-weight:600;cursor:pointer;">关闭</button>';
  html += '</div>';

  html += '</div>';
  html += '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  // 存储分享数据供后续使用
  overlay._shareData = {
    text: shareText,
    wild: wild
  };

  // 如果不支持 Web Share API，隐藏分享按钮并给提示
  if (!navigator.share) {
    setTimeout(function() {
      var btn = document.getElementById('shareSocialBtn');
      if (btn) {
        btn.textContent = '📋 复制分享文案（桌面端）';
        btn.onclick = copyShareText;
        btn.style.background = 'linear-gradient(90deg,#3B82F6,#2563EB)';
      }
    }, 100);
  }
}

// 调用系统分享（移动端：微信/小红书等）
function shareToSocial() {
  var overlay = document.getElementById('shareCardOverlay');
  if (!overlay || !overlay._shareData) return;

  var data = overlay._shareData;

  if (navigator.share) {
    navigator.share({
      title: 'FitBuddy 野外探索 - 捕捉到 ' + data.wild.speciesName + '！',
      text: data.text,
    }).catch(function(err) {
      // 用户取消或失败，静默处理
    });
  } else {
    // 不支持 Web Share API，回退到复制
    copyShareText();
  }
}

// 复制分享文案
function copyShareText() {
  var overlay = document.getElementById('shareCardOverlay');
  if (!overlay || !overlay._shareData) return;

  var text = overlay._shareData.text;

  // 使用 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showCopyToast();
    }).catch(function() {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showCopyToast();
  } catch(e) {
    alert('分享文案：\n\n' + text);
  }
  document.body.removeChild(textarea);
}

function showCopyToast() {
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10002;' +
    'background:#22C55E;color:#fff;padding:14px 28px;border-radius:16px;' +
    'font-size:15px;font-weight:700;text-align:center;box-shadow:0 8px 30px rgba(34,197,94,0.4);animation:petEvo 0.3s ease-out;';
  toast.textContent = '✅ 已复制分享文案！';
  document.body.appendChild(toast);
  setTimeout(function(){
    toast.style.animation = 'catchEscape 0.3s ease-in forwards';
    setTimeout(function(){ toast.remove(); }, 300);
  }, 2000);
}

// ============ 收藏库存储 ============
function getCollection() {
  try { return JSON.parse(localStorage.getItem('fitbuddy_pet_collection') || '[]'); } catch(e) { return []; }
}

function saveToCollection(wild) {
  var collection = getCollection();
  collection.push({
    id: 'catch_' + Date.now(),
    speciesId: wild.speciesId,
    speciesName: wild.speciesName,
    speciesEmoji: wild.speciesEmoji,
    rarity: wild.rarity,
    element: wild.element,
    stage: wild.stage,
    stageEmoji: wild.stageEmoji,
    stageName: wild.stageName,
    power: wild.power,
    hp: wild.maxHp,
    catchDate: new Date().toISOString().slice(0, 10),
    catchTime: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})
  });
  localStorage.setItem('fitbuddy_pet_collection', JSON.stringify(collection));

  // 如果是隐藏款独角兽，自动解锁
  if (wild.speciesId === 'phantomUnicorn') {
    var unlocked = JSON.parse(localStorage.getItem('fitbuddy_pet_unlocked') || '[]');
    if (unlocked.indexOf('phantomUnicorn') < 0) {
      unlocked.push('phantomUnicorn');
      localStorage.setItem('fitbuddy_pet_unlocked', JSON.stringify(unlocked));
      // 弹窗庆祝
      setTimeout(function() {
        showUnicornUnlockCelebration();
      }, 1500);
    }
  }

  // 野外捕捉稀有/史诗也自动解锁（如果还没通过训练解锁的话）
  if (wild.speciesId === 'thunderTiger' || wild.speciesId === 'jadeDeer') {
    var unlocked2 = JSON.parse(localStorage.getItem('fitbuddy_pet_unlocked') || '[]');
    if (unlocked2.indexOf(wild.speciesId) < 0) {
      unlocked2.push(wild.speciesId);
      localStorage.setItem('fitbuddy_pet_unlocked', JSON.stringify(unlocked2));
      // 弹窗庆祝
      setTimeout(function() {
        showRarityUnlockCelebration(wild.speciesId);
      }, 1500);
    }
  }

  // 成就检查
  checkCollectionAchievements(collection);
}

// 独角兽解锁庆祝
function showUnicornUnlockCelebration() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(){ overlay.remove(); });

  overlay.innerHTML = '<div style="background:linear-gradient(135deg,#FDF2F8,#FCE7F3,#FBCFE8);border-radius:24px;padding:30px 20px;max-width:340px;width:90%;text-align:center;animation:petEvo 0.5s ease-out;color:#9D174D;">' +
    '<div style="font-size:64px;margin-bottom:8px;">🦄</div>' +
    '<div style="font-size:22px;font-weight:900;margin-bottom:4px;">🌈 幻光独角兽解锁！</div>' +
    '<div style="font-size:13px;opacity:0.85;margin-bottom:16px;">在野外遇见了传说中的独角兽并成功捕捉！<br>现在你可以切换为它了！</div>' +
    '<button onclick="petSwitch(\'phantomUnicorn\');this.parentElement.parentElement.remove();" style="padding:10px 28px;border-radius:20px;background:linear-gradient(90deg,#EC4899,#DB2777);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;">🦄 切换为独角兽</button>' +
    '</div>';

  document.body.appendChild(overlay);
}

// 成就检查
function checkCollectionAchievements(collection) {
  var uniqueSpecies = {};
  for (var i = 0; i < collection.length; i++) {
    uniqueSpecies[collection[i].speciesId] = true;
  }
  var count = Object.keys(uniqueSpecies).length;

  var earned = JSON.parse(localStorage.getItem('fitbuddy_collection_achievements') || '[]');
  var newAchievements = [];

  if (count >= 1 && earned.indexOf('first_catch') < 0) {
    newAchievements.push({ id: 'first_catch', title: '🎯 初次捕获', desc: '成功捕捉第一只野生精灵！' });
  }
  if (count >= 3 && earned.indexOf('three_species') < 0) {
    newAchievements.push({ id: 'three_species', title: '📚 收藏家', desc: '收集了3种不同精灵！' });
  }
  if (count >= 5 && earned.indexOf('five_species') < 0) {
    newAchievements.push({ id: 'five_species', title: '👑 精灵大师', desc: '收集了5种不同精灵！' });
  }
  if (count >= 8 && earned.indexOf('all_species') < 0) {
    newAchievements.push({ id: 'all_species', title: '🌟 全图鉴制霸', desc: '收集了全部8种精灵（含野外专属）！' });
  }
  if (collection.length >= 10 && earned.indexOf('ten_catches') < 0) {
    newAchievements.push({ id: 'ten_catches', title: '🏆 捕猎达人', desc: '累计捕捉10只野生精灵！' });
  }

  if (newAchievements.length > 0) {
    for (var a = 0; a < newAchievements.length; a++) {
      earned.push(newAchievements[a].id);
      showAchievementToast(newAchievements[a]);
    }
    localStorage.setItem('fitbuddy_collection_achievements', JSON.stringify(earned));
  }
}

// 成就提示
function showAchievementToast(ach) {
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:10001;' +
    'background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;padding:14px 22px;border-radius:16px;' +
    'text-align:center;box-shadow:0 8px 30px rgba(124,58,237,0.4);animation:petEvo 0.4s ease-out;';
  toast.innerHTML = '<div style="font-size:15px;font-weight:900;">' + ach.title + '</div>' +
    '<div style="font-size:11px;opacity:0.85;">' + ach.desc + '</div>';
  document.body.appendChild(toast);
  setTimeout(function(){ toast.style.animation = 'catchEscape 0.4s ease-in forwards'; setTimeout(function(){ toast.remove(); }, 400); }, 3000);
}

// ============ 渲染收藏库 ============
function renderCollection() {
  var collection = getCollection();
  var html = '';

  // 统计
  var uniqueSpecies = {};
  for (var i = 0; i < collection.length; i++) {
    uniqueSpecies[collection[i].speciesId] = (uniqueSpecies[collection[i].speciesId] || 0) + 1;
  }
  var speciesCount = Object.keys(uniqueSpecies).length;

  html += '<div class="card" style="margin-bottom:14px;"><div class="card-title">📦 我的精灵收藏 <span style="font-size:11px;font-weight:400;color:var(--text3);">' +
    collection.length + '只 · ' + speciesCount + '/8种</span></div>';

  if (collection.length === 0) {
    html += '<div class="collection-empty">🌿 还没有捕捉到野生精灵<br><span style="font-size:11px;">去野外探索试试吧！</span></div>';
  } else {
    html += '<div class="collection-grid">';
    // 按捕捉时间倒序
    var sorted = collection.slice().reverse();
    for (var j = 0; j < sorted.length; j++) {
      var c = sorted[j];
      var rarityColors = { '普通': '#6B7280', '稀有': '#3B82F6', '史诗': '#8B5CF6', '隐藏': '#F472B6' };
      var isWildOnly = PET_SPECIES[c.speciesId] && PET_SPECIES[c.speciesId].wildOnly;
      html += '<div class="collection-card">';
      html += '<span class="cc-emoji">' + c.stageEmoji + '</span>';
      html += '<div class="cc-name">' + c.speciesName + '</div>';
      html += '<div class="cc-info" style="color:' + (rarityColors[c.rarity] || '#6B7280') + ';">' + c.rarity + ' · ' + c.stageName + '</div>';
      html += '<div class="cc-info">⚔️' + c.power + ' ❤️' + c.hp + '</div>';
      if (isWildOnly) {
        html += '<div style="font-size:9px;font-weight:700;color:#D97706;background:#FEF3C7;padding:1px 6px;border-radius:6px;margin-top:3px;display:inline-block;">🌿 野外专属</div>';
      }
      html += '<div class="cc-date">' + c.catchDate + ' ' + c.catchTime + '</div>';
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  return html;
}

// ============ 野外探索规则引导 ============
function showWildGuide() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10001;display:flex;align-items:center;justify-content:center;';
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

  var html = '<div style="background:linear-gradient(135deg,#1A1A2E,#16213E,#0F3460);border:2px solid #6EE7B7;border-radius:20px;padding:24px 20px;max-width:360px;width:92%;text-align:center;color:#fff;animation:petEvo 0.3s ease-out;max-height:85vh;overflow-y:auto;">';

  html += '<div style="font-size:40px;margin-bottom:6px;">🌿</div>';
  html += '<div style="font-size:20px;font-weight:900;margin-bottom:4px;">野外探索规则</div>';
  html += '<div style="font-size:11px;opacity:0.65;margin-bottom:16px;">深入密林，邂逅并捕捉野生精灵！</div>';

  // 步骤
  html += '<div style="text-align:left;line-height:1.7;">';

  html += '<div style="font-size:13px;font-weight:700;color:#6EE7B7;margin:12px 0 4px;">🔍 如何探索？</div>';
  html += '<div style="font-size:12px;opacity:0.85;">点击"野外探索"卡片即可出发。每次探索有 <b>15分钟冷却</b>，72%概率遭遇野生精灵。</div>';

  html += '<div style="font-size:13px;font-weight:700;color:#F97316;margin:12px 0 4px;">⚔️ 战斗规则</div>';
  html += '<div style="font-size:12px;opacity:0.85;">遭遇后进入3回合自动对战，元素克制关系：<br><b>🔥火→🌿草→⚡雷→❄️冰→🔥火</b><br><span style="opacity:0.7;">🌊水克火 · ⛰️岩克雷 · 🦇暗克草</span><br>胜利后才能尝试捕捉，输了精灵会逃走。</div>';

  html += '<div style="font-size:13px;font-weight:700;color:#F59E0B;margin:12px 0 4px;">🎯 捕捉概率</div>';
  html += '<div style="font-size:12px;opacity:0.85;">';
  html += '基础捕捉率因稀有度而异：<br>🟢 普通 <b>55%</b> · 🔵 稀有 <b>40%</b> · 🟣 史诗 <b>30%</b> · 🌈隐藏 <b>18%</b><br>';
  html += '对方剩余HP越多，捕捉率越高（最高+15%）。<br>';
  html += '捕捉率上限 <b>75%</b>，不存在100%必中。';
  html += '</div>';

  html += '<div style="font-size:13px;font-weight:700;color:#A855F7;margin:12px 0 4px;">📦 收藏与成就</div>';
  html += '<div style="font-size:12px;opacity:0.85;">捕捉到的精灵存入收藏库，目标集齐全部8种！<br>其中 <b>3种野外专属精灵</b>（🌊深渊水母/⛰️岩甲龟/🦇暗影蝠）仅能通过野外探索获得，不可训练。<br>达成一定数量可解锁隐藏成就~</div>';

  html += '<div style="font-size:13px;font-weight:700;color:#EC4899;margin:12px 0 4px;">🌈 隐藏彩蛋</div>';
  html += '<div style="font-size:12px;opacity:0.85;">幻光独角兽🦄 出现率仅 <b>7%</b>，极低概率在野外遇见。捕捉成功后自动解锁，可直接切换为自己精灵！</div>';

  html += '</div>';

  html += '<button onclick="this.parentElement.parentElement.remove();" style="margin-top:18px;padding:10px 32px;border-radius:18px;background:linear-gradient(90deg,#059669,#10B981);color:#fff;border:none;font-size:14px;font-weight:700;cursor:pointer;">👌 知道了！</button>';
  html += '</div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

// 首次进入社区自动弹出规则（仅一次）
function checkFirstVisitGuide() {
  if (!localStorage.getItem('fitbuddy_wild_guide_shown')) {
    localStorage.setItem('fitbuddy_wild_guide_shown', '1');
    setTimeout(function(){ showWildGuide(); }, 600);
  }
}

// ============ 更新 renderCommunity 加入探索 ============
var _originalRenderCommunity = renderCommunity;
renderCommunity = function() {
  // 先调用原始渲染
  _originalRenderCommunity();

  var container = document.getElementById('communityContent');
  if (!container) return;

  // 在每日挑战后面插入野外探索卡片
  var dailyDiv = container.querySelector('.daily-challenge');

  // 探索卡片
  var cdLeft = exploreCooldownLeft();
  var canExplore = cdLeft <= 0;
  var cdText = canExplore ? '点击探索' : '冷却中 ' + Math.ceil(cdLeft) + ' 分钟';

  var exploreHTML = '<div class="wild-explore" id="wildExploreCard" onclick="triggerWildExplore()" style="cursor:pointer;">';
  exploreHTML += '<div style="display:flex;align-items:center;justify-content:space-between;">';
  exploreHTML += '<div class="we-title">🌿 野外探索</div>';
  exploreHTML += '<span onclick="event.stopPropagation();showWildGuide();" style="font-size:11px;background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:10px;cursor:pointer;">📖 规则</span>';
  exploreHTML += '</div>';
  exploreHTML += '<div class="we-sub">深入密林，遭遇野生精灵！8种精灵含3种野外专属 🌊⛰️🦇，捕捉入库~</div>';
  if (!canExplore) {
    exploreHTML += '<div class="we-cooldown">⏳ ' + cdText + '后可再次探索</div>';
  } else {
    exploreHTML += '<div class="we-cooldown">✨ ' + cdText + '</div>';
  }
  exploreHTML += '</div>';

  // 收藏库
  var collectionHTML = renderCollection();

  // 插入：每日挑战 → 探索 → 排行榜 → 训练者广场
  if (dailyDiv) {
    // 在每日挑战后面插入
    dailyDiv.insertAdjacentHTML('afterend', exploreHTML + collectionHTML);
  } else {
    // fallback：插入到 container 最前面
    container.insertAdjacentHTML('afterbegin', exploreHTML + collectionHTML);
  }
};

// 确保 pets.js 已加载后再初始化（defer 脚本最后执行）
window.addEventListener('load', function() {
  if (typeof updateHeaderStreak === 'function') updateHeaderStreak();
});


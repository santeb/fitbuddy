/* FitBuddy 反馈通道 + 全局错误采集 (feedback.js) v1
 *
 * 「找 Bug · 公开测试」的落地：没有后端、没有第三方表单、零成本。
 * 用户点一下 → 自动把"设备/页面/计划/最近报错"打包成一段文本 → 复制走 →
 * 粘到微信/邮件/小红书私信即可。用户不用自己描述环境，那部分我们替他写。
 *
 * 顺带做的：全局 JS 错误采集（存 localStorage，最多 10 条）。
 * 用户说"点了没反应"时，错误日志才是能真正定位的东西。
 * 控制台执行 fbDumpErrlog() 可导出全部。
 *
 * ── 上线前要改的就两行 ──
 *   DEV.mail  你的邮箱（填了才会出现"发邮件"按钮）
 *   DEV.gh    你的 GitHub 仓库地址（填了才会出现"去提 Issue"）
 */
(function () {
  'use strict';

  // ============ 配置（改这里） ============
  var DEV = {
    mail: '2528699611@qq.com',                  // 例：'fitbuddy@qq.com'
    gh: 'https://github.com/santeb/fitbuddy'    // 例：'https://github.com/santeb/fitbuddy'
  };
  // =======================================

  var ERR_KEY = 'fitbuddy_errlog';
  var ERR_MAX = 10;
  var CNT_KEY = 'fitbuddy_feedback_count';

  // ---------- 环境探测 ----------
  function inApp() {
    var ua = navigator.userAgent || '';
    if (/MicroMessenger/.test(ua)) return '微信内置';
    if (/XhsH5|xiaohongshu|XHS/i.test(ua)) return '小红书内置';
    if (/Weibo/.test(ua)) return '微博内置';
    if (/AlipayClient/.test(ua)) return '支付宝内置';
    if (/aweme|ToutiaoMicroApp|NewsArticle/i.test(ua)) return '抖音内置';
    if (/\bQQ\/|MQQBrowser/.test(ua)) return 'QQ内置';
    return '';
  }
  function osName() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Macintosh/.test(ua)) return 'macOS';
    return '未知系统';
  }
  function browserName() {
    var ua = navigator.userAgent || '';
    if (/MicroMessenger/.test(ua)) return '微信内核';
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/CriOS/.test(ua)) return 'Chrome';
    if (/FxiOS/.test(ua)) return 'Firefox';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Safari/.test(ua)) return 'Safari';
    return '系统浏览器';
  }
  function envLine() {
    var app = inApp();
    return (app ? app + ' · ' : '') + osName() + ' · ' + browserName();
  }
  function screenLine() {
    try {
      return screen.width + '×' + screen.height + ' @' + (window.devicePixelRatio || 1) + 'x';
    } catch (e) { return '未知'; }
  }
  function netLine() {
    try {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (c && c.effectiveType) return c.effectiveType.toUpperCase();
    } catch (e) {}
    return '';
  }
  function pageName() {
    var h = (location.hash || '').replace('#page-', '');
    var MAP = { plan: '计划页', lib: '动作库', prog: '进度页', supps: '补给页', donate: '发电页' };
    return MAP[h] || (h || '首页');
  }
  function ls(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsJson(key) {
    try { return JSON.parse(ls(key) || 'null'); } catch (e) { return null; }
  }
  function planLine() {
    var p = lsJson('fitbuddy_lastplan');
    if (!p || !p.goal) return '还没生成计划';
    var G = { muscle: '增肌', strength: '力量', cut: '减脂', shape: '塑形', cardio: '心肺', marathon: '马拉松' };
    var L = { beginner: '新手', intermediate: '中级', advanced: '进阶' };
    var E = { gym: '健身房', dumbbell: '哑铃', home: '居家', bodyweight: '徒手' };
    var wk = '';
    try { wk = '第' + (parseInt(ls('fitbuddy_currentweek'), 10) || 1) + '周'; } catch (e) {}
    return (G[p.goal] || p.goal) + '·' + (L[p.level] || p.level) + '·'
      + (p.days || '?') + '天/周·' + (E[p.equip] || p.equip || '?') + (wk ? '·' + wk : '');
  }
  function dataLine() {
    var h = lsJson('fitbuddy_history');
    var n = (h && h.length) || 0;
    var last = ls('fitbuddy_lastcheck') || '无';
    return '记录' + n + '条 · 上次打卡' + last;
  }
  function srcLine() {
    try { return ls('fitbuddy_utm') || ''; } catch (e) { return ''; }
  }
  function errLines() {
    var log = lsJson(ERR_KEY);
    if (!log || !log.length) return '';
    var tail = log.slice(-3).map(function (e) {
      var t = new Date(e.t);
      var hh = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
      return hh + ' ' + String(e.m).slice(0, 90);
    });
    return tail.join('\n');
  }

  // ---------- 全局错误采集 ----------
  function pushErr(m) {
    if (!m) return;
    var log = lsJson(ERR_KEY) || [];
    log.push({ t: Date.now(), m: String(m).slice(0, 300) });
    while (log.length > ERR_MAX) log.shift();
    try { localStorage.setItem(ERR_KEY, JSON.stringify(log)); } catch (e) {}
  }
  window.addEventListener('error', function (e) {
    var f = (e.filename || '').split('/').pop();
    pushErr((e.message || 'Script error') + (f ? ' @' + f + ':' + (e.lineno || 0) : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    pushErr('Promise: ' + (r && r.message ? r.message : String(r)));
  });
  window.fbDumpErrlog = function () {
    var log = lsJson(ERR_KEY) || [];
    console.log('[FitBuddy 错误日志] ' + log.length + ' 条');
    log.forEach(function (e) { console.log(new Date(e.t).toLocaleString(), e.m); });
    return log;
  };

  // ---------- 反馈包 ----------
  var TYPES = [
    { k: 'bug', t: '🐞 Bug', h: '点了没反应 / 算错了 / 白屏' },
    { k: 'idea', t: '💡 建议', h: '想要的功能 / 觉得该改的地方' },
    { k: 'other', t: '❓ 其他', h: '说不清，但觉得不对劲' }
  ];

  function buildPack(type, text, nick) {
    var t = TYPES.filter(function (x) { return x.k === type; })[0] || TYPES[0];
    var lines = [];
    lines.push('【FitBuddy 反馈】' + t.t);
    lines.push('昵称：' + (nick ? nick : '（匿名）'));
    lines.push('');
    lines.push('▸ ' + String(text).trim());
    lines.push('');
    lines.push('── 以下自动生成，别删 ──');
    lines.push('时间 ' + new Date().toLocaleString('zh-CN', { hour12: false }));
    lines.push('环境 ' + envLine());
    lines.push('屏幕 ' + screenLine());
    lines.push('页面 ' + pageName());
    lines.push('计划 ' + planLine());
    lines.push('数据 ' + dataLine());
    var net = netLine(); if (net) lines.push('网络 ' + net);
    var src = srcLine(); if (src) lines.push('来源 ' + src);
    var errs = errLines();
    if (errs) { lines.push('报错 '); lines.push(errs); }
    return lines.join('\n');
  }

  // ---------- 邮件专用（短包） ----------
  // iOS / 微信内置浏览器对 mailto 的 URL 长度有硬限制（约 2KB），超了就把整串 query
  // 当成收件人原样显示，用户看到一堆 %E4%B8... 乱码，邮件也发不出去。
  // 中文经 encodeURIComponent 一个字变 9 个字节，完整反馈包几百字必然爆。
  // 所以正文用精简版，完整包先塞剪贴板，用户想贴可以自己贴。
  var MAIL_URL_MAX = 900;
  function mailShort(type) {
    return type === 'idea' ? '建议' : (type === 'other' ? '其他' : 'Bug');
  }
  // 标签一律用短词：中文一个字编码后是 9 个字符，能省就省
  function buildMailPack(type, text) {
    var lines = [];
    lines.push('[' + mailShort(type) + ']');
    lines.push(String(text || '').trim().slice(0, 80));
    lines.push('环境: ' + envLine());
    lines.push('页面: ' + pageName() + ' ' + screenLine());
    var err = errLines();
    if (err) lines.push('报错: ' + err.split('\n')[0].slice(0, 60));
    return lines.join('\n');
  }
  // 邮件正文只放精简包（完整包走剪贴板）；万一还超长就退到只剩一句话，绝不让 URL 撑爆。
  function buildMailto(type, text) {
    var head = '[FitBuddy ' + mailShort(type) + '] ' + String(text || '').trim().slice(0, 20);
    function mk(body) {
      return 'mailto:' + DEV.mail
        + '?subject=' + encodeURIComponent(head)
        + '&body=' + encodeURIComponent(body);
    }
    var list = [
      buildMailPack(type, text),
      '[' + mailShort(type) + '] ' + String(text || '').trim().slice(0, 40)
    ];
    for (var i = 0; i < list.length; i++) {
      var u = mk(list[i]);
      if (u.length <= MAIL_URL_MAX) return u;
    }
    return mk(list[list.length - 1]);
  }

  // ---------- UI ----------
  function toast(msg) {
    try { if (typeof window.showToast === 'function') { window.showToast(msg); return; } } catch (e) {}
    try { alert(msg); } catch (e) {}
  }
  function event(name, p) {
    try { if (typeof window.track === 'function') window.track(name, p || {}); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectCss() {
    if (document.getElementById('fbFbCss')) return;
    var s = document.createElement('style');
    s.id = 'fbFbCss';
    s.textContent = ''
      // 入口卡
      + '.fb-hunt{background:var(--card);border-radius:var(--radius);padding:16px;margin-bottom:14px;'
      + 'box-shadow:var(--shadow);border:1.5px solid var(--primary);}'
      + '.fb-hunt-h{display:flex;align-items:baseline;gap:8px;font-size:15px;font-weight:800;margin-bottom:6px;}'
      + '.fb-hunt-live{font-size:9.5px;font-weight:700;color:#fff;background:var(--primary);'
      + 'border-radius:6px;padding:2px 6px;vertical-align:middle;}'
      + '.fb-hunt-sub{font-size:12.5px;color:var(--text2);line-height:1.75;margin-bottom:13px;}'
      + '.fb-hunt-sub b{color:var(--primary);}'
      + '.fb-hunt-btns{display:flex;gap:8px;}'
      + '.fb-hunt-btn{flex:1;padding:11px;border-radius:12px;font-size:13.5px;font-weight:700;'
      + 'border:1.5px solid var(--primary);background:var(--primary);color:#fff;cursor:pointer;}'
      + '.fb-hunt-btn.ghost{background:none;color:var(--primary);}'
      + '.fb-hunt-btn:active{transform:scale(.97);}'
      + '.fb-hunt-mine{font-size:11px;color:var(--text3);margin-top:9px;text-align:center;}'
      // 弹层
      + '.fb-fb-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:950;display:flex;'
      + 'align-items:flex-end;justify-content:center;animation:fadeIn .18s ease;}'
      + '.fb-fb-sheet{width:100%;max-width:430px;background:var(--card);border-radius:20px 20px 0 0;'
      + 'padding:18px 16px calc(18px + env(safe-area-inset-bottom));max-height:92vh;overflow:auto;'
      + 'box-shadow:0 -8px 40px rgba(0,0,0,.3);transform:translateY(14px);transition:transform .25s;}'
      + '.fb-fb-ov.show .fb-fb-sheet{transform:translateY(0);}'
      + '.fb-fb-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}'
      + '.fb-fb-title{font-size:16.5px;font-weight:800;}'
      + '.fb-fb-x{background:none;border:none;font-size:19px;color:var(--text3);padding:4px 6px;}'
      + '.fb-fb-chips{display:flex;gap:7px;margin-bottom:11px;}'
      + '.fb-fb-chip{flex:1;padding:8px 4px;border-radius:11px;font-size:12.5px;font-weight:600;'
      + 'text-align:center;border:1.5px solid var(--border);background:none;color:var(--text2);cursor:pointer;}'
      + '.fb-fb-chip.on{background:var(--primary);border-color:var(--primary);color:#fff;}'
      + '.fb-fb-tip{font-size:11.5px;color:var(--text3);line-height:1.6;margin:-4px 0 9px;min-height:18px;}'
      + '.fb-fb-ta{width:100%;box-sizing:border-box;height:96px;resize:none;padding:11px 12px;'
      + 'border:1.5px solid var(--border);border-radius:12px;font-size:13.5px;line-height:1.6;'
      + 'background:var(--bg);color:var(--text);outline:none;}'
      + '.fb-fb-ta:focus{border-color:var(--primary);}'
      + '.fb-fb-nick{width:100%;box-sizing:border-box;margin-top:9px;padding:10px 12px;'
      + 'border:1.5px solid var(--border);border-radius:12px;font-size:13.5px;'
      + 'background:var(--bg);color:var(--text);outline:none;}'
      + '.fb-fb-main{display:block;width:100%;margin-top:12px;padding:13px;border:none;border-radius:14px;'
      + 'font-size:15px;font-weight:700;color:#fff;cursor:pointer;'
      + 'background:linear-gradient(135deg,#FF6B35,#FF3E7F);box-shadow:0 4px 14px rgba(255,107,53,.35);}'
      + '.fb-fb-main:active{transform:scale(.98);}'
      + '.fb-fb-subs{display:flex;gap:8px;margin-top:9px;}'
      + '.fb-fb-sub{flex:1;padding:10px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;'
      + 'border:1.5px solid var(--border);background:none;color:var(--text2);text-decoration:none;'
      + 'text-align:center;display:block;}'
      + '.fb-fb-sub:active{transform:scale(.97);}'
      + '.fb-fb-note{font-size:11px;color:var(--text3);line-height:1.65;margin-top:11px;text-align:center;}';
    document.head.appendChild(s);
  }

  function renderEntry(host) {
    injectCss();
    var n = 0;
    try { n = parseInt(ls(CNT_KEY) || '0', 10) || 0; } catch (e) {}
    host.innerHTML =
      '<div class="fb-hunt">'
      + '<div class="fb-hunt-h">🐞 帮我抓个 Bug <span class="fb-hunt-live">长期有效</span></div>'
      + '<div class="fb-hunt-sub">一个人开发，看不全。你遇到任何「不对劲」—— 点不动、算错、'
      + '话看不懂、看着别扭 —— 直接告诉我。<br>被采纳就<b>上荣誉墙</b>，'
      + '并锁定<b>未来所有付费功能的终身免费</b>。</div>'
      + '<div class="fb-hunt-btns">'
      + '<button type="button" class="fb-hunt-btn" id="fbHuntBug">🐞 提 Bug</button>'
      + '<button type="button" class="fb-hunt-btn ghost" id="fbHuntIdea">💡 提建议</button>'
      + '</div>'
      + (n ? '<div class="fb-hunt-mine">你已提交 ' + n + ' 条，谢谢你 🙏</div>' : '')
      + '</div>';
    document.getElementById('fbHuntBug').addEventListener('click', function () { open('bug'); });
    document.getElementById('fbHuntIdea').addEventListener('click', function () { open('idea'); });
  }

  function open(type) {
    injectCss();
    type = type || 'bug';
    event('feedback_open', { type: type });

    var ov = document.createElement('div');
    ov.className = 'fb-fb-ov';
    ov.id = 'fbFbOv';
    var subBtns = '';
    if (DEV.mail) {
      subBtns += '<a class="fb-fb-sub" id="fbFbMail">📧 发邮件</a>';
    }
    if (DEV.gh) {
      subBtns += '<a class="fb-fb-sub" id="fbFbGh" target="_blank" rel="noopener">🐙 提 Issue</a>';
    }
    subBtns += '<button type="button" class="fb-fb-sub" id="fbFbWx">🤝 去群里说</button>';

    ov.innerHTML =
      '<div class="fb-fb-sheet" role="dialog" aria-modal="true" aria-label="提交反馈">'
      + '<div class="fb-fb-head">'
      + '<div class="fb-fb-title">' + (type === 'bug' ? '🐞 抓到一个 Bug' : '💡 有个想法') + '</div>'
      + '<button class="fb-fb-x" id="fbFbClose" aria-label="关闭">✕</button>'
      + '</div>'
      + '<div class="fb-fb-chips">' + TYPES.map(function (t) {
        return '<button type="button" class="fb-fb-chip' + (t.k === type ? ' on' : '') + '" data-k="' + t.k + '">' + esc(t.t) + '</button>';
      }).join('') + '</div>'
      + '<div class="fb-fb-tip" id="fbFbTip"></div>'
      + '<textarea class="fb-fb-ta" id="fbFbText" maxlength="500" placeholder="'
      + (type === 'bug'
        ? '我点了什么 → 我以为会怎样 → 实际发生了什么'
        : '我想要什么 / 哪里用着别扭') + '"></textarea>'
      + '<input class="fb-fb-nick" id="fbFbNick" maxlength="16" placeholder="昵称（可留空，被采纳后刻上荣誉墙）">'
      + '<button class="fb-fb-main" id="fbFbCopy">📋 复制反馈包</button>'
      + '<div class="fb-fb-subs">' + subBtns + '</div>'
      + '<div class="fb-fb-note">复制时会自动带上设备、页面和最近的报错，<br>这些不用你自己写。</div>'
      + '</div>';

    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });

    var ta = document.getElementById('fbFbText');
    var nickEl = document.getElementById('fbFbNick');
    var tipEl = document.getElementById('fbFbTip');

    function close() {
      ov.classList.remove('show');
      setTimeout(function () { ov.remove(); }, 220);
    }
    document.getElementById('fbFbClose').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

    ov.querySelectorAll('.fb-fb-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        type = c.getAttribute('data-k');
        ov.querySelectorAll('.fb-fb-chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        tipEl.textContent = (TYPES.filter(function (t) { return t.k === type; })[0] || {}).h || '';
        ta.placeholder = type === 'bug'
          ? '我点了什么 → 我以为会怎样 → 实际发生了什么'
          : '我想要什么 / 哪里用着别扭';
        document.querySelector('.fb-fb-title').textContent =
          type === 'bug' ? '🐞 抓到一个 Bug' : (type === 'idea' ? '💡 有个想法' : '❓ 说说哪里不对');
      });
    });
    tipEl.textContent = (TYPES.filter(function (t) { return t.k === type; })[0] || {}).h || '';

    function currentPack() {
      return buildPack(type, ta.value, nickEl.value);
    }

    function afterSubmit() {
      var n = 0;
      try {
        n = (parseInt(ls(CNT_KEY) || '0', 10) || 0) + 1;
        localStorage.setItem(CNT_KEY, String(n));
      } catch (e) {}
      var mine = document.querySelector('.fb-hunt-mine');
      var host = document.getElementById('fbHuntCard');
      if (mine) {
        mine.textContent = '你已提交 ' + n + ' 条，谢谢你 🙏';
      } else if (host) {
        var d = document.createElement('div');
        d.className = 'fb-hunt-mine';
        d.textContent = '你已提交 ' + n + ' 条，谢谢你 🙏';
        host.querySelector('.fb-hunt').appendChild(d);
      }
    }

    document.getElementById('fbFbCopy').addEventListener('click', function () {
      var txt = (ta.value || '').trim();
      if (!txt) { toast('先写一句发生了什么 🙂'); ta.focus(); return; }
      var pack = currentPack();
      var btn = this;
      function ok() {
        btn.textContent = '✅ 已复制，去粘给开发者';
        event('feedback_copy', { type: type });
        afterSubmit();
        toast('✅ 已复制，粘到微信/邮件发我就行');
        setTimeout(function () { btn.textContent = '📋 复制反馈包'; }, 2500);
      }
      function fallback() {
        ta.select();
        try { if (document.execCommand('copy')) { ok(); return; } } catch (e) {}
        // 兜底：把内容摊开让用户长按自己复制
        var pre = document.createElement('textarea');
        pre.value = pack;
        pre.style.cssText = 'position:fixed;left:0;top:0;opacity:0;height:1px;';
        document.body.appendChild(pre);
        pre.select();
        toast('请长按选中内容 → 复制');
        setTimeout(function () { pre.remove(); }, 8000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pack).then(ok, fallback);
      } else fallback();
    });

    var mailBtn = document.getElementById('fbFbMail');
    if (mailBtn) {
      mailBtn.addEventListener('click', function (e) {
        var txt = (ta.value || '').trim();
        if (!txt) { e.preventDefault(); toast('先写一句发生了什么 🙂'); ta.focus(); return; }
        var pack = currentPack();
        e.preventDefault();
        // 完整包先静默塞进剪贴板：邮件正文放不下它，但用户想贴就能贴
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(pack).then(null, function () {});
          }
        } catch (err0) {}
        toast('完整反馈包已复制，可在邮件正文长按粘贴');
        location.href = buildMailto(type, txt);
        event('feedback_mail', { type: type });
        afterSubmit();
      });
    }

    var ghBtn = document.getElementById('fbFbGh');
    if (ghBtn) {
      ghBtn.href = DEV.gh.replace(/\/$/, '') + '/issues/new';
      ghBtn.addEventListener('click', function () { event('feedback_gh', { type: type }); });
    }

    document.getElementById('fbFbWx').addEventListener('click', function () {
      // 群里说更自然：先复制好，进群直接粘贴
      var pack = currentPack();
      function go() {
        try { if (typeof window.showGroupQR === 'function') { window.showGroupQR(); return; } } catch (e) {}
        toast('复制好了，粘到 FitBuddy 训练群就行');
      }
      if ((ta.value || '').trim() && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pack).then(function () {
          toast('✅ 已复制，进群直接粘贴');
          go();
        }, go);
      } else {
        go();
      }
      event('feedback_wx', { type: type });
      afterSubmit();
    });

    setTimeout(function () { try { ta.focus(); } catch (e) {} }, 320);
  }

  // 调试用：控制台执行 fbBuildPack('bug','描述','昵称') 可直接看打包结果
  window.fbBuildPack = buildPack;
  window.fbMailto = buildMailto;
  window.fbOpenFeedback = open;

  // 页脚「🐞 找 Bug · 荣誉墙」入口：切到发电页并滚到活动卡
  window.goBugHunt = function () {
    var tab = document.querySelector('[data-tab=page-donate]');
    if (tab) tab.click();
    setTimeout(function () {
      var c = document.getElementById('fbHuntCard');
      if (c) { try { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
    }, 220);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      var host = document.getElementById('fbHuntCard');
      if (host) renderEntry(host);
    });
  } else {
    var h0 = document.getElementById('fbHuntCard');
    if (h0) renderEntry(h0);
  }
})();

/* FitBuddy 首访引导 (onboarding.js)
 *
 * 目的: 小红书引流来的新用户 10 秒内看懂"选3个选项→出计划"。
 * 3 步遮罩式引导, 看完/跳过后 localStorage 记录, 不再打扰。
 *
 * 触发条件: 没看过引导 且 本机没有任何已生成的计划(老用户不弹)
 * 手动再看: 控制台执行 showOnboarding()
 */
(function () {
  var KEY = 'fitbuddy_onboarded';
  var STEP = 0;

  var STEPS = [
    {
      icon: '🎯',
      title: '选一个目标',
      desc: '增肌、力量、减脂、心肺、马拉松——你想要哪个，就点哪个。',
      chips: ['💪 增肌', '🔱 力量', '🔥 减脂', '❤️ 心肺', '🏃 马拉松']
    },
    {
      icon: '⚙️',
      title: '定 3 个选项',
      desc: '你的水平、每周练几天、手边有什么器械。都是点一下的事，30 秒搞定。',
      chips: ['🌱 新手', '每周 3 天', '🏠 哑铃', '✅ 搞定']
    },
    {
      icon: '✨',
      title: '一键生成完整计划',
      desc: '动作、组数、重量、热身、饮食指南全部排好——完全免费，不用注册。',
      chips: ['📋 周计划', '🏋️ 100+动作', '🍚 饮食指南', '🎯 周期化']
    }
  ];

  function seen() {
    try { return !!localStorage.getItem(KEY); } catch (e) { return true; }
  }

  function markSeen() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  function hasPlan() {
    try { return !!localStorage.getItem('fitbuddy_lastplan'); } catch (e) { return false; }
  }

  function injectStyles() {
    if (document.getElementById('onboarding-styles')) return;
    var css = document.createElement('style');
    css.id = 'onboarding-styles';
    css.textContent =
      '.ob-overlay{position:fixed;inset:0;z-index:9999;background:rgba(10,10,20,0.72);display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;transition:opacity .3s;}' +
      '.ob-overlay.show{opacity:1;}' +
      '.ob-card{width:100%;max-width:340px;background:var(--card);border-radius:20px;padding:28px 24px 20px;box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative;transform:translateY(12px);transition:transform .3s;}' +
      '.ob-overlay.show .ob-card{transform:translateY(0);}' +
      '.ob-skip{position:absolute;top:12px;right:14px;font-size:12px;color:var(--text3);background:none;border:none;padding:6px;}' +
      '.ob-step-tag{font-size:11px;font-weight:700;color:var(--primary);letter-spacing:1px;margin-bottom:10px;}' +
      '.ob-icon{font-size:52px;line-height:1;text-align:center;margin:8px 0 14px;}' +
      '.ob-title{font-size:20px;font-weight:800;text-align:center;margin-bottom:8px;color:var(--text);}' +
      '.ob-desc{font-size:13px;color:var(--text2);text-align:center;line-height:1.7;margin-bottom:16px;}' +
      '.ob-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:20px;}' +
      '.ob-chip{font-size:12px;padding:5px 12px;border-radius:16px;background:var(--bg);color:var(--text2);border:1px solid var(--border);}' +
      '.ob-dots{display:flex;gap:6px;justify-content:center;margin-bottom:16px;}' +
      '.ob-dot{width:7px;height:7px;border-radius:50%;background:var(--border);transition:all .25s;}' +
      '.ob-dot.on{width:20px;border-radius:4px;background:linear-gradient(135deg,#FF6B35,#FF3E7F);}' +
      '.ob-btn{display:block;width:100%;padding:13px;border-radius:14px;font-size:15px;font-weight:700;color:#fff;background:linear-gradient(135deg,#FF6B35,#FF3E7F);box-shadow:0 4px 15px rgba(255,107,53,0.4);border:none;}' +
      '.ob-btn:active{transform:scale(0.97);}' +
      '.ob-prev{display:block;width:100%;margin-top:10px;padding:6px;font-size:13px;color:var(--text3);background:none;border:none;}';
    document.head.appendChild(css);
  }

  function render() {
    injectStyles();
    var ov = document.createElement('div');
    ov.className = 'ob-overlay';
    ov.id = 'obOverlay';
    ov.innerHTML =
      '<div class="ob-card" role="dialog" aria-modal="true" aria-label="新手引导">' +
      '  <button class="ob-skip" aria-label="跳过引导">跳过</button>' +
      '  <div class="ob-step-tag"></div>' +
      '  <div class="ob-icon"></div>' +
      '  <div class="ob-title"></div>' +
      '  <div class="ob-desc"></div>' +
      '  <div class="ob-chips"></div>' +
      '  <div class="ob-dots"></div>' +
      '  <button class="ob-btn"></button>' +
      '  <button class="ob-prev" style="display:none;">上一步</button>' +
      '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });
    return ov;
  }

  function paint(ov) {
    var s = STEPS[STEP];
    var last = STEP === STEPS.length - 1;
    ov.querySelector('.ob-step-tag').textContent = '第 ' + (STEP + 1) + ' 步 / 共 3 步';
    ov.querySelector('.ob-icon').textContent = s.icon;
    ov.querySelector('.ob-title').textContent = s.title;
    ov.querySelector('.ob-desc').textContent = s.desc;
    var chips = ov.querySelector('.ob-chips');
    chips.innerHTML = '';
    s.chips.forEach(function (c) {
      var el = document.createElement('span');
      el.className = 'ob-chip';
      el.textContent = c;
      chips.appendChild(el);
    });
    var dots = ov.querySelector('.ob-dots');
    dots.innerHTML = '';
    STEPS.forEach(function (_, i) {
      var d = document.createElement('span');
      d.className = 'ob-dot' + (i === STEP ? ' on' : '');
      dots.appendChild(d);
    });
    ov.querySelector('.ob-btn').textContent = last ? '🚀 开始定制我的计划' : '下一步';
    ov.querySelector('.ob-prev').style.display = STEP > 0 ? 'block' : 'none';
  }

  function close(ov, finished) {
    markSeen();
    ov.classList.remove('show');
    setTimeout(function () { ov.remove(); }, 300);
    if (typeof track === 'function') {
      try { track('onboarding_' + (finished ? 'finish' : 'skip'), { step: STEP + 1 }); } catch (e) {}
    }
    if (finished) {
      // 落地: 滚到目标选择处, 让用户直接开始第 1 步
      setTimeout(function () {
        var g = document.getElementById('goalGroup');
        if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }

  window.showOnboarding = function (force) {
    if (!force && (seen() || document.getElementById('obOverlay'))) return;
    var ov = render();
    paint(ov);
    ov.querySelector('.ob-skip').addEventListener('click', function () { close(ov, false); });
    ov.querySelector('.ob-btn').addEventListener('click', function () {
      if (STEP < STEPS.length - 1) { STEP++; paint(ov); }
      else close(ov, true);
    });
    ov.querySelector('.ob-prev').addEventListener('click', function () {
      if (STEP > 0) { STEP--; paint(ov); }
    });
  };

  // 首访且没有老计划才自动弹 (深链用户 deeplink.js 已标记 _deepLinked, 不弹)
  if (!seen() && !hasPlan()) {
    setTimeout(function () {
      // defer 脚本按文档顺序执行, deeplink.js 在 onboarding.js 之后跑,
      // 600ms 后它早已设好 _deepLinked, 此处再确认一次
      if (window._deepLinked) return;
      window.showOnboarding(true);
    }, 600);
  }
})();

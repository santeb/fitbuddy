/* FitBuddy iOS 安装引导横幅 (install-banner.js)
 *
 * 背景: iOS Safari 不支持 beforeinstallprompt(原生安装弹窗),
 *       必须用户手动: 分享按钮 → 添加到主屏幕。
 *       所以给 iOS 用户弹一条带步骤的引导横幅。
 *
 * 触发: iPhone/iPad Safari + 非独立窗口模式 + 用户已有交互 + 延迟6秒
 * 免打扰: 点「知道了」→ 30天内不再弹; 点 ✕ → 7天内不再弹
 * Android/桌面: 不弹(原生 beforeinstallprompt 已由 installBtn 覆盖)
 */
(function () {
  var KEY = 'fitbuddy_ios_banner';

  // ---- 环境检测 ----
  function isIOS() {
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      // iPadOS 13+ UA 伪装成 Mac, 用触点数区分
      return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    }
    return true;
  }
  function isStandalone() {
    return window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches;
  }
  // iOS 上的第三方浏览器(微信/Chrome iOS)无法"添加到主屏幕"为App, 只有 Safari 可以
  function isSafari() {
    var ua = navigator.userAgent;
    var isIOSWebview = /FxiOS|CriOS|EdgiOS|MetaService|MicroMessenger/.test(ua);
    return !isIOSWebview;
  }

  function getState() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function shouldShow() {
    if (!isIOS() || isStandalone() || !isSafari()) return false;
    var s = getState();
    var now = Date.now();
    if (s.clicked && now - s.clicked < 30 * 864e5) return false;  // 去装了: 30天
    if (s.dismissed && now - s.dismissed < 7 * 864e5) return false; // 关掉: 7天
    return true;
  }

  function injectStyles() {
    if (document.getElementById('ios-banner-styles')) return;
    var css = document.createElement('style');
    css.id = 'ios-banner-styles';
    css.textContent =
      '.ib-wrap{position:fixed;left:0;right:0;bottom:0;z-index:9998;padding:12px 14px calc(12px + env(safe-area-inset-bottom));pointer-events:none;}' +
      '.ib-banner{pointer-events:auto;max-width:420px;margin:0 auto;background:var(--card,#fff);border-radius:18px;box-shadow:0 -4px 40px rgba(0,0,0,0.25);border:1px solid var(--border,#eee);padding:16px 16px 14px;transform:translateY(120%);transition:transform .45s cubic-bezier(.2,.9,.3,1.2);}' +
      '.ib-banner.show{transform:translateY(0);}' +
      '.ib-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;position:relative;}' +
      '.ib-logo{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#FF6B35,#FF3E7F);display:flex;align-items:center;justify-content:center;font-size:22px;flex:none;}' +
      '.ib-title{font-size:15px;font-weight:800;color:var(--text,#222);}' +
      '.ib-sub{font-size:11.5px;color:var(--text3,#999);margin-top:2px;}' +
      '.ib-close{position:absolute;right:-4px;top:-4px;width:28px;height:28px;border:none;background:none;color:var(--text3,#999);font-size:17px;padding:0;cursor:pointer;}' +
      '.ib-steps{background:var(--bg,#f7f7f9);border-radius:12px;padding:10px 12px;margin:10px 0 12px;}' +
      '.ib-step{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--text2,#555);line-height:1.5;padding:3px 0;}' +
      '.ib-num{width:17px;height:17px;border-radius:50%;background:#FF6B35;color:#fff;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none;}' +
      '.ib-share{display:inline-flex;align-items:center;gap:3px;background:var(--card,#fff);border:1px solid var(--border,#ddd);border-radius:6px;padding:1px 7px;font-size:11.5px;font-weight:600;color:var(--text,#222);}' +
      '.ib-btn{display:block;width:100%;padding:11px;border-radius:12px;border:none;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(135deg,#FF6B35,#FF3E7F);box-shadow:0 3px 12px rgba(255,107,53,0.35);cursor:pointer;}' +
      '.ib-btn:active{transform:scale(0.98);}';
    document.head.appendChild(css);
  }

  function render() {
    injectStyles();
    var wrap = document.createElement('div');
    wrap.className = 'ib-wrap';
    wrap.id = 'iosBanner';
    wrap.innerHTML =
      '<div class="ib-banner" role="dialog" aria-label="添加到主屏幕引导">' +
      '  <div class="ib-head">' +
      '    <div class="ib-logo">🏋️</div>' +
      '    <div>' +
      '      <div class="ib-title">把 FitBuddy 装到桌面</div>' +
      '      <div class="ib-sub">像App一样全屏打开，训练打卡不迷路</div>' +
      '    </div>' +
      '    <button class="ib-close" aria-label="关闭">✕</button>' +
      '  </div>' +
      '  <div class="ib-steps">' +
      '    <div class="ib-step"><span class="ib-num">1</span><span>点 Safari 底部的 <span class="ib-share">分享 <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 0.5 L5 7 M2 3 L5 0.5 L8 3 M1 8 C1 7.2 1.6 6.5 2.5 6.5 H7.5 C8.4 6.5 9 7.2 9 8 V10.5 C9 11.3 8.4 12 7.5 12 H2.5 C1.6 12 1 11.3 1 10.5 Z" stroke="#007AFF" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg></span> 按钮</span></div>' +
      '    <div class="ib-step"><span class="ib-num">2</span><span>往下滑，选「<b>添加到主屏幕</b>」</span></div>' +
      '    <div class="ib-step"><span class="ib-num">3</span><span>桌面出现 🏋️ 图标，点开就是全屏App</span></div>' +
      '  </div>' +
      '  <button class="ib-btn">知道了，我去添加</button>' +
      '</div>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { wrap.querySelector('.ib-banner').classList.add('show'); });
    });
    return wrap;
  }

  window.showIOSBanner = function (force) {
    if (!force && (document.getElementById('iosBanner') || !shouldShow())) return;
    var w = render();
    var s = getState();
    w.querySelector('.ib-close').addEventListener('click', function () {
      s.dismissed = Date.now(); saveState(s);
      w.querySelector('.ib-banner').classList.remove('show');
      setTimeout(function () { w.remove(); }, 450);
      if (typeof track === 'function') { try { track('ios_banner_close', {}); } catch (e) {} }
    });
    w.querySelector('.ib-btn').addEventListener('click', function () {
      s.clicked = Date.now(); saveState(s);
      w.querySelector('.ib-banner').classList.remove('show');
      setTimeout(function () { w.remove(); }, 450);
      if (typeof track === 'function') { try { track('ios_banner_click', {}); } catch (e) {} }
    });
    if (typeof track === 'function') { try { track('ios_banner_show', {}); } catch (e) {} }
  };

  // 触发: iOS + 非standalone + Safari + 延迟6秒 + 用户产生过任意交互(不打断首屏)
  var _force = /[?&]ibshow=1/.test(location.search);
  if (_force) {
    // 调试模式 (?ibshow=1): 强制预览横幅, 用于桌面浏览器手动验证
    try { localStorage.setItem('fitbuddy_onboarded', '1'); } catch (e) {}
    // onboarding.js 早于本脚本执行, 600ms 后会弹遮罩, 抢先移除
    setTimeout(function () {
      var ov = document.getElementById('obOverlay');
      if (ov) ov.remove();
    }, 700);
  }
  if (_force || shouldShow()) {
    var interacted = false;
    ['touchstart', 'scroll', 'click'].forEach(function (evt) {
      window.addEventListener(evt, function once() {
        interacted = true;
        window.removeEventListener(evt, once);
      }, { passive: true, once: true });
    });
    setTimeout(function () {
      // 引导遮罩在展示时延后, 避免同屏多层引导
      if (document.getElementById('obOverlay')) {
        setTimeout(function () { if (!document.getElementById('obOverlay')) window.showIOSBanner(true); }, 4000);
        return;
      }
      window.showIOSBanner(true);
    }, _force ? 800 : 6000);
  }
})();

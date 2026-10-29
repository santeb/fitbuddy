/*
 * donate.js — 为爱发电页：按用户当前所在的 App 给出最短的付款路径
 *
 * 为什么需要这个：
 *   打赏二维码的转化路径天生很长。用户在哪打开，差别巨大：
 *     - 微信里打开：长按二维码 → 识别，2 步搞定。但微信识别不了支付宝的码，
 *       所以这时候摆两个码是害人——用户会先去点支付宝那张，然后失败。
 *     - 小红书 / 微博 / QQ / 抖音内置浏览器：这些 webview 长按只能"保存图片"，
 *       不能识别二维码。路径变成：保存 → 切 App → 扫一扫 → 相册选图，4 步。
 *     - Safari / Chrome：同上，一样长。
 *   与其给所有人同一句"打开微信扫一扫"（这话在微信里是错的，在别处是废话），
 *   不如先判断环境，再告诉他眼下这一步该干什么。
 *
 * 唯一能真正缩短路径的东西：支付宝收款链接（ALIPAY_LINK）。
 * 它是 https://qr.alipay.com/xxxxx 这样的地址，手机上点一下会直接唤起支付宝付款页，
 * 小红书来的用户也能一步到位。微信没有对等的公开能力，这条路只有支付宝走得通。
 */
(function () {
  'use strict';

  // ============ 配置（改这里） ============
  // 支付宝 App → 收钱 → 收款码 → 复制链接，会拿到 https://qr.alipay.com/xxxxx
  // 填上之后，页面上会多出一个「一键打开支付宝」按钮，留空则不显示。
  var ALIPAY_LINK = '';
  // =======================================

  function env() {
    var u = '';
    try { u = navigator.userAgent || ''; } catch (e) { return 'web'; }
    if (/MicroMessenger/i.test(u)) return 'wx';
    if (/AlipayClient/i.test(u)) return 'ali';
    if (/XhsH5|xiaohongshu|XHS/i.test(u)) return 'xhs';
    if (/Weibo/i.test(u)) return 'weibo';
    if (/QQ\//i.test(u)) return 'qq';
    if (/Douyin|aweme|ByteDance/i.test(u)) return 'dy';
    return 'web';
  }

  function injectStyle() {
    if (document.getElementById('fbDonateCss')) return;
    var s = document.createElement('style');
    s.id = 'fbDonateCss';
    s.textContent =
      '.donate-qr-row.single{justify-content:center;}'
      + '.donate-qr-row.single .donate-qr-card{max-width:210px;}'
      + '.fb-donate-tip{border-radius:var(--radius,14px);padding:11px 14px;margin-bottom:14px;'
      + 'font-size:12px;line-height:1.75;box-shadow:var(--shadow,0 2px 8px rgba(0,0,0,.06));}'
      + '.fb-donate-tip b{font-weight:800;}'
      + '.fb-donate-tip.easy{background:#ECFDF5;color:#065F46;}'
      + '.fb-donate-tip.hard{background:#FFFBEB;color:#78350F;}'
      + '.fb-donate-tip .fb-dt-h{font-weight:800;font-size:12.5px;margin-bottom:3px;display:flex;align-items:center;gap:5px;}'
      + '.fb-donate-tip ol{margin:5px 0 0;padding-left:17px;}'
      + '.fb-donate-tip li{margin:1px 0;}'
      + '.fb-ali-btn{display:block;width:100%;margin-top:9px;padding:9px 0;border:none;border-radius:10px;'
      + 'background:#1677FF;color:#fff;font-size:13px;font-weight:700;cursor:pointer;}'
      + '.fb-ali-btn:active{opacity:.85;}';
    document.head.appendChild(s);
  }

  function build(e) {
    var wxCard = document.getElementById('donateCardWx');
    var aliCard = document.getElementById('donateCardAli');
    var row = document.querySelector('.donate-qr-row');
    if (!wxCard || !aliCard || !row) return;

    var tipHtml = '';
    var tipCls = 'easy';

    if (e === 'wx') {
      // 微信里：只留微信码。摆着支付宝码只会让人点错，然后识别失败。
      aliCard.style.display = 'none';
      row.classList.add('single');
      wxCard.querySelector('.qr-hint').textContent = '长按下面的二维码';
      tipHtml = '<div class="fb-dt-h">✅ 你现在就在微信里，最快</div>'
        + '<b>长按</b>上面的二维码 → 点「识别图中二维码」，直接就能付。不用截图，也不用切 App。';
      tipCls = 'easy';
    } else if (e === 'ali') {
      wxCard.style.display = 'none';
      row.classList.add('single');
      aliCard.querySelector('.qr-hint').textContent = '长按下面的二维码';
      tipHtml = '<div class="fb-dt-h">✅ 你现在就在支付宝里，最快</div>'
        + '<b>长按</b>上面的二维码 → 识别，直接就能付。';
      tipCls = 'easy';
    } else {
      var appName = { xhs: '小红书', weibo: '微博', qq: 'QQ', dy: '抖音' }[e];
      var lead = appName ? '你现在是在' + appName + '里打开的' : '你是在手机浏览器里打开的';
      tipHtml = '<div class="fb-dt-h">📋 这里没法直接扫码，得存到相册</div>'
        + lead + '，长按二维码只能保存图片，识别不了。步骤是：'
        + '<ol>'
        + '<li>长按二维码 → 保存到相册</li>'
        + '<li>打开微信（或支付宝）→ 扫一扫</li>'
        + '<li>点右上角相册 → 选刚存的那张</li>'
        + '</ol>'
        + '<div style="margin-top:5px;opacity:.85;">麻烦是麻烦，愿意走这三步的，是真爱。</div>';
      tipCls = 'hard';
    }

    // 支付宝一键链接：唯一能跳过扫码的路径，只有支付宝有这个能力
    if (ALIPAY_LINK && e !== 'ali') {
      tipHtml += '<button type="button" class="fb-ali-btn" id="fbAliJump">💙 一键打开支付宝付款</button>'
        + '<div style="margin-top:5px;opacity:.8;font-size:11px;">不用扫码，点了会直接跳到支付宝。</div>';
    }

    var tip = document.createElement('div');
    tip.className = 'fb-donate-tip ' + tipCls;
    tip.innerHTML = tipHtml;
    // 插在二维码行之前：先看怎么做，再看码
    row.parentNode.insertBefore(tip, row);

    var jump = document.getElementById('fbAliJump');
    if (jump) {
      jump.addEventListener('click', function () {
        try { window.open(ALIPAY_LINK, '_blank'); } catch (err) { location.href = ALIPAY_LINK; }
      });
    }

    // 原来那个 requestFullscreen 的点击是无效的：全屏之后照样扫不了。去掉。
    wxCard.removeAttribute('onclick');
    aliCard.removeAttribute('onclick');
  }

  function init() {
    injectStyle();
    try { build(env()); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

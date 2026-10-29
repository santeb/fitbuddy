/* FitBuddy 荣誉墙 (contributors.js) v1
 *
 * 「找 Bug · 公开测试」活动的展示组件。挂在打赏页(发电)。
 *
 * ── 日常维护：只改下面两个数组，其它一律不用动 ──
 *   CONTRIBUTORS  被采纳的人，一人一条：
 *     { name:'阿强', tag:'🐞', note:'发现减载后重量建议掉到减载重量', ver:'v130', at:'2026-11-02' }
 *   ACCEPTED      已采纳并修好的问题（这是活动的"闭环证据"，比名单更重要）：
 *     { what:'点「跳周」页面没反应', by:'阿强', ver:'v130', at:'2026-11-02' }
 *
 * ⚠️ 刻意不接 GitHub 头像：githubusercontent.com 在国内大量地区加载失败，
 *    破图比没头像更劝退。要放图就自己传到 exercise-images/ 再填 img 字段。
 */
(function () {
  'use strict';

  // ================= 名单区（改这里） =================
  var CONTRIBUTORS = [
    // { name:'', tag:'🐞', note:'', ver:'', at:'' }
  ];

  var ACCEPTED = [
    // { what:'', by:'', ver:'', at:'' }
  ];
  // ===================================================

  var MIN_SEATS = 3;   // 墙上最少摆几个座位，空着的用「虚位以待」占位
  var TAGS = { bug: '🐞', idea: '💡', ux: '🎨', data: '📊' };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectCss() {
    if (document.getElementById('fbWallCss')) return;
    var s = document.createElement('style');
    s.id = 'fbWallCss';
    s.textContent = ''
      + '.fb-wall{border-radius:var(--radius);padding:16px;margin-bottom:14px;'
      + 'background:linear-gradient(150deg,#1E1B4B 0%,#312E81 55%,#4C1D95 100%);'
      + 'color:#fff;box-shadow:0 8px 26px rgba(76,29,149,0.28);}'
      + '.fb-wall-h{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:800;margin-bottom:4px;}'
      + '.fb-wall-sub{font-size:12px;line-height:1.7;opacity:.82;margin-bottom:13px;}'
      + '.fb-wall-sub b{color:#FDE047;}'
      + '.fb-seats{display:flex;flex-direction:column;gap:7px;margin-bottom:14px;}'
      + '.fb-seat{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:12px;'
      + 'background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.13);}'
      + '.fb-seat.empty{background:rgba(255,255,255,0.045);border-style:dashed;border-color:rgba(255,255,255,0.18);opacity:.62;}'
      + '.fb-seat-av{width:30px;height:30px;border-radius:50%;flex:none;display:flex;align-items:center;'
      + 'justify-content:center;font-size:15px;background:rgba(255,255,255,0.16);overflow:hidden;}'
      + '.fb-seat-av img{width:100%;height:100%;object-fit:cover;}'
      + '.fb-seat-main{min-width:0;flex:1;}'
      + '.fb-seat-name{font-size:13px;font-weight:700;display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;}'
      + '.fb-seat-ver{font-size:10px;font-weight:600;color:#FDE047;opacity:.9;}'
      + '.fb-seat-note{font-size:11px;opacity:.72;line-height:1.5;margin-top:2px;}'
      + '.fb-seat-me{font-size:10px;opacity:.55;flex:none;}'
      + '.fb-acc{border-top:1px dashed rgba(255,255,255,0.2);padding-top:11px;}'
      + '.fb-acc-t{font-size:11px;font-weight:700;letter-spacing:.5px;opacity:.7;margin-bottom:7px;}'
      + '.fb-acc-row{display:flex;align-items:baseline;gap:7px;font-size:11.5px;line-height:1.6;padding:3px 0;opacity:.92;}'
      + '.fb-acc-fix{color:#86EFAC;font-size:10px;font-weight:700;flex:none;}'
      + '.fb-acc-what{flex:1;min-width:0;}'
      + '.fb-acc-by{opacity:.6;flex:none;font-size:10.5px;}'
      + '.fb-acc-none{font-size:11.5px;opacity:.6;line-height:1.6;}'
      + '.fb-oath{margin-top:12px;padding-top:11px;border-top:1px dashed rgba(255,255,255,0.2);'
      + 'font-size:11.5px;line-height:1.75;opacity:.88;}'
      + '.fb-oath-t{font-size:11px;font-weight:800;color:#FDE047;letter-spacing:.5px;margin-bottom:5px;}';
    document.head.appendChild(s);
  }

  function seatHtml(c, i) {
    if (!c) {
      return '<div class="fb-seat empty">'
        + '<div class="fb-seat-av">💺</div>'
        + '<div class="fb-seat-main"><div class="fb-seat-name" style="opacity:.7;">虚位以待</div>'
        + '<div class="fb-seat-note">提个有效 Bug / 建议，这个位置就是你的</div></div>'
        + '<div class="fb-seat-me">#' + (i + 1) + '</div></div>';
    }
    var av = c.img
      ? '<img src="' + esc(c.img) + '" alt="' + esc(c.name) + '" loading="lazy">'
      : esc(c.tag || TAGS.bug);
    return '<div class="fb-seat">'
      + '<div class="fb-seat-av">' + av + '</div>'
      + '<div class="fb-seat-main">'
      + '<div class="fb-seat-name">' + esc(c.name)
      + (c.ver ? '<span class="fb-seat-ver">' + esc(c.ver) + '</span>' : '')
      + '</div>'
      + (c.note ? '<div class="fb-seat-note">' + esc(c.note) + '</div>' : '')
      + '</div>'
      + '<div class="fb-seat-me">#' + (i + 1) + '</div></div>';
  }

  function acceptedHtml() {
    if (!ACCEPTED.length) {
      return '<div class="fb-acc-none">还没有修好的记录 —— 报告得越具体，修得越快。<br>'
        + '直接说「点了什么 → 期望什么 → 实际发生什么」就够了。</div>';
    }
    return ACCEPTED.slice(0, 6).map(function (a) {
      return '<div class="fb-acc-row">'
        + '<span class="fb-acc-fix">' + esc(a.ver || '已修') + '</span>'
        + '<span class="fb-acc-what">' + esc(a.what) + '</span>'
        + (a.by ? '<span class="fb-acc-by">@' + esc(a.by) + '</span>' : '')
        + '</div>';
    }).join('');
  }

  function render(host) {
    injectCss();
    var seats = CONTRIBUTORS.slice(0);
    while (seats.length < MIN_SEATS) seats.push(null);

    var count = CONTRIBUTORS.length;
    var sub = count
      ? '已有 <b>' + count + '</b> 位猎人的名字被刻在这里。'
      : 'FitBuddy 是个人独立开发，<b>没有预算发红包</b>。';

    host.innerHTML =
      '<div class="fb-wall">'
      + '<div class="fb-wall-h">🏆 荣誉墙 <span style="font-size:11px;font-weight:600;opacity:.7;">找 Bug · 公开测试</span></div>'
      + '<div class="fb-wall-sub">' + sub
      + '你提的 Bug 或建议被采纳，名字就<b>永久</b>挂在这面墙上。</div>'
      + '<div class="fb-seats">' + seats.map(seatHtml).join('') + '</div>'
      + '<div class="fb-acc">'
      + '<div class="fb-acc-t">✅ 已采纳并修好</div>'
      + acceptedHtml()
      + '</div>'
      + '<div class="fb-oath">'
      + '<div class="fb-oath-t">🎁 终身特权承诺</div>'
      + '未来 FitBuddy 出任何付费功能（云同步 / Pro 模板 / 高级工具），'
      + '墙上这些名字<b>一律永久免费</b>，不设期限、不设条件。<br>'
      + '写在页面上，就是钉在页面上。'
      + '</div>'
      + '</div>';
  }

  window.fbRenderWall = function () {
    var host = document.getElementById('fbWallCard');
    if (host) render(host);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.fbRenderWall);
  } else {
    window.fbRenderWall();
  }
})();

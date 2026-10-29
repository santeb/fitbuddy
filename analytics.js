/* FitBuddy 统计埋点模块 (analytics.js) —— 51LA v6
 *
 * 为什么用 51LA 而不是 GA4:
 *   用户主要在国内(小红书引流), googletagmanager.com 国内无法访问,
 *   GA4 既收不到用户数据、后台也打不开。51LA 国内直连, 免备案, 免费。
 *
 * 启用方式(二选一):
 *   1. 把下方 LA_ID 常量填上站点ID(推荐, 提交后线上生效)
 *   2. 浏览器控制台: localStorage.setItem('fitbuddy_laid', 'ID') 后刷新(本地测试用)
 *
 * 站点ID获取: 51.la 控制台 → 添加站点(域名填线上网址) → 复制ID
 * 未配置时本模块零开销, 不加载任何外部脚本。
 *
 * 事件: page_view / generate_plan / week_advance / calc_1rm / timer_start
 *       数据状态(2026-10-29 新增): data_empty / snap_recoverable —— 见文件末尾
 * 接口: track(event, params) —— 与旧 GA4 版完全兼容, 业务代码无需改动
 */
(function () {
  var LA_ID = '3R6heDwfTUvB37ND'; // 51LA 上报ID (官方代码里的 id/ck, 不是应用列表的"统计ID")
  try { LA_ID = LA_ID || localStorage.getItem('fitbuddy_laid') || ''; } catch (e) {}

  window._laReady = window._laReady || false;
  window._laPending = window._laPending || [];

  if (!LA_ID) return; // 未配置: 零开销

  // index.html 里已有静态 <script id="LA_COLLECT"> (51LA 后台靠它检测代码, 初始化也在那边)
  if (document.getElementById('LA_COLLECT')) return;

  // 兜底: 页面没有静态标签时才动态加载 (正常线上不会走到这里)
  var s = document.createElement('script');
  s.charset = 'UTF-8';
  s.id = 'LA_COLLECT';
  s.src = '//sdk.51.la/js-sdk-pro.min.js';
  s.onload = function () {
    if (!window.LA) return;
    try {
      LA.init({
        id: LA_ID,
        ck: LA_ID,
        autoTrack: true,        // 自动采基础PV/UV(漏斗第一层:来了多少人)
        hashMode: true,         // SPA 必需: 切 tab 时改 location.hash, SDK 轮询自动补 PV
        ignoreParams: ['_t']    // 忽略时间戳类噪声参数
      });
      // 初始 hash: 让首次进入就有 PV 锚
      if (!location.hash) location.hash = '#page-plan';
      window._laReady = true;
      // 补发初始化前积压的事件
      while (window._laPending && window._laPending.length) {
        var t = window._laPending.shift();
        try { LA.track(t[0], t[1] || {}); } catch (e) {}
      }
    } catch (e) {}
  };
  document.head.appendChild(s);
})();

/**
 * 全局埋点函数: 所有事件都走这里, 与业务代码解耦
 * @param {string} event  事件名: page_view / generate_plan / week_advance / calc_1rm / timer_start
 * @param {object} params 事件参数 (goal/level/days/week 等)
 */
function track(event, params) {
  try {
    // hashMode 下, 切页 = 改 hash, 由 SDK 自动补 PV; 手动 LA.track 仅用于非页面类事件
    if (event === 'page_view') {
      var p = params || {};
      var tabName = p.tab || p.page_title;
      if (tabName && tabName !== location.hash.slice(1)) {
        location.hash = '#' + tabName;
      }
      return; // 不再调 LA.track(SDK 内部会监听到 hash 变化)
    }
    if (window._laReady && window.LA && typeof LA.track === 'function') {
      LA.track(event, params || {});
    } else if (window._laReady === false) {
      // SDK 未就绪: 入队等 onload 后补发 (最多缓冲20条防膨胀)
      if (window._laPending && window._laPending.length < 20) {
        window._laPending.push([event, params]);
      }
    }
  } catch (e) { /* 埋点失败不影响主功能 */ }
}

/* =========================================================================
 * 数据状态埋点 (2026-10-29 新增) —— 用来监控"用户数据丢失"的规模
 *
 * 设计原则: **只报异常, 正常不开口**。
 *   - 省事件量(免费版 51LA 有额度);
 *   - 后台看到的数字直接就是"需要关注的人数", 不用做除法;
 *   - 分母用 51LA 自动采的 UV(自带新老访客维度), 所以不需要再报 data_ok。
 *
 *   data_empty       打开时训练数据是空的 —— 可能真丢了, 也可能是全新用户
 *                    参数 any: '1' = localStorage 还有别的 fitbuddy_ key(用过, 疑似真丢)
 *                             '0' = 一个 key 都没有(大概率全新用户, 属正常)
 *   snap_recoverable 存在比当前更全的快照 —— 其实还有救, 只是没去点救援
 *                    参数 n: 有几个 key 有更全的版本
 *
 * ⚠️ 必须延时执行: analytics.js 排在 persistence.js **之前**,
 *    defer 只保证顺序执行, 不保证 persistence 的 init() 与 window.name
 *    快照比对已经跑完 —— 早读了 __fbSnapLongerKeys 永远是 undefined。
 * ======================================================================= */
function fbTrackDataState() {
  try {
    var DATA_KEYS = [
      'fitbuddy_trainlog', 'fitbuddy_lastplan',
      'fitbuddy_history', 'fitbuddy_prs', 'fitbuddy_bodylog'
    ];
    var has = false, i, v;

    for (i = 0; i < DATA_KEYS.length; i++) {
      v = localStorage.getItem(DATA_KEYS[i]);
      if (v && v !== '[]' && v !== '{}') { has = true; break; }
    }

    if (!has) {
      // 一个 fitbuddy_ key 都不剩 = 全新用户; 还剩别的 key = 用过, 疑似被清过
      var any = false;
      for (i = 0; i < localStorage.length; i++) {
        if (String(localStorage.key(i)).indexOf('fitbuddy_') === 0) { any = true; break; }
      }
      track('data_empty', { any: any ? '1' : '0' });
    }

    // v155 起: persistence.init() 发现快照比当前更全时会写这个全局量
    var bigger = window.__fbSnapLongerKeys;
    if (bigger && bigger.length) track('snap_recoverable', { n: bigger.length });
  } catch (e) { /* 埋点永远不能影响主功能 */ }
}

(function () {
  // 2.5s: 等 persistence.init() 里的 IndexedDB 打开 + window.name 快照比对跑完
  function schedule() { setTimeout(fbTrackDataState, 2500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})();

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
 * 接口: track(event, params) —— 与旧 GA4 版完全兼容, 业务代码无需改动
 */
(function () {
  var LA_ID = '31594463R9hneDwffUVb'; // 51LA 站点ID (FitBuddy / santeb.github.io)
  try { LA_ID = LA_ID || localStorage.getItem('fitbuddy_laid') || ''; } catch (e) {}

  window._laReady = false;
  window._laPending = [];

  if (!LA_ID) return; // 未配置: 零开销

  // 动态加载 51LA SDK
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
        autoTrack: true,  // 自动采基础PV/UV(漏斗第一层:来了多少人)
        hashMode: false   // 本站非hash路由, tab切换由 track('page_view') 手动上报
      });
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
    if (window._laReady && window.LA) {
      LA.track(event, params || {});
    } else if (window._laReady === false) {
      // SDK 未就绪: 入队等 onload 后补发 (最多缓冲20条防膨胀)
      if (window._laPending && window._laPending.length < 20) {
        window._laPending.push([event, params]);
      }
    }
  } catch (e) { /* 埋点失败不影响主功能 */ }
}

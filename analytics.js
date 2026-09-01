/* FitBuddy GA4 埋点模块 (analytics.js)
 *
 * 启用方式（二选一）:
 *   1. 浏览器控制台执行:  localStorage.setItem('fitbuddy_gaid', 'G-XXXXXXXXXX')  然后刷新
 *   2. 或在本文件顶部把 GA_ID 默认值改成你的 Measurement ID
 * 未配置时本模块完全不加载 gtag，不影响任何功能；配置后自动生效。
 *
 * 为什么 ID 走 localStorage 而非写死在代码里:
 *   仓库是公开的, 写死 ID 会被任何人看到并刷你的 GA 配额。
 *   首次配置后 localStorage 持久保存, 普通用户无感知。
 */
(function(){
  var GA_ID = '';
  try { GA_ID = localStorage.getItem('fitbuddy_gaid') || ''; } catch(e) {}

  if (!GA_ID) {
    window._gaEnabled = false;
    return;
  }

  // 加载 gtag.js
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  window._gaEnabled = true;

  gtag('js', new Date());
  // SPA 单页应用: 关闭自动 page_view, 由 switchTab 手动上报
  gtag('config', GA_ID, { send_page_view: false });

  // 首次进入(默认计划页)上报一次
  track('page_view', { page_title: 'page-plan' });
})();

/**
 * 全局埋点函数: 所有自定义事件都走这里
 * @param {string} event  事件名, 如 generate_plan / week_advance
 * @param {object} params 事件参数 (goal/level/days 等)
 */
function track(event, params){
  try {
    if (window.gtag) gtag('event', event, params || {});
  } catch(e) { /* 埋点失败不影响主功能 */ }
}

// ============ FitBuddy 训练群入口 ============
// 从 community.js 拆出：社区大厅已移除，但「加微信训练群」是小程序外的私域引流入口，
// 唯一入口保留在这里，挂载在页面底部 footer。依赖全局 showToast（planner-core.js）。

// 二维码加载失败时的兜底（引导搜索微信号）
function getQRCodeFallback() {
  return '<div style="text-align:center;padding:24px 12px;"><div style="font-size:40px;margin-bottom:8px;">📷</div><div style="font-size:12px;color:#999;line-height:1.6;">二维码加载失败<br>请先搜索微信号添加<br><strong style="color:#FF6B35;font-size:15px;display:inline-block;margin-top:6px;">wxid_hjlzzrtdbfsy12</strong></div></div>';
}

// 加微信拉群弹窗
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

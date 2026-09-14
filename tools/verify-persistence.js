// ============ FitBuddy 持久化层 验证脚本 ============
// 复制粘贴到 Chrome DevTools Console 运行
// 期望：所有检查项都是 ✅

(function () {
  var log = function (icon, msg) { console.log('%c ' + icon + ' ' + msg, 'font-weight:bold'); };
  var ok = 0, fail = 0;
  function check(name, cond, detail) {
    if (cond) { ok++; log('✅', name + (detail ? ' — ' + detail : '')); }
    else { fail++; log('❌', name + (detail ? ' — ' + detail : '')); }
  }

  console.group('%c=== FitBuddy 持久化验证 ===', 'font-size:14px;color:#FF6B35');

  // 1. 模块是否加载
  check('persistence.js 已加载', typeof window.FB_persistence === 'object', 'window.FB_persistence = ' + typeof window.FB_persistence);
  check('版本号', window.FB_persistence && window.FB_persistence.version, window.FB_persistence && window.FB_persistence.version);

  // 2. Storage.prototype.setItem 是否被劫持
  var origProto = Storage.prototype.setItem.toString();
  check('Storage.prototype.setItem 已被包装',
    origProto.indexOf('idbSet') !== -1 || origProto.indexOf('updateWindowName') !== -1,
    '当前函数体长度: ' + origProto.length);

  // 3. 写入测试：手动调用 localStorage.setItem 应该触发 IDB 镜像
  try {
    localStorage.setItem('fitbuddy_test_key', JSON.stringify({ ts: Date.now(), v: 'hello' }));
    log('📝', '写入测试 key：fitbuddy_test_key');
  } catch (e) { check('写入测试', false, e.message); }

  // 4. window.name 是否被设置
  setTimeout(function () {
    check('window.name 已写入', typeof window.name === 'string' && window.name.indexOf('FB_SNAP:') === 0,
      'window.name 长度: ' + (window.name || '').length);
  }, 200);

  // 5. IndexedDB 中是否能看到测试数据
  setTimeout(function () {
    var req = indexedDB.open('fitbuddy_persist_db', 1);
    req.onsuccess = function (e) {
      var db = e.target.result;
      var tx = db.transaction('kv', 'readonly');
      var getReq = tx.objectStore('kv').get('fitbuddy_test_key');
      getReq.onsuccess = function () {
        check('IndexedDB 镜像成功',
          getReq.result && getReq.result.v === 'hello',
          'IDB 中存的值: ' + JSON.stringify(getReq.result));

        // 清理测试数据
        localStorage.removeItem('fitbuddy_test_key');
        console.groupEnd();
        log('📊', '验证完成：' + ok + ' 通过 / ' + fail + ' 失败');
      };
      getReq.onerror = function () {
        check('IndexedDB 读取', false, 'IDB read error');
        console.groupEnd();
      };
    };
    req.onerror = function () {
      check('IndexedDB 可用', false, '可能处于隐私模式');
      console.groupEnd();
    };
  }, 800);

  // 6. 删除测试：localStorage.removeItem 是否触发 IDB 删除
  setTimeout(function () {
    try {
      localStorage.removeItem('fitbuddy_test_key');
      log('📝', '删除测试 key');
      setTimeout(function () {
        var req = indexedDB.open('fitbuddy_persist_db', 1);
        req.onsuccess = function (e) {
          var tx = e.target.result.transaction('kv', 'readonly');
          var getReq = tx.objectStore('kv').get('fitbuddy_test_key');
          getReq.onsuccess = function () {
            check('IndexedDB 删除同步', getReq.result === undefined,
              '删除后 IDB 值: ' + JSON.stringify(getReq.result));
          };
        };
      }, 400);
    } catch (e) { check('删除测试', false, e.message); }
  }, 1400);

  // 7. 非 fitbuddy_ 前缀不镜像
  try {
    localStorage.setItem('other_app_key', 'should_not_mirror');
    setTimeout(function () {
      var req = indexedDB.open('fitbuddy_persist_db', 1);
      req.onsuccess = function (e) {
        var tx = e.target.result.transaction('kv', 'readonly');
        var getReq = tx.objectStore('kv').get('other_app_key');
        getReq.onsuccess = function () {
          check('非 fitbuddy_ key 不被镜像',
            getReq.result === undefined,
            'other_app_key 在 IDB: ' + JSON.stringify(getReq.result));
          localStorage.removeItem('other_app_key');
        };
      };
    }, 400);
  } catch (e) {}

})();
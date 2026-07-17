/**
 * Contour Shuttle — WebHID + 键盘模式检测
 */
(function () {
  'use strict';

  var CONTOUR_VENDOR_IDS = [0x0b33, 0x05f3];
  var connected = false;
  var opening = false;
  var lastError = '';
  var lastReportSig = '';

  function dispatchAdvance(detail) {
    window.dispatchEvent(new CustomEvent('shuttle-advance', { detail: detail || {} }));
  }

  function isContourDevice(device) {
    return device && CONTOUR_VENDOR_IDS.indexOf(device.vendorId) !== -1;
  }

  function reportSignature(data) {
    if (!data || !data.byteLength) return '';
    var parts = [];
    for (var i = 0; i < data.byteLength; i++) parts.push(data.getUint8(i));
    return parts.join(',');
  }

  function handleInputReport(device, data) {
    var sig = reportSignature(data);
    if (!sig || sig === lastReportSig) return;
    lastReportSig = sig;

    var allZero = !sig.split(',').some(function (b) { return b !== '0'; });
    if (allZero) return;

    dispatchAdvance({ device: device.productName, sig: sig });
    updateStatus(true, (device.productName || 'Shuttle') + ' ●');
  }

  function attachContourDevice(device) {
    if (!device || device._sysErrorShuttleAttached) return Promise.resolve(false);

    device.addEventListener('inputreport', function (event) {
      handleInputReport(device, event.data);
    });

    device.addEventListener('disconnect', function () {
      device._sysErrorShuttleAttached = false;
      connected = false;
      lastReportSig = '';
      updateStatus(false, '已断开 — 点击重连');
      reopenKnownDevices();
    });

    device._sysErrorShuttleAttached = true;

    return device.open().then(function () {
      connected = true;
      lastError = '';
      var label = device.productName || 'Contour Shuttle';
      updateStatus(true, label + ' OK');
      return true;
    }).catch(function (err) {
      device._sysErrorShuttleAttached = false;
      lastError = String(err && err.message ? err.message : err);
      console.warn('Shuttle open failed', device.productName, err);
      return false;
    });
  }

  function reopenKnownDevices() {
    if (!navigator.hid) return Promise.resolve(false);
    return navigator.hid.getDevices().then(function (devices) {
      var contour = devices.filter(isContourDevice);
      if (!contour.length) return false;
      return Promise.all(contour.map(attachContourDevice)).then(function (results) {
        return results.some(Boolean);
      });
    });
  }

  function showHelp(reason) {
    var lines = [
      '未能连接 Shuttle：' + (reason || '未知原因'),
      '',
      '【推荐】不用 WebHID，改用键盘模式：',
      '1. 打开 Contour Shuttle 驱动软件',
      '2. 把你要用的按钮映射成 Enter 或 Space',
      '3. 回到游戏页面，先点一下屏幕，再按 Shuttle',
      '',
      '若仍要用 WebHID：',
      '• 完全退出 Contour 后台（任务栏图标）',
      '• Chrome / Edge 桌面版',
      '• Connect 弹窗里选中设备并点「连接」',
    ];
    alert(lines.join('\n'));
  }

  function requestShuttleAccess() {
    if (!navigator.hid) {
      showHelp('浏览器不支持 WebHID — 请用键盘模式（映射 Enter）');
      return Promise.resolve(false);
    }
    if (opening) return Promise.resolve(false);
    opening = true;

    return navigator.hid.requestDevice({
      filters: [{ vendorId: 0x0b33 }, { vendorId: 0x05f3 }],
    }).then(function (devices) {
      if (!devices || !devices.length) {
        showHelp('未选择设备');
        return false;
      }
      return Promise.all(devices.map(attachContourDevice)).then(function (results) {
        if (results.some(Boolean)) return true;
        showHelp('设备被占用 — 请退出 Contour 驱动后重试，或改用键盘模式');
        return false;
      });
    }).catch(function (err) {
      showHelp(String(err && err.message ? err.message : err));
      return false;
    }).finally(function () {
      opening = false;
    });
  }

  function updateStatus(on, text) {
    var el = document.getElementById('shuttle-status');
    if (!el) return;
    if (on) {
      el.textContent = text || 'Shuttle connected';
      el.classList.add('on');
      el.title = 'Shuttle 已连接';
    } else {
      el.textContent = text || 'Shuttle · 键盘模式';
      el.classList.remove('on');
      el.title = '在 Contour 驱动里映射快捷键；点击可尝试 WebHID';
    }
  }

  function injectUi() {
    if (document.getElementById('shuttle-status')) return;
    var btn = document.createElement('button');
    btn.id = 'shuttle-status';
    btn.type = 'button';
    btn.textContent = 'Shuttle · 键盘模式';
    btn.title = '蓝牙/USB Shuttle：在驱动里映射快捷键即可；可选 WebHID 连接';
    btn.addEventListener('click', function () {
      requestShuttleAccess();
    });
    document.body.appendChild(btn);
  }

  function init() {
    injectUi();
    reopenKnownDevices().then(function (ok) {
      if (!ok) updateStatus(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SYS_ERROR_SHUTTLE = {
    connect: requestShuttleAccess,
    reconnect: reopenKnownDevices,
    get connected() { return connected; },
  };
})();

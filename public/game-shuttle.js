/**
 * AB Shuttle 3 · Bluetooth
 * 驱动映射键盘快捷键 → 游戏继续；可选 WebHID（USB 更稳，蓝牙请优先键盘模式）
 */
(function () {
  'use strict';

  var DEVICE = window.SYS_ERROR_SHUTTLE_DEVICE || 'AB Shuttle 3 · Bluetooth';
  var CONTOUR_VENDOR_IDS = [0x0b33, 0x05f3];
  var connected = false;
  var opening = false;
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
    dispatchAdvance({ device: DEVICE, sig: sig });
    updateStatus(true, DEVICE + ' ●');
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
      updateStatus(false);
      reopenKnownDevices();
    });

    device._sysErrorShuttleAttached = true;

    return device.open().then(function () {
      connected = true;
      updateStatus(true, DEVICE + ' · WebHID');
      return true;
    }).catch(function () {
      device._sysErrorShuttleAttached = false;
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
    alert([
      DEVICE,
      reason || '',
      '',
      '【蓝牙 · 推荐设置】',
      '1. Windows 蓝牙已配对 AB Shuttle 3',
      '2. Contour 驱动里把按钮映射为 Enter / Space / 任意单键',
      '3. 回到游戏，先点一下屏幕，再按 Shuttle',
      '4. 无需 WebHID；鼠标点击也可继续',
      '',
      'WebHID 仅作可选（蓝牙通常不可用）。',
    ].filter(Boolean).join('\n'));
  }

  function requestShuttleAccess() {
    if (!navigator.hid) {
      showHelp('浏览器不支持 WebHID。\n蓝牙 AB Shuttle 3 请用驱动键盘快捷键。');
      return Promise.resolve(false);
    }
    if (opening) return Promise.resolve(false);
    opening = true;

    return navigator.hid.requestDevice({
      filters: [{ vendorId: 0x0b33 }, { vendorId: 0x05f3 }],
    }).then(function (devices) {
      if (!devices || !devices.length) {
        showHelp('未选择设备。\n蓝牙 AB Shuttle 3 请直接用驱动快捷键，不必连接 WebHID。');
        return false;
      }
      return Promise.all(devices.map(attachContourDevice)).then(function (results) {
        if (results.some(Boolean)) return true;
        showHelp('WebHID 无法打开。\n蓝牙 AB Shuttle 3 请用驱动映射 Enter，照样可继续游戏。');
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
      el.textContent = text || DEVICE;
      el.classList.add('on');
      el.title = DEVICE + ' 已就绪';
    } else {
      el.textContent = DEVICE;
      el.classList.remove('on');
      el.title = DEVICE + ' — 在 Contour 驱动映射快捷键；点击可尝试 WebHID';
    }
  }

  function injectUi() {
    if (document.getElementById('shuttle-status')) return;
    var btn = document.createElement('button');
    btn.id = 'shuttle-status';
    btn.type = 'button';
    btn.textContent = DEVICE;
    btn.title = DEVICE + ' — Contour 驱动快捷键即可继续；点击尝试 WebHID';
    btn.addEventListener('click', function () {
      requestShuttleAccess();
    });
    document.body.appendChild(btn);
  }

  function init() {
    injectUi();
    updateStatus(false);
    reopenKnownDevices();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SYS_ERROR_SHUTTLE = {
    device: DEVICE,
    connect: requestShuttleAccess,
    reconnect: reopenKnownDevices,
    get connected() { return connected; },
  };
})();

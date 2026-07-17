/**
 * Contour Shuttle / ShuttleXpress / Shuttle Pro / Shuttle 3 (WebHID)
 * Dispatches `shuttle-advance` when any shuttle button is pressed.
 */
(function () {
  'use strict';

  var CONTOUR_VENDOR_IDS = [0x0b33, 0x05f3];
  var connected = false;
  var opening = false;

  function dispatchAdvance(detail) {
    window.dispatchEvent(new CustomEvent('shuttle-advance', { detail: detail || {} }));
  }

  function isContourDevice(device) {
    return device && CONTOUR_VENDOR_IDS.indexOf(device.vendorId) !== -1;
  }

  function attachContourDevice(device) {
    if (!device || device._sysErrorShuttleAttached) return Promise.resolve(false);
    device._sysErrorShuttleAttached = true;

    var prevButtons = 0;

    device.addEventListener('inputreport', function (event) {
      var data = event.data;
      if (!data || data.byteLength < 5) return;
      var buttons = data.getUint16(3, true);
      var newlyPressed = buttons & ~prevButtons;
      prevButtons = buttons;
      if (newlyPressed) dispatchAdvance({ device: device.productName, buttons: newlyPressed });
    });

    device.addEventListener('disconnect', function () {
      device._sysErrorShuttleAttached = false;
      connected = false;
      updateStatus(false);
      reopenKnownDevices();
    });

    return device.open().then(function () {
      connected = true;
      updateStatus(true, device.productName || 'Contour Shuttle');
      return true;
    }).catch(function (err) {
      device._sysErrorShuttleAttached = false;
      console.warn('Shuttle open failed', err);
      return false;
    });
  }

  function reopenKnownDevices() {
    if (!navigator.hid) return Promise.resolve();
    return navigator.hid.getDevices().then(function (devices) {
      var tasks = devices.filter(isContourDevice).map(attachContourDevice);
      return Promise.all(tasks);
    });
  }

  function requestShuttleAccess() {
    if (!navigator.hid) {
      alert('当前浏览器不支持 WebHID。请使用 Chrome / Edge 桌面版，并确保已插入 Shuttle。');
      return Promise.resolve(false);
    }
    if (opening) return Promise.resolve(false);
    opening = true;
    return navigator.hid.requestDevice({
      filters: CONTOUR_VENDOR_IDS.map(function (vendorId) {
        return { vendorId: vendorId };
      }),
    }).then(function (devices) {
      var tasks = devices.map(attachContourDevice);
      return Promise.all(tasks).then(function () {
        return connected;
      });
    }).catch(function (err) {
      console.warn('Shuttle permission denied', err);
      return false;
    }).finally(function () {
      opening = false;
    });
  }

  function updateStatus(on, name) {
    var el = document.getElementById('shuttle-status');
    if (!el) return;
    if (on) {
      el.textContent = 'Shuttle: ' + (name || 'connected');
      el.classList.add('on');
    } else {
      el.textContent = 'Connect Shuttle';
      el.classList.remove('on');
    }
  }

  function injectUi() {
    if (document.getElementById('shuttle-status')) return;
    var btn = document.createElement('button');
    btn.id = 'shuttle-status';
    btn.type = 'button';
    btn.textContent = 'Connect Shuttle';
    btn.title = 'Connect Contour Shuttle controller (WebHID)';
    btn.addEventListener('click', function () {
      requestShuttleAccess();
    });
    document.body.appendChild(btn);
  }

  function init() {
    injectUi();
    reopenKnownDevices().then(function () {
      if (!connected) updateStatus(false);
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
    get connected() {
      return connected;
    },
  };
})();

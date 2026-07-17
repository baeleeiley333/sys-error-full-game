/**
 * Unified "press to continue" input for SYS_ERROR full game.
 * Accepts: mouse click / touch, keyboard (Enter, Space, any key in anyKey mode),
 * and Contour Shuttle button presses (shuttle-advance event).
 */
(function () {
  'use strict';

  var armed = false;
  var handler = null;
  var options = { anyKey: false, allowClick: true, allowKeyboard: true, allowShuttle: true };

  function defaults() {
    return { anyKey: false, allowClick: true, allowKeyboard: true, allowShuttle: true };
  }

  function isTypingTarget(el) {
    if (!el || !el.closest) return false;
    return !!el.closest('input, textarea, select, [contenteditable="true"]');
  }

  function trigger(source) {
    if (!armed || !handler) return;
    var fn = handler;
    var opts = options;
    disarm();
    try {
      fn(source);
    } catch (err) {
      console.error('SYS_ERROR_ADVANCE handler failed', err);
    }
    return opts;
  }

  function arm(fn, opts) {
    disarm();
    if (typeof fn !== 'function') return;
    handler = fn;
    armed = true;
    options = Object.assign(defaults(), opts || {});
  }

  function disarm() {
    armed = false;
    handler = null;
    options = defaults();
  }

  function onPointerDown(e) {
    if (!armed || !options.allowClick) return;
    if (e.button !== 0) return;
    if (isTypingTarget(e.target)) return;
    trigger('click');
  }

  function onKeyDown(e) {
    if (!armed || !options.allowKeyboard) return;
    if (e.repeat) return;
    if (isTypingTarget(e.target)) return;
    if (options.anyKey) {
      trigger('key:' + e.key);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      trigger('key:' + e.key);
    }
  }

  function onShuttleAdvance() {
    if (!armed || !options.allowShuttle) return;
    trigger('shuttle');
  }

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('shuttle-advance', onShuttleAdvance);

  window.SYS_ERROR_ADVANCE = {
    arm: arm,
    disarm: disarm,
    trigger: trigger,
    get active() {
      return armed;
    },
  };
})();

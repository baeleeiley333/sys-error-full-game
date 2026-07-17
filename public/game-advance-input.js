/**
 * Unified "press to continue" for SYS_ERROR full game.
 *
 * Supports:
 * - Mouse / touch click
 * - ANY keyboard key or shortcut (Contour Shuttle 驱动映射的快捷键)
 * - WebHID shuttle-advance (optional; 蓝牙 Shuttle 通常用键盘模式即可)
 */
(function () {
  'use strict';

  var armed = false;
  var handler = null;
  var options = { anyKey: true, allowClick: true, allowKeyboard: true, allowShuttle: true };
  var hintEl = null;
  var lastKeyAt = 0;

  function defaults() {
    return { anyKey: true, allowClick: true, allowKeyboard: true, allowShuttle: true };
  }

  function isTypingTarget(el) {
    if (!el || !el.closest) return false;
    return !!el.closest('input, textarea, select, [contenteditable="true"]');
  }

  function isModifierOnly(key) {
    return key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta';
  }

  function keyLabel(e) {
    var parts = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    var main = (e.key && e.key !== 'Unidentified') ? e.key : (e.code || 'Key');
    if (!isModifierOnly(main)) parts.push(main);
    return parts.join('+') || main;
  }

  function flashInput(source) {
    var btn = document.getElementById('shuttle-status');
    if (btn) {
      btn.textContent = '✓ ' + source;
      btn.classList.add('on', 'flash');
      setTimeout(function () {
        btn.classList.remove('flash');
        if (window.SYS_ERROR_SHUTTLE && window.SYS_ERROR_SHUTTLE.connected) {
          btn.classList.add('on');
        } else if (!armed) {
          btn.classList.remove('on');
          btn.textContent = (window.SYS_ERROR_SHUTTLE_DEVICE || 'AB Shuttle 3 · BT');
        }
      }, 800);
    }
  }

  function showHint() {
    if (!hintEl) {
      hintEl = document.createElement('div');
      hintEl.id = 'advance-hint';
      document.body.appendChild(hintEl);
    }
    hintEl.textContent = '点击屏幕 或 按 AB Shuttle 3（蓝牙快捷键）→ 继续';
    hintEl.classList.add('show');
  }

  function hideHint() {
    if (hintEl) hintEl.classList.remove('show');
  }

  function trigger(source) {
    if (!armed || !handler) return;
    var fn = handler;
    disarm();
    flashInput(source);
    try {
      fn(source);
    } catch (err) {
      console.error('SYS_ERROR_ADVANCE handler failed', err);
    }
  }

  function arm(fn, opts) {
    disarm();
    if (typeof fn !== 'function') return;
    handler = fn;
    armed = true;
    options = Object.assign(defaults(), opts || {});
    showHint();
  }

  function disarm() {
    armed = false;
    handler = null;
    options = defaults();
    hideHint();
  }

  function onPointerDown(e) {
    if (!armed || !options.allowClick) return;
    if (e.button !== 0) return;
    if (isTypingTarget(e.target)) return;
    trigger('click');
  }

  function onKeyDown(e) {
    if (e.repeat) return;
    if (isTypingTarget(e.target)) return;
    if (isModifierOnly(e.key)) return;

    var label = keyLabel(e);
    var now = Date.now();
    if (now - lastKeyAt < 120) return;
    lastKeyAt = now;

    if (armed && options.allowKeyboard) {
      if (options.anyKey || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        trigger(label);
        return;
      }
    }

    if (!armed && label) {
      flashInput((window.SYS_ERROR_SHUTTLE_DEVICE || 'AB Shuttle 3') + ' · ' + label);
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

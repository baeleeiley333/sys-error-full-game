/**
 * SYS_ERROR full-game idle reset.
 * When a "press to continue" wait is armed, 40s without the expected
 * advance action sends the player back to Step 1 (/).
 */
(function () {
  'use strict';

  var TIMEOUT_MS = 40000;
  var STEP1_URL = '/';

  var timer = null;
  var activeLabel = null;

  function exitToStep1() {
    timer = null;
    activeLabel = null;
    window.location.href = STEP1_URL;
  }

  function arm(label) {
    if (timer) clearTimeout(timer);
    activeLabel = label || 'press-wait';
    timer = setTimeout(exitToStep1, TIMEOUT_MS);
  }

  function disarm() {
    if (timer) clearTimeout(timer);
    timer = null;
    activeLabel = null;
  }

  window.SYS_ERROR_IDLE = {
    TIMEOUT_MS: TIMEOUT_MS,
    STEP1_URL: STEP1_URL,
    arm: arm,
    disarm: disarm,
    exitToStep1: exitToStep1,
    get active() {
      return activeLabel;
    },
  };
})();

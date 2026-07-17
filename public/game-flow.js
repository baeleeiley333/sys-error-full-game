/** Full-game route map for SYS_ERROR installation */
window.SYS_ERROR_GAME = {
  routes: {
    step1: '/',
    step2: '/part3/index.html',
    step3: '/part2/index.html',
    bridge: '/bridge/index.html',
    step4: '/part4/sequence.html',
  },
  go(routeKey) {
    const url = this.routes[routeKey];
    if (url) window.location.href = url;
  },
  /** 40s press-wait timeout → back to Step 1 (see game-idle-reset.js) */
  idleResetMs: 40000,
  exitToStep1() {
    if (window.SYS_ERROR_IDLE) window.SYS_ERROR_IDLE.exitToStep1();
    else window.location.href = '/';
  },
};

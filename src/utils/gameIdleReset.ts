const TIMEOUT_MS = 40000;
const STEP1_URL = '/';

let timer: ReturnType<typeof setTimeout> | null = null;

export function armPressWait(_label?: string) {
  disarmPressWait();
  timer = setTimeout(() => {
    window.location.href = STEP1_URL;
  }, TIMEOUT_MS);
}

export function disarmPressWait() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

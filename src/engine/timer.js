export class GameTimer {
  constructor(durationMs, options = {}) {
    this.durationMs = durationMs;
    this.options = options; // { onTick, onComplete }
    
    this.startTime = null;
    this.pausedAt = null;
    this.totalPausedTime = 0;
    this.animationFrameId = null;
    this.running = false;
    
    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    this.totalPausedTime = 0;
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    this.pausedAt = performance.now();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  resume() {
    if (this.running || !this.pausedAt) return;
    this.running = true;
    this.totalPausedTime += performance.now() - this.pausedAt;
    this.pausedAt = null;
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  stop() {
    if (this.running && !this.pausedAt) {
      this.pausedAt = performance.now(); // Preserve elapsed time
    }
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  reset(durationMs) {
    this.stop();
    if (durationMs !== undefined) {
      this.durationMs = durationMs;
    }
    this.startTime = null;
    this.pausedAt = null;
    this.totalPausedTime = 0;
  }

  getElapsed() {
    if (!this.startTime) return 0;
    let now = this.running ? performance.now() : (this.pausedAt || this.startTime);
    return now - this.startTime - this.totalPausedTime;
  }

  getRemaining() {
    if (this.isPracticeMode()) return Infinity;
    return Math.max(0, this.durationMs - this.getElapsed());
  }

  isRunning() {
    return this.running;
  }

  isPracticeMode() {
    return this.durationMs === 0;
  }

  tick() {
    if (!this.running) return;
    
    const elapsed = this.getElapsed();
    const remaining = this.getRemaining();
    
    let progress = 0;
    if (!this.isPracticeMode()) {
       progress = elapsed / this.durationMs;
    }
    
    if (this.options.onTick) {
      this.options.onTick({ remaining, elapsed, progress });
    }
    
    if (!this.isPracticeMode() && remaining <= 0) {
      this.stop();
      if (this.options.onComplete) {
        this.options.onComplete();
      }
    } else {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  }
}

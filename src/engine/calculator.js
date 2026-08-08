export class StatsCalculator {
  constructor() {
    this.keystrokes = [];
    this.perSecondWPM = [];
    this.lastSecond = 0;
  }

  addKeystroke(correct, timestamp) {
    this.keystrokes.push({ correct, timestamp });
  }

  getWPM(elapsedMs) {
    if (elapsedMs === 0) return 0;
    const correctChars = this.getCharStats().correct;
    return Math.max(0, Math.round((correctChars / 5) / (elapsedMs / 60000)));
  }

  getRawWPM(elapsedMs) {
    if (elapsedMs === 0) return 0;
    return Math.max(0, Math.round((this.keystrokes.length / 5) / (elapsedMs / 60000)));
  }

  getAccuracy() {
    if (this.keystrokes.length === 0) return 100;
    const correct = this.getCharStats().correct;
    return (correct / this.keystrokes.length) * 100;
  }

  getConsistency() {
    if (this.perSecondWPM.length < 2) return 100;
    const wpms = this.perSecondWPM.map(s => s.wpm);
    const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    if (mean === 0) return 100;
    
    const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
    const stddev = Math.sqrt(variance);
    
    const consistency = 100 - ((stddev / mean) * 100);
    return Math.max(0, Math.min(100, consistency));
  }

  getPerSecondWPM() {
    return [...this.perSecondWPM];
  }
  
  updatePerSecondWPM(elapsedMs) {
      const currentSecond = Math.floor(elapsedMs / 1000);
      if (currentSecond > this.lastSecond) {
          this.perSecondWPM.push({ second: currentSecond, wpm: this.getWPM(elapsedMs) });
          this.lastSecond = currentSecond;
      }
  }

  getCharStats() {
    let correct = 0;
    let incorrect = 0;
    for (const k of this.keystrokes) {
      if (k.correct) correct++;
      else incorrect++;
    }
    return { correct, incorrect, total: this.keystrokes.length };
  }

  reset() {
    this.keystrokes = [];
    this.perSecondWPM = [];
    this.lastSecond = 0;
  }
}

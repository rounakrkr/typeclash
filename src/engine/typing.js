export class TypingEngine {
  constructor(containerEl, text, options = {}) {
    this.containerEl = containerEl;
    this.text = text;
    this.options = options;
    
    this.position = 0;
    this.correctChars = 0;
    this.incorrectChars = 0;
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.state = 'idle'; // 'idle', 'active', 'completed'
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  init() {
    this.containerEl.innerHTML = '';
    this.spans = [];

    // Build flat char spans wrapped in per-word divs
    // so words never break mid-letter across lines
    const words = this.text.split(' ');
    const wordsContainer = document.createElement('div');
    wordsContainer.className = 'text-words';

    words.forEach((word, wIdx) => {
      const wordEl = document.createElement('div');
      wordEl.className = 'word';

      // letter spans
      for (const ch of word) {
        const span = document.createElement('span');
        span.textContent = ch;
        span.className = 'char char-pending';
        wordEl.appendChild(span);
        this.spans.push(span);
      }

      // trailing space (except last word)
      if (wIdx < words.length - 1) {
        const sp = document.createElement('span');
        sp.textContent = ' ';
        sp.className = 'char char-pending char-space-char';
        wordEl.appendChild(sp);
        this.spans.push(sp);
      }

      wordsContainer.appendChild(wordEl);
    });

    this.containerEl.appendChild(wordsContainer);

    // --- Smooth GPU caret ---
    this.caretEl = document.createElement('div');
    this.caretEl.className = 'typing-caret';
    this.containerEl.appendChild(this.caretEl);

    if (this.spans.length > 0) {
      this.spans[0].classList.add('char-current');
      requestAnimationFrame(() => this.updateCaret(true));
    }

    document.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('resize', this.handleResize);
  }

  handleResize() { this.updateCaret(true); }

  start() { this.state = 'active'; }
  stop()  { this.state = 'idle'; }

  reset() {
    this.position = 0;
    this.correctChars = 0;
    this.incorrectChars = 0;
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.state = 'idle';
    this.spans.forEach((span, i) => {
      span.className = 'char char-pending';
      if (i === 0) span.classList.add('char-current');
    });
    this.containerEl.scrollTop = 0;
    this.updateCaret(true);
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
    this.containerEl.innerHTML = '';
  }

  updateCaret(instant = false) {
    if (!this.caretEl || !this.spans) return;
    const span = this.spans[this.position];
    if (!span) { this.caretEl.style.opacity = '0'; return; }
    this.caretEl.style.opacity = '1';

    const cRect = this.containerEl.getBoundingClientRect();
    const sRect = span.getBoundingClientRect();
    const x = sRect.left - cRect.left;
    const y = sRect.top  - cRect.top + this.containerEl.scrollTop;

    if (instant) {
      this.caretEl.style.transition = 'none';
      this.caretEl.style.transform  = `translate3d(${x}px,${y}px,0)`;
      requestAnimationFrame(() => {
        if (this.caretEl)
          this.caretEl.style.transition = 'transform 0.09s cubic-bezier(0.2,0,0,1)';
      });
    } else {
      this.caretEl.style.transform = `translate3d(${x}px,${y}px,0)`;
    }
  }

  handleKeyDown(e) {
    if (this.state !== 'active') return;
    if (e.key.length !== 1 && e.key !== 'Backspace') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ') e.preventDefault();

    if (this.position === 0 && !this.startTime && e.key !== 'Backspace') {
      this.startTime = performance.now();
      if (this.options.onStart) this.options.onStart();
    }

    if (e.key === 'Backspace') {
      if (this.position > 0) {
        this.spans[this.position].classList.remove('char-current');
        this.position--;
        const prev = this.spans[this.position];
        if (prev.classList.contains('char-correct'))   this.correctChars--;
        if (prev.classList.contains('char-incorrect')) this.incorrectChars--;
        prev.className = 'char char-pending char-current';
        this.updateCaret();
        this.autoScroll();
      }
      return;
    }

    if (this.position >= this.text.length) return;

    // Map nbsp back to space for comparison
    const expected = this.text[this.position];
    const typed    = e.key;
    const correct  = expected === typed;

    const cur = this.spans[this.position];
    cur.classList.remove('char-current', 'char-pending');
    cur.classList.add(correct ? 'char-correct' : 'char-incorrect');
    if (correct) this.correctChars++;
    else {
      this.incorrectChars++;
      this.errors.push({ position: this.position, expected, typed });
    }

    if (this.options.onKeystroke) {
      this.options.onKeystroke({
        char: typed, position: this.position,
        correct, timestamp: performance.now()
      });
    }

    this.position++;
    if (this.position < this.text.length) {
      this.spans[this.position].classList.add('char-current');
      this.updateCaret();
      this.autoScroll();
    } else {
      this.updateCaret();
      this.complete();
    }
  }

  autoScroll() {
    const span = this.spans[this.position];
    if (!span) return;
    const ch   = this.containerEl.clientHeight;
    const top  = span.offsetTop;
    const sc   = this.containerEl.scrollTop;
    if (top - sc > ch * 0.52) {
      this.containerEl.scrollTop = top - ch * 0.38;
      this.updateCaret(true);
    }
  }

  complete() {
    this.state   = 'completed';
    this.endTime = performance.now();
    if (this.options.onComplete) {
      this.options.onComplete({
        totalChars: this.text.length,
        correctChars: this.correctChars,
        incorrectChars: this.incorrectChars,
        errors: this.errors,
        startTime: this.startTime,
        endTime: this.endTime
      });
    }
  }

  getProgress() {
    return {
      position: this.position,
      total: this.text.length,
      percentage: this.text.length > 0 ? (this.position / this.text.length) * 100 : 0,
      correctChars: this.correctChars,
      incorrectChars: this.incorrectChars
    };
  }

  getErrors()  { return [...this.errors]; }
  getState()   { return this.state; }
  isActive()   { return this.state === 'active'; }
}

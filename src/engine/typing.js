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
    const wordsContainer = document.createElement('div');
    wordsContainer.className = 'text-words';
    
    const words = this.text.split(' ');
    this.spans = [];

    words.forEach((wordText, wIdx) => {
      const wordDiv = document.createElement('div');
      wordDiv.className = 'word';

      for (let i = 0; i < wordText.length; i++) {
        const span = document.createElement('span');
        span.textContent = wordText[i];
        span.className = 'char char-pending';
        wordDiv.appendChild(span);
        this.spans.push(span);
      }

      if (wIdx < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.textContent = ' ';
        spaceSpan.className = 'char char-pending char-space';
        wordDiv.appendChild(spaceSpan);
        this.spans.push(spaceSpan);
      }

      wordsContainer.appendChild(wordDiv);
    });
    
    this.containerEl.appendChild(wordsContainer);

    // Smooth floating caret element
    this.caretEl = document.createElement('div');
    this.caretEl.id = 'caret';
    this.caretEl.className = 'typing-caret';
    this.containerEl.appendChild(this.caretEl);

    if (this.spans.length > 0) {
      this.spans[0].classList.add('char-current');
      requestAnimationFrame(() => this.updateCaret(true));
    }
    
    document.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('resize', this.handleResize);
  }

  handleResize() {
    this.updateCaret(true);
  }

  start() {
    this.state = 'active';
  }

  stop() {
    this.state = 'idle';
  }

  reset() {
    this.position = 0;
    this.correctChars = 0;
    this.incorrectChars = 0;
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
    this.state = 'idle';
    
    this.spans.forEach((span, index) => {
      span.className = 'char char-pending';
      if (index === 0) span.classList.add('char-current');
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
    if (!this.caretEl) return;
    const currentSpan = this.spans[this.position];
    if (!currentSpan) {
      this.caretEl.style.display = 'none';
      return;
    }
    this.caretEl.style.display = 'block';

    const containerRect = this.containerEl.getBoundingClientRect();
    const spanRect = currentSpan.getBoundingClientRect();

    const x = spanRect.left - containerRect.left;
    const y = spanRect.top - containerRect.top + this.containerEl.scrollTop;

    if (instant) {
      this.caretEl.style.transition = 'none';
      this.caretEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(() => {
        if (this.caretEl) {
          this.caretEl.style.transition = 'transform 0.06s cubic-bezier(0, 0.9, 0.1, 1)';
        }
      });
    } else {
      this.caretEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  handleKeyDown(e) {
    if (this.state !== 'active') return;
    
    if (e.key.length !== 1 && e.key !== 'Backspace') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Prevent default scrolling on spacebar
    if (e.key === ' ') {
      e.preventDefault();
    }
    
    if (this.position === 0 && !this.startTime && e.key !== 'Backspace') {
      this.startTime = performance.now();
      if (this.options.onStart) this.options.onStart();
    }
    
    if (e.key === 'Backspace') {
      if (this.position > 0) {
        this.spans[this.position].classList.remove('char-current');
        this.position--;
        const prevSpan = this.spans[this.position];
        
        if (prevSpan.classList.contains('char-correct')) {
          this.correctChars--;
        } else if (prevSpan.classList.contains('char-incorrect')) {
          this.incorrectChars--;
        }
        
        prevSpan.className = 'char char-pending char-current';
        this.updateCaret();
        this.autoScroll();
      }
      return;
    }
    
    if (this.position >= this.text.length) return;
    
    const expectedChar = this.text[this.position];
    const typedChar = e.key;
    const isCorrect = expectedChar === typedChar;
    
    const currentSpan = this.spans[this.position];
    currentSpan.classList.remove('char-current', 'char-pending', 'char-speaking');
    
    if (isCorrect) {
      currentSpan.classList.add('char-correct');
      this.correctChars++;
    } else {
      currentSpan.classList.add('char-incorrect');
      this.incorrectChars++;
      this.errors.push({
        position: this.position,
        expected: expectedChar,
        typed: typedChar
      });
    }
    
    if (this.options.onKeystroke) {
      this.options.onKeystroke({
        char: typedChar,
        position: this.position,
        correct: isCorrect,
        timestamp: performance.now()
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
    const currentSpan = this.spans[this.position];
    if (!currentSpan) return;
    
    const containerHeight = this.containerEl.clientHeight;
    const spanTop = currentSpan.offsetTop;
    const scrollTop = this.containerEl.scrollTop;
    
    if (spanTop - scrollTop > containerHeight * 0.55) {
      this.containerEl.scrollTop = spanTop - (containerHeight * 0.35);
      this.updateCaret(true);
    }
  }

  complete() {
    this.state = 'completed';
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

  getErrors() {
    return [...this.errors];
  }

  getState() {
    return this.state;
  }

  isActive() {
    return this.state === 'active';
  }
}

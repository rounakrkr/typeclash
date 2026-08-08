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
  }

  init() {
    this.containerEl.innerHTML = '';
    const wordsContainer = document.createElement('div');
    wordsContainer.className = 'text-words';
    
    for (let i = 0; i < this.text.length; i++) {
      const span = document.createElement('span');
      span.textContent = this.text[i];
      span.className = 'char char-pending';
      if (i === 0) span.classList.add('char-current');
      wordsContainer.appendChild(span);
    }
    
    this.containerEl.appendChild(wordsContainer);
    this.spans = Array.from(wordsContainer.children);
    
    document.addEventListener('keydown', this.handleKeyDown);
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
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.containerEl.innerHTML = '';
  }

  handleKeyDown(e) {
    if (this.state !== 'active') return;
    
    // Ignore modifier keys and function keys
    if (e.key.length !== 1 && e.key !== 'Backspace') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    
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
      this.autoScroll();
    } else {
      this.complete();
    }
  }

  autoScroll() {
    const currentSpan = this.spans[this.position];
    if (!currentSpan) return;
    
    const containerHeight = this.containerEl.clientHeight;
    const spanTop = currentSpan.offsetTop;
    const scrollTop = this.containerEl.scrollTop;
    
    if (spanTop - scrollTop > containerHeight * 0.6) {
      this.containerEl.scrollBy({ top: 30, behavior: 'smooth' });
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

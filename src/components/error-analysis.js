/**
 * Render an error analysis section showing which characters were problematic.
 * @param {Array} errors - Array of { position, expected, typed } objects
 * @returns {HTMLElement} The error analysis DOM element
 */
export function renderErrorAnalysis(errors) {
  const container = document.createElement('div');
  container.className = 'error-analysis';

  if (!errors || errors.length === 0) {
    container.innerHTML = `
      <h3 class="section-title">Error Analysis</h3>
      <div class="error-perfect">
        <span class="perfect-icon">✨</span>
        <span>Perfect accuracy! No errors found.</span>
      </div>
    `;
    return container;
  }

  // Count errors per expected character
  const charErrorCount = {};
  const confusionPairs = {};

  errors.forEach(err => {
    const expected = err.expected === ' ' ? '⎵' : err.expected;
    const typed = err.typed === ' ' ? '⎵' : err.typed;

    charErrorCount[expected] = (charErrorCount[expected] || 0) + 1;

    const pair = `${expected} → ${typed}`;
    confusionPairs[pair] = (confusionPairs[pair] || 0) + 1;
  });

  // Sort by frequency
  const sortedChars = Object.entries(charErrorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 problematic chars

  const sortedPairs = Object.entries(confusionPairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Top 6 confusion pairs

  const maxErrors = sortedChars.length > 0 ? sortedChars[0][1] : 1;

  container.innerHTML = `
    <h3 class="section-title">Error Analysis</h3>
    <div class="error-grid">
      <div class="error-column">
        <div class="error-column-title">Most Missed Characters</div>
        <div class="error-bars">
          ${sortedChars.map(([char, count]) => `
            <div class="error-bar-row">
              <span class="error-char">${char}</span>
              <div class="error-bar-track">
                <div class="error-bar-fill" style="width: ${(count / maxErrors) * 100}%"></div>
              </div>
              <span class="error-count">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="error-column">
        <div class="error-column-title">Common Mistakes</div>
        <div class="confusion-list">
          ${sortedPairs.map(([pair, count]) => `
            <div class="confusion-row">
              <span class="confusion-pair">${pair}</span>
              <span class="confusion-count">×${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  return container;
}

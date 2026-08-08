import { storage } from '../lib/storage.js';

export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  
  const testCount = storage.getTestCount();
  
  footer.innerHTML = `
    <div class="footer-content">
      <p>Built by Rounak Kumar <a href="https://github.com" target="_blank" class="btn-icon" style="display:inline-flex; width:auto; height:auto; padding:0 4px;">GitHub</a></p>
      <p class="stats-counter" style="margin-top: 0.5rem; opacity: 0.7;">${testCount} tests completed</p>
    </div>
  `;
  return footer;
}

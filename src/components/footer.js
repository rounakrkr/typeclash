import { storage } from '../lib/storage.js';

export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';

  footer.innerHTML = `
    <div class="footer-content" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary);">
      <span>Built with ❤️ by <strong>Rounak Kumar</strong></span>
    </div>
  `;
  return footer;
}

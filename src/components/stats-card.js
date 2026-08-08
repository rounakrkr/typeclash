export function createStatCard(label, value, sublabel = '') {
  const card = document.createElement('div');
  card.className = 'stat-card';
  card.innerHTML = `
    <div class="stat-card-label">${label}</div>
    <div class="stat-card-value">${value}</div>
    ${sublabel ? `<div class="stat-card-sublabel">${sublabel}</div>` : ''}
  `;
  return card;
}

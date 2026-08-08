export function renderModeSelector(currentDuration, onChange) {
  const container = document.createElement('div');
  container.className = 'mode-selector';
  
  const options = [
    { label: 'Practice', value: 0 },
    { label: '30s', value: 30 },
    { label: '45s', value: 45 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '120s', value: 120 }
  ];
  
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;
    if (opt.value === currentDuration) {
      btn.className = 'active';
    }
    btn.addEventListener('click', () => {
      const currentActive = container.querySelector('.active');
      if (currentActive) currentActive.classList.remove('active');
      btn.classList.add('active');
      onChange(opt.value);
    });
    container.appendChild(btn);
  });
  
  return container;
}

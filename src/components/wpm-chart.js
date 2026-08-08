export function renderWPMChart(canvasEl, wpmData, accuracyData = null) {
  const ctx = canvasEl.getContext('2d');
  
  const draw = () => {
    const width = canvasEl.parentElement.clientWidth;
    const height = canvasEl.parentElement.clientHeight;
    canvasEl.width = width;
    canvasEl.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (!wpmData || wpmData.length === 0) return;
    
    const maxTime = Math.max(...wpmData.map(d => d.second), 1);
    const maxWpm = Math.max(...wpmData.map(d => d.wpm), 50);
    
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    
    // Draw grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH * i) / 5;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
    }
    ctx.stroke();
    
    // Draw WPM line
    ctx.beginPath();
    const getX = (sec) => padding.left + (sec / maxTime) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxWpm) * chartH;
    
    wpmData.forEach((d, i) => {
      const x = getX(d.second);
      const y = getY(d.wpm);
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prev = wpmData[i - 1];
        const cx = (x + getX(prev.second)) / 2;
        ctx.bezierCurveTo(cx, getY(prev.wpm), cx, y, x, y);
      }
    });
    
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Fill gradient
    ctx.lineTo(getX(wpmData[wpmData.length-1].second), padding.top + chartH);
    ctx.lineTo(getX(wpmData[0].second), padding.top + chartH);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(108, 92, 231, 0.3)');
    gradient.addColorStop(1, 'rgba(108, 92, 231, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  };
  
  draw();
  window.addEventListener('resize', draw);
  return () => window.removeEventListener('resize', draw);
}

/**
 * Generate a shareable result card image using Canvas API.
 * Returns methods to download or get blob for sharing.
 */
export function generateResultCard({ wpm, accuracy, consistency, duration, rank }) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle gradient overlay
  const bgGrad = ctx.createLinearGradient(0, 0, 800, 450);
  bgGrad.addColorStop(0, 'rgba(108, 92, 231, 0.06)');
  bgGrad.addColorStop(1, 'rgba(168, 85, 247, 0.03)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 450);

  // Border
  ctx.strokeStyle = 'rgba(108, 92, 231, 0.2)';
  ctx.lineWidth = 2;
  ctx.roundRect(4, 4, 792, 442, 16);
  ctx.stroke();

  // Logo
  ctx.textAlign = 'left';
  ctx.font = '300 28px "JetBrains Mono", monospace';
  ctx.fillStyle = '#e8e6e3';
  ctx.fillText('type', 40, 55);
  const typeWidth = ctx.measureText('type').width;
  ctx.font = '800 28px "JetBrains Mono", monospace';
  const logoGrad = ctx.createLinearGradient(40 + typeWidth, 30, 40 + typeWidth + 80, 60);
  logoGrad.addColorStop(0, '#6c5ce7');
  logoGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = logoGrad;
  ctx.fillText('clash', 40 + typeWidth, 55);

  // WPM — big center number
  ctx.textAlign = 'center';
  ctx.font = '800 120px "JetBrains Mono", monospace';
  const wpmGrad = ctx.createLinearGradient(300, 120, 500, 260);
  wpmGrad.addColorStop(0, '#a855f7');
  wpmGrad.addColorStop(1, '#6c5ce7');
  ctx.fillStyle = wpmGrad;
  ctx.fillText(Math.round(wpm), 400, 230);

  // "words per minute" label
  ctx.font = '500 18px "Inter", sans-serif';
  ctx.fillStyle = '#8b8b9e';
  ctx.letterSpacing = '4px';
  ctx.fillText('WORDS PER MINUTE', 400, 265);

  // Rank badge
  ctx.font = '700 20px "Inter", sans-serif';
  ctx.fillStyle = getRankColor(rank);
  ctx.fillText(`${getRankEmoji(rank)} ${rank.toUpperCase()}`, 400, 300);

  // Divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 330);
  ctx.lineTo(720, 330);
  ctx.stroke();

  // Stats row
  ctx.font = '600 16px "Inter", sans-serif';
  ctx.fillStyle = '#e8e6e3';
  ctx.textAlign = 'center';

  // Accuracy
  ctx.fillText(`${Math.round(accuracy)}%`, 200, 370);
  ctx.font = '400 12px "Inter", sans-serif';
  ctx.fillStyle = '#8b8b9e';
  ctx.fillText('ACCURACY', 200, 390);

  // Consistency
  ctx.font = '600 16px "Inter", sans-serif';
  ctx.fillStyle = '#e8e6e3';
  ctx.fillText(`${Math.round(consistency)}%`, 400, 370);
  ctx.font = '400 12px "Inter", sans-serif';
  ctx.fillStyle = '#8b8b9e';
  ctx.fillText('CONSISTENCY', 400, 390);

  // Duration
  ctx.font = '600 16px "Inter", sans-serif';
  ctx.fillStyle = '#e8e6e3';
  ctx.fillText(duration === 0 ? 'Practice' : `${duration}s`, 600, 370);
  ctx.font = '400 12px "Inter", sans-serif';
  ctx.fillStyle = '#8b8b9e';
  ctx.fillText('MODE', 600, 390);

  // Footer
  ctx.textAlign = 'right';
  ctx.font = '400 13px "Inter", sans-serif';
  ctx.fillStyle = '#55556a';
  ctx.fillText('typeclash.com', 760, 430);

  const dataUrl = canvas.toDataURL('image/png');

  return {
    dataUrl,
    canvas,

    /** Download the result card as PNG */
    download() {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `typeclash-${Math.round(wpm)}wpm.png`;
      a.click();
    },

    /** Share using native Web Share API (WhatsApp, Instagram, etc.) */
    async share() {
      try {
        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], `typeclash-${Math.round(wpm)}wpm.png`, { type: 'image/png' });

        const shareText = `I just typed ${Math.round(wpm)} WPM with ${Math.round(accuracy)}% accuracy on TypeClash! ${getRankEmoji(rank)} ${rank} rank. Can you beat me?`;

        // Check if Web Share API with files is supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My TypeClash Result',
            text: shareText,
            files: [file]
          });
          return { shared: true };
        }
        // Fallback: share without image (text only)
        else if (navigator.share) {
          await navigator.share({
            title: 'My TypeClash Result',
            text: shareText
          });
          return { shared: true };
        }
        // No share API — fallback to download
        else {
          this.download();
          return { shared: false, fallback: 'download' };
        }
      } catch (err) {
        // User cancelled share or error
        if (err.name !== 'AbortError') {
          console.warn('Share failed, falling back to download:', err);
          this.download();
        }
        return { shared: false };
      }
    }
  };
}

function getRankColor(rank) {
  const colors = {
    'Bronze': '#cd7f32', 'Silver': '#c0c0c0', 'Gold': '#ffd700',
    'Platinum': '#e5e4e2', 'Diamond': '#b9f2ff', 'Master': '#9370db',
    'Grandmaster': '#ff69b4'
  };
  return colors[rank] || '#e8e6e3';
}

function getRankEmoji(rank) {
  const emojis = {
    'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇',
    'Platinum': '💎', 'Diamond': '💠', 'Master': '👑',
    'Grandmaster': '⚡'
  };
  return emojis[rank] || '🏅';
}

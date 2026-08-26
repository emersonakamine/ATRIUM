import QRCode from 'qrcode';
import { Guest, EventData, TicketCategory } from '../types';
import { THEME_PRESETS } from './inviteStyles';

/**
 * Generates a high-resolution, self-contained PNG image data URL of the digital pass
 * for a specific guest synchronously & deterministically.
 */
export function generateGuestCardImage(
  guest: Guest,
  event: EventData,
  category?: TicketCategory
): string {
  try {
    const width = 640;
    const height = 900;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const layout = event.inviteLayout || {
      bgTheme: 'dark',
      title: 'CREDENCIAL DE GALA',
      accentColor: '#fbbf24',
      textColor: '#ffffff',
    };

    const themeDef = THEME_PRESETS.find(t => t.id === layout.bgTheme) || THEME_PRESETS[0];
    const accentColor = layout.accentColor || themeDef.accentColor || '#fbbf24';
    const textColor = layout.textColor || themeDef.textColor || '#ffffff';
    const isLight = themeDef.category === 'light';

    // 1. Draw rounded card background with gradient
    const cornerRadius = 32;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(width - cornerRadius, 0);
    ctx.quadraticCurveTo(width, 0, width, cornerRadius);
    ctx.lineTo(width, height - cornerRadius);
    ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
    ctx.lineTo(cornerRadius, height);
    ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.clip();

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (layout.bgTheme === 'gold') {
      grad.addColorStop(0, '#2a1b06');
      grad.addColorStop(0.5, '#1c1917');
      grad.addColorStop(1, '#451a03');
    } else if (layout.bgTheme === 'emerald') {
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#134e4a');
    } else if (layout.bgTheme === 'indigo') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.6, '#1e1b4b');
      grad.addColorStop(1, '#172554');
    } else if (layout.bgTheme === 'ruby') {
      grad.addColorStop(0, '#380718');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#4c0519');
    } else if (layout.bgTheme === 'purple') {
      grad.addColorStop(0, '#2e1065');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#3b0764');
    } else if (isLight) {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
    } else {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle accent light glow behind QR code
    const radialGlow = ctx.createRadialGradient(width / 2, 420, 20, width / 2, 420, 320);
    radialGlow.addColorStop(0, `${accentColor}25`);
    radialGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Card Border
    ctx.strokeStyle = isLight ? '#cbd5e1' : `${accentColor}40`;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    // 2. Header Text (Pass Type / Subtitle)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    const headerSubtitle = (layout.title || 'CREDENCIAL DE GALA').toUpperCase();
    ctx.fillText(headerSubtitle, width / 2, 55);

    // 3. Event Title (Auto-wrapping if long)
    ctx.fillStyle = textColor;
    ctx.font = 'bold 28px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    const eventTitle = event.title || 'Gala Anual BP Executive 2026';
    
    if (eventTitle.length > 32) {
      const words = eventTitle.split(' ');
      let line1 = '';
      let line2 = '';
      for (const w of words) {
        if ((line1 + w).length <= 26) {
          line1 += (line1 ? ' ' : '') + w;
        } else {
          line2 += (line2 ? ' ' : '') + w;
        }
      }
      ctx.fillText(line1, width / 2, 95);
      ctx.fillText(line2, width / 2, 130);
    } else {
      ctx.fillText(eventTitle, width / 2, 105);
    }

    // 4. White QR Container Box
    const qrBoxWidth = 320;
    const qrBoxHeight = 360;
    const qrBoxX = (width - qrBoxWidth) / 2;
    const qrBoxY = 165;
    const qrBoxRadius = 24;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    ctx.moveTo(qrBoxX + qrBoxRadius, qrBoxY);
    ctx.lineTo(qrBoxX + qrBoxWidth - qrBoxRadius, qrBoxY);
    ctx.quadraticCurveTo(qrBoxX + qrBoxWidth, qrBoxY, qrBoxX + qrBoxWidth, qrBoxY + qrBoxRadius);
    ctx.lineTo(qrBoxX + qrBoxWidth, qrBoxY + qrBoxHeight - qrBoxRadius);
    ctx.quadraticCurveTo(qrBoxX + qrBoxWidth, qrBoxY + qrBoxHeight, qrBoxX + qrBoxWidth - qrBoxRadius, qrBoxY + qrBoxHeight);
    ctx.lineTo(qrBoxX + qrBoxRadius, qrBoxY + qrBoxHeight);
    ctx.quadraticCurveTo(qrBoxX, qrBoxY + qrBoxHeight, qrBoxX, qrBoxY + qrBoxHeight - qrBoxRadius);
    ctx.lineTo(qrBoxX, qrBoxY + qrBoxRadius);
    ctx.quadraticCurveTo(qrBoxX, qrBoxY, qrBoxX + qrBoxRadius, qrBoxY);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Render QR Code directly using QRCode.create (Instant 0ms, 100% synchronous)
    try {
      const qrPayload = guest.qrPayloadToken || guest.publicCode || 'GLA-9821-X';
      const qr = QRCode.create(qrPayload, { errorCorrectionLevel: 'H' });
      const moduleCount = qr.modules.size;
      const qrInnerSize = 260;
      const qrStartX = qrBoxX + (qrBoxWidth - qrInnerSize) / 2;
      const qrStartY = qrBoxY + 25;
      const cellSize = qrInnerSize / moduleCount;

      ctx.fillStyle = '#0f172a';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            ctx.fillRect(
              Math.round(qrStartX + c * cellSize),
              Math.round(qrStartY + r * cellSize),
              Math.ceil(cellSize),
              Math.ceil(cellSize)
            );
          }
        }
      }
    } catch (err) {
      console.warn('Direct QR generation error:', err);
    }

    // Draw Public Code below QR Code inside box
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "SF Mono", "Roboto Mono", monospace';
    ctx.fillText(guest.publicCode || 'GLA-9821-X', width / 2, qrBoxY + 325);

    // 5. Guest Name (Bold & prominent)
    ctx.fillStyle = textColor;
    ctx.font = 'bold 26px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    const guestName = guest.name || 'Convidado';
    ctx.fillText(guestName, width / 2, 575);

    // 6. Category Pill Badge
    const catName = category?.name || 'Convidado';
    ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(catName).width;
    const pillWidth = Math.max(160, textWidth + 40);
    const pillHeight = 36;
    const pillX = (width - pillWidth) / 2;
    const pillY = 610;
    const pillRadius = 18;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pillX + pillRadius, pillY);
    ctx.lineTo(pillX + pillWidth - pillRadius, pillY);
    ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + pillRadius);
    ctx.lineTo(pillX + pillWidth, pillY + pillHeight - pillRadius);
    ctx.quadraticCurveTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - pillRadius, pillY + pillHeight);
    ctx.lineTo(pillX + pillRadius, pillY + pillHeight);
    ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - pillRadius);
    ctx.lineTo(pillX, pillY + pillRadius);
    ctx.quadraticCurveTo(pillX, pillY, pillX + pillRadius, pillY);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = `${accentColor}80`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillText(catName, width / 2, pillY + 19);

    // 7. Divider Line
    ctx.strokeStyle = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 680);
    ctx.lineTo(width - 60, 680);
    ctx.stroke();

    // 8. Event Date, Time & Venue
    ctx.fillStyle = isLight ? '#334155' : 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 17px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    const dateTimeStr = `${event.startDate || '12 de novembro de 2026'} • ${event.startTime || '19h30'}`;
    ctx.fillText(dateTimeStr, width / 2, 715);

    ctx.fillStyle = isLight ? '#64748b' : 'rgba(255, 255, 255, 0.75)';
    ctx.font = '15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    const locationStr = event.locationName || 'Belmond Copacabana Palace - Salão Nobre';
    ctx.fillText(locationStr, width / 2, 745);

    // 9. Antifraud / Security Footer
    ctx.fillStyle = accentColor;
    ctx.font = '12px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillText('🔒 PASSE DIGITAL AUTÊNTICO • APRESENTE NA PORTARIA', width / 2, 800);

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Error generating card image:', e);
    return '';
  }
}

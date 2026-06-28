import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { quoteLayoutConfig } from './layoutConfig.js';
import { themeConfig } from './themeConfig.js';
import { wrapReadableTextByWidth } from './textLayout.js';

const PDF_IMPORT_START = 'SITE_QUOTE_IMPORT_START';
const PDF_IMPORT_END = 'SITE_QUOTE_IMPORT_END';

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  );
}

const T = themeConfig.colors;
const C = {
  ink: hexToRgb(T.text),
  green: hexToRgb(T.primary),
  darkGreen: hexToRgb(T.primaryDark),
  lightGreen: hexToRgb(T.primaryLight),
  paleGreen: hexToRgb(T.primaryPale),
  yellow: hexToRgb(T.warning),
  yellowStrong: hexToRgb(T.warningStrong),
  line: hexToRgb(T.borderDark),
  border: hexToRgb(T.border),
  red: hexToRgb(T.danger),
  dangerSoft: hexToRgb(T.dangerSoft),
  muted: hexToRgb(T.muted),
  gold: hexToRgb(T.quoteGold),
  goldSoft: hexToRgb(T.quoteGoldSoft),
  sage: hexToRgb(T.sage),
  sageSoft: hexToRgb(T.sageSoft),
  white: hexToRgb(T.white)
};

function fontkitFace(postscriptName) {
  return {
    ...fontkit,
    create: async (data) => {
      const font = await fontkit.create(data);
      return font.getFont ? font.getFont(postscriptName) : font;
    }
  };
}

function pending(value) {
  return value?.trim() ? value.trim() : '待確認';
}

function formatRoomSummary(value) {
  const source = String(value || '').trim();
  if (!source) return '';
  const slashMatch = source.match(/^(\d+)\s*[\/／]\s*(\d+)\s*[\/／]\s*(\d+)(?:\s*[\/／]\s*(\d+))?$/);
  if (slashMatch) {
    return `${slashMatch[1]}房${slashMatch[2]}廳${slashMatch[3]}衛${slashMatch[4] ? `${slashMatch[4]}陽台` : ''}`;
  }
  return source;
}

function stripColorTags(text) {
  return String(text || '').replace(/\[color=[^\]]+\]([\s\S]*?)\[\/color\]/g, '$1');
}

function money(value) {
  return value?.trim() ? `NT$ ${value.trim()}` : '';
}

function moneyNumber(value) {
  if (!value) return null;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function feeAmount(total, subtotal, tax) {
  const totalValue = moneyNumber(total);
  if (totalValue !== null) return totalValue;
  const subtotalValue = moneyNumber(subtotal);
  const taxValue = moneyNumber(tax);
  if (subtotalValue === null && taxValue === null) return null;
  return (subtotalValue || 0) + (taxValue || 0);
}

function numberToChineseCurrency(value) {
  const amount = Math.round(Number(value) || 0);
  if (!amount) return '零元整';
  const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const sections = ['', '萬', '億', '兆'];
  const convertSection = (section) => {
    let result = '';
    let zeroPending = false;
    String(section).padStart(4, '0').split('').map(Number).forEach((digit, index) => {
      const unitIndex = 3 - index;
      if (digit === 0) {
        if (result) zeroPending = true;
        return;
      }
      if (zeroPending) {
        result += digits[0];
        zeroPending = false;
      }
      result += `${digits[digit]}${units[unitIndex]}`;
    });
    return result;
  };
  let result = '';
  let remaining = amount;
  let sectionIndex = 0;
  let needZero = false;
  while (remaining > 0) {
    const section = remaining % 10000;
    if (section) {
      const sectionText = `${convertSection(section)}${sections[sectionIndex]}`;
      result = needZero && result ? `${sectionText}零${result}` : `${sectionText}${result}`;
      needZero = section < 1000;
    } else if (result) {
      needZero = true;
    }
    remaining = Math.floor(remaining / 10000);
    sectionIndex += 1;
  }
  return `${result.replace(/零+/g, '零')}元整`;
}

function totalFeeChineseText(form) {
  const serviceAmount = feeAmount(form.serviceTotal, form.serviceSubtotal, form.serviceTax);
  const cleaningAmount = feeAmount(form.cleaningTotal, form.cleaningSubtotal, form.cleaningTax);
  if (serviceAmount === null && cleaningAmount === null) return '';
  return numberToChineseCurrency((serviceAmount || 0) + (cleaningAmount || 0));
}

function paymentConditionText(form) {
  return form.paymentCondition === '其他'
    ? pending(form.paymentConditionOther)
    : pending(form.paymentCondition);
}

function encodePdfImportText(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function bytes(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Missing asset: ${path}`);
  return response.arrayBuffer();
}

function rect(page, x, y, w, h, options = {}) {
  page.drawRectangle({ x, y: page.getHeight() - y - h, width: w, height: h, ...options });
}

function roundedRect(page, x, y, w, h, radius = 4, options = {}) {
  const pageHeight = page.getHeight();
  const x0 = x;
  const x1 = x + w;
  const y0 = pageHeight - y - h;
  const y1 = pageHeight - y;
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const c = r * 0.5522847498;
  const { color, borderColor, borderWidth, ...rest } = options;
  if (color && r > 0) {
    rect(page, x + r, y, w - r * 2, h, { color, borderWidth: 0 });
    rect(page, x, y + r, w, h - r * 2, { color, borderWidth: 0 });
    page.drawCircle({ x: x + r, y: pageHeight - y - r, size: r, color });
    page.drawCircle({ x: x + w - r, y: pageHeight - y - r, size: r, color });
    page.drawCircle({ x: x + r, y: pageHeight - y - h + r, size: r, color });
    page.drawCircle({ x: x + w - r, y: pageHeight - y - h + r, size: r, color });
  } else if (color) {
    rect(page, x, y, w, h, { color, borderWidth: 0 });
  }
  if (!borderColor || !borderWidth) return;
  const path = [
    `M ${x0 + r} ${y1}`,
    `L ${x1 - r} ${y1}`,
    `C ${x1 - r + c} ${y1} ${x1} ${y1 - r + c} ${x1} ${y1 - r}`,
    `L ${x1} ${y0 + r}`,
    `C ${x1} ${y0 + r - c} ${x1 - r + c} ${y0} ${x1 - r} ${y0}`,
    `L ${x0 + r} ${y0}`,
    `C ${x0 + r - c} ${y0} ${x0} ${y0 + r - c} ${x0} ${y0 + r}`,
    `L ${x0} ${y1 - r}`,
    `C ${x0} ${y1 - r + c} ${x0 + r - c} ${y1} ${x0 + r} ${y1}`,
    'Z'
  ].join(' ');
  page.drawSvgPath(path, { borderColor, borderWidth, ...rest });
}

function line(page, x1, y1, x2, y2, options = {}) {
  page.drawLine({
    start: { x: x1, y: page.getHeight() - y1 },
    end: { x: x2, y: page.getHeight() - y2 },
    ...options
  });
}

function wrap(text, font, size, maxWidth) {
  const lines = String(stripColorTags(text || '')).split('\n');
  const output = [];
  lines.forEach((rawLine) => {
    const lineText = rawLine || '';
    if (!lineText.trim()) {
      output.push('');
      return;
    }
    const readableLines = wrapReadableTextByWidth(lineText, {
      maxWidth,
      measure: (value) => font.widthOfTextAtSize(value, size)
    });
    readableLines.forEach((readableLine) => {
      if (font.widthOfTextAtSize(readableLine, size) <= maxWidth) {
        output.push(readableLine);
        return;
      }
      let current = '';
      const leading = readableLine.match(/^\s*/)?.[0] || '';
      const continuationPrefix = leading ? `${leading}  ` : '';
      Array.from(readableLine).forEach((char) => {
        const next = `${current}${char}`;
        if (!current || font.widthOfTextAtSize(next, size) <= maxWidth) {
          current = next;
        } else {
          output.push(current);
          current = continuationPrefix ? `${continuationPrefix}${char}` : char;
        }
      });
      if (current) output.push(current);
    });
  });
  return output;
}

function fitSize(text, font, maxSize, maxWidth, minSize = 6) {
  let size = maxSize;
  while (size > minSize && font.widthOfTextAtSize(stripColorTags(text), size) > maxWidth) {
    size -= 0.3;
  }
  return size;
}

function fitTextBlock(text, font, maxSize, maxWidth, maxHeight, options = {}) {
  const {
    minSize = 5.2,
    lineHeightRatio = 1.28,
    lineHeight,
    step = 0.2
  } = options;
  let size = maxSize;
  let fittedLines = wrap(text, font, size, maxWidth);
  let fittedLineHeight = lineHeight || size * lineHeightRatio;

  while (size > minSize && fittedLines.length * fittedLineHeight > maxHeight) {
    size = Math.max(minSize, size - step);
    fittedLines = wrap(text, font, size, maxWidth);
    fittedLineHeight = lineHeight ? Math.max(size * 1.12, lineHeight * (size / maxSize)) : size * lineHeightRatio;
  }

  return { size, lines: fittedLines, lineHeight: fittedLineHeight };
}

function measureTextHeight(text, font, size, maxWidth, lineHeight) {
  return wrap(text, font, size, maxWidth).length * lineHeight;
}

function formatConstructionDetail(text) {
  return String(text || '')
    .split('\n')
    .map((lineText) => {
      const line = lineText.trim();
      if (/^[*•]/.test(line)) return line.replace(/^[*]\s*/, '• ');
      if (/^[（(]/.test(line)) return `    ${line}`;
      if (/^[或無不]/.test(line)) return `     ${line}`;
      return lineText;
    })
    .join('\n');
}

function drawText(page, text, x, y, options) {
  const {
    font,
    size = 10,
    color = C.ink,
    maxWidth,
    maxHeight,
    minSize = 5.2,
    align = 'left',
    lineHeight = size * 1.35,
    fauxBold = false,
    textLift = 0,
    opacity
  } = options;
  const fitted = maxWidth && maxHeight
    ? fitTextBlock(text, font, size, maxWidth, maxHeight, { minSize, lineHeight })
    : null;
  const actualSize = fitted?.size || size;
  const actualLineHeight = fitted?.lineHeight || lineHeight;
  const lines = fitted?.lines || (maxWidth ? wrap(text, font, actualSize, maxWidth) : String(stripColorTags(text || '')).split('\n'));
  lines.forEach((lineText, index) => {
    const width = font.widthOfTextAtSize(lineText, actualSize);
    let textX = x;
    if (align === 'center' && maxWidth) textX = x + (maxWidth - width) / 2;
    if (align === 'right' && maxWidth) textX = x + maxWidth - width;
    page.drawText(lineText, {
      x: textX,
      y: page.getHeight() - (y - textLift) - actualSize - index * actualLineHeight,
      size: actualSize,
      font,
      color,
      opacity
    });
    if (fauxBold) {
      page.drawText(lineText, {
        x: textX + 0.18,
        y: page.getHeight() - (y - textLift) - actualSize - index * actualLineHeight,
        size: actualSize,
        font,
        color,
        opacity
      });
    }
  });
  return lines.length * actualLineHeight;
}

function cell(page, text, x, y, w, h, options) {
  const {
    font,
    size = 10,
    color = C.ink,
    fillColor,
    borderColor = C.line,
    borderWidth = 0.65,
    align = 'left',
    paddingX = 5,
    paddingY = 2,
    lineHeight = size * 1.32,
    minSize = 5.2,
    valign = 'middle',
    fauxBold = false,
    textLift = 0
  } = options;
  rect(page, x, y, w, h, { color: fillColor, borderColor, borderWidth });
  const fit = fitTextBlock(text, font, size, Math.max(6, w - paddingX * 2), Math.max(4, h - paddingY * 2), {
    minSize,
    lineHeight
  });
  const lines = fit.lines;
  const actualSize = fit.size;
  const actualLineHeight = fit.lineHeight;
  const blockH = lines.length * actualLineHeight;
  let textY = y + paddingY;
  if (valign === 'middle') textY = y + Math.max(paddingY, (h - blockH) / 2);
  if (valign === 'bottom') textY = y + h - blockH - paddingY;
  lines.forEach((lineText, index) => {
    const width = font.widthOfTextAtSize(lineText, actualSize);
    let textX = x + paddingX;
    if (align === 'center') textX = x + (w - width) / 2;
    if (align === 'right') textX = x + w - paddingX - width;
    page.drawText(lineText, {
      x: textX,
      y: page.getHeight() - (textY - textLift) - actualSize - index * actualLineHeight,
      size: actualSize,
      font,
      color
    });
    if (fauxBold) {
      page.drawText(lineText, {
        x: textX + 0.18,
        y: page.getHeight() - (textY - textLift) - actualSize - index * actualLineHeight,
        size: actualSize,
        font,
        color
      });
    }
  });
}

function roundedCell(page, text, x, y, w, h, radius, options) {
  const {
    font,
    size = 10,
    color = C.ink,
    fillColor,
    borderColor = C.line,
    borderWidth = 0.65,
    align = 'left',
    paddingX = 5,
    paddingY = 2,
    lineHeight = size * 1.32,
    minSize = 5.2,
    valign = 'middle',
    fauxBold = false,
    textLift = 0
  } = options;
  roundedRect(page, x, y, w, h, radius, { color: fillColor, borderColor, borderWidth });
  const fit = fitTextBlock(text, font, size, Math.max(6, w - paddingX * 2), Math.max(4, h - paddingY * 2), {
    minSize,
    lineHeight
  });
  const lines = fit.lines;
  const actualSize = fit.size;
  const actualLineHeight = fit.lineHeight;
  const blockH = lines.length * actualLineHeight;
  let textY = y + paddingY;
  if (valign === 'middle') textY = y + Math.max(paddingY, (h - blockH) / 2);
  if (valign === 'bottom') textY = y + h - blockH - paddingY;
  lines.forEach((lineText, index) => {
    const width = font.widthOfTextAtSize(lineText, actualSize);
    let textX = x + paddingX;
    if (align === 'center') textX = x + (w - width) / 2;
    if (align === 'right') textX = x + w - paddingX - width;
    page.drawText(lineText, {
      x: textX,
      y: page.getHeight() - (textY - textLift) - actualSize - index * actualLineHeight,
      size: actualSize,
      font,
      color
    });
    if (fauxBold) {
      page.drawText(lineText, {
        x: textX + 0.18,
        y: page.getHeight() - (textY - textLift) - actualSize - index * actualLineHeight,
        size: actualSize,
        font,
        color
      });
    }
  });
}

function drawImageFit(page, image, x, y, w, h, options = {}) {
  const scale = Math.min(w / image.width, h / image.height);
  const iw = image.width * scale;
  const ih = image.height * scale;
  page.drawImage(image, {
    x: x + (w - iw) / 2,
    y: page.getHeight() - y - (h + ih) / 2,
    width: iw,
    height: ih,
    ...options
  });
}

function drawDarkTitleBar(page, x, y, w, h) {
  rect(page, x, y, w, h, { color: C.darkGreen, borderColor: C.line, borderWidth: 0.95 });
  rect(page, x, y, w, h * 0.5, { color: C.green, borderWidth: 0 });
  line(page, x, y + 1, x + w, y + 1, { color: rgb(0.5, 0.68, 0.38), thickness: 0.55 });
  line(page, x, y + h - 1, x + w, y + h - 1, { color: C.line, thickness: 0.85 });
}

function drawNoticeIcon(page, index, x, y, size) {
  const centerY = y + size / 2;
  const centerX = x + size / 2;
  const stroke = { color: C.green, thickness: 1.45 };
  roundedRect(page, x, y, size, size, 3.2, { color: C.lightGreen, borderColor: C.border, borderWidth: 0.65 });

  if (index === 0) {
    rect(page, x + size * 0.38, y + size * 0.28, size * 0.24, size * 0.48, { borderColor: C.green, borderWidth: 1.35 });
    rect(page, x + size * 0.42, y + size * 0.16, size * 0.16, size * 0.12, { borderColor: C.green, borderWidth: 1.25 });
    line(page, x + size * 0.27, centerY, x + size * 0.16, centerY - size * 0.08, stroke);
    return;
  }

  if (index === 1) {
    page.drawCircle({ x: centerX - size * 0.12, y: page.getHeight() - (y + size * 0.34), size: size * 0.1, borderColor: C.green, borderWidth: 1.3 });
    page.drawCircle({ x: centerX + size * 0.13, y: page.getHeight() - (y + size * 0.36), size: size * 0.085, borderColor: C.green, borderWidth: 1.3 });
    rect(page, x + size * 0.22, y + size * 0.52, size * 0.52, size * 0.26, { borderColor: C.green, borderWidth: 1.3 });
    return;
  }

  if (index === 2) {
    rect(page, x + size * 0.24, y + size * 0.22, size * 0.52, size * 0.52, { borderColor: C.green, borderWidth: 1.35 });
    line(page, x + size * 0.33, centerY, x + size * 0.46, y + size * 0.62, stroke);
    line(page, x + size * 0.46, y + size * 0.62, x + size * 0.68, y + size * 0.38, stroke);
    return;
  }

  rect(page, x + size * 0.2, y + size * 0.32, size * 0.6, size * 0.42, { borderColor: C.green, borderWidth: 1.35 });
  rect(page, x + size * 0.34, y + size * 0.22, size * 0.24, size * 0.11, { borderColor: C.green, borderWidth: 1.25 });
  page.drawCircle({ x: centerX, y: page.getHeight() - (y + size * 0.54), size: size * 0.11, borderColor: C.green, borderWidth: 1.3 });
}

function noticeCards(text) {
  const titles = ['專業報價', '團隊進場', '現場驗收', '現況差異'];
  const cards = [];
  String(text || '').split(/\r?\n/).map((lineText) => lineText.trim()).filter(Boolean).forEach((lineText) => {
    const match = lineText.match(/^[•*－-]\s*(.*)$/);
    if (match || !cards.length) {
      cards.push({ title: titles[cards.length] || '施工須知', text: match ? match[1] : lineText });
    } else {
      cards[cards.length - 1].text += `\n${lineText}`;
    }
  });
  return titles.map((title, index) => {
    let cardText = cards[index]?.text || '';
    if (index === 2) {
      cardText = cardText
        .replace('施作後屋主可現場驗收，若有遺漏可立即補強處理。', '施作後屋主可現場驗收\n若有遺漏可立即補強處理。')
        .replace('施作後屋主可現場驗收， 若有遺漏可立即補強處理。', '施作後屋主可現場驗收\n若有遺漏可立即補強處理。');
    }
    return { title, text: cardText };
  });
}

function buildPlainText(form, rows) {
  return [
    `清潔類型：${pending(form.cleaningType)}`,
    `日期：${pending(form.quoteDate)}`,
    `有效日期至：${pending(form.validUntil)}`,
    `公司名稱：${pending(form.company)}`,
    `統編：${pending(form.taxId)}`,
    `聯絡人：${pending(form.contact)}`,
    `聯絡電話：${pending(form.phone)}`,
    `社區：${pending(form.building)}`,
    `地址：${pending(form.address)}`,
    `房型：${pending(form.roomSummary)}`,
    `型態：${pending(form.projectType)}`,
    `施作日期：${pending(form.serviceDate)}`,
    ...rows.map((row) => `${row.number}. ${row.area}：${stripColorTags(row.detail)}`)
  ].join('\n');
}

export async function createNativeQuotePdf(form, rows) {
  const pdfDoc = await PDFDocument.create();
  const [fontBytes, boldFontBytes] = await Promise.all([
    bytes('/assets/msjh.ttc'),
    bytes('/assets/msjhbd.ttc')
  ]);
  pdfDoc.registerFontkit(fontkitFace('MicrosoftJhengHeiRegular'));
  const font = await pdfDoc.embedFont(fontBytes, { subset: false });
  pdfDoc.registerFontkit(fontkitFace('MicrosoftJhengHeiBold'));
  const bold = await pdfDoc.embedFont(boldFontBytes, { subset: false });
  const [
    logo,
    instagramQr,
    facebookQr,
    lineQr,
    bankCover,
    paymentQr
  ] = await Promise.all([
    pdfDoc.embedPng(await bytes('/assets/brand-logo-mark.png')),
    pdfDoc.embedPng(await bytes('/assets/brand-qr-instagram.png')),
    pdfDoc.embedPng(await bytes('/assets/brand-qr-facebook.png')),
    pdfDoc.embedPng(await bytes('/assets/brand-qr-line.png')),
    pdfDoc.embedPng(await bytes('/assets/bank-cover.png')),
    pdfDoc.embedPng(await bytes('/assets/payment-transfer-qr.png'))
  ]);

  const layout = quoteLayoutConfig.pdf;
  const page = pdfDoc.addPage([layout.page.width, layout.page.height]);
  const outer = { x: layout.outer.x, y: layout.outer.y, w: layout.outer.width, h: layout.outer.height };
  const headerH = layout.header.height;
  const itemLayout = layout.constructionItems;
  const barH = itemLayout.titleBarHeight;
  const noW = itemLayout.columns.numberWidth;
  const areaW = itemLayout.columns.areaWidth;
  const itemRowLayout = itemLayout.row;
  const detailWidth = outer.w - noW - areaW;
  const baseHeights = rows.map((row) => {
    const isFeaturedRow = itemRowLayout.featuredNumbers.includes(Number(row.number));
    const detailPaddingY = isFeaturedRow ? 5 : 3;
    const detailText = formatConstructionDetail(row.detail);
    const lines = wrap(detailText, font, itemRowLayout.detailFontSize, detailWidth - itemRowLayout.detailWrapInset).length;
    const measuredHeight = lines * itemRowLayout.detailLineHeight + detailPaddingY * 2 + 3;
    const minHeight = isFeaturedRow ? itemRowLayout.featuredMinHeight : itemRowLayout.normalMinHeight;
    return Math.max(minHeight, measuredHeight);
  });
  const totalBase = baseHeights.reduce((sum, height) => sum + height, 0) || itemLayout.sectionHeight;
  const minBottomHeight = 264;
  const maxItemH = outer.h - headerH - barH - minBottomHeight;
  const itemH = Math.min(Math.max(itemLayout.sectionHeight, totalBase), maxItemH);
  const bottomH = outer.h - headerH - barH - itemH;
  const headerY = outer.y;
  const barY = headerY + headerH;
  const itemY = barY + barH;
  const bottomY = itemY + itemH;

  roundedRect(page, outer.x, outer.y, outer.w, outer.h, 4, { color: C.white, borderColor: C.line, borderWidth: 1.1 });
  rect(page, outer.x, headerY, outer.w, headerH, { color: C.lightGreen, borderWidth: 0 });
  drawImageFit(page, logo, outer.x + 142, headerY + 20, 72, 72, { opacity: 0.08 });

  const leftW = layout.header.leftWidth;
  const brandW = layout.header.brandWidth;
  const noticeW = outer.w - leftW - brandW;
  const brandX = outer.x + leftW + noticeW;
  const titleLayout = layout.header.title;
  const metaLayout = layout.header.meta;
  const brandLayout = layout.header.brand;
  line(page, brandX, headerY, brandX, headerY + headerH, { color: C.border, thickness: brandLayout.dividerWidth });

  drawText(page, 'QUOTATION', outer.x + titleLayout.quotationX, headerY + titleLayout.quotationY, { font: bold, size: titleLayout.quotationFontSize, color: C.muted, maxWidth: leftW - titleLayout.quotationX * 2, align: 'center' });
  drawText(page, pending(form.title), outer.x + titleLayout.titleX, headerY + titleLayout.titleY, { font: bold, size: fitSize(pending(form.title), bold, titleLayout.titleMaxFontSize, leftW - titleLayout.titleX * 2, titleLayout.titleMinFontSize), color: C.darkGreen, maxWidth: leftW - titleLayout.titleX * 2, align: 'center', fauxBold: true });
  drawText(page, '如對本報價內容有任何疑問，歡迎透過 LINE 商家與我們聯繫。', outer.x + titleLayout.reminderX, headerY + titleLayout.reminderY, { font: bold, size: titleLayout.reminderFontSize, color: C.red, maxWidth: leftW - titleLayout.reminderX * 2, align: 'center' });

  const metaX = outer.x + metaLayout.x;
  const metaY = headerY + metaLayout.y;
  const labelW = metaLayout.labelWidth;
  const valueW = metaLayout.valueWidth;
  const rowH = metaLayout.rowHeight;
  [
    ['日期', pending(form.quoteDate), '有效日期至', pending(form.validUntil)],
    ['公司名稱', pending(form.company), '統編', pending(form.taxId)],
    ['聯絡人', pending(form.contact), '聯絡電話', pending(form.phone)],
    ['社區', pending(form.building), '型態', pending(form.projectType)]
  ].forEach((row, index) => {
    const y = metaY + index * rowH;
    cell(page, row[0], metaX, y, labelW, rowH, { font: bold, size: metaLayout.labelFontSize, align: 'center', fillColor: C.paleGreen, color: C.darkGreen, borderColor: C.border });
    cell(page, row[1], metaX + labelW, y, valueW, rowH, { font, size: metaLayout.valueFontSize, fillColor: C.lightGreen, color: C.ink, borderColor: C.border });
    cell(page, row[2], metaX + labelW + valueW, y, labelW, rowH, { font: bold, size: metaLayout.labelFontSize, align: 'center', fillColor: C.paleGreen, color: C.darkGreen, borderColor: C.border });
    cell(page, row[3], metaX + labelW * 2 + valueW, y, valueW, rowH, { font, size: metaLayout.valueFontSize, fillColor: C.lightGreen, color: C.ink, borderColor: C.border });
  });
  cell(page, '地址', metaX, metaY + rowH * 4, labelW, rowH, { font: bold, size: metaLayout.labelFontSize, align: 'center', fillColor: C.paleGreen, color: C.darkGreen, borderColor: C.border });
  cell(page, pending(form.address), metaX + labelW, metaY + rowH * 4, labelW + valueW * 2, rowH, { font, size: metaLayout.valueFontSize, fillColor: C.lightGreen, color: C.ink, borderColor: C.border });

  const noticeLayout = layout.constructionNotice;
  const noteX = outer.x + leftW + noticeLayout.insetLeft;
  drawText(page, '施工須知', noteX, headerY + noticeLayout.titleY, { font: bold, size: noticeLayout.titleFontSize, color: C.darkGreen, fauxBold: true });
  const noticeAvailableWidth = noticeW - noticeLayout.insetLeft;
  line(page, noteX, headerY + noticeLayout.ruleY, noteX + noticeAvailableWidth - noticeLayout.ruleRightInset, headerY + noticeLayout.ruleY, { color: C.border, thickness: 0.8 });
  const noticeCardGap = noticeLayout.cardGap ?? Math.max(3, noticeLayout.cardStepY - noticeLayout.cardHeight);
  const noticeCardWidth = noticeAvailableWidth - noticeLayout.cardRightInset;
  const noticeTextWidth = noticeCardWidth - noticeLayout.textX - (noticeLayout.textPaddingRight ?? 8);
  const noticeAvailableH = headerH - noticeLayout.cardStartY - (noticeLayout.bottomInset ?? 6);
  const noticeCardData = noticeCards(form.constructionNotes).map((card, index) => {
    const textSize = noticeLayout.textFontSizes?.[index] ?? (index === 3 ? noticeLayout.importantTextFontSize : noticeLayout.textFontSize);
    const lineHeight = noticeLayout.lineHeights?.[index] ?? (index === 3 ? noticeLayout.importantLineHeight : noticeLayout.lineHeight);
    const textH = measureTextHeight(card.text, bold, textSize, noticeTextWidth, lineHeight);
    const baseCardHeight = noticeLayout.cardHeights?.[index] ?? (index === 3
      ? (noticeLayout.importantCardHeight ?? noticeLayout.cardHeight)
      : (noticeLayout.normalCardHeight ?? noticeLayout.cardHeight));
    const naturalHeight = Math.max(
      baseCardHeight,
      noticeLayout.textY + textH + (noticeLayout.cardPaddingBottom ?? 6)
    );
    return { card, index, textSize, lineHeight, naturalHeight };
  });
  const noticeTotalNaturalH = noticeCardData.reduce((sum, item) => sum + item.naturalHeight, 0) + noticeCardGap * Math.max(0, noticeCardData.length - 1);
  const noticeHeightRatio = noticeTotalNaturalH > noticeAvailableH ? Math.max(0.72, (noticeAvailableH - noticeCardGap * Math.max(0, noticeCardData.length - 1)) / (noticeTotalNaturalH - noticeCardGap * Math.max(0, noticeCardData.length - 1))) : 1;
  let noticeCardY = headerY + noticeLayout.cardStartY;
  noticeCardData.forEach(({ card, index, textSize, lineHeight, naturalHeight }) => {
    const h = Math.max(noticeLayout.cardMinHeight ?? 28, naturalHeight * noticeHeightRatio);
    roundedRect(page, noteX, noticeCardY, noticeCardWidth, h, 5.5, { color: C.white, borderColor: C.border, borderWidth: noticeLayout.cardBorderWidth });
    roundedRect(page, noteX + 7, noticeCardY + (noticeLayout.iconBgTopY ?? Math.max(5, (h - 25) / 2)), 28, 25, 4.5, { color: C.paleGreen, borderWidth: 0 });
    drawNoticeIcon(page, index, noteX + 10, noticeCardY + (noticeLayout.iconTopY ?? Math.max(6, (h - 22.5) / 2)), 22.5);
    drawText(page, card.title, noteX + noticeLayout.textX, noticeCardY + noticeLayout.titleTextY, { font: bold, size: noticeLayout.cardTitleFontSize, color: C.darkGreen, fauxBold: true, textLift: 0.8 });
    drawText(page, card.text, noteX + noticeLayout.textX, noticeCardY + noticeLayout.textY, {
      font,
      size: textSize,
      color: card.text.includes('#d71920') ? C.red : C.ink,
      maxWidth: noticeTextWidth,
      maxHeight: h - noticeLayout.textY - (noticeLayout.cardPaddingBottom ?? 5),
      minSize: index === 3 ? 5.2 : 6.6,
      lineHeight,
      textLift: 0.6
    });
    noticeCardY += h + noticeCardGap;
  });

  drawImageFit(page, logo, brandX + brandLayout.logoX, headerY + brandLayout.logoY, brandW - brandLayout.logoWidthInset, brandLayout.logoHeight);
  drawText(page, '微笑清家', brandX + brandLayout.nameX, headerY + brandLayout.nameY, { font: bold, size: brandLayout.nameFontSize, color: C.darkGreen, maxWidth: brandW - brandLayout.nameX * 2, align: 'center' });
  drawText(page, 'meant2clean.com', brandX + brandLayout.siteX, headerY + brandLayout.siteY, { font, size: brandLayout.siteFontSize, color: C.muted, maxWidth: brandW - brandLayout.siteX * 2, align: 'center' });
  const socialQrSize = 50;
  const socialQrY = 83;
  const socialLabelY = 79;
  const instagramQrX = -2.5;
  const facebookQrX = 39.5;
  drawText(page, 'IG', brandX + instagramQrX, headerY + socialLabelY, { font: bold, size: brandLayout.secondaryQrLabelFontSize, color: C.darkGreen, maxWidth: socialQrSize, align: 'center' });
  drawText(page, 'FB', brandX + facebookQrX, headerY + socialLabelY, { font: bold, size: brandLayout.secondaryQrLabelFontSize, color: C.darkGreen, maxWidth: socialQrSize, align: 'center' });
  page.drawImage(instagramQr, {
    x: brandX + instagramQrX,
    y: page.getHeight() - (headerY + socialQrY) - socialQrSize,
    width: socialQrSize,
    height: socialQrSize
  });
  page.drawImage(facebookQr, {
    x: brandX + facebookQrX,
    y: page.getHeight() - (headerY + socialQrY) - socialQrSize,
    width: socialQrSize,
    height: socialQrSize
  });
  drawImageFit(page, lineQr, brandX + brandLayout.lineQrX, headerY + brandLayout.lineQrY, brandW - brandLayout.lineQrWidthInset, brandLayout.lineQrHeight);

  rect(page, outer.x, headerY, outer.w, headerH, { borderColor: C.line, borderWidth: 0.95 });
  line(page, brandX, headerY, brandX, headerY + headerH, { color: C.line, thickness: 0.85 });
  line(page, outer.x, headerY + headerH, outer.x + outer.w, headerY + headerH, { color: C.line, thickness: 0.95 });

  drawDarkTitleBar(page, outer.x, barY, outer.w, barH);
  const roomTitle = formatRoomSummary(form.roomSummary);
  const itemTitle = roomTitle ? `${roomTitle}   施 作 項 目` : '施 作 項 目';
  drawText(page, itemTitle, outer.x, barY + itemLayout.title.y, { font: bold, size: itemLayout.title.fontSize, color: C.white, maxWidth: outer.w, align: 'center', fauxBold: true });

  const totalBaseHeight = baseHeights.reduce((sum, height) => sum + height, 0) || 1;
  const ratio = totalBaseHeight > itemH ? itemH / totalBaseHeight : 1;
  let yCursor = itemY;
  rows.forEach((row, index) => {
    const h = (baseHeights[index] || itemRowLayout.fallbackHeight) * ratio;
    const isFeaturedRow = itemRowLayout.featuredNumbers.includes(Number(row.number));
    const fill = isFeaturedRow ? C.yellow : C.white;
    const detailSize = itemRowLayout.detailFontSize;
    const detailLineHeight = itemRowLayout.detailLineHeight;
    cell(page, String(row.number), outer.x, yCursor, noW, h, { font, size: itemRowLayout.numberFontSize, align: 'center', fillColor: fill, color: C.green, textLift: 0.5 });
    cell(page, row.area, outer.x + noW, yCursor, areaW, h, { font: bold, size: itemRowLayout.areaFontSize, align: 'center', fillColor: fill, color: C.green, textLift: 0.5 });
    cell(page, formatConstructionDetail(row.detail), outer.x + noW + areaW, yCursor, detailWidth, h, {
      font,
      size: detailSize,
      fillColor: fill,
      color: C.ink,
      paddingX: itemRowLayout.detailPaddingX + 8,
      paddingY: isFeaturedRow ? 5 : 3,
      valign: h > itemRowLayout.topAlignThreshold ? 'top' : 'middle',
      lineHeight: detailLineHeight,
      minSize: ratio < 1 ? itemRowLayout.detailMinFontSize : itemRowLayout.detailFontSize,
      textLift: isFeaturedRow ? 1.1 : 0.5
    });
    yCursor += h;
  });
  rect(page, outer.x, itemY, outer.w, itemH, { borderColor: C.line, borderWidth: 0.95 });
  line(page, outer.x + noW, itemY, outer.x + noW, itemY + itemH, { color: C.line, thickness: 0.75 });
  line(page, outer.x + noW + areaW, itemY, outer.x + noW + areaW, itemY + itemH, { color: C.line, thickness: 0.75 });

  rect(page, outer.x, bottomY, outer.w, bottomH, { color: C.paleGreen, borderColor: C.line, borderWidth: 0.95 });
  const feeLayout = layout.feeSummary;
  const bottomLeftW = feeLayout.columns.leftWidth;
  const bottomRightW = outer.w - bottomLeftW;
  const headH = feeLayout.headerHeight;
  const summaryH = feeLayout.summaryHeight;
  const mainH = bottomH - headH - summaryH - 22;
  cell(page, '費 用 摘 要', outer.x, bottomY, bottomLeftW, headH, { font: bold, size: 13.2, align: 'center', fillColor: C.lightGreen, color: C.darkGreen, fauxBold: true, textLift: 0.8 });
  cell(page, '條 款 及 簽 核', outer.x + bottomLeftW, bottomY, bottomRightW, headH, { font: bold, size: 13.2, align: 'center', fillColor: C.lightGreen, color: C.darkGreen, fauxBold: true, textLift: 0.8 });

  roundedRect(page, outer.x, bottomY, outer.w, headH, 3.5, { borderColor: C.line, borderWidth: 0.8 });

  const feeY = bottomY + headH;
  const cardW = bottomLeftW / 2;
  [
    [pending(form.serviceFeeLabel), [['小計', money(form.serviceSubtotal)], ['稅額', money(form.serviceTax)], ['總計含稅', money(form.serviceTotal)]]],
    [pending(form.cleaningFeeLabel), [['小計', money(form.cleaningSubtotal)], ['稅額', money(form.cleaningTax)], ['總計含稅', money(form.cleaningTotal)]]]
  ].forEach(([title, feeRows], cardIndex) => {
    const x = outer.x + cardW * cardIndex;
    roundedRect(page, x, feeY, cardW, feeLayout.feeCardHeight, 2.5, { color: C.white, borderColor: C.line, borderWidth: feeLayout.feeCardBorderWidth + 0.1 });
    drawText(page, title, x + feeLayout.feeCardTitle.x, feeY + feeLayout.feeCardTitle.y, { font: bold, size: feeLayout.feeCardTitle.fontSize, color: C.red, fauxBold: true, textLift: 0.9 });
    feeRows.forEach(([label, value], rowIndex) => {
      const y = feeY + feeLayout.feeRows.startY + rowIndex * feeLayout.feeRows.stepY;
      drawText(page, label, x + feeLayout.feeRows.labelX, y, { font: bold, size: feeLayout.feeRows.fontSize, color: C.red, textLift: 1.1 });
      drawText(page, value, x + feeLayout.feeRows.valueX, y, { font: bold, size: feeLayout.feeRows.fontSize, color: C.red, textLift: 1.1 });
      line(page, x + feeLayout.feeRows.separatorLeftInset, y + feeLayout.feeRows.separatorY, x + cardW - feeLayout.feeRows.separatorRightInset, y + feeLayout.feeRows.separatorY, { color: C.red, thickness: feeLayout.feeRows.separatorWidth + 0.1 });
    });
  });
  const totalY = feeY + feeLayout.feeCardHeight;
  const totalText = totalFeeChineseText(form);
  cell(page, totalText ? `${totalText}【含稅】` : '', outer.x, totalY, bottomLeftW, feeLayout.totalRow.height, { font: bold, size: feeLayout.totalRow.fontSize, align: 'center', fillColor: C.yellowStrong, color: C.red, fauxBold: true, minSize: 5.8, lineHeight: feeLayout.totalRow.fontSize * 1.08, paddingY: 1.5, textLift: 1.2 });
  cell(page, `訂金匯款：${money(form.deposit)}`, outer.x, totalY + feeLayout.totalRow.height, bottomLeftW / 2, feeLayout.installmentRow.height, { font: bold, size: feeLayout.installmentRow.fontSize, align: 'center', fillColor: C.goldSoft, color: C.red, minSize: 5.8, paddingY: 2, textLift: 0.9 });
  cell(page, `尾款：${money(form.balance)}`, outer.x + bottomLeftW / 2, totalY + feeLayout.totalRow.height, bottomLeftW / 2, feeLayout.installmentRow.height, { font: bold, size: feeLayout.installmentRow.fontSize, align: 'center', fillColor: C.goldSoft, color: C.red, minSize: 5.8, paddingY: 2, textLift: 0.9 });

  const termsX = outer.x + bottomLeftW;
  const termsY = bottomY + headH;
  const termsLayout = layout.termsSignature.terms;
  [
    ['1', '付款條件', paymentConditionText(form)],
    ['2', '付款期限', pending(form.paymentDeadline)],
    ['3', '施作日期', pending(form.serviceDate)]
  ].forEach((row, index) => {
    const y = termsY + index * termsLayout.rowHeight;
    cell(page, row[0], termsX, y, termsLayout.numberWidth, termsLayout.rowHeight, { font: bold, size: termsLayout.numberFontSize, align: 'center', fillColor: C.lightGreen, color: C.green, borderColor: C.border, textLift: 0.7 });
    cell(page, row[1], termsX + termsLayout.numberWidth, y, termsLayout.labelWidth, termsLayout.rowHeight, { font: bold, size: termsLayout.labelFontSize, align: 'center', fillColor: C.paleGreen, color: C.darkGreen, borderColor: C.border, textLift: 0.7 });
    cell(page, row[2], termsX + termsLayout.numberWidth + termsLayout.labelWidth, y, bottomRightW - termsLayout.numberWidth - termsLayout.labelWidth, termsLayout.rowHeight, { font: bold, size: termsLayout.valueFontSize, fillColor: C.paleGreen, color: C.red, borderColor: C.border, textLift: 0.7 });
  });
  const totalRowBottomY = totalY + feeLayout.totalRow.height;
  const termNoteY = termsY + termsLayout.noteY;
  const termNoteH = Math.max(17, totalRowBottomY - termNoteY);
  cell(page, '驗收完畢完成驗收通過（照片/影片或放棄驗收）\n視同「完成通過驗收」 事後無法要求管家再回現場進行二次清潔。', termsX, termNoteY, bottomRightW, termNoteH, { font: bold, size: 7.2, fillColor: C.yellow, color: C.ink, borderColor: C.line, borderWidth: 0.75, lineHeight: 8.4, minSize: 6.2, paddingX: 7, paddingY: 1, textLift: 0.4 });

  const mainY = bottomY + headH + summaryH;
  const signatureY = totalRowBottomY;
  const signatureH = outer.y + outer.h - 22 - signatureY;
  const paymentInfoH = 14;
  cell(page, '付款資訊   匯款後請提供末五碼，以利對帳', outer.x, mainY, bottomLeftW, paymentInfoH, { font: bold, size: 8.2, fillColor: C.white, color: C.ink, borderColor: C.line, minSize: 6.5, paddingX: 8, paddingY: 1.5, textLift: 0.7 });
  const paymentY = mainY + paymentInfoH;
  const qrW = 92;
  rect(page, outer.x, paymentY, bottomLeftW - qrW, mainH - paymentInfoH, { color: C.white, borderWidth: 0 });
  line(page, outer.x + 1, paymentY, outer.x + bottomLeftW - qrW - 1, paymentY, { color: C.white, thickness: 1.2 });
  drawImageFit(page, bankCover, outer.x + 8, paymentY + 5, bottomLeftW - qrW - 16, mainH - paymentInfoH - 10);
  const qrSectionY = mainY;
  rect(page, outer.x + bottomLeftW - qrW, qrSectionY, qrW, mainH, { color: C.paleGreen, borderWidth: 0 });
  roundedCell(page, '掃碼付款', outer.x + bottomLeftW - qrW + 18, qrSectionY + 4, 56, 16, 8, { font: bold, size: 8.3, align: 'center', fillColor: C.green, color: C.white, borderColor: C.green, minSize: 6.5, paddingY: 3 });
  drawImageFit(page, paymentQr, outer.x + bottomLeftW - qrW + 4, qrSectionY + 22, 84, 122);

  const signatureLayout = layout.termsSignature.signature;
  const sigW = bottomRightW / signatureLayout.columns;
  [
    ['接受報價簽名', C.gold],
    ['驗收簽名', C.sage]
  ].forEach(([title, border], index) => {
    const x = termsX + sigW * index;
    const signatureFill = index === 0 ? C.goldSoft : C.sageSoft;
    const signatureFrameX = x;
    const signatureFrameY = signatureY;
    const signatureFrameW = sigW;
    const signatureFrameH = signatureH;
    const titleY = signatureFrameY + 5;
    const signBoxX = signatureFrameX + 7;
    const signBoxY = signatureFrameY + 26;
    const signBoxW = signatureFrameW - 14;
    const signBoxH = signatureFrameH - 34;
    const signLineY = signBoxY + signBoxH - 24;
    rect(page, signatureFrameX, signatureFrameY, signatureFrameW, signatureFrameH, { color: signatureFill, borderColor: C.line, borderWidth: signatureLayout.cardBorderWidth });
    drawText(page, title, signatureFrameX, titleY, { font: bold, size: signatureLayout.titleFontSize, color: C.darkGreen, maxWidth: signatureFrameW, align: 'center', fauxBold: true, textLift: 0.5 });
    rect(page, signBoxX, signBoxY, signBoxW, signBoxH, { color: C.white, borderWidth: 0 });
    line(page, signBoxX, signBoxY, signBoxX + signBoxW, signBoxY, { color: border, thickness: signatureLayout.areaBorderWidth, dashArray: signatureLayout.areaDash });
    line(page, signBoxX, signBoxY, signBoxX, signBoxY + signBoxH, { color: border, thickness: signatureLayout.areaBorderWidth, dashArray: signatureLayout.areaDash });
    line(page, signBoxX + signBoxW, signBoxY, signBoxX + signBoxW, signBoxY + signBoxH, { color: border, thickness: signatureLayout.areaBorderWidth, dashArray: signatureLayout.areaDash });
    line(page, signBoxX, signBoxY + signBoxH, signBoxX + signBoxW, signBoxY + signBoxH, { color: border, thickness: signatureLayout.areaBorderWidth, dashArray: signatureLayout.areaDash });
    line(page, signBoxX + signatureLayout.lineInsetX, signLineY, signBoxX + signBoxW - signatureLayout.lineInsetX, signLineY, { color: C.green, thickness: signatureLayout.lineWidth });
    drawText(page, '簽名 / 日期', signBoxX, signLineY + 7, { font, size: signatureLayout.lineLabelFontSize, color: C.green, maxWidth: signBoxW - 8, align: 'right', textLift: 0.7 });
  });

  rect(page, outer.x, bottomY, outer.w, bottomH, { borderColor: C.line, borderWidth: 0.95 });
  line(page, outer.x + bottomLeftW, bottomY, outer.x + bottomLeftW, outer.y + outer.h - 22, { color: C.line, thickness: 0.85 });
  line(page, outer.x, bottomY + headH, outer.x + outer.w, bottomY + headH, { color: C.line, thickness: 0.85 });
  line(page, outer.x, bottomY + headH + summaryH, outer.x + bottomLeftW, bottomY + headH + summaryH, { color: C.line, thickness: 0.85 });
  line(page, outer.x, outer.y + outer.h - 22, outer.x + outer.w, outer.y + outer.h - 22, { color: C.line, thickness: 0.85 });
  line(page, outer.x + cardW, feeY, outer.x + cardW, totalY, { color: C.line, thickness: 0.75 });
  line(page, outer.x, totalY, outer.x + bottomLeftW, totalY, { color: C.line, thickness: 0.75 });
  line(page, outer.x, totalY + feeLayout.totalRow.height, outer.x + bottomLeftW, totalY + feeLayout.totalRow.height, { color: C.line, thickness: 0.75 });
  line(page, outer.x + bottomLeftW / 2, totalY + feeLayout.totalRow.height, outer.x + bottomLeftW / 2, totalY + feeLayout.totalRow.height + feeLayout.installmentRow.height, { color: C.line, thickness: 0.75 });

  cell(page, '本估價單內容依場勘紀錄與客戶提供資訊整理，實際施作範圍以雙方確認版本為準。', outer.x, outer.y + outer.h - 22, outer.w, 22, { font, size: 7.8, align: 'center', fillColor: C.paleGreen, color: C.muted });

  roundedRect(page, outer.x, outer.y, outer.w, outer.h, 4, { borderColor: C.line, borderWidth: 1.1 });

  const encoded = encodePdfImportText(buildPlainText(form, rows));
  drawText(page, `${PDF_IMPORT_START}\n${encoded.match(/.{1,90}/g).join('\n')}\n${PDF_IMPORT_END}`, 2, 2, { font, size: 1, color: C.white, opacity: 0 });

  return pdfDoc.save();
}

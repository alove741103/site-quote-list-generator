import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, GripVertical, Plus, Sparkles, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';
import './styles.css';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const DEFAULT_CATEGORIES = ['牆面地面', '客廳玄關', '臥室', '廁所', '廚房', '陽台', '窗戶', '注意事項', '其他'];
const CATEGORIES = DEFAULT_CATEGORIES;
const DEFAULT_CATEGORY_CONFIG = DEFAULT_CATEGORIES.map((category) => ({ key: category, label: category }));
const CLEANING_TEMPLATE_OPTIONS = ['裝潢細清', '遷入清潔', '遷出清潔', '居家清潔', '空屋清潔', '其他'];

const categoryRules = [
  { category: '牆面地面', keywords: ['牆', '壁', '地', '地板', '磁磚', '油漆', '壁癌', '踢腳', '天花'] },
  { category: '客廳玄關', keywords: ['客廳', '玄關', '鞋櫃', '電視牆', '沙發', '大門', '門口'] },
  { category: '臥室', keywords: ['臥室', '房間', '主臥', '次臥', '床', '衣櫃', '書房'] },
  { category: '廁所', keywords: ['廁所', '浴室', '衛浴', '馬桶', '洗手台', '淋浴', '乾濕', '排水'] },
  { category: '廚房', keywords: ['廚房', '流理台', '瓦斯', '抽油煙', '櫥櫃', '水槽', '爐'] },
  { category: '陽台', keywords: ['陽台', '後陽台', '前陽台', '曬衣', '洗衣機'] },
  { category: '窗戶', keywords: ['窗', '窗戶', '紗窗', '玻璃', '窗框', '落地窗'] },
  { category: '注意事項', keywords: ['注意', '提醒', '限制', '不可', '需確認', '待確認', '管委會', '電梯', '施工時間'] }
];

const STANDARD_NOTICE_ITEMS = [
  '廁所乾濕分離門如有發霉、髒污及水垢皂垢，管家都會盡量清潔，但可能無法100%去除還原。',
  '石材檯面材質可能有水垢沉積，無法保證100%去除還原。',
  '廚房重度油垢、瓦斯爐架生鏽或燒焦痕跡，可能無法100%去除還原。',
  '大理石如需拋光需尋求專業廠商。'
];

const STANDARD_OTHER_ITEMS = [
  '施作內容不包含窗簾、捲簾、百葉窗。',
  '廢棄物僅協助集中整理，不含清運。',
  '無移位清潔。',
  '若現場狀況與場勘照片或影片不同，需加時或調整費用時將另行說明。',
  '如有疑問歡迎於Line商家提出。'
];

const CLEANING_TEMPLATES = {
  裝潢細清: {
    title: '裝潢細清 估價單',
    items: {
      牆面地面: '全室地板粉塵清潔、踢腳板擦拭、地面細部掃拖清潔。',
      客廳玄關: '大門、門框、開關面板、插座、玄關櫃與客廳裝潢表面粉塵擦拭。',
      臥室: '門片、門框、櫃體內外、層板、窗台及家具表面粉塵擦拭。',
      廁所: '廁所天花板、牆面、洗手台、乾濕分離玻璃、馬桶、鏡子、抽風機排風口與五金水垢清潔。',
      廚房: '廚房櫃體內外、牆面、檯面、流理台、爐具外觀與抽油煙機外觀粉塵油污清潔。',
      陽台: '陽台地板、牆面、欄杆、排水孔與曬衣桿擦拭清潔。',
      窗戶: '玻璃、窗框、窗溝、紗窗粉塵清潔。',
      注意事項: '裝潢殘膠、油漆點、矽利康殘留依現況盡量處理，特殊刮除另行確認。',
      其他: '施工粉塵較重區域會優先加強，實際清潔範圍依現場確認。'
    }
  },
  遷入清潔: {
    title: '遷入清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖清潔。',
      客廳玄關: '大門、門框、開關面板、家具表面擦拭。',
      臥室: '門片及大門擦拭、全室櫃體內外擦拭、家具表面擦拭。',
      廁所: '廁所天花板、牆面、洗手台、乾濕分離玻璃、馬桶、鏡子、抽風機排風口清潔。需除黴除垢。',
      廚房: '廚房櫃體內外擦拭、牆面、檯面、流理台、烘碗機、爐具外觀清潔。',
      陽台: '陽台地板掃拖清潔。',
      窗戶: '玻璃、窗框、窗溝、紗窗清潔。',
      注意事項: '入住前清潔以可使用狀態為目標，重度汙垢或舊有痕跡依現場狀況盡量處理。',
      其他: '施作範圍依場勘內容與雙方確認版本為準。'
    }
  },
  遷出清潔: {
    title: '遷出清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖清潔、踢腳板與牆面可及處擦拭。',
      客廳玄關: '大門、門框、開關面板、玄關櫃、客廳櫃體與家具表面擦拭。',
      臥室: '臥室門片、門框、衣櫃內外、窗台與家具表面擦拭。',
      廁所: '廁所天花板、牆面、洗手台、馬桶、鏡子、乾濕分離玻璃、排風口清潔，水垢皂垢盡量處理。',
      廚房: '廚房櫃體內外、牆面、檯面、流理台、爐具外觀與抽油煙機外觀油污清潔。',
      陽台: '陽台地板、欄杆、排水孔、洗衣機周邊可及處掃拖清潔。',
      窗戶: '玻璃、窗框、窗溝、紗窗清潔。',
      注意事項: '遷出清潔不含垃圾清運與大型家具移位，現場遺留物需先集中。',
      其他: '若需房東驗收前加強區域，可於施作前提出確認。'
    }
  },
  居家清潔: {
    title: '居家清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖、踢腳板與可及牆面表面擦拭。',
      客廳玄關: '玄關、大門、開關面板、桌面、櫃體外觀與家具表面擦拭整理。',
      臥室: '臥室地板、門片、家具表面、床邊與櫃體外觀擦拭。',
      廁所: '洗手台、鏡面、馬桶、淋浴區、地面、排水孔與可及牆面清潔。',
      廚房: '檯面、流理台、爐具外觀、櫃體外觀、牆面局部油污與地面清潔。',
      陽台: '陽台地板掃拖、欄杆與洗衣機周邊可及處擦拭。',
      窗戶: '窗台、窗框可及處與玻璃局部擦拭。',
      注意事項: '居家清潔以日常維護為主，重度油垢、水垢或櫃體內部需另行確認。',
      其他: '貴重物品、私人文件與易碎物品請先收妥。'
    }
  },
  空屋清潔: {
    title: '空屋清潔 估價單',
    items: {
      牆面地面: '全室地板掃拖、踢腳板、牆面可及處與角落落塵清潔。',
      客廳玄關: '大門、門框、玄關櫃、客廳櫃體內外、開關面板與窗台擦拭。',
      臥室: '臥室門片、門框、櫃體內外、層板、窗台與地面清潔。',
      廁所: '廁所天花板、牆面、洗手台、馬桶、鏡子、乾濕分離玻璃、排風口與地面清潔。',
      廚房: '廚房櫃體內外、流理台、檯面、牆面、爐具外觀、烘碗機與地面清潔。',
      陽台: '陽台地板、牆面可及處、欄杆、排水孔與曬衣桿清潔。',
      窗戶: '全室玻璃、窗框、窗溝、紗窗清潔。',
      注意事項: '空屋清潔不含裝潢殘膠大面積刮除、油漆工程或大型廢棄物清運。',
      其他: '若現場仍有物品，需先確認是否可移動或避開施作。'
    }
  },
  其他: {
    title: '清潔服務 估價單',
    items: {
      牆面地面: '依現場需求確認牆面、地面、踢腳板與可及處清潔範圍。',
      客廳玄關: '依現場需求確認大門、玄關、客廳櫃體與家具表面清潔範圍。',
      臥室: '依現場需求確認臥室門片、櫃體、家具表面與地面清潔範圍。',
      廁所: '依現場需求確認衛浴設備、牆面、地面、玻璃與五金清潔範圍。',
      廚房: '依現場需求確認廚房櫃體、檯面、流理台、爐具與牆面清潔範圍。',
      陽台: '依現場需求確認陽台地板、欄杆、排水孔與可及處清潔範圍。',
      窗戶: '依現場需求確認玻璃、窗框、窗溝與紗窗清潔範圍。',
      注意事項: '特殊材質、重度汙垢、施工限制與加價項目需另行確認。',
      其他: '其他未列項目依雙方確認內容辦理。'
    }
  }
};

function numberedList(items) {
  return items.map((item, index) => `${index + 1} ${item}`).join('\n');
}

function buildStandardSpecialNotes() {
  return numberedList([...STANDARD_NOTICE_ITEMS, ...STANDARD_OTHER_ITEMS]);
}

function templateItemsToRows(template) {
  return DEFAULT_CATEGORY_CONFIG.map((category) => ({
    area: category.key,
    detail: template?.items?.[category.key] || '待確認'
  }));
}

const defaultCleaningType = '遷入清潔';
const defaultSpecialNotes = buildStandardSpecialNotes();

const defaultTerms = `1. 付款條件：待確認。
2. 付款期限：施作完畢後付款，匯費勿內扣。
3. 施作日期：待確認。
驗收完畢完成驗收通過，視同完成通過驗收，事後無法要求再回現場進行二次清潔。`;

const defaultPaymentNote = `戶名：待確認
銀行：待確認
帳號：待確認
匯款後請提供末五碼，以利對帳。`;

const PAYMENT_CONDITIONS = ['匯款', '現金', '其他'];
const PDF_IMPORT_START = 'SITE_QUOTE_IMPORT_START';
const PDF_IMPORT_END = 'SITE_QUOTE_IMPORT_END';

function todayString() {
  return dateOffsetString(0);
}

function dateOffsetString(days) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

const emptyForm = {
  title: CLEANING_TEMPLATES[defaultCleaningType].title,
  cleaningType: defaultCleaningType,
  company: '',
  taxId: '',
  contact: '',
  phone: '',
  building: '',
  address: '',
  roomSummary: '',
  projectType: '',
  quoteDate: todayString(),
  validUntil: dateOffsetString(3),
  serviceDate: todayString(),
  paymentCondition: '匯款',
  paymentConditionOther: '',
  serviceFeeLabel: '清潔費用 A',
  serviceSubtotal: '',
  serviceTax: '',
  serviceTotal: '',
  cleaningFeeLabel: '清潔費用 B',
  cleaningSubtotal: '',
  cleaningTax: '',
  cleaningTotal: '',
  deposit: '',
  balance: '',
  specialNotes: defaultSpecialNotes,
  terms: defaultTerms,
  paymentNote: defaultPaymentNote,
  rawText: ''
};

function pending(value) {
  return value?.trim() || '待確認';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stripColorTags(value) {
  return String(value).replace(/\[color=#[0-9a-fA-F]{6}\]([\s\S]*?)\[\/color\]/g, '$1');
}

function richTextHtml(value) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\[color=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/color\]/g, '<span style="color:$1;font-weight:700;">$2</span>')
    .replace(/\n/g, '<br>');
}

function rgbToHex(value) {
  if (!value) return '';
  if (value.startsWith('#')) return value.slice(0, 7);
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return '';
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function htmlToRichText(html) {
  const template = document.createElement('template');
  template.innerHTML = html;

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeName === 'BR') return '\n';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const element = node;
    const text = Array.from(element.childNodes).map(walk).join('');
    const color = rgbToHex(element.style?.color || element.getAttribute?.('color') || '');
    const blockBreak = ['DIV', 'P'].includes(element.nodeName) ? '\n' : '';
    const content = color ? `[color=${color}]${text}[/color]` : text;
    return content + blockBreak;
  }

  return Array.from(template.content.childNodes).map(walk).join('').replace(/\n{3,}/g, '\n\n').replace(/\n$/g, '');
}

function RichTextEditor({ editorId, value, onChange, onActivate, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = richTextHtml(value);
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => onActivate(editorId, ref.current)}
      onMouseUp={() => onActivate(editorId, ref.current)}
      onKeyUp={() => onActivate(editorId, ref.current)}
      onInput={(event) => onChange(htmlToRichText(event.currentTarget.innerHTML))}
      className={className}
      dangerouslySetInnerHTML={{ __html: richTextHtml(value) }}
    />
  );
}

function AccordionSection({ title, description, open, onToggle, className = '', children }) {
  return (
    <section className={`shrink-0 overflow-hidden rounded-md border border-[#dfe8d8] bg-white ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-[#fbfdf8] px-4 py-3 text-left transition hover:bg-[#f4f9ef]"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-bold text-stone-800">{title}</span>
          {description ? <span className="mt-1 block text-xs leading-5 text-stone-500">{description}</span> : null}
        </span>
        <ChevronDown className={`shrink-0 text-moss-700 transition-transform ${open ? 'rotate-180' : ''}`} size={20} />
      </button>
      {open ? <div className="space-y-4 border-t border-[#dfe8d8] p-4">{children}</div> : null}
    </section>
  );
}

function RichText({ text }) {
  const parts = [];
  const source = String(text);
  const pattern = /\[color=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/color\]/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(source))) {
    if (match.index > lastIndex) {
      parts.push({ text: source.slice(lastIndex, match.index) });
    }
    parts.push({ text: match[2], color: match[1] });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < source.length) {
    parts.push({ text: source.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((part, index) =>
        part.color ? (
          <span key={index} style={{ color: part.color, fontWeight: 700 }}>
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

function normalizeText(text) {
  return stripColorTags(text)
    .replace(/\r/g, '\n')
    .split(/\n|。|；|;|、(?=\S{3,})/g)
    .map((line) => line.replace(/^[\s\d.、\-*•]+/, '').trim())
    .filter((line) => !/^(社區|社區大樓|社區\/大樓|大樓|案場|門牌|地址|地點|位置|聯絡人|聯絡人姓名|窗口|電話|聯絡電話|手機|聯絡手機|房型|格局|型態|案件類型|清潔類型)\s*[:：@]/.test(line))
    .filter(Boolean);
}

function detectCategory(text) {
  const compact = text.toLowerCase();
  return categoryRules.find((rule) => rule.keywords.some((keyword) => compact.includes(keyword)))?.category || '其他';
}

function localOrganize(rawText) {
  const lines = normalizeText(rawText);
  if (!lines.length) return [{ area: '其他', detail: '施工內容待確認' }];
  return lines.map((line) => ({ area: detectCategory(line), detail: line || '待確認' }));
}

function sanitizeAiRows(rows) {
  const validAreas = new Set(CATEGORIES);
  const cleaned = Array.isArray(rows)
    ? rows
        .map((row) => ({
          area: validAreas.has(row.area) ? row.area : detectCategory(`${row.area || ''} ${row.detail || ''}`),
          detail: row.detail?.trim() || '待確認'
        }))
        .filter((row) => !/^(社區|社區大樓|社區\/大樓|大樓|案場|門牌|地址|地點|位置|聯絡人|聯絡人姓名|窗口|電話|聯絡電話|手機|聯絡手機|房型|格局|型態|案件類型|清潔類型)\s*[:：@]/.test(stripColorTags(row.detail)))
    : [];
  return cleaned.length ? cleaned : [{ area: '其他', detail: '施工內容待確認' }];
}

function normalizeItemText(value) {
  return stripColorTags(value)
    .replace(/\s+/g, '')
    .replace(/[，,。；;、.]/g, '')
    .toLowerCase();
}

function linesFromText(text) {
  return pending(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function money(value) {
  return value?.trim() ? `NT$ ${value.trim()}` : '待確認';
}

function formatRoomSummary(value) {
  const source = String(value || '').trim();
  if (!source) return '待確認';
  const slashMatch = source.match(/^(\d+)\s*[\/／]\s*(\d+)\s*[\/／]\s*(\d+)(?:\s*[\/／]\s*(\d+))?$/);
  if (slashMatch) {
    return `${slashMatch[1]}房${slashMatch[2]}廳${slashMatch[3]}衛${slashMatch[4] ? `${slashMatch[4]}陽台` : ''}`;
  }
  return source;
}

function moneyNumber(value) {
  const normalized = String(value || '').replace(/[^\d.-]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
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

function totalFeeText(form) {
  const serviceAmount = feeAmount(form.serviceTotal, form.serviceSubtotal, form.serviceTax);
  const cleaningAmount = feeAmount(form.cleaningTotal, form.cleaningSubtotal, form.cleaningTax);
  if (serviceAmount === null && cleaningAmount === null) return '待確認';
  return `NT$ ${((serviceAmount || 0) + (cleaningAmount || 0)).toLocaleString('zh-TW')}`;
}

function paymentConditionText(form) {
  return form.paymentCondition === '其他' ? pending(form.paymentConditionOther) : pending(form.paymentCondition);
}

function pickField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[，,。；;]+$/g, '');
  }
  return '';
}

function cleanInferredField(value) {
  return String(value || '')
    .split('\n')[0]
    .replace(/^(是|為|在|於)\s*/g, '')
    .replace(/[，,。；;、]+$/g, '')
    .trim();
}

function detectProjectType(text) {
  const types = ['退租', '遷出', '遷入', '入住前', '入住中', '空屋', '裝潢後', '新成屋', '細清', '粗清', '交屋', '大掃除'];
  return types.find((type) => text.includes(type)) || '';
}

function detectCleaningType(text) {
  if (/裝潢|細清|新成屋|交屋/.test(text)) return '裝潢細清';
  if (/遷入|入住前/.test(text)) return '遷入清潔';
  if (/遷出|退租/.test(text)) return '遷出清潔';
  if (/居家|日常|大掃除/.test(text)) return '居家清潔';
  if (/空屋/.test(text)) return '空屋清潔';
  return '';
}

function detectPhone(text) {
  return pickField(text, [
    /(?:聯絡電話|聯絡手機|手機|電話|tel|phone)\s*[:：]?\s*([+()0-9\-\s]{8,})/i,
    /((?:09\d{2}|0\d{1,2})[-\s]?\d{3,4}[-\s]?\d{3,4})/
  ]).replace(/\s+/g, '');
}

function pickLineValue(text, labels) {
  for (const label of labels) {
    const pattern = new RegExp(`${label}\\s*[:：]?\\s*@?\\s*([^\\n]+)`, 'i');
    const match = text.match(pattern);
    if (match?.[1]) return cleanInferredField(match[1]);
  }
  return '';
}

function normalizeDateValue(value) {
  const match = value?.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})|(\d{3})年(\d{1,2})月(\d{1,2})日?/);
  if (!match) return value || '';
  if (match[1]) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  const year = String(Number(match[4]) + 1911);
  return `${year}-${match[5].padStart(2, '0')}-${match[6].padStart(2, '0')}`;
}

function inferFormFields(text) {
  const lineFields = {
    building: pickLineValue(text, ['社區', '社區大樓', '社區/大樓', '大樓', '案場']),
    address: pickLineValue(text, ['門牌', '地址', '地點', '位置']),
    contact: pickLineValue(text, ['聯絡人', '聯絡人姓名', '窗口']),
    phone: pickLineValue(text, ['電話', '聯絡電話', '手機', '聯絡手機']).replace(/\s+/g, ''),
    roomSummary: pickLineValue(text, ['房型', '格局']),
    projectType: pickLineValue(text, ['型態', '案件類型']),
    cleaningType: pickLineValue(text, ['清潔類型', '服務類型'])
  };

  return {
    title: cleanInferredField(pickField(text, [/([^\n]{2,20}估價單)/])),
    quoteDate: normalizeDateValue(pickField(text, [/報價日期\s*[:：]?\s*([0-9/-]{6,10})/, /日期\s*[:：]?\s*([0-9/-]{6,10})/, /日期\s*(\d{3}年\d{1,2}月\d{1,2}日?)/])),
    validUntil: normalizeDateValue(pickField(text, [/有效日期至\s*[:：]?\s*([0-9/-]{6,10})/, /有效期限\s*[:：]?\s*([0-9/-]{6,10})/, /有效日期至\s*(\d{3}年\d{1,2}月\d{1,2}日?)/])),
    company: cleanInferredField(pickField(text, [/客戶公司名稱\s*[:：]?\s*([^\n]+)/, /公司名稱\s*[:：]?\s*([^\n]+)/, /客戶\s*[:：]?\s*([^\n]+)/])),
    taxId: pickField(text, [/統編\s*[:：]?\s*([0-9]{8})/, /統一編號\s*[:：]?\s*([0-9]{8})/]),
    contact: lineFields.contact || cleanInferredField(pickField(text, [/聯絡人姓名\s*[:：]?\s*([^\n]+)/, /聯絡人\s*[:：]?\s*([^\n]+)/, /(?:^|\n)\s*([^\n，,。:：\s]{1,6}(?:先生|小姐|太太|主任|經理|總幹事))/])),
    phone: lineFields.phone || detectPhone(text),
    building: lineFields.building || cleanInferredField(pickField(text, [/社區\/大樓\s*[:：]?\s*([^\n]+)/, /社區大樓\s*[:：]?\s*([^\n]+)/, /社區\s*[:：]?\s*([^\n]+)/, /大樓\s*[:：]?\s*([^\n]+)/, /案場\s*[:：]?\s*([^\n]+)/])),
    address: lineFields.address || cleanInferredField(pickField(text, [/門牌\s*[:：]?\s*([^\n]+)/, /地址\s*[:：]?\s*([^\n]+)/, /(?:地點|位置)\s*[:：]?\s*([^\n]+)/, /((?:台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|基隆|新竹|苗栗|彰化|南投|雲林|嘉義|屏東|宜蘭|花蓮|台東|臺東|澎湖|金門|連江)[^\n，,。]{6,})/])),
    roomSummary: lineFields.roomSummary || cleanInferredField(pickField(text, [/((?:\d+\s*房)\s*(?:\d+\s*廳)?\s*(?:\d+\s*衛|衛浴)?\s*(?:\d+\s*陽台)?)/, /房型\s*[:：]?\s*([^\n]+)/, /格局\s*[:：]?\s*([^\n]+)/])),
    projectType: lineFields.projectType || cleanInferredField(pickField(text, [/型態\s*[:：]?\s*([^\n]+)/, /案件類型\s*[:：]?\s*([^\n]+)/])) || detectProjectType(text),
    cleaningType: CLEANING_TEMPLATE_OPTIONS.includes(lineFields.cleaningType) ? lineFields.cleaningType : detectCleaningType(text),
    serviceDate: normalizeDateValue(pickField(text, [/施作日期\s*[:：]?\s*([^\n]+)/, /施工日期\s*[:：]?\s*([^\n]+)/, /清潔日期\s*[:：]?\s*([^\n]+)/]))
  };
}

function buildCategoryRows(items, categoryConfig = DEFAULT_CATEGORY_CONFIG) {
  return categoryConfig.map((category, index) => {
    const details = items.filter((item) => item.area === category.key).map((item) => item.detail || '待確認');
    return {
      number: index + 1,
      area: category.label || '待確認',
      key: category.key,
      detail: details.length ? details.join('\n') : '待確認'
    };
  });
}

function buildPlainText(form, rows) {
  const itemText = rows.map((row) => `${row.number}. ${row.area}\n${stripColorTags(row.detail)}`).join('\n\n');
  return [
    pending(form.title),
    `清潔類型：${pending(form.cleaningType)}`,
    `日期：${pending(form.quoteDate)}`,
    `有效日期至：${pending(form.validUntil)}`,
    `客戶公司名稱：${pending(form.company)}`,
    `統編：${pending(form.taxId)}`,
    `聯絡人：${pending(form.contact)}`,
    `聯絡電話：${pending(form.phone)}`,
    `社區：${pending(form.building)}`,
    `地址：${pending(form.address)}`,
    `房型：${pending(form.roomSummary)}`,
    `型態：${pending(form.projectType)}`,
    `施作日期：${pending(form.serviceDate)}`,
    `付款條件：${paymentConditionText(form)}`,
    `${pending(form.serviceFeeLabel)} 小計：${money(form.serviceSubtotal)}`,
    `${pending(form.serviceFeeLabel)} 稅額：${money(form.serviceTax)}`,
    `${pending(form.serviceFeeLabel)} 總計含稅：${money(form.serviceTotal)}`,
    `${pending(form.cleaningFeeLabel)} 小計：${money(form.cleaningSubtotal)}`,
    `${pending(form.cleaningFeeLabel)} 稅額：${money(form.cleaningTax)}`,
    `${pending(form.cleaningFeeLabel)} 總計含稅：${money(form.cleaningTotal)}`,
    `總計費用：${totalFeeText(form)}`,
    `訂金：${money(form.deposit)}`,
    `尾款：${money(form.balance)}`,
    '',
    '特別說明',
    stripColorTags(pending(form.specialNotes)),
    '',
    '施作項目',
    itemText,
    '',
    '條款及細則',
    stripColorTags(pending(form.terms)),
    '',
    '付款資訊',
    stripColorTags(pending(form.paymentNote))
  ].join('\n');
}

function encodePdfImportText(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodePdfImportText(encoded) {
  const binary = atob(encoded.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function extractEmbeddedPdfImportText(text) {
  const match = text.match(new RegExp(`${PDF_IMPORT_START}\\s*([A-Za-z0-9+/=\\s]+?)\\s*${PDF_IMPORT_END}`));
  if (!match?.[1]) return '';
  try {
    return decodePdfImportText(match[1]);
  } catch {
    return '';
  }
}

function isLikelyMojibake(text) {
  const source = text.trim();
  if (!source) return false;
  const hasChinese = /[\u4e00-\u9fff]/.test(source);
  const weirdMatches = source.match(/[^\w\s.,;:!?()[\]{}'"@#+\-/%$&*\u4e00-\u9fff]/g) || [];
  return !hasChinese && source.length > 60 && weirdMatches.length / source.length > 0.08;
}

function buildPrintHtml(form, rows) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(pending(form.title))}</title>
  <style>
    body { font-family: "Microsoft JhengHei", "Noto Sans TC", Arial, sans-serif; margin: 28px; color: #243423; }
    .sheet { width: 960px; margin: auto; border: 2px solid #111; background: #fff; }
    .top { display: grid; grid-template-columns: 1.25fr 0.95fr 150px; background: #e8f3df; color: #4b7d35; }
    .top > div { padding: 18px 22px; }
    h1 { margin: 0 0 14px; text-align: center; font-size: 28px; font-weight: 500; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #c8d9bd; border-left: 1px solid #c8d9bd; }
    .meta-row { display: grid; grid-template-columns: 88px minmax(0, 1fr); border-right: 1px solid #c8d9bd; border-bottom: 1px solid #c8d9bd; font-size: 12px; min-width: 0; }
    .meta-row span { display: flex; min-width: 0; align-items: center; padding: 7px 8px; overflow-wrap: anywhere; word-break: break-word; line-height: 1.45; }
    .meta-row span:first-child { justify-content: center; background: rgba(255,255,255,0.35); font-weight: 700; text-align: center; }
    .note-row { display: grid; grid-template-columns: 24px 1fr; gap: 8px; margin: 8px 0; font-size: 13px; line-height: 1.55; }
    .note-row span { text-align: right; font-weight: 700; }
    .brand { text-align: center; word-break: break-all; overflow-wrap: anywhere; overflow: hidden; }
    .brand strong, .brand div { display: block; max-width: 100%; line-height: 1.35; }
    .brand div { font-size: 11px; }
    .qr-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; }
    .qr { width: 52px; height: 52px; border: 2px solid #8bb078; background: repeating-linear-gradient(45deg,#fff,#fff 5px,#dbead1 5px,#dbead1 10px); }
    .logo { width: 62px; height: 62px; border: 2px solid #4b7d35; border-radius: 50%; display: grid; place-items: center; margin: 6px auto; font-size: 30px; font-weight: 700; }
    .bar { background: #548436; color: white; text-align: center; font-size: 24px; letter-spacing: 4px; padding: 7px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { border-top: 1px solid #111; padding: 12px 14px; vertical-align: middle; white-space: pre-line; }
    .no { width: 54px; color: #57921f; text-align: center; }
    .area { width: 120px; color: #496d34; text-align: center; letter-spacing: 6px; }
    .highlight td { background: #fffed0; }
    .bottom { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #111; }
    .box { min-height: 170px; padding: 18px; border-right: 1px solid #111; }
    .box:last-child { border-right: 0; }
    .muted { color: #688158; font-size: 13px; line-height: 1.8; white-space: pre-line; }
    .fee-columns { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #c8d9bd; background: #fff; }
    .fee-panel { padding: 10px 12px; border-right: 1px solid #c8d9bd; min-width: 0; }
    .fee-panel:last-child { border-right: 0; }
    .fee-title { margin-bottom: 8px; color: #243423; font-weight: 700; overflow-wrap: anywhere; }
    .fee-grid { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 6px 8px; color: #e11d1d; font-weight: 700; overflow-wrap: anywhere; }
    .fee-grid span, .fee-note span { display: flex; align-items: center; min-height: 24px; }
    .fee-grid span:nth-child(odd), .fee-note span:nth-child(odd) { justify-content: center; }
    .fee-note { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 6px 8px; margin-top: 10px; color: #e11d1d; font-weight: 700; }
    .signature { margin-top: 18px; border-top: 1px solid #111; padding-top: 14px; font-size: 18px; color: #4b7d35; }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="top">
      <div class="meta">
        <h1>${escapeHtml(pending(form.title))}</h1>
        <div class="meta-grid">
          <div class="meta-row"><span>日期</span><span>${escapeHtml(pending(form.quoteDate))}</span></div>
          <div class="meta-row"><span>有效日期至</span><span>${escapeHtml(pending(form.validUntil))}</span></div>
          <div class="meta-row"><span>客戶公司名稱</span><span>${escapeHtml(pending(form.company))}</span></div>
          <div class="meta-row"><span>統編</span><span>${escapeHtml(pending(form.taxId))}</span></div>
          <div class="meta-row"><span>聯絡人</span><span>${escapeHtml(pending(form.contact))}</span></div>
          <div class="meta-row"><span>聯絡電話</span><span>${escapeHtml(pending(form.phone))}</span></div>
          <div class="meta-row"><span>社區</span><span>${escapeHtml(pending(form.building))}</span></div>
          <div class="meta-row"><span>地址</span><span>${escapeHtml(pending(form.address))}</span></div>
        </div>
      </div>
      <div class="notes">
        <strong>特別說明</strong>
        ${linesFromText(form.specialNotes)
          .map((line, index) => `<div class="note-row"><span>${index + 1}</span><p>${richTextHtml(line.replace(/^\d+\s*[.、]?\s*/, ''))}</p></div>`)
          .join('')}
      </div>
      <div class="brand">
        <div class="qr-row"><div class="qr"></div><div class="qr"></div></div>
        <div class="logo">葉</div>
        <strong>微笑清家</strong>
        <div>meant2clean.com</div>
      </div>
    </section>
    <div class="bar">${escapeHtml(formatRoomSummary(form.roomSummary))}　施 作 項 目</div>
    <table><tbody>
      ${rows
        .map((row) => `<tr class="${row.area === '注意事項' || row.area === '其他' ? 'highlight' : ''}"><td class="no">${row.number}</td><td class="area">${escapeHtml(row.area)}</td><td>${richTextHtml(row.detail)}</td></tr>`)
        .join('')}
    </tbody></table>
    <section class="bottom">
      <div class="box">
        <div class="fee-columns">
          <div class="fee-panel">
            <div class="fee-title">${escapeHtml(pending(form.serviceFeeLabel))}</div>
            <div class="fee-grid"><span>小計</span><span>${escapeHtml(money(form.serviceSubtotal))}</span><span>稅額</span><span>${escapeHtml(money(form.serviceTax))}</span><span>總計含稅</span><span>${escapeHtml(money(form.serviceTotal))}</span></div>
          </div>
          <div class="fee-panel">
            <div class="fee-title">${escapeHtml(pending(form.cleaningFeeLabel))}</div>
            <div class="fee-grid"><span>小計</span><span>${escapeHtml(money(form.cleaningSubtotal))}</span><span>稅額</span><span>${escapeHtml(money(form.cleaningTax))}</span><span>總計含稅</span><span>${escapeHtml(money(form.cleaningTotal))}</span></div>
          </div>
        </div>
        <div class="fee-note"><span>訂金</span><span>${escapeHtml(money(form.deposit))}</span><span>尾款</span><span>${escapeHtml(money(form.balance))}</span></div>
        <p class="muted">${richTextHtml(pending(form.paymentNote))}</p>
      </div>
      <div class="box"><strong>條款及細則</strong><p class="muted">${richTextHtml(pending(form.terms))}</p><div class="signature">接受報價簽名：</div><div class="signature">驗收簽名：</div></div>
    </section>
  </main>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function createPdfCaptureNode(source) {
  const clone = source.cloneNode(true);
  clone.classList.add('pdf-capture-mode');
  clone.style.position = 'fixed';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.style.margin = '0';
  clone.style.zIndex = '-1';

  clone.querySelectorAll('.quote-items-table td').forEach((cell) => {
    cell.style.paddingTop = '0';
    cell.style.paddingBottom = '0';
    cell.style.verticalAlign = 'middle';
    cell.style.lineHeight = '1.4';
  });

  clone.querySelectorAll('.quote-table-cell').forEach((cell) => {
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.justifyContent = cell.classList.contains('justify-start') ? 'flex-start' : 'center';
    cell.style.minHeight = '40px';
    cell.style.height = '40px';
    cell.style.lineHeight = '1.4';
    cell.style.fontWeight = '400';
    cell.style.margin = '0';
    cell.style.paddingTop = '0';
    cell.style.paddingBottom = '0';
  });

  clone.querySelectorAll('.fee-table-row > span, .terms-table-row > div, .quote-summary-row').forEach((cell) => {
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.minHeight = '36px';
    cell.style.fontWeight = '500';
    cell.style.lineHeight = '1.4';
    cell.style.margin = '0';
    cell.style.paddingTop = '0';
    cell.style.paddingBottom = '0';
  });

  clone.querySelectorAll('.fee-table-row > span:first-child, .terms-table-row > div:nth-child(odd)').forEach((cell) => {
    cell.style.justifyContent = 'center';
  });

  clone.querySelectorAll('.fee-table-row > span:nth-child(even), .terms-table-row > div:nth-child(even)').forEach((cell) => {
    cell.style.justifyContent = 'flex-start';
  });

  clone.querySelectorAll('td > div, td > span, td > p, th > div, th > span, th > p').forEach((node) => {
    node.style.margin = '0';
    node.style.padding = '0';
    node.style.lineHeight = '1.4';
  });

  document.body.appendChild(clone);
  return clone;
}

function App() {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState(() => templateItemsToRows(CLEANING_TEMPLATES[emptyForm.cleaningType]));
  const [categoryConfig, setCategoryConfig] = useState(DEFAULT_CATEGORY_CONFIG);
  const [status, setStatus] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#d92626');
  const [activeTextTarget, setActiveTextTarget] = useState(null);
  const [draggingCategoryKey, setDraggingCategoryKey] = useState('');
  const [openSections, setOpenSections] = useState({
    survey: true,
    customer: false,
    notes: false,
    items: false,
    payment: false
  });
  const quoteRef = useRef(null);
  const textRefs = useRef({});

  const categoryRows = useMemo(() => buildCategoryRows(items, categoryConfig), [items, categoryConfig]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyCleaningTemplate(cleaningType) {
    const template = CLEANING_TEMPLATES[cleaningType];
    setForm((current) => ({
      ...current,
      cleaningType,
      title: template?.title || current.title,
      specialNotes: template ? buildStandardSpecialNotes() : current.specialNotes
    }));
    if (template) {
      setCategoryConfig(DEFAULT_CATEGORY_CONFIG);
      setItems(templateItemsToRows(template));
      setOpenSections((current) => ({ ...current, items: true, notes: true }));
      setStatus(`已套用「${cleaningType}」標準清潔範本，內容仍可手動編輯`);
    }
  }

  function applyInferredFormFields(text, extraFields = {}) {
    const inferred = inferFormFields(text);
    const usefulFields = Object.fromEntries(Object.entries(inferred).filter(([, value]) => value));
    setForm((current) => ({
      ...current,
      ...usefulFields,
      ...extraFields
    }));
    return Object.keys(usefulFields).length;
  }

  function toggleSection(section) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function updateCategoryDetail(category, value) {
    setItems((current) => {
      const remaining = current.filter((item) => item.area !== category);
      return [...remaining, { area: category, detail: value || '待確認' }];
    });
  }

  function updateCategoryLabel(key, value) {
    setCategoryConfig((current) => current.map((category) => (category.key === key ? { ...category, label: value } : category)));
  }

  function addCategoryRow() {
    const key = `custom-${Date.now()}`;
    setCategoryConfig((current) => [...current, { key, label: '新增項目' }]);
    setItems((current) => [...current, { area: key, detail: '待確認' }]);
    setOpenSections((current) => ({ ...current, items: true }));
  }

  function removeCategoryRow(key) {
    setCategoryConfig((current) => current.filter((category) => category.key !== key));
    setItems((current) => current.filter((item) => item.area !== key));
    setStatus('已刪除施工項目');
  }

  function moveCategoryRow(dragKey, targetKey) {
    if (!dragKey || dragKey === targetKey) return;
    setCategoryConfig((current) => {
      const fromIndex = current.findIndex((category) => category.key === dragKey);
      const targetIndex = current.findIndex((category) => category.key === targetKey);
      if (fromIndex < 0 || targetIndex < 0) return current;

      const next = current.filter((category) => category.key !== dragKey);
      const insertIndex = fromIndex < targetIndex ? targetIndex : targetIndex;
      next.splice(insertIndex, 0, current[fromIndex]);
      return next;
    });
  }

  function rememberTextTarget(type, key, node = null, rich = false) {
    setActiveTextTarget({ type, key, node, rich });
  }

  function setTextRef(id, node) {
    if (node) textRefs.current[id] = node;
  }

  function handleRichEditorActivate(editorId, node) {
    const [type, ...keyParts] = editorId.split(':');
    rememberTextTarget(type, keyParts.join(':'), node, true);
  }

  function applyColorToSelection(color = highlightColor) {
    if (!activeTextTarget) {
      setStatus('請先選取要變色的文字');
      return;
    }

    if (activeTextTarget.rich && activeTextTarget.node) {
      activeTextTarget.node.focus();
      document.execCommand('foreColor', false, color);
      const nextValue = htmlToRichText(activeTextTarget.node.innerHTML);

      if (activeTextTarget.type === 'form') {
        updateField(activeTextTarget.key, nextValue);
      } else {
        updateCategoryDetail(activeTextTarget.key, nextValue);
      }

      setStatus('已套用文字顏色');
      return;
    }

    const id = `${activeTextTarget.type}:${activeTextTarget.key}`;
    const node = textRefs.current[id];
    if (!node) return;

    const start = node.selectionStart ?? 0;
    const end = node.selectionEnd ?? 0;
    const currentValue = node.value;
    const selected = currentValue.slice(start, end) || '輸入文字';
    const nextValue = `${currentValue.slice(0, start)}[color=${color}]${selected}[/color]${currentValue.slice(end)}`;

    if (activeTextTarget.type === 'form') {
      updateField(activeTextTarget.key, nextValue);
    } else {
      updateCategoryDetail(activeTextTarget.key, nextValue);
    }

    window.requestAnimationFrame(() => {
      node.focus();
      const cursor = start + `[color=${color}]${selected}[/color]`.length;
      node.setSelectionRange(cursor, cursor);
    });
    setStatus('已套用文字顏色');
  }

  function appendSupplementRows(rows) {
    const validAreas = new Set(categoryConfig.map((category) => category.key));
    let addedCount = 0;

    setItems((current) => {
      const existingTexts = new Set(current.map((item) => normalizeItemText(item.detail)).filter(Boolean));
      const additions = [];

      rows.forEach((row) => {
        const detail = stripColorTags(row.detail || '').trim();
        const normalized = normalizeItemText(detail);
        if (!detail || normalized === normalizeItemText('待確認') || normalized === normalizeItemText('施工內容待確認')) return;
        if (existingTexts.has(normalized)) return;

        const area = validAreas.has(row.area) ? row.area : detectCategory(`${row.area || ''} ${detail}`);
        additions.push({ area: validAreas.has(area) ? area : '其他', detail });
        existingTexts.add(normalized);
      });

      addedCount = additions.length;
      return additions.length ? [...current, ...additions] : current;
    });

    return addedCount;
  }

  async function organizeTextContent(text, mode = 'manual') {
    if (!text.trim()) {
      setStatus('尚未偵測到可解析的 LINE 補充內容');
      return;
    }

    const inferredCount = applyInferredFormFields(text);
    setIsOrganizing(true);
    setStatus(mode === 'paste' ? '已偵測貼上內容，正在解析 LINE 補充...' : '正在解析 LINE 補充項目...');
    try {
      const response = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, categories: CATEGORIES })
      });
      if (!response.ok) throw new Error('AI API unavailable');
      const data = await response.json();
      const addedCount = appendSupplementRows(sanitizeAiRows(data.items));
      setOpenSections((current) => ({ ...current, items: true }));
      setStatus(
        addedCount
          ? `已解析 LINE 補充：新增 ${addedCount} 個項目，並套入 ${inferredCount} 個客戶資料欄位`
          : `已解析 LINE 補充，沒有新增重複項目；套入 ${inferredCount} 個客戶資料欄位`
      );
    } catch {
      const addedCount = appendSupplementRows(localOrganize(text));
      setOpenSections((current) => ({ ...current, items: true }));
      setStatus(
        addedCount
          ? `已用本機規則新增 ${addedCount} 個 LINE 補充項目，並套入 ${inferredCount} 個客戶資料欄位`
          : `已解析 LINE 補充，沒有新增重複項目；若要提升準確度，請設定 OpenAI API Key`
      );
    } finally {
      setIsOrganizing(false);
    }
  }

  async function parseLineSupplements() {
    await organizeTextContent(form.rawText, 'manual');
  }

  async function extractPdfText(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const positionedItems = content.items
        .map((item) => ({
          text: item.str,
          x: item.transform?.[4] || 0,
          y: item.transform?.[5] || 0
        }))
        .filter((item) => item.text?.trim())
        .sort((a, b) => b.y - a.y || a.x - b.x);

      const lines = [];
      positionedItems.forEach((item) => {
        const currentLine = lines.find((line) => Math.abs(line.y - item.y) < 3);
        if (currentLine) {
          currentLine.items.push(item);
        } else {
          lines.push({ y: item.y, items: [item] });
        }
      });

      pages.push(
        lines
          .sort((a, b) => b.y - a.y)
          .map((line) =>
            line.items
              .sort((a, b) => a.x - b.x)
              .map((item) => item.text)
              .join(' ')
          )
          .join('\n')
      );
    }

    const extractedText = pages.join('\n');
    const embeddedText = extractEmbeddedPdfImportText(extractedText);
    return embeddedText || extractedText;
  }

  async function extractSpreadsheetText(file) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    return workbook.SheetNames.map((sheetName) => {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
      return [`【${sheetName}】`, ...rows.map((row) => row.filter(Boolean).join(' '))].join('\n');
    }).join('\n\n');
  }

  async function handleFileImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus(`正在讀取 ${file.name}...`);
    try {
      const fileName = file.name.toLowerCase();
      const text = fileName.endsWith('.pdf') ? await extractPdfText(file) : await extractSpreadsheetText(file);
      if (!text.trim()) {
        throw new Error('這份 PDF 沒有可讀文字，可能是圖片或掃描檔，請改貼文字內容或匯入 Excel。');
      }
      if (fileName.endsWith('.pdf') && isLikelyMojibake(text)) {
        throw new Error('這份 PDF 讀到的是亂碼，請用新版重新下載 PDF 後再匯入，或改貼 LINE 文字內容。');
      }
      const inferred = inferFormFields(text);

      setForm((current) => ({
        ...current,
        ...Object.fromEntries(Object.entries(inferred).filter(([, value]) => value)),
        rawText: text
      }));
      await organizeTextContent(text, 'file');
      setStatus(`已匯入 ${file.name}，並解析為補充項目`);
    } catch (error) {
      setStatus(`匯入失敗：${error.message || '無法讀取檔案內容'}`);
    } finally {
      event.target.value = '';
    }
  }

  function handleRawTextPaste(event) {
    const target = event.currentTarget;
    window.setTimeout(() => {
      const pastedText = target.value;
      updateField('rawText', pastedText);
      organizeTextContent(pastedText, 'paste');
    }, 0);
  }

  async function copyResult() {
    await navigator.clipboard.writeText(buildPlainText(form, categoryRows));
    setStatus('已複製結果');
  }

  function downloadExcel() {
    const infoRows = [
      ['估價單名稱', pending(form.title)],
      ['清潔類型', pending(form.cleaningType)],
      ['日期', pending(form.quoteDate)],
      ['有效日期至', pending(form.validUntil)],
      ['客戶公司名稱', pending(form.company)],
      ['統編', pending(form.taxId)],
      ['聯絡人', pending(form.contact)],
      ['聯絡電話', pending(form.phone)],
      ['社區', pending(form.building)],
      ['地址', pending(form.address)],
      ['房型', pending(form.roomSummary)],
      ['型態', pending(form.projectType)],
      ['施作日期', pending(form.serviceDate)],
      ['付款條件', paymentConditionText(form)],
      [`${pending(form.serviceFeeLabel)} 小計`, money(form.serviceSubtotal)],
      [`${pending(form.serviceFeeLabel)} 稅額`, money(form.serviceTax)],
      [`${pending(form.serviceFeeLabel)} 總計含稅`, money(form.serviceTotal)],
      [`${pending(form.cleaningFeeLabel)} 小計`, money(form.cleaningSubtotal)],
      [`${pending(form.cleaningFeeLabel)} 稅額`, money(form.cleaningTax)],
      [`${pending(form.cleaningFeeLabel)} 總計含稅`, money(form.cleaningTotal)],
      ['總計費用', totalFeeText(form)],
      ['訂金', money(form.deposit)],
      ['尾款', money(form.balance)]
    ];
    const itemRows = categoryRows.map((row) => ({
      編號: row.number,
      區域: row.area,
      施工細項: stripColorTags(row.detail)
    }));
    const wb = XLSX.utils.book_new();
    const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
    infoSheet['!cols'] = [{ wch: 24 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(wb, infoSheet, '基本資料');

    const notesSheet = XLSX.utils.aoa_to_sheet([['特別說明'], ...linesFromText(form.specialNotes).map((line) => [stripColorTags(line)])]);
    notesSheet['!cols'] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, notesSheet, '特別說明');

    const itemsSheet = XLSX.utils.json_to_sheet(itemRows);
    itemsSheet['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(wb, itemsSheet, '施工項目');

    const termsSheet = XLSX.utils.aoa_to_sheet([['條款及細則'], ...linesFromText(form.terms).map((line) => [stripColorTags(line)])]);
    termsSheet['!cols'] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, termsSheet, '條款及細則');

    const paymentSheet = XLSX.utils.aoa_to_sheet([['付款資訊'], ...linesFromText(form.paymentNote).map((line) => [stripColorTags(line)])]);
    paymentSheet['!cols'] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, paymentSheet, '付款資訊');
    XLSX.writeFile(wb, `場勘報價清單_${pending(form.company)}.xlsx`);
    setStatus('已下載 Excel');
  }

  async function downloadPdf() {
    const preview = quoteRef.current;
    let captureNode = null;
    try {
      if (!preview) return;
      setStatus('正在產生 PDF...');
      captureNode = createPdfCaptureNode(preview);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = await html2canvas(captureNode, { scale: 6, backgroundColor: '#ffffff', useCORS: true });
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');
      const margin = 6;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(1);
      const encodedImportText = encodePdfImportText(buildPlainText(form, categoryRows));
      const importLines = [
        PDF_IMPORT_START,
        ...encodedImportText.match(/.{1,90}/g),
        PDF_IMPORT_END
      ];
      doc.text(importLines, 3, 3);
      doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'NONE');
      doc.save(`場勘報價清單_${pending(form.company)}.pdf`);
      setStatus('已下載 PDF');
    } catch {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(buildPrintHtml(form, categoryRows));
      printWindow.document.close();
      setStatus('已開啟列印視窗，可選擇另存為 PDF');
    } finally {
      captureNode?.remove();
    }
  }

  const fields = [
    ['title', '估價單名稱'],
    ['company', '客戶公司名稱'],
    ['taxId', '統編'],
    ['contact', '聯絡人姓名'],
    ['phone', '聯絡電話'],
    ['building', '社區/大樓'],
    ['roomSummary', '房型/格局'],
    ['projectType', '型態'],
    ['quoteDate', '日期', 'date'],
    ['validUntil', '有效日期', 'date'],
    ['serviceDate', '施作日期', 'date'],
    ['address', '地址']
  ];

  const metaRows = [
    { label: '日期', value: pending(form.quoteDate) },
    { label: '有效日期至', value: pending(form.validUntil) },
    { label: '客戶公司名稱', value: pending(form.company) },
    { label: '統編', value: pending(form.taxId) },
    { label: '聯絡人', value: pending(form.contact) },
    { label: '聯絡電話', value: pending(form.phone) },
    { label: '社區', value: pending(form.building) },
    { label: '型態', value: pending(form.projectType) },
    { label: '地址', value: pending(form.address), wide: true }
  ];

  const feeGroups = [
    {
      labelField: 'serviceFeeLabel',
      labelText: '費用 A 標題',
      placeholder: '清潔費用 A',
      fields: [
        ['serviceSubtotal', '小計'],
        ['serviceTax', '稅額'],
        ['serviceTotal', '總計含稅']
      ]
    },
    {
      labelField: 'cleaningFeeLabel',
      labelText: '費用 B 標題',
      placeholder: '清潔費用 B',
      fields: [
        ['cleaningSubtotal', '小計'],
        ['cleaningTax', '稅額'],
        ['cleaningTotal', '總計含稅']
      ]
    }
  ];

  const paymentSummaryFields = [
    ['deposit', '訂金匯款'],
    ['balance', '尾款']
  ];

  const quickColors = ['#d92626', '#f59e0b', '#2f7d32', '#2563eb', '#7c3aed', '#111827'];

  return (
    <main className="min-h-screen bg-[#eef3ea] text-stone-900">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-5 px-4 py-5 lg:h-screen lg:flex-row lg:overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#d9e2d2] bg-white shadow-soft">
          <div className="border-b border-[#dbe4d5] bg-gradient-to-r from-white to-[#f4f8f0] px-5 py-4">
            <p className="text-xs font-bold uppercase text-moss-700">Professional site survey quotation</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-stone-950">場勘報價清單產生器</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              先套用清潔範本，再將 LINE 對話解析為補充項目，產出可供客戶確認的正式估價單內容。
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-5">
            <AccordionSection
              title="客戶資料"
              description="估價單抬頭、日期、聯絡資訊與地址。"
              open={openSections.customer}
              onToggle={() => toggleSection('customer')}
              className="order-2"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map(([field, label, type = 'text']) => (
                  <label key={field} className={field === 'address' || field === 'title' ? 'sm:col-span-2' : ''}>
                    <span className="mb-1 block text-sm font-semibold text-stone-700">{label}</span>
                    <input
                      type={type}
                      value={form[field]}
                      onChange={(event) => updateField(field, event.target.value)}
                      className="h-11 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[15px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      placeholder="待確認"
                    />
                  </label>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection
              title="場勘內容"
              description="貼上 LINE 對話、場勘文字，或匯入既有 PDF / Excel。"
              open={openSections.survey}
              onToggle={() => toggleSection('survey')}
              className="order-1"
            >
              <label className="block rounded-md border-2 border-moss-700 bg-[#edf7e6] p-4 shadow-sm ring-4 ring-[#dcebd3]">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-moss-700 px-3 py-1 text-xs font-black tracking-wide text-white">
                      先選這裡
                    </span>
                    <span className="mt-2 block text-base font-black text-moss-900">清潔類型 / 套用範本</span>
                    <span className="mt-1 block text-xs leading-5 text-moss-800">
                      選擇後會自動帶入常用施工項目、標準注意事項與其他事項，所有內容仍可手動編輯。
                    </span>
                  </div>
                  <span className="rounded-md bg-white px-3 py-2 text-xs font-bold text-moss-700 ring-1 ring-[#b9d0ad]">
                    目前：{form.cleaningType}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={form.cleaningType}
                    onChange={(event) => applyCleaningTemplate(event.target.value)}
                    className="h-13 w-full cursor-pointer appearance-none rounded-md border-2 border-moss-700 bg-white px-4 py-3 pr-11 text-[17px] font-black text-moss-800 shadow-inner outline-none transition hover:bg-[#fbfff8] focus:border-moss-800 focus:ring-4 focus:ring-moss-100"
                  >
                    {CLEANING_TEMPLATE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-moss-700" size={22} />
                </div>
              </label>

              <section className="rounded-md border border-[#d7e5cf] bg-[#f4f9ef] p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">匯入既有估價單</h2>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      支援 PDF、Excel、CSV。匯入後會嘗試帶入客戶資料，施工內容只會新增為補充項目。
                    </p>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-bold text-moss-700 ring-1 ring-[#c8d9bd] transition hover:bg-moss-50">
                    選擇檔案
                    <input type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
                  </label>
                </div>
              </section>

              <label className="block rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-sm font-semibold text-stone-800">貼上 LINE 對話或場勘文字內容</span>
                    <span className="block text-xs text-stone-500">貼上後可解析為補充項目，會保留目前清潔範本內容。</span>
                  </div>
                  <span className="rounded-full bg-moss-50 px-3 py-1 text-xs font-bold text-moss-700">補充解析</span>
                </div>
                <textarea
                  value={form.rawText}
                  onChange={(event) => updateField('rawText', event.target.value)}
                  onPaste={handleRawTextPaste}
                  className="min-h-[230px] w-full resize-y rounded-md border border-[#cfd8c8] bg-[#fffefb] p-3 text-[15px] leading-7 outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                  placeholder="例：客廳牆面要補土油漆、主臥窗戶玻璃清潔、廚房流理台除油，管委會施工時間需確認..."
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={parseLineSupplements}
                    disabled={isOrganizing}
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-moss-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles size={18} />
                    {isOrganizing ? '解析中' : '解析 LINE 補充'}
                  </button>
                  <span className="text-xs leading-5 text-stone-500">會依空間分類新增到「施工項目」，重複內容不會再次加入。</span>
                </div>
              </label>
            </AccordionSection>

            <AccordionSection
              title="施工項目"
              description="範本與 LINE 補充都會顯示在這裡，可手動微調與標色。"
              open={openSections.items}
              onToggle={() => toggleSection('items')}
              className="order-3"
            >
              <section className="rounded-md border border-[#dfe8d8] bg-white p-3">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">施作項目手動編輯</h2>
                    <p className="mt-1 text-xs text-stone-500">範本項目與 LINE 補充都可在這裡微調文字，也可以選取文字套用任意顏色。</p>
                  </div>
                  <button
                    type="button"
                    onClick={addCategoryRow}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#c8d9bd] bg-[#f4f9ef] px-3 text-sm font-bold text-moss-700 transition hover:bg-moss-50"
                  >
                    <Plus size={16} />
                    新增項目
                  </button>
                </div>
                <div className="space-y-3">
                  {categoryRows.map((row) => (
                    <div
                      key={row.key}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        moveCategoryRow(draggingCategoryKey || event.dataTransfer.getData('text/plain'), row.key);
                        setDraggingCategoryKey('');
                      }}
                      className={`grid gap-2 rounded-md border p-2 transition md:grid-cols-[128px_1fr_40px] ${
                        draggingCategoryKey === row.key
                          ? 'border-moss-600 bg-moss-50 opacity-60'
                          : 'border-[#edf2e8] bg-[#fbfdf8]'
                      }`}
                    >
                      <span className="space-y-1">
                        <span className="block text-xs font-bold text-moss-700">項目 {row.number}</span>
                        <input
                          value={row.area}
                          onChange={(event) => updateCategoryLabel(row.key, event.target.value)}
                          className="h-9 w-full rounded-md border border-[#cfd8c8] bg-white px-2 text-sm font-bold text-moss-700 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        />
                      </span>
                      <RichTextEditor
                        editorId={`category:${row.key}`}
                        value={row.detail}
                        onChange={(value) => updateCategoryDetail(row.key, value)}
                        onActivate={handleRichEditorActivate}
                        className="min-h-20 w-full overflow-auto whitespace-pre-wrap rounded-md border border-[#cfd8c8] bg-[#fffefb] p-3 text-[14px] leading-6 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      />
                      <div className="flex gap-1 md:flex-col">
                        <div
                          draggable
                          onDragStart={(event) => {
                            setDraggingCategoryKey(row.key);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', row.key);
                          }}
                          onDragEnd={() => setDraggingCategoryKey('')}
                          className="flex h-9 w-9 cursor-grab items-center justify-center rounded-md border border-[#cfd8c8] bg-white text-moss-700 active:cursor-grabbing"
                          title="拖拉排序"
                          aria-label={`拖拉項目 ${row.number}`}
                        >
                          <GripVertical size={16} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCategoryRow(row.key)}
                          className="flex h-9 w-9 items-center justify-center rounded-md border border-red-100 bg-white text-red-500 transition hover:border-red-200 hover:bg-red-50"
                          title="刪除此施工項目"
                          aria-label={`刪除項目 ${row.number}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </AccordionSection>

            <AccordionSection
              title="費用與付款"
              description="清潔費用、訂金尾款與付款資訊。"
              open={openSections.payment}
              onToggle={() => toggleSection('payment')}
              className="order-4"
            >
              <section className="rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-800">費用資訊</h2>
                    <p className="mt-1 text-xs text-stone-500">只輸入數字即可，預覽會自動顯示 NT$。不填則顯示待確認。</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-moss-700 ring-1 ring-[#dfe8d8]">Optional</span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {feeGroups.map((group) => (
                    <div key={group.labelField} className="rounded-md border border-[#dfe8d8] bg-white p-3">
                      <label>
                        <span className="mb-1 block text-xs font-bold text-stone-600">{group.labelText}</span>
                        <input
                          value={form[group.labelField]}
                          onChange={(event) => updateField(group.labelField, event.target.value)}
                          className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] font-bold text-moss-700 outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                          placeholder={group.placeholder}
                        />
                      </label>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {group.fields.map(([field, label]) => (
                          <label key={field}>
                            <span className="mb-1 block text-xs font-bold text-stone-600">{label}</span>
                            <input
                              inputMode="numeric"
                              value={form[field]}
                              onChange={(event) => updateField(field, event.target.value)}
                              className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                              placeholder="待確認"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-md border border-[#dfe8d8] bg-white p-3 sm:grid-cols-3">
                  {paymentSummaryFields.map(([field, label]) => (
                    <label key={field}>
                      <span className="mb-1 block text-xs font-bold text-stone-600">{label}</span>
                      <input
                        inputMode="numeric"
                        value={form[field]}
                        onChange={(event) => updateField(field, event.target.value)}
                        className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        placeholder="待確認"
                      />
                    </label>
                  ))}
                  <div>
                    <span className="mb-1 block text-xs font-bold text-stone-600">總計費用</span>
                    <div className="flex h-10 items-center rounded-md border border-[#cfd8c8] bg-[#f4f9ef] px-3 text-[14px] font-bold text-moss-700">
                      {totalFeeText(form)}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-[#dfe8d8] bg-white p-3">
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-stone-800">條款及細則付款條件</h2>
                  <p className="mt-1 text-xs text-stone-500">會同步顯示在右側估價單的條款及簽核區。</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_CONDITIONS.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => updateField('paymentCondition', condition)}
                      className={`h-10 rounded-md border text-sm font-bold transition ${
                        form.paymentCondition === condition
                          ? 'border-moss-700 bg-moss-700 text-white shadow-sm'
                          : 'border-[#cfd8c8] bg-[#fbfdf8] text-moss-700 hover:bg-moss-50'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
                {form.paymentCondition === '其他' ? (
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-bold text-stone-600">其他付款條件</span>
                    <input
                      value={form.paymentConditionOther}
                      onChange={(event) => updateField('paymentConditionOther', event.target.value)}
                      className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      placeholder="請輸入付款條件"
                    />
                  </label>
                ) : null}
              </section>

              <label className="block rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <span className="mb-1 block text-sm font-semibold text-stone-800">付款資訊</span>
                <span className="mb-2 block text-xs text-stone-500">會顯示在估價單底部，價格仍維持待確認。</span>
                <RichTextEditor
                  editorId="form:paymentNote"
                  value={form.paymentNote}
                  onChange={(value) => updateField('paymentNote', value)}
                  onActivate={handleRichEditorActivate}
                  className="min-h-24 w-full overflow-auto whitespace-pre-wrap rounded-md border border-[#cfd8c8] bg-white p-3 text-[15px] leading-7 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                />
              </label>
            </AccordionSection>

            <AccordionSection
              title="特別說明"
              description="估價單說明與條款。"
              open={openSections.notes}
              onToggle={() => toggleSection('notes')}
              className="order-5"
            >
              <label className="block rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <span className="mb-1 block text-sm font-semibold text-stone-800">特別說明</span>
                <span className="mb-2 block text-xs text-stone-500">會顯示在估價單右上方，建議保留品質、驗收、現場差異等說明。</span>
                <RichTextEditor
                  editorId="form:specialNotes"
                  value={form.specialNotes}
                  onChange={(value) => updateField('specialNotes', value)}
                  onActivate={handleRichEditorActivate}
                  className="min-h-28 w-full overflow-auto whitespace-pre-wrap rounded-md border border-[#cfd8c8] bg-white p-3 text-[15px] leading-7 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                />
              </label>

            </AccordionSection>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#dbe4d5] bg-[#fbfdf8] px-5 py-4">
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-[#dfe8d8]">
              <span className="text-xs font-bold text-stone-500">快速標色</span>
              {quickColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setHighlightColor(color);
                    applyColorToSelection(color);
                  }}
                  className="h-6 w-6 rounded-full border border-white shadow ring-1 ring-stone-200"
                  style={{ backgroundColor: color }}
                  title={`套用 ${color}`}
                />
              ))}
              <input
                type="color"
                value={highlightColor}
                onChange={(event) => setHighlightColor(event.target.value)}
                onBlur={() => applyColorToSelection(highlightColor)}
                className="h-7 w-8 cursor-pointer rounded border border-[#cfd8c8] bg-white p-0.5"
                title="自訂顏色，選完後套用"
              />
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-sm text-stone-600 ring-1 ring-[#dfe8d8]">{status || '等待貼上場勘文字'}</p>
          </div>
        </section>

        <section className="flex min-h-0 flex-[1.45] flex-col overflow-hidden rounded-lg border border-[#d2dfca] bg-paper shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-leaf bg-[#3f6535] px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold opacity-90">正式估價單版型</p>
              <h2 className="text-2xl font-bold tracking-normal">估價單預覽</h2>
            </div>
            <div className="flex gap-2">
              <button title="複製結果" onClick={copyResult} className="icon-button">
                複製
              </button>
              <button title="下載預覽版 PDF" onClick={downloadPdf} className="icon-button">
                PDF
              </button>
              <button title="下載 Excel" onClick={downloadExcel} className="icon-button">
                EXCEL
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-[#edf2e8] p-4">
            <article ref={quoteRef} className="quote-export mx-auto overflow-hidden border-2 border-[#1e2d1b] bg-white text-[#25381f] shadow-[0_20px_60px_rgba(40,64,35,0.18)]">
              <section className="quote-header grid grid-cols-1 bg-[#e8f3df] text-[#4f7d35] md:grid-cols-[1.2fr_0.9fr_170px]">
                <div className="px-6 py-5">
                  <p className="mb-1 text-center text-xs font-bold uppercase text-[#6f9461]">Quotation</p>
                  <h3 className="mb-4 text-center text-3xl font-semibold tracking-normal text-[#3f6535]">{pending(form.title)}</h3>
                  <div className="grid overflow-hidden border-l border-t border-[#c6d9ba] sm:grid-cols-2">
                    {metaRows.map(({ label, value, wide }) => (
                      <div key={label} className={`grid min-w-0 grid-cols-[88px_minmax(0,1fr)] border-b border-r border-[#c6d9ba] text-[12px] ${wide ? 'sm:col-span-2' : ''}`}>
                        <div className="flex items-center justify-center bg-white/40 px-2 py-2 text-center font-bold leading-5">{label}</div>
                        <div className="min-w-0 overflow-hidden break-words px-2 py-2 leading-5 text-[#385f2c] [overflow-wrap:anywhere]">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-5">
                  <p className="border-b border-[#b7cdaa] pb-2 text-base font-bold text-[#3f6535]">特別說明</p>
                  <div className="mt-3 space-y-2">
                    {linesFromText(form.specialNotes).map((line, index) => (
                      <div key={line} className="grid grid-cols-[24px_1fr] gap-2 leading-6">
                        <span className="text-right font-bold text-[#5a8249]">{index + 1}</span>
                        <p><RichText text={line.replace(/^\d+\s*[.、]?\s*/, '')} /></p>
                      </div>
                    ))}
                  </div>
                </div>
                <aside className="border-t border-[#c6d9ba] bg-[#f4f8ef] px-4 py-5 text-center md:border-l md:border-t-0">
                  <div className="mb-4 flex justify-center gap-2">
                    <div className="qr-placeholder">LINE</div>
                    <div className="qr-placeholder">IG</div>
                  </div>
                  <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full border-2 border-[#4f7d35] bg-white text-4xl font-bold shadow-sm">葉</div>
                  <p className="text-xl font-bold tracking-normal text-moss-800">微笑清家</p>
                  <p className="mx-auto max-w-[120px] break-all text-[10px] leading-4 text-moss-700">meant2clean.com</p>
                </aside>
              </section>

              <div className="border-y border-[#1e2d1b] bg-[#548436] px-4 py-2.5 text-center text-2xl font-semibold tracking-[0.18em] text-white">
                {formatRoomSummary(form.roomSummary)}　施 作 項 目
              </div>

              <table className="quote-items-table w-full border-collapse">
                <colgroup>
                  <col className="w-[54px]" />
                  <col className="w-[118px]" />
                  <col />
                </colgroup>
                <tbody>
                  {categoryRows.map((row) => {
                    const highlighted = row.area === '注意事項' || row.area === '其他';
                    return (
                      <tr key={row.area} className={highlighted ? 'bg-[#fffed0]' : 'bg-white'}>
                        <td className="border-t border-[#1e2d1b] px-3 py-0 text-center align-middle font-semibold text-[#57921f]">
                          <div className="quote-table-cell justify-center">{row.number}</div>
                        </td>
                        <td className="border-t border-[#1e2d1b] px-3 py-0 text-center align-middle font-semibold tracking-[0.28em] text-[#496d34]">
                          <div className="quote-table-cell justify-center">{row.area}</div>
                        </td>
                        <td className="border-t border-[#1e2d1b] px-4 py-0 align-middle leading-7 whitespace-pre-line text-[#3f463b]">
                          <div className="quote-table-cell justify-start"><RichText text={row.detail} /></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <section className="quote-bottom-section border-t border-[#1e2d1b]">
                <div className="quote-bottom-grid grid bg-[#e8f3df] md:grid-cols-[1fr_1fr]">
                  <div className="quote-fee-column border-b border-[#1e2d1b] md:border-b-0 md:border-r">
                    <div className="bg-[#dcebd3] px-4 py-2 text-center text-lg font-bold tracking-[0.12em] text-moss-700">費 用 摘 要</div>
                    <div className="grid grid-cols-2 border-t border-[#1e2d1b]">
                      <div className="border-r border-[#1e2d1b] p-4">
                        <p className="mb-3 font-bold text-red-600">{pending(form.serviceFeeLabel)}</p>
                        <div className="overflow-hidden rounded-sm border border-red-200 bg-white/60 text-sm text-red-600">
                          {[
                            ['小計', money(form.serviceSubtotal)],
                            ['稅額', money(form.serviceTax)],
                            ['總計含稅', money(form.serviceTotal)]
                          ].map(([label, value]) => (
                            <div key={label} className="fee-table-row grid grid-cols-[72px_minmax(0,1fr)] border-b border-red-100 last:border-b-0">
                              <span className="bg-red-50 px-2 py-2 font-bold">{label}</span>
                              <span className="min-w-0 break-words px-2 py-2 font-semibold [overflow-wrap:anywhere]">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="mb-3 font-bold text-red-600">{pending(form.cleaningFeeLabel)}</p>
                        <div className="overflow-hidden rounded-sm border border-red-200 bg-white/60 text-sm text-red-600">
                          {[
                            ['小計', money(form.cleaningSubtotal)],
                            ['稅額', money(form.cleaningTax)],
                            ['總計含稅', money(form.cleaningTotal)]
                          ].map(([label, value]) => (
                            <div key={label} className="fee-table-row grid grid-cols-[72px_minmax(0,1fr)] border-b border-red-100 last:border-b-0">
                              <span className="bg-red-50 px-2 py-2 font-bold">{label}</span>
                              <span className="min-w-0 break-words px-2 py-2 font-semibold [overflow-wrap:anywhere]">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="border-y border-[#1e2d1b] bg-[#fffed0] text-red-600">
                      <div className="quote-summary-row flex items-center justify-center border-b border-[#1e2d1b] px-4 py-2 text-center text-[16px] font-bold whitespace-nowrap">總計費用：{totalFeeText(form)}</div>
                      <div className="grid grid-cols-2">
                        <div className="quote-summary-row flex min-w-0 items-center border-r border-[#1e2d1b] px-4 py-3 text-[15px] font-bold whitespace-nowrap">訂金匯款：{money(form.deposit)}</div>
                        <div className="quote-summary-row flex min-w-0 items-center px-4 py-3 text-[15px] font-bold whitespace-nowrap">尾款：{money(form.balance)}</div>
                      </div>
                    </div>
                    <div className="grid min-h-40 grid-cols-[1fr_150px] bg-white">
                      <div className="p-4">
                        <p className="font-bold text-moss-700">付款資訊</p>
                        <div className="mt-3 leading-7 whitespace-pre-line text-stone-700"><RichText text={pending(form.paymentNote)} /></div>
                      </div>
                      <div className="grid place-items-center border-l border-[#1e2d1b] bg-[#f5f7f0] p-4 text-center text-moss-700">
                        <div className="qr-placeholder large">匯款 QR</div>
                      </div>
                    </div>
                  </div>

                  <div className="quote-terms-column bg-[#e8f3df]">
                    <h4 className="border-b border-[#1e2d1b] bg-[#dcebd3] py-2 text-center text-lg font-bold tracking-[0.18em] text-moss-700">條 款 及 簽 核</h4>
                    <div className="terms-table-row grid grid-cols-[112px_1fr] border-b border-[#1e2d1b]">
                      <div className="border-r border-[#1e2d1b] px-3 py-3 text-center font-semibold text-moss-700">付款條件</div>
                      <div className="px-3 py-3 text-red-600">{paymentConditionText(form)}</div>
                      <div className="border-r border-t border-[#1e2d1b] px-3 py-3 text-center font-semibold text-moss-700">付款期限</div>
                      <div className="border-t border-[#1e2d1b] px-3 py-3">施作完畢後付款，匯費勿內扣。</div>
                      <div className="border-r border-t border-[#1e2d1b] px-3 py-3 text-center font-semibold text-moss-700">施作日期</div>
                      <div className="border-t border-[#1e2d1b] px-3 py-3">{pending(form.serviceDate)}</div>
                    </div>
                    <div className="border-t border-[#1e2d1b] bg-[#f7f0c6] px-4 py-3 leading-7 text-moss-700">
                      驗收完畢完成驗收通過（照片/影片或放棄驗收），視同「完成通過驗收」，事後無法要求再回現場進行二次清潔。
                    </div>
                    <div className="border-t border-[#1e2d1b] bg-white p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="mb-2 text-base font-bold text-moss-700">接受報價簽名</div>
                          <div className="grid min-h-28 place-items-end border border-dashed border-[#8ba87c] bg-[#fbfdf8] p-4">
                            <div className="w-full border-t border-[#4f7d35] pt-2 text-right text-sm text-moss-700">簽名 / 日期</div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-base font-bold text-moss-700">驗收簽名</div>
                          <div className="grid min-h-28 place-items-end border border-dashed border-[#8ba87c] bg-[#fbfdf8] p-4">
                            <div className="w-full border-t border-[#4f7d35] pt-2 text-right text-sm text-moss-700">簽名 / 日期</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="quote-footer border-t border-[#1e2d1b] bg-[#f4f8ef] px-5 py-3 text-center text-xs leading-6 text-moss-700">
                本估價單內容依場勘紀錄與客戶提供資訊整理，實際施作範圍以雙方確認版本為準。
              </section>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);

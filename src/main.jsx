import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClipboardCopy, FileDown, FileSpreadsheet, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';
import './styles.css';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const CATEGORIES = ['牆面地面', '客廳玄關', '臥室', '廁所', '廚房', '陽台', '窗戶', '注意事項', '其他'];

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

const defaultSpecialNotes = `1 本估價單為含耗材與清潔工具之專業報價。
2 團隊進場制：所有管家會同進同出，確保施工品質與驗收一致性。
3 品質保證：施作後屋主可現場驗收，若有遺漏可立即補強處理。
4 報價依實際現場狀況為準；若與場勘資訊差異較大，將於現場說明並經屋主同意後處理。`;

const defaultTerms = `1. 付款條件：待確認。
2. 付款期限：施作完畢後付款，匯費勿內扣。
3. 施作日期：待確認。
驗收完畢完成驗收通過，視同完成通過驗收，事後無法要求再回現場進行二次清潔。`;

const defaultPaymentNote = `戶名：待確認
銀行：待確認
帳號：待確認
匯款後請提供末五碼，以利對帳。`;

const emptyForm = {
  title: '遷入/遷出清潔 估價單',
  company: '',
  taxId: '',
  contact: '',
  phone: '',
  building: '',
  address: '',
  roomSummary: '',
  quoteDate: new Date().toISOString().slice(0, 10),
  validUntil: '',
  serviceDate: '',
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
    ? rows.map((row) => ({
        area: validAreas.has(row.area) ? row.area : detectCategory(`${row.area || ''} ${row.detail || ''}`),
        detail: row.detail?.trim() || '待確認'
      }))
    : [];
  return cleaned.length ? cleaned : [{ area: '其他', detail: '施工內容待確認' }];
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

function pickField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/[，,。；;]+$/g, '');
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
  return {
    title: pickField(text, [/([^\n]{2,20}估價單)/]),
    quoteDate: normalizeDateValue(pickField(text, [/日期\s*([0-9/-]{6,10})/, /日期\s*(\d{3}年\d{1,2}月\d{1,2}日?)/])),
    validUntil: normalizeDateValue(pickField(text, [/有效日期至\s*([0-9/-]{6,10})/, /有效日期至\s*(\d{3}年\d{1,2}月\d{1,2}日?)/])),
    company: pickField(text, [/客戶公司名稱\s*([^\n]+)/, /公司名稱\s*[:：]?\s*([^\n]+)/]),
    taxId: pickField(text, [/統編\s*([0-9]{8})/, /統一編號\s*[:：]?\s*([0-9]{8})/]),
    contact: pickField(text, [/聯絡人\s*([^\n]+)/, /聯絡人姓名\s*[:：]?\s*([^\n]+)/]),
    phone: pickField(text, [/聯絡電話\s*([0-9+\-\s()]{8,})/, /電話\s*[:：]?\s*([0-9+\-\s()]{8,})/]),
    building: pickField(text, [/社區\s*([^\n]+)/, /社區\/大樓\s*[:：]?\s*([^\n]+)/]),
    address: pickField(text, [/地址\s*([^\n]+)/]),
    roomSummary: pickField(text, [/(\d+\s*房\s*\d+\s*廳\s*\d+\s*衛\s*\d+\s*陽台)/, /房型\s*[:：]?\s*([^\n]+)/]),
    serviceDate: normalizeDateValue(pickField(text, [/施作日期\s*[:：]?\s*([^\n]+)/]))
  };
}

function buildCategoryRows(items) {
  return CATEGORIES.map((category, index) => {
    const details = items.filter((item) => item.area === category).map((item) => item.detail || '待確認');
    return {
      number: index + 1,
      area: category,
      detail: details.length ? details.join('\n') : '待確認'
    };
  });
}

function buildPlainText(form, rows) {
  const itemText = rows.map((row) => `${row.number}. ${row.area}\n${stripColorTags(row.detail)}`).join('\n\n');
  return [
    pending(form.title),
    `日期：${pending(form.quoteDate)}`,
    `有效日期至：${pending(form.validUntil)}`,
    `客戶公司名稱：${pending(form.company)}`,
    `統編：${pending(form.taxId)}`,
    `聯絡人：${pending(form.contact)}`,
    `聯絡電話：${pending(form.phone)}`,
    `社區：${pending(form.building)}`,
    `地址：${pending(form.address)}`,
    `房型：${pending(form.roomSummary)}`,
    `施作日期：${pending(form.serviceDate)}`,
    `${pending(form.serviceFeeLabel)} 小計：${money(form.serviceSubtotal)}`,
    `${pending(form.serviceFeeLabel)} 稅額：${money(form.serviceTax)}`,
    `${pending(form.serviceFeeLabel)} 總計含稅：${money(form.serviceTotal)}`,
    `${pending(form.cleaningFeeLabel)} 小計：${money(form.cleaningSubtotal)}`,
    `${pending(form.cleaningFeeLabel)} 稅額：${money(form.cleaningTax)}`,
    `${pending(form.cleaningFeeLabel)} 總計含稅：${money(form.cleaningTotal)}`,
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
    .meta-row span { min-width: 0; padding: 7px 8px; overflow-wrap: anywhere; word-break: break-word; line-height: 1.45; }
    .meta-row span:first-child { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.35); font-weight: 700; text-align: center; }
    .note-row { display: grid; grid-template-columns: 24px 1fr; gap: 8px; margin: 8px 0; font-size: 13px; line-height: 1.55; }
    .note-row span { text-align: right; font-weight: 700; }
    .brand { text-align: center; }
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
    .fee-grid { display: grid; grid-template-columns: 120px 1fr; gap: 8px; color: #e11d1d; font-weight: 700; }
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
    <div class="bar">${escapeHtml(pending(form.roomSummary))}　施 作 項 目</div>
    <table><tbody>
      ${rows
        .map((row) => `<tr class="${row.area === '注意事項' || row.area === '其他' ? 'highlight' : ''}"><td class="no">${row.number}</td><td class="area">${escapeHtml(row.area)}</td><td>${richTextHtml(row.detail)}</td></tr>`)
        .join('')}
    </tbody></table>
    <section class="bottom">
      <div class="box">
        <strong>${escapeHtml(pending(form.serviceFeeLabel))}</strong>
        <div class="fee-grid"><span>小計</span><span>${escapeHtml(money(form.serviceSubtotal))}</span><span>稅額</span><span>${escapeHtml(money(form.serviceTax))}</span><span>總計含稅</span><span>${escapeHtml(money(form.serviceTotal))}</span><span>訂金</span><span>${escapeHtml(money(form.deposit))}</span><span>尾款</span><span>${escapeHtml(money(form.balance))}</span></div>
        <p class="muted">${richTextHtml(pending(form.paymentNote))}</p>
      </div>
      <div class="box"><strong>條款及細則</strong><p class="muted">${richTextHtml(pending(form.terms))}</p><div class="signature">接受報價簽名：</div></div>
    </section>
  </main>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function App() {
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([{ area: '其他', detail: '施工內容待確認' }]);
  const [status, setStatus] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#d92626');
  const [activeTextTarget, setActiveTextTarget] = useState(null);
  const quoteRef = useRef(null);
  const textRefs = useRef({});

  const categoryRows = useMemo(() => buildCategoryRows(items), [items]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCategoryDetail(category, value) {
    setItems((current) => {
      const remaining = current.filter((item) => item.area !== category);
      return [...remaining, { area: category, detail: value || '待確認' }];
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

  async function organizeTextContent(text, mode = 'manual') {
    if (!text.trim()) {
      setItems([{ area: '其他', detail: '施工內容待確認' }]);
      setStatus('尚未偵測到可整理的場勘文字');
      return;
    }

    setIsOrganizing(true);
    setStatus(mode === 'paste' ? '已偵測貼上內容，正在自動整理...' : '正在整理施工細項...');
    try {
      const response = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, categories: CATEGORIES })
      });
      if (!response.ok) throw new Error('AI API unavailable');
      const data = await response.json();
      setItems(sanitizeAiRows(data.items));
      setStatus(mode === 'paste' ? '已自動分析貼上內容並套入施作項目' : '已用 AI 整理完成');
    } catch {
      setItems(localOrganize(text));
      setStatus(
        mode === 'paste'
          ? '已自動套入施作項目；若要提升準確度，請設定 OpenAI API Key'
          : '已用本機規則整理完成；若要啟用 AI，請設定 OpenAI API Key'
      );
    } finally {
      setIsOrganizing(false);
    }
  }

  async function organizeText() {
    await organizeTextContent(form.rawText, 'manual');
  }

  async function extractPdfText(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: buffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(' '));
    }

    return pages.join('\n');
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
      const inferred = inferFormFields(text);

      setForm((current) => ({
        ...current,
        ...Object.fromEntries(Object.entries(inferred).filter(([, value]) => value)),
        rawText: text
      }));
      await organizeTextContent(text, 'file');
      setStatus(`已匯入 ${file.name}，並自動套入資料`);
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
      ['日期', pending(form.quoteDate)],
      ['有效日期至', pending(form.validUntil)],
      ['客戶公司名稱', pending(form.company)],
      ['統編', pending(form.taxId)],
      ['聯絡人', pending(form.contact)],
      ['聯絡電話', pending(form.phone)],
      ['社區', pending(form.building)],
      ['地址', pending(form.address)],
      ['房型', pending(form.roomSummary)],
      ['施作日期', pending(form.serviceDate)],
      [`${pending(form.serviceFeeLabel)} 小計`, money(form.serviceSubtotal)],
      [`${pending(form.serviceFeeLabel)} 稅額`, money(form.serviceTax)],
      [`${pending(form.serviceFeeLabel)} 總計含稅`, money(form.serviceTotal)],
      [`${pending(form.cleaningFeeLabel)} 小計`, money(form.cleaningSubtotal)],
      [`${pending(form.cleaningFeeLabel)} 稅額`, money(form.cleaningTax)],
      [`${pending(form.cleaningFeeLabel)} 總計含稅`, money(form.cleaningTotal)],
      ['訂金', money(form.deposit)],
      ['尾款', money(form.balance)]
    ];
    const itemRows = categoryRows.map((row) => ({
      編號: row.number,
      區域: row.area,
      施工細項: stripColorTags(row.detail)
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(infoRows), '基本資料');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['特別說明'], ...linesFromText(form.specialNotes).map((line) => [stripColorTags(line)])]), '特別說明');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), '施工項目');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['條款及細則'], ...linesFromText(form.terms).map((line) => [stripColorTags(line)])]), '條款及細則');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['付款資訊'], ...linesFromText(form.paymentNote).map((line) => [stripColorTags(line)])]), '付款資訊');
    XLSX.writeFile(wb, `場勘報價清單_${pending(form.company)}.xlsx`);
    setStatus('已下載 Excel');
  }

  async function downloadPdf() {
    try {
      if (!quoteRef.current) return;
      setStatus('正在產生 PDF...');
      const canvas = await html2canvas(quoteRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 48;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/png');
      let y = 24;
      let remainingHeight = imgHeight;

      doc.addImage(imgData, 'PNG', 24, y, imgWidth, imgHeight);
      remainingHeight -= pageHeight - 48;
      while (remainingHeight > 0) {
        doc.addPage();
        y = remainingHeight - imgHeight + 24;
        doc.addImage(imgData, 'PNG', 24, y, imgWidth, imgHeight);
        remainingHeight -= pageHeight - 48;
      }
      doc.save(`場勘報價清單_${pending(form.company)}.pdf`);
      setStatus('已下載 PDF');
    } catch {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(buildPrintHtml(form, categoryRows));
      printWindow.document.close();
      setStatus('已開啟列印視窗，可選擇另存為 PDF');
    }
  }

  function openPrintablePdf() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(buildPrintHtml(form, categoryRows));
    printWindow.document.close();
    setStatus('已開啟列印視窗，可選擇另存為 PDF');
  }

  const fields = [
    ['title', '估價單名稱'],
    ['company', '客戶公司名稱'],
    ['taxId', '統編'],
    ['contact', '聯絡人姓名'],
    ['phone', '聯絡電話'],
    ['building', '社區/大樓'],
    ['roomSummary', '房型/格局'],
    ['quoteDate', '日期', 'date'],
    ['validUntil', '有效日期', 'date'],
    ['serviceDate', '施作日期', 'date'],
    ['address', '地址']
  ];

  const metaRows = [
    ['日期', pending(form.quoteDate)],
    ['有效日期至', pending(form.validUntil)],
    ['客戶公司名稱', pending(form.company)],
    ['統編', pending(form.taxId)],
    ['聯絡人', pending(form.contact)],
    ['聯絡電話', pending(form.phone)],
    ['社區', pending(form.building)],
    ['地址', pending(form.address)]
  ];

  const feeFields = [
    ['serviceSubtotal', '清潔 A 小計'],
    ['serviceTax', '清潔 A 稅額'],
    ['serviceTotal', '清潔 A 總計'],
    ['cleaningSubtotal', '清潔 B 小計'],
    ['cleaningTax', '清潔 B 稅額'],
    ['cleaningTotal', '清潔 B 總計'],
    ['deposit', '訂金'],
    ['balance', '尾款']
  ];

  const quickColors = ['#d92626', '#f59e0b', '#2f7d32', '#2563eb', '#7c3aed', '#111827'];

  return (
    <main className="min-h-screen bg-[#eef3ea] text-stone-900">
      <div className="mx-auto flex max-w-[1580px] flex-col gap-5 px-4 py-5 lg:h-screen lg:flex-row lg:overflow-hidden">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#d9e2d2] bg-white shadow-soft">
          <div className="border-b border-[#dbe4d5] bg-gradient-to-r from-white to-[#f4f8f0] px-5 py-4">
            <p className="text-xs font-bold uppercase text-moss-700">Professional site survey quotation</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-stone-950">場勘報價清單產生器</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              貼上對話紀錄後自動整理施作項目，產出可供客戶確認的正式估價單內容。
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
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

            <section className="rounded-md border border-[#d7e5cf] bg-[#f4f9ef] p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-stone-800">匯入既有估價單</h2>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    支援 PDF、Excel、CSV。匯入後會嘗試帶入客戶資料並自動整理施作項目。
                  </p>
                </div>
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-bold text-moss-700 ring-1 ring-[#c8d9bd] transition hover:bg-moss-50">
                  選擇檔案
                  <input type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
            </section>

            <label className="block rounded-md border border-[#dfe8d8] bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <span className="block text-sm font-semibold text-stone-800">貼上 LINE 對話或場勘文字內容</span>
                  <span className="block text-xs text-stone-500">貼上後會自動分析並套入右側 1-9 類施作項目。</span>
                </div>
                <span className="rounded-full bg-moss-50 px-3 py-1 text-xs font-bold text-moss-700">Auto classify</span>
              </div>
              <textarea
                value={form.rawText}
                onChange={(event) => updateField('rawText', event.target.value)}
                onPaste={handleRawTextPaste}
                className="min-h-[230px] w-full resize-y rounded-md border border-[#cfd8c8] bg-[#fffefb] p-3 text-[15px] leading-7 outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                placeholder="例：客廳牆面要補土油漆、主臥窗戶玻璃清潔、廚房流理台除油，管委會施工時間需確認..."
              />
            </label>

            <section className="rounded-md border border-[#dfe8d8] bg-white p-3">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-stone-800">施作項目手動編輯</h2>
                <p className="mt-1 text-xs text-stone-500">AI 分類後可在這裡微調文字，也可以選取文字套用任意顏色。</p>
              </div>
              <div className="space-y-3">
                {categoryRows.map((row) => (
                  <label key={row.area} className="grid gap-2 md:grid-cols-[92px_1fr]">
                    <span className="pt-2 text-sm font-bold text-moss-700">{row.number}. {row.area}</span>
                    <RichTextEditor
                      editorId={`category:${row.area}`}
                      value={row.detail}
                      onChange={(value) => updateCategoryDetail(row.area, value)}
                      onActivate={handleRichEditorActivate}
                      className="min-h-20 w-full overflow-auto whitespace-pre-wrap rounded-md border border-[#cfd8c8] bg-[#fffefb] p-3 text-[14px] leading-6 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-stone-800">費用資訊</h2>
                  <p className="mt-1 text-xs text-stone-500">只輸入數字即可，預覽會自動顯示 NT$。不填則顯示待確認。</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-moss-700 ring-1 ring-[#dfe8d8]">Optional</span>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-bold text-stone-600">費用 A 標題</span>
                  <input
                    value={form.serviceFeeLabel}
                    onChange={(event) => updateField('serviceFeeLabel', event.target.value)}
                    className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                    placeholder="清潔費用 A"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-stone-600">費用 B 標題</span>
                  <input
                    value={form.cleaningFeeLabel}
                    onChange={(event) => updateField('cleaningFeeLabel', event.target.value)}
                    className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                    placeholder="清潔費用 B"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {feeFields.map(([field, label]) => (
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
            </section>

            <label className="block rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
              <span className="mb-1 block text-sm font-semibold text-stone-800">條款及細則</span>
              <span className="mb-2 block text-xs text-stone-500">建議放付款、施作、驗收與現場差異相關條款。</span>
              <RichTextEditor
                editorId="form:terms"
                value={form.terms}
                onChange={(value) => updateField('terms', value)}
                onActivate={handleRichEditorActivate}
                className="min-h-28 w-full overflow-auto whitespace-pre-wrap rounded-md border border-[#cfd8c8] bg-white p-3 text-[15px] leading-7 outline-none transition focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
              />
            </label>

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
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#dbe4d5] bg-[#fbfdf8] px-5 py-4">
            <button
              onClick={organizeText}
              disabled={isOrganizing}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-moss-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={18} />
              {isOrganizing ? '整理中' : 'AI 自動整理'}
            </button>
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

        <section className="flex min-h-0 flex-[1.25] flex-col overflow-hidden rounded-lg border border-[#d2dfca] bg-paper shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-leaf bg-[#3f6535] px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold opacity-90">正式估價單版型</p>
              <h2 className="text-2xl font-bold tracking-normal">估價單預覽</h2>
            </div>
            <div className="flex gap-2">
              <button title="複製結果" onClick={copyResult} className="icon-button">
                <ClipboardCopy size={18} />
              </button>
              <button title="下載 PDF" onClick={downloadPdf} className="icon-button">
                <FileDown size={18} />
              </button>
              <button title="瀏覽器另存 PDF" onClick={openPrintablePdf} className="icon-button">
                PDF
              </button>
              <button title="下載 Excel" onClick={downloadExcel} className="icon-button">
                <FileSpreadsheet size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-[#edf2e8] p-5">
            <article ref={quoteRef} className="mx-auto w-full max-w-[1000px] overflow-hidden border-2 border-[#1e2d1b] bg-white text-[13px] text-[#25381f] shadow-[0_20px_60px_rgba(40,64,35,0.18)]">
              <section className="grid grid-cols-1 bg-[#e8f3df] text-[#4f7d35] md:grid-cols-[1.25fr_0.95fr_150px]">
                <div className="px-6 py-5">
                  <p className="mb-1 text-center text-xs font-bold uppercase text-[#6f9461]">Quotation</p>
                  <h3 className="mb-4 text-center text-3xl font-semibold tracking-normal text-[#3f6535]">{pending(form.title)}</h3>
                  <div className="grid overflow-hidden border-l border-t border-[#c6d9ba] sm:grid-cols-2">
                    {metaRows.map(([label, value]) => (
                      <div key={label} className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] border-b border-r border-[#c6d9ba] text-[12px]">
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
                  <p className="text-2xl font-bold tracking-normal text-moss-800">微笑清家</p>
                  <p className="text-xs text-moss-700">meant2clean.com</p>
                </aside>
              </section>

              <div className="border-y border-[#1e2d1b] bg-[#548436] px-4 py-2.5 text-center text-2xl font-semibold tracking-[0.18em] text-white">
                {pending(form.roomSummary)}　施 作 項 目
              </div>

              <table className="w-full border-collapse">
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
                        <td className="border-t border-[#1e2d1b] px-3 py-4 text-center align-middle font-semibold text-[#57921f]">{row.number}</td>
                        <td className="border-t border-[#1e2d1b] px-3 py-4 text-center align-middle font-semibold tracking-[0.28em] text-[#496d34]">{row.area}</td>
                        <td className="border-t border-[#1e2d1b] px-4 py-4 leading-7 whitespace-pre-line text-stone-800"><RichText text={row.detail} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <section className="border-t border-[#1e2d1b]">
                <div className="grid bg-[#e8f3df] md:grid-cols-[1fr_1fr]">
                  <div className="border-b border-[#1e2d1b] md:border-b-0 md:border-r">
                    <div className="bg-[#dcebd3] px-4 py-2 text-center text-lg font-bold tracking-[0.12em] text-moss-700">費 用 摘 要</div>
                    <div className="grid grid-cols-2 border-t border-[#1e2d1b]">
                      <div className="border-r border-[#1e2d1b] p-4">
                        <p className="mb-3 font-bold text-red-600">{pending(form.serviceFeeLabel)}</p>
                        <div className="grid grid-cols-[88px_1fr] gap-y-3 text-red-600">
                          <span className="font-bold">小計</span>
                          <span>{money(form.serviceSubtotal)}</span>
                          <span className="font-bold">稅額</span>
                          <span>{money(form.serviceTax)}</span>
                          <span className="font-bold">總計含稅</span>
                          <span>{money(form.serviceTotal)}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="mb-3 font-bold text-red-600">{pending(form.cleaningFeeLabel)}</p>
                        <div className="grid grid-cols-[88px_1fr] gap-y-3 text-red-600">
                          <span className="font-bold">小計</span>
                          <span>{money(form.cleaningSubtotal)}</span>
                          <span className="font-bold">稅額</span>
                          <span>{money(form.cleaningTax)}</span>
                          <span className="font-bold">總計含稅</span>
                          <span>{money(form.cleaningTotal)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-y border-[#1e2d1b] bg-[#fffed0] text-red-600">
                      <div className="border-r border-[#1e2d1b] px-4 py-3 font-bold">訂金匯款：{money(form.deposit)}</div>
                      <div className="px-4 py-3 font-bold">尾款：{money(form.balance)}</div>
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

                  <div className="bg-[#e8f3df]">
                    <h4 className="border-b border-[#1e2d1b] bg-[#dcebd3] py-2 text-center text-lg font-bold tracking-[0.18em] text-moss-700">條 款 及 簽 核</h4>
                    <div className="grid grid-cols-[112px_1fr] border-b border-[#1e2d1b]">
                      <div className="border-r border-[#1e2d1b] px-3 py-3 text-center font-semibold text-moss-700">付款條件</div>
                      <div className="px-3 py-3 text-red-600">請依雙方確認內容辦理。</div>
                      <div className="border-r border-t border-[#1e2d1b] px-3 py-3 text-center font-semibold text-moss-700">付款期限</div>
                      <div className="border-t border-[#1e2d1b] px-3 py-3">施作完畢後付款，匯費勿內扣。</div>
                      <div className="border-r border-t border-[#1e2d1b] px-3 py-3 text-center font-semibold text-moss-700">施作日期</div>
                      <div className="border-t border-[#1e2d1b] px-3 py-3">{pending(form.serviceDate)}</div>
                    </div>
                    <div className="min-h-24 px-4 py-3 leading-7 whitespace-pre-line text-stone-800"><RichText text={pending(form.terms)} /></div>
                    <div className="border-t border-[#1e2d1b] bg-[#f7f0c6] px-4 py-3 leading-7 text-moss-700">
                      驗收完畢完成驗收通過（照片/影片或放棄驗收），視同「完成通過驗收」，事後無法要求再回現場進行二次清潔。
                    </div>
                    <div className="border-t border-[#1e2d1b] bg-white p-4">
                      <div className="mb-3 text-lg font-bold text-moss-700">接受報價簽名</div>
                      <div className="grid min-h-32 place-items-end border border-dashed border-[#8ba87c] bg-[#fbfdf8] p-4">
                        <div className="w-full border-t border-[#4f7d35] pt-2 text-right text-sm text-moss-700">簽名 / 日期</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="border-t border-[#1e2d1b] bg-[#f4f8ef] px-5 py-3 text-center text-xs leading-6 text-moss-700">
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

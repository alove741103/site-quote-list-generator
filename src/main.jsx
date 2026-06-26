import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, ChevronDown, GripVertical, Plus, ShieldCheck, Sparkles, SprayCan, UsersRound, X } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';
import './styles.css';
import { createNativeQuotePdf } from './nativePdf';
import { quoteLayoutConfig } from './layoutConfig';
import { themeConfig } from './themeConfig';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const constructionNoticePreviewConfig = quoteLayoutConfig.preview.constructionNotice;
const headerPreviewConfig = quoteLayoutConfig.preview.header;
const brandPreviewConfig = quoteLayoutConfig.preview.brand;
const quotePreviewLayoutStyle = {
  '--theme-primary': themeConfig.colors.primary,
  '--theme-primary-dark': themeConfig.colors.primaryDark,
  '--theme-primary-deep': themeConfig.colors.primaryDeep,
  '--theme-primary-light': themeConfig.colors.primaryLight,
  '--theme-primary-pale': themeConfig.colors.primaryPale,
  '--theme-warning': themeConfig.colors.warning,
  '--theme-warning-strong': themeConfig.colors.warningStrong,
  '--theme-danger': themeConfig.colors.danger,
  '--theme-danger-soft': themeConfig.colors.dangerSoft,
  '--theme-text': themeConfig.colors.text,
  '--theme-muted': themeConfig.colors.muted,
  '--theme-border': themeConfig.colors.border,
  '--theme-border-dark': themeConfig.colors.borderDark,
  '--theme-quote-gold': themeConfig.colors.quoteGold,
  '--theme-quote-gold-soft': themeConfig.colors.quoteGoldSoft,
  '--theme-sage': themeConfig.colors.sage,
  '--theme-sage-soft': themeConfig.colors.sageSoft,
  '--quote-header-columns': quoteLayoutConfig.preview.headerColumns,
  '--quote-header-section-padding-y': headerPreviewConfig.sectionPaddingY,
  '--quote-header-section-padding-x': headerPreviewConfig.sectionPaddingX,
  '--quote-header-notice-padding-x': headerPreviewConfig.noticePaddingX,
  '--quote-header-quotation-font-size': `${headerPreviewConfig.quotationFontSize}px`,
  '--quote-header-title-font-size': `${headerPreviewConfig.titleFontSize}px`,
  '--quote-header-title-line-height': headerPreviewConfig.titleLineHeight,
  '--quote-header-title-margin-bottom': headerPreviewConfig.titleMarginBottom,
  '--quote-header-reminder-margin': headerPreviewConfig.reminderMargin,
  '--quote-header-reminder-font-size': `${headerPreviewConfig.reminderFontSize}px`,
  '--quote-header-reminder-line-height': headerPreviewConfig.reminderLineHeight,
  '--quote-header-meta-font-size': `${headerPreviewConfig.metaFontSize}px`,
  '--quote-header-meta-columns': headerPreviewConfig.metaColumns,
  '--quote-header-meta-cell-min-height': `${headerPreviewConfig.metaCellMinHeight}px`,
  '--quote-header-meta-cell-padding-y': headerPreviewConfig.metaCellPaddingY,
  '--quote-header-meta-cell-padding-x': headerPreviewConfig.metaCellPaddingX,
  '--quote-brand-logo-width': `${brandPreviewConfig.logoWidth}px`,
  '--quote-brand-logo-height': `${brandPreviewConfig.logoHeight}px`,
  '--quote-brand-name-font-size': `${brandPreviewConfig.nameFontSize}px`,
  '--quote-brand-site-font-size': `${brandPreviewConfig.siteFontSize}px`,
  '--quote-brand-site-line-height': `${brandPreviewConfig.siteLineHeight}px`,
  '--quote-brand-site-max-width': `${brandPreviewConfig.siteMaxWidth}px`,
  '--quote-brand-secondary-qr-size': `${brandPreviewConfig.secondaryQrSize}px`,
  '--quote-brand-primary-qr-size': `${brandPreviewConfig.primaryQrSize}px`,
  '--quote-brand-qr-gap': `${brandPreviewConfig.qrGap}px`,
  '--quote-brand-secondary-margin-bottom': `${brandPreviewConfig.secondaryMarginBottom}px`,
  '--construction-notice-title-font-size': `${constructionNoticePreviewConfig.titleFontSize}px`,
  '--construction-notice-title-padding-bottom': `${constructionNoticePreviewConfig.titlePaddingBottom}px`,
  '--construction-notice-list-gap': `${constructionNoticePreviewConfig.listGap}px`,
  '--construction-notice-list-margin-top': `${constructionNoticePreviewConfig.listMarginTop}px`,
  '--construction-notice-card-icon-column': `${constructionNoticePreviewConfig.cardIconColumn}px`,
  '--construction-notice-card-min-height': `${constructionNoticePreviewConfig.cardMinHeight}px`,
  '--construction-notice-copy-padding': constructionNoticePreviewConfig.cardCopyPadding,
  '--construction-notice-heading-font-size': `${constructionNoticePreviewConfig.cardTitleFontSize}px`,
  '--construction-notice-text-font-size': `${constructionNoticePreviewConfig.cardTextFontSize}px`,
  '--construction-notice-text-line-height': constructionNoticePreviewConfig.cardTextLineHeight
};
const constructionItemsPreviewConfig = quoteLayoutConfig.preview.constructionItems;
const quoteItemsLayoutStyle = {
  '--quote-item-columns': constructionItemsPreviewConfig.columns,
  '--quote-item-row-min-height': `${constructionItemsPreviewConfig.rowMinHeight}px`,
  '--quote-item-cell-line-height': constructionItemsPreviewConfig.cellLineHeight,
  '--quote-item-number-padding': constructionItemsPreviewConfig.numberPadding,
  '--quote-item-area-padding': constructionItemsPreviewConfig.areaPadding,
  '--quote-item-detail-padding': constructionItemsPreviewConfig.detailPadding,
  '--quote-item-area-letter-spacing': constructionItemsPreviewConfig.areaLetterSpacing,
  '--quote-item-detail-white-space': constructionItemsPreviewConfig.detailWhiteSpace,
  '--quote-item-title-padding-y': `${constructionItemsPreviewConfig.titleBarPaddingY}rem`,
  '--quote-item-title-font-size': `${constructionItemsPreviewConfig.titleBarFontSize}rem`
};
const feeSummaryPreviewConfig = quoteLayoutConfig.preview.feeSummary;
const feeSummaryLayoutStyle = {
  '--qbf-summary-columns': feeSummaryPreviewConfig.columns,
  '--qbf-fee-grid-rows': feeSummaryPreviewConfig.feeGridRows,
  '--qbf-fee-cards-columns': feeSummaryPreviewConfig.feeCardsColumns,
  '--qbf-fee-card-padding': feeSummaryPreviewConfig.feeCardPadding,
  '--qbf-fee-name-margin-bottom': `${feeSummaryPreviewConfig.feeNameMarginBottom}px`,
  '--qbf-fee-name-font-size': `${feeSummaryPreviewConfig.feeNameFontSize}px`,
  '--qbf-fee-table-font-size': `${feeSummaryPreviewConfig.feeTableFontSize}px`,
  '--qbf-fee-table-gap': `${feeSummaryPreviewConfig.feeTableGap}px`,
  '--qbf-fee-row-columns': feeSummaryPreviewConfig.feeRowColumns,
  '--qbf-fee-row-min-height': `${feeSummaryPreviewConfig.feeRowMinHeight}px`,
  '--qbf-fee-cell-padding-x': `${feeSummaryPreviewConfig.feeCellPaddingX}px`,
  '--qbf-total-row-min-height': `${feeSummaryPreviewConfig.totalRowMinHeight}px`,
  '--qbf-total-font-size': `${feeSummaryPreviewConfig.totalFontSize}px`,
  '--qbf-total-gap': `${feeSummaryPreviewConfig.totalGap}px`,
  '--qbf-total-letter-spacing': feeSummaryPreviewConfig.totalLetterSpacing,
  '--qbf-total-badge-font-size': `${feeSummaryPreviewConfig.totalBadgeFontSize}px`,
  '--qbf-total-badge-padding': feeSummaryPreviewConfig.totalBadgePadding,
  '--qbf-total-badge-radius': `${feeSummaryPreviewConfig.totalBadgeRadius}px`,
  '--qbf-installment-columns': feeSummaryPreviewConfig.installmentColumns,
  '--qbf-installment-row-min-height': `${feeSummaryPreviewConfig.installmentRowMinHeight}px`,
  '--qbf-installment-font-size': `${feeSummaryPreviewConfig.installmentFontSize}px`,
  '--qbf-fee-red': feeSummaryPreviewConfig.red,
  '--qbf-total-red': feeSummaryPreviewConfig.totalRed,
  '--qbf-fee-line-height': feeSummaryPreviewConfig.lineHeight
};
const termsSignaturePreviewConfig = quoteLayoutConfig.preview.termsSignature;
const termsSignatureLayoutStyle = {
  '--qbf-terms-grid-rows': termsSignaturePreviewConfig.termsGridRows,
  '--qbf-term-list-rows': termsSignaturePreviewConfig.termListRows,
  '--qbf-term-row-columns': termsSignaturePreviewConfig.termRowColumns,
  '--qbf-term-row-gap': `${termsSignaturePreviewConfig.termRowGap}px`,
  '--qbf-term-cell-padding-x': `${termsSignaturePreviewConfig.termCellPaddingX}px`,
  '--qbf-term-cell-font-size': `${termsSignaturePreviewConfig.termCellFontSize}px`,
  '--qbf-term-cell-line-height': termsSignaturePreviewConfig.termCellLineHeight,
  '--qbf-term-note-gap': `${termsSignaturePreviewConfig.termNoteGap}px`,
  '--qbf-term-note-font-size': `${termsSignaturePreviewConfig.termNoteFontSize}px`,
  '--qbf-term-note-line-height': termsSignaturePreviewConfig.termNoteLineHeight,
  '--qbf-term-note-padding': termsSignaturePreviewConfig.termNotePadding,
  '--qbf-main-min-height': `${termsSignaturePreviewConfig.mainMinHeight}px`,
  '--qbf-signature-columns': termsSignaturePreviewConfig.signatureColumns,
  '--qbf-signature-card-padding': termsSignaturePreviewConfig.signatureCardPadding,
  '--qbf-signature-area-min-height': `${termsSignaturePreviewConfig.signatureAreaMinHeight}px`,
  '--qbf-signature-area-padding': `${termsSignaturePreviewConfig.signatureAreaPadding}px`,
  '--qbf-signature-line-padding-top': `${termsSignaturePreviewConfig.signatureLinePaddingTop}px`,
  '--qbf-export-term-row-columns': termsSignaturePreviewConfig.exportTermRowColumns,
  '--qbf-export-term-cell-font-size': `${termsSignaturePreviewConfig.exportTermCellFontSize}px`,
  '--qbf-export-term-cell-padding-x': `${termsSignaturePreviewConfig.exportTermCellPaddingX}px`,
  '--qbf-export-term-note-padding': termsSignaturePreviewConfig.exportTermNotePadding,
  '--qbf-export-term-note-font-size': `${termsSignaturePreviewConfig.exportTermNoteFontSize}px`,
  '--qbf-export-term-note-line-height': termsSignaturePreviewConfig.exportTermNoteLineHeight,
  '--qbf-export-signature-card-padding': termsSignaturePreviewConfig.exportSignatureCardPadding,
  '--qbf-export-signature-area-min-height': `${termsSignaturePreviewConfig.exportSignatureAreaMinHeight}px`
};
const bottomSummaryLayoutStyle = {
  ...feeSummaryLayoutStyle,
  ...termsSignatureLayoutStyle
};

const DEFAULT_CATEGORIES = ['牆面地面', '客廳玄關', '臥室', '廁所', '廚房', '陽台', '窗戶', '注意事項', '其他'];
const CATEGORIES = DEFAULT_CATEGORIES;
const DEFAULT_CATEGORY_CONFIG = DEFAULT_CATEGORIES.map((category) => ({ key: category, label: category }));
const BLANK_CASE_CATEGORY_CONFIG = DEFAULT_CATEGORY_CONFIG.filter((category) => category.key !== '其他');
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
  '若現場狀況與場勘照片或影片不同，需加時或調整費用時將另行說明。',
  '如有疑問歡迎於Line商家提出。'
];

const TEMPLATE_NOTICE_DETAIL = `*廁所乾濕分離門如有發霉、髒污及水垢皂垢管家都會盡量清潔，但可能無法100%去除還原。
*石材檯面材質，水中的鈣、鎂礦物質會在水蒸發後沉澱在石材表面形成水垢，部分表面會有這個情形，
  無法保證100%去除還原。
*廚房重度油垢如已經結成油塊、瓦斯爐架如已經生鏽、有燒焦痕跡、可能無法100%去除還原。
*大理石為特殊石材，如需拋光需尋求專業廠商`;

const TEMPLATE_OTHER_DETAIL = `*廢棄物: 管家僅協助整理集中，屋主需自備垃圾袋及自行清運。
*燈具、玻璃有使用年限，容易老舊脆化造成。僅以灰塵撢除塵方式進行。
*如物品老舊或是已不堪使用，可能導致破損或損壞，清潔前請先行知會。
*另天然因素損壞如：油漆、磁磚、水泥、水管、燈飾...等，因熱脹冷縮或自然災害而導致龜裂、剝落之情形，
  或金屬因潮濕或使用年限久遠而生鏽斷裂...等，如業主堅持清潔，微笑清家恕不賠償。`;

const CLEANING_TEMPLATES = {
  裝潢細清: {
    title: '裝潢細清 估價單',
    items: {
      牆面地面: '全室地板掃拖清潔，全室牆面除塵。',
      客廳玄關: '全室門片門框擦拭、全室牆面除塵、全室櫃體內外.平面.桌面擦拭(需協助撕保護膜)',
      臥室: '臥室門片、門框、櫃體內外、層板、平面、桌面擦拭(需協助撕保護膜)。',
      廁所: `廁所天花板、牆面、洗手台、乾溼分離玻璃、浴缸、馬桶、鏡子(鏡面及請小心處理)、抽風機排風口清潔。
需協助撕保護膜、除粉塵`,
      廚房: '廚房櫃體內外擦拭、牆面、烤漆玻璃、檯面、流理台、烘碗機、瓦斯爐、抽油煙機清潔、需除塵。',
      陽台: '陽台地板、牆面可及處、欄杆、排水孔與曬衣桿清潔。',
      窗戶: `全室玻璃、窗框、窗溝、紗窗清潔。
(外窗管家以工具輔助會盡量清潔，無法100%無水痕殘留，如遇直角式窗戶無開窗縫，則以內窗、窗框溝施作為主)
*安全考量: 窗戶會視情況是否拆窗施作，多數大樓窗戶比載重，如拆下有危險性，則以不拆窗施作。
*如有窗戶紗窗為摺紗，因摺紗脆弱易損壞，故管家僅能以除塵撢除去灰塵，可能無法100%乾淨。
*施作地點為高危險之處(如外窗、陽台、邊雨棚...)，或是無立足點、欄杆低於腰部...等部分，
  不在服務範圍內，管家請勿以輔助工具施作`,
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
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
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
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
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
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
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
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
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
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
      注意事項: TEMPLATE_NOTICE_DETAIL,
      其他: TEMPLATE_OTHER_DETAIL
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
    detail: template?.items?.[category.key] || ''
  }));
}

const defaultCleaningType = '';
const defaultSpecialNotes = buildStandardSpecialNotes();
const defaultConstructionNotes = `• 本估價單為含耗材與清潔工具之專業報價。
• 裝潢細清為團隊合作工程，所有管家同進同出，
確保施工品質與驗收一致性。
• 施作後屋主可現場驗收
若有遺漏可立即補強處理。
• [color=#d71920]若施作當日現場狀況與場勘或業主提供的[/color]
[color=#d71920]照片/影片不同，若需加時或調整費用，[/color]
[color=#d71920]將於當日與屋主說明並確認後再行處理。[/color]`;

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
  title: '清潔服務 估價單',
  cleaningType: defaultCleaningType,
  company: '',
  taxId: '',
  contact: '',
  phone: '',
  building: '',
  address: '',
  constructionNotes: defaultConstructionNotes,
  roomSummary: '',
  projectType: '',
  quoteDate: todayString(),
  validUntil: dateOffsetString(3),
  serviceDate: '待訂',
  paymentCondition: '匯款',
  paymentConditionOther: '',
  paymentDeadline: '施作完畢後付款，匯費勿內扣。',
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

function createEmptyForm() {
  return {
    ...emptyForm,
    quoteDate: todayString(),
    validUntil: dateOffsetString(3),
    serviceDate: '待訂'
  };
}

function pending(value) {
  return value?.trim() || '';
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

function printItemRowHtml(row) {
  const highlighted = Number(row.number) >= 8 ? 'highlight' : '';
  return `<div class="print-item-row ${highlighted}"><div class="print-item-cell no">${row.number}</div><div class="print-item-cell area">${escapeHtml(row.area)}</div><div class="print-item-cell">${richTextHtml(row.detail)}</div></div>`;
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

function constructionNoticeCards(text) {
  const titles = ['專業報價', '團隊進場', '現場驗收', '現況差異'];
  const cards = [];

  linesFromText(text).forEach((line) => {
    const bulletMatch = line.match(/^[•*－-]\s*(.*)$/);
    if (bulletMatch || !cards.length) {
      cards.push({
        title: titles[cards.length] || '施工須知',
        text: bulletMatch ? bulletMatch[1] : line
      });
      return;
    }
    cards[cards.length - 1].text = `${cards[cards.length - 1].text}\n${line}`;
  });

  return cards;
}

function money(value) {
  return value?.trim() ? `NT$ ${value.trim()}` : '';
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

function moneyNumber(value) {
  const normalized = String(value || '').replace(/[^\d.-]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function amountText(value) {
  if (value === null || value === undefined || value === '') return '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(Math.round(parsed)) : '';
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
  const chineseAmount = totalFeeChineseText(form);
  return chineseAmount ? `${chineseAmount}【含稅】` : '';
}

function totalFeeChineseText(form) {
  const serviceAmount = feeAmount(form.serviceTotal, form.serviceSubtotal, form.serviceTax);
  const cleaningAmount = feeAmount(form.cleaningTotal, form.cleaningSubtotal, form.cleaningTax);
  if (serviceAmount === null && cleaningAmount === null) return '';
  return numberToChineseCurrency((serviceAmount || 0) + (cleaningAmount || 0));
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

function paymentConditionText(form) {
  return form.paymentCondition === '其他' ? pending(form.paymentConditionOther) : pending(form.paymentCondition);
}

function termsExtraText(form) {
  const extraLines = linesFromText(form.terms).filter((line) => !/^\d+\s*[.．、]/.test(stripColorTags(line)));
  return extraLines.length
    ? extraLines.join('\n')
    : '驗收完畢完成驗收通過，視同完成通過驗收，\n事後無法要求再回現場進行二次清潔。';
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
  const activeConfig = [...categoryConfig];
  items.forEach((item) => {
    if (!activeConfig.some((category) => category.key === item.area)) {
      activeConfig.push({ key: item.area, label: item.area });
    }
  });
  return activeConfig.map((category, index) => {
    const details = items.filter((item) => item.area === category.key).map((item) => item.detail || '');
    return {
      number: index + 1,
      area: category.label || '',
      key: category.key,
      detail: details.length ? details.join('\n') : ''
    };
  }).filter((row) => row.area || row.detail);
}

function buildPlainText(form, rows) {
  const itemText = rows.map((row) => `${row.number}. ${row.area}\n${stripColorTags(row.detail)}`).join('\n\n');
  return [
    pending(form.title),
    `清潔類型：${pending(form.cleaningType)}`,
    `日期：${pending(form.quoteDate)}`,
    `有效日期至：${pending(form.validUntil)}`,
    `公司名稱：${pending(form.company)}`,
    `統編：${pending(form.taxId)}`,
    `聯絡人：${pending(form.contact)}`,
    `聯絡電話：${pending(form.phone)}`,
    `社區：${pending(form.building)}`,
    `地址：${pending(form.address)}`,
    `施工說明：${stripColorTags(pending(form.constructionNotes))}`,
    `房型：${pending(form.roomSummary)}`,
    `型態：${pending(form.projectType)}`,
    `施作日期：${pending(form.serviceDate)}`,
    `付款條件：${paymentConditionText(form)}`,
    `付款期限：${pending(form.paymentDeadline)}`,
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
    ''
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
    .meta-row span { min-width: 0; padding: 7px 8px; overflow-wrap: anywhere; word-break: break-word; line-height: 1.45; }
    .meta-row span:first-child { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.35); font-weight: 700; text-align: center; }
    .note-row { display: grid; grid-template-columns: 24px 1fr; gap: 8px; margin: 8px 0; font-size: 13px; line-height: 1.55; }
    .note-row span { text-align: right; font-weight: 700; }
    .brand { text-align: center; word-break: break-all; overflow-wrap: anywhere; overflow: hidden; }
    .brand strong, .brand div { display: block; max-width: 100%; line-height: 1.35; }
    .brand div { font-size: 11px; }
    .qr-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 12px; }
    .qr { width: 52px; height: 52px; border: 2px solid #8bb078; background: repeating-linear-gradient(45deg,#fff,#fff 5px,#dbead1 5px,#dbead1 10px); }
    .logo { width: 62px; height: 62px; border: 2px solid #4b7d35; border-radius: 50%; display: grid; place-items: center; margin: 6px auto; font-size: 30px; font-weight: 700; }
    .bar { background: #548436; color: white; text-align: center; font-size: 24px; letter-spacing: 4px; padding: 7px; }
    .print-items-grid { display: grid; background: #111; gap: 1px 0; font-size: 13px; }
    .print-item-row { display: grid; grid-template-columns: 54px 120px minmax(0, 1fr); min-height: 42px; background: #fff; }
    .print-item-row.highlight { background: #fffed0; }
    .print-item-cell { display: flex; min-width: 0; align-items: center; justify-content: flex-start; background: inherit; padding: 12px 14px; line-height: 1.28; white-space: pre-line; overflow-wrap: anywhere; }
    .no { justify-content: center; color: #57921f; text-align: center; }
    .area { justify-content: center; color: #496d34; text-align: center; letter-spacing: 6px; }
    .bottom { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #111; }
    .box { min-height: 170px; padding: 18px; border-right: 1px solid #111; }
    .box:last-child { border-right: 0; }
    .muted { color: #688158; font-size: 13px; line-height: 1.8; white-space: pre-line; }
    .fee-columns { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #c8d9bd; background: #fff; }
    .fee-panel { padding: 10px 12px; border-right: 1px solid #c8d9bd; min-width: 0; }
    .fee-panel:last-child { border-right: 0; }
    .fee-title { margin-bottom: 8px; color: #243423; font-weight: 700; overflow-wrap: anywhere; }
    .fee-grid { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 6px 8px; color: #e11d1d; font-weight: 700; overflow-wrap: anywhere; }
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
          <div class="meta-row"><span>公司名稱</span><span>${escapeHtml(pending(form.company))}</span></div>
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
    <div class="print-items-grid">
      ${rows
        .map(printItemRowHtml)
        .join('')}
    </div>
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
      </div>
      <div class="box"><strong>條款及細則</strong><p class="muted">${richTextHtml(pending(form.terms))}</p><div class="signature">接受報價簽名：</div><div class="signature">驗收簽名：</div></div>
    </section>
  </main>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

function App() {
  const [form, setForm] = useState(createEmptyForm);
  const [items, setItems] = useState([]);
  const [categoryConfig, setCategoryConfig] = useState(BLANK_CASE_CATEGORY_CONFIG);
  const [status, setStatus] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#d92626');
  const [activeTextTarget, setActiveTextTarget] = useState(null);
  const [draggingCategoryKey, setDraggingCategoryKey] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
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
    setForm((current) => {
      const next = { ...current, [field]: value };

      const syncFee = (prefix) => {
        const subtotalField = `${prefix}Subtotal`;
        const taxField = `${prefix}Tax`;
        const totalField = `${prefix}Total`;
        const subtotal = moneyNumber(next[subtotalField]);
        if (subtotal === null) {
          if (field === subtotalField) {
            next[taxField] = '';
            next[totalField] = '';
          }
          return;
        }
        const tax = Math.round(subtotal * 0.05);
        next[taxField] = amountText(tax);
        next[totalField] = amountText(subtotal + tax);
      };

      if (field === 'serviceSubtotal') syncFee('service');
      if (field === 'cleaningSubtotal') syncFee('cleaning');

      if (['serviceSubtotal', 'cleaningSubtotal', 'serviceTotal', 'cleaningTotal', 'deposit'].includes(field)) {
        const serviceAmount = feeAmount(next.serviceTotal, next.serviceSubtotal, next.serviceTax) || 0;
        const cleaningAmount = feeAmount(next.cleaningTotal, next.cleaningSubtotal, next.cleaningTax) || 0;
        const depositAmount = moneyNumber(next.deposit);
        if (depositAmount !== null) {
          next.balance = amountText(Math.max(0, serviceAmount + cleaningAmount - depositAmount));
        }
      }

      return next;
    });
  }

  function openConfirmDialog({ title, message, confirmText, onConfirm }) {
    setConfirmDialog({ title, message, confirmText, onConfirm });
  }

  function closeConfirmDialog() {
    setConfirmDialog(null);
  }

  function confirmAndClose() {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  }

  function applyCleaningTemplate(cleaningType) {
    if (cleaningType === form.cleaningType && items.length > 0) return;
    if (!cleaningType) {
      setForm((current) => ({ ...current, cleaningType: '' }));
      return;
    }
    openConfirmDialog({
      title: '套用清潔範本',
      message: '套用範本會覆蓋目前施工項目，是否繼續？',
      confirmText: '繼續套用',
      onConfirm: () => applyCleaningTemplateNow(cleaningType)
    });
  }

  function applyCleaningTemplateNow(cleaningType) {
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

  function resetCurrentCase() {
    openConfirmDialog({
      title: '開新案件',
      message: '開新案件會清空目前資料，並以空白估價單覆蓋舊內容，是否繼續？',
      confirmText: '開新案件',
      onConfirm: resetCurrentCaseNow
    });
  }

  function resetCurrentCaseNow() {
    setForm(createEmptyForm());
    setCategoryConfig(BLANK_CASE_CATEGORY_CONFIG);
    setItems([]);
    setOpenSections({
      survey: true,
      customer: false,
      notes: false,
      items: false,
      payment: false
    });
    setActiveTextTarget(null);
    setDraggingCategoryKey('');
    setStatus('已建立空白估價單');
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
      const next = [...current];
      const index = next.findIndex((item) => item.area === category);
      if (index >= 0) {
        next[index] = { ...next[index], detail: value || '' };
        return next;
      }
      return [...next, { area: category, detail: value || '' }];
    });
  }

  function updateCategoryLabel(key, value) {
    setCategoryConfig((current) => current.map((category) => (category.key === key ? { ...category, label: value } : category)));
  }

  function addCategoryRow() {
    const key = `custom-${Date.now()}`;
    setCategoryConfig((current) => [...current, { key, label: '新增項目' }]);
    setItems((current) => [...current, { area: key, detail: '' }]);
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
    const validAreas = new Set([...DEFAULT_CATEGORY_CONFIG, ...categoryConfig].map((category) => category.key));
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
    setStatus(mode === 'paste' ? '已偵測貼上內容，正在解析補充內容...' : '正在解析補充內容...');
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
          ? `已解析補充內容：新增 ${addedCount} 個項目，並套入 ${inferredCount} 個客戶資料欄位`
          : `已解析補充內容，沒有新增重複項目；套入 ${inferredCount} 個客戶資料欄位`
      );
    } catch {
      const addedCount = appendSupplementRows(localOrganize(text));
      setOpenSections((current) => ({ ...current, items: true }));
      setStatus(
        addedCount
          ? `已用本機規則新增 ${addedCount} 個 LINE 補充項目，並套入 ${inferredCount} 個客戶資料欄位`
          : `已解析補充內容，沒有新增重複項目；若要提升準確度，請完成 API Key 設定`
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
      ['公司名稱', pending(form.company)],
      ['統編', pending(form.taxId)],
      ['聯絡人', pending(form.contact)],
      ['聯絡電話', pending(form.phone)],
      ['社區', pending(form.building)],
      ['地址', pending(form.address)],
      ['房型', pending(form.roomSummary)],
      ['型態', pending(form.projectType)],
      ['施作日期', pending(form.serviceDate)],
      ['付款條件', paymentConditionText(form)],
      ['付款期限', pending(form.paymentDeadline)],
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

    XLSX.writeFile(wb, `場勘報價清單_${pending(form.company)}.xlsx`);
    setStatus('已下載 Excel');
  }

  async function downloadPdf() {
    try {
      setStatus('正在產生 PDF...');
      const pdfBytes = await createNativeQuotePdf(form, categoryRows);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `場勘報價清單_${pending(form.company)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus('已下載 PDF');
    } catch (error) {
      console.error(error);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(buildPrintHtml(form, categoryRows));
      printWindow.document.close();
      setStatus('PDF 模板產生失敗，已開啟列印視窗。');
    }
  }

  const fields = [
    ['title', '估價單名稱'],
    ['company', '公司名稱'],
    ['taxId', '統編'],
    ['contact', '聯絡人姓名'],
    ['phone', '聯絡電話'],
    ['building', '社區/大樓'],
    ['roomSummary', '房型/格局'],
    ['projectType', '型態'],
    ['quoteDate', '日期', 'date'],
    ['validUntil', '有效日期', 'date'],
    ['address', '地址']
  ];

  const metaRows = [
    { label: '日期', value: pending(form.quoteDate) },
    { label: '有效日期至', value: pending(form.validUntil) },
    { label: '公司名稱', value: pending(form.company) },
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
          <div className="relative overflow-hidden border-b border-[#dbe4d5] bg-gradient-to-r from-white to-[#f4f8f0] px-5 py-4">
            <div className="pointer-events-none absolute right-5 top-4 opacity-90" aria-hidden="true">
              <img className="kitty-mini" src="/assets/hello-kitty-accent.png" alt="" />
            </div>
            <div className="pr-24">
              <p className="text-xs font-bold uppercase text-moss-700">Professional site survey quotation</p>
              <h1 className="mt-1 text-2xl font-bold tracking-normal text-stone-950">場勘報價清單產生器</h1>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                先套用清潔範本，再將 LINE 對話解析為補充項目，產出可供客戶確認的正式估價單內容。
              </p>
            </div>
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
                      placeholder=""
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
                    <option value="">請選擇清潔類型</option>
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
                    {isOrganizing ? '解析中' : '解析補充內容'}
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
                    <p className="mt-1 text-xs text-stone-500">只輸入數字即可，預覽會自動顯示 NT$。不填則留白。</p>
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
                              placeholder=""
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-md border border-[#dfe8d8] bg-white p-3 sm:grid-cols-[0.7fr_0.7fr_1.8fr]">
                  {paymentSummaryFields.map(([field, label]) => (
                    <label key={field}>
                      <span className="mb-1 block text-xs font-bold text-stone-600">{label}</span>
                      <input
                        inputMode="numeric"
                        value={form[field]}
                        onChange={(event) => updateField(field, event.target.value)}
                        className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        placeholder=""
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
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-xs font-bold text-stone-600">付款期限</span>
                    <input
                      value={form.paymentDeadline}
                      onChange={(event) => updateField('paymentDeadline', event.target.value)}
                      className="h-10 w-full rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                      placeholder="施作完畢後付款，匯費勿內扣。"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-stone-600">施作日期</span>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={/^\d{4}-\d{2}-\d{2}$/.test(form.serviceDate) ? form.serviceDate : ''}
                        onChange={(event) => updateField('serviceDate', event.target.value)}
                        className="h-10 min-w-0 flex-1 rounded-md border border-[#cfd8c8] bg-white px-3 text-[14px] outline-none transition placeholder:text-stone-400 focus:border-moss-600 focus:ring-2 focus:ring-moss-100"
                        placeholder="待訂或 YYYY-MM-DD"
                      />
                      <button
                        type="button"
                        onClick={() => updateField('serviceDate', '待訂')}
                        className="h-10 rounded-md border border-[#cfd8c8] bg-[#fbfdf8] px-3 text-sm font-bold text-moss-700 transition hover:bg-moss-50"
                      >
                        待訂
                      </button>
                    </div>
                  </label>
                </div>
              </section>

            </AccordionSection>

            <AccordionSection
              title="施工說明"
              description="估價單上方施工須知內容。"
              open={openSections.notes}
              onToggle={() => toggleSection('notes')}
              className="order-5"
            >
              <label className="block rounded-md border border-[#dfe8d8] bg-[#fbfdf8] p-3">
                <span className="mb-1 block text-sm font-semibold text-stone-800">施工說明</span>
                <span className="mb-2 block text-xs text-stone-500">會顯示在估價單右上方，建議保留品質、驗收、現場差異等說明。</span>
                <RichTextEditor
                  editorId="form:constructionNotes"
                  value={form.constructionNotes}
                  onChange={(value) => updateField('constructionNotes', value)}
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
              <button title="建立空白估價單" onClick={resetCurrentCase} className="icon-button">
                開新案件
              </button>
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
              <section className="quote-header grid grid-cols-1 bg-[#e8f3df] text-[#4f7d35] md:grid-cols-[1.2fr_0.9fr_170px]" style={quotePreviewLayoutStyle}>
                <div className="px-6 py-5">
                  <p className="quote-kicker mb-1 text-center text-xs font-bold uppercase text-[#6f9461]">Quotation</p>
                  <h3 className="mb-4 text-center text-3xl font-semibold tracking-normal text-[#3f6535]">{pending(form.title)}</h3>
                  <p className="quote-contact-reminder">如對本報價內容有任何疑問，歡迎透過 LINE 商家與我們聯繫。</p>
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
                  <p className="construction-notice-title">施工須知</p>
                  <div className="construction-notice-list">
                    {constructionNoticeCards(form.constructionNotes).map((card, index) => {
                      const Icon = [SprayCan, UsersRound, ShieldCheck, Camera][index] || ShieldCheck;
                      const isImportant = card.text.includes('[color=#d71920]') || card.text.includes('#d71920');
                      return (
                        <div key={`${card.title}-${index}`} className={`construction-notice-card ${isImportant ? 'construction-notice-card-important' : ''}`}>
                          <div className="construction-notice-icon"><Icon size={constructionNoticePreviewConfig.iconSize} strokeWidth={constructionNoticePreviewConfig.iconStrokeWidth} /></div>
                          <div className="construction-notice-copy">
                            <p className="construction-notice-heading">{card.title}</p>
                            <div className="construction-notice-text">
                              {card.text.split('\n').map((line) => (
                                <p key={line}><RichText text={line} /></p>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <aside className="border-t border-[#c6d9ba] bg-[#f4f8ef] px-4 py-5 text-center md:border-l md:border-t-0">
                  <img className="brand-logo-mark mx-auto mb-2" src="/assets/brand-logo-mark.png" alt="微笑清家 Logo" />
                  <p className="brand-name text-xl font-bold tracking-normal text-moss-800">微笑清家</p>
                  <p className="brand-site mx-auto mb-3 max-w-[120px] break-all text-[10px] leading-4 text-moss-700">meant2clean.com</p>
                  <div className="brand-qr-secondary mb-3 flex justify-center gap-2">
                    <div className="brand-qr-mini">
                      <span>IG</span>
                      <img src="/assets/brand-qr-instagram.png" alt="Instagram QR" />
                    </div>
                    <div className="brand-qr-mini">
                      <span>FB</span>
                      <img src="/assets/brand-qr-facebook.png" alt="Facebook QR" />
                    </div>
                  </div>
                  <div className="brand-qr-primary flex justify-center">
                    <img src="/assets/brand-qr-line.png" alt="LINE QR Code" />
                  </div>
                </aside>
              </section>

              <div className="quote-items-title-bar border-y border-[#1e2d1b] bg-[#548436] px-4 py-2.5 text-center text-2xl font-semibold tracking-[0.18em] text-white" style={quoteItemsLayoutStyle}>
                {formatRoomSummary(form.roomSummary)}　施 作 項 目
              </div>

              <div className="quote-items-grid" style={quoteItemsLayoutStyle}>
                  {categoryRows.map((row) => {
                    const highlighted = constructionItemsPreviewConfig.featuredNumbers.includes(Number(row.number));
                    return (
                      <div key={row.area} className={`quote-item-row ${highlighted ? 'is-highlighted' : ''}`}>
                        <div className="quote-item-cell quote-item-no">{row.number}</div>
                        <div className="quote-item-cell quote-item-area">{row.area}</div>
                        <div className="quote-item-cell quote-item-detail">
                          <span className="quote-item-detail-text"><RichText text={row.detail} /></span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <section className="quote-bottom-frame">
                <div className="qbf-head">
                  <div className="qbf-title">費 用 摘 要</div>
                  <div className="qbf-title">條 款 及 簽 核</div>
                </div>
                <div className="qbf-summary" style={bottomSummaryLayoutStyle}>
                  <div className="qbf-fees">
                    <div className="qbf-fee-cards">
                      {[
                        [pending(form.serviceFeeLabel), [
                          ['小計', money(form.serviceSubtotal)],
                          ['稅額', money(form.serviceTax)],
                          ['總計含稅', money(form.serviceTotal)]
                        ]],
                        [pending(form.cleaningFeeLabel), [
                          ['小計', money(form.cleaningSubtotal)],
                          ['稅額', money(form.cleaningTax)],
                          ['總計含稅', money(form.cleaningTotal)]
                        ]]
                      ].map(([title, rows]) => (
                        <div key={title} className="qbf-fee-card">
                          <p className="qbf-fee-name">{title}</p>
                          <div className="qbf-fee-table">
                            {rows.map(([label, value]) => (
                              <div key={label} className="qbf-fee-row">
                                <span>{label}</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="qbf-total">
                      <span className="qbf-total-badge"><span className="qbf-total-badge-text">應付總額</span></span>
                      <span className="cell-content">{totalFeeText(form)}</span>
                    </div>
                    <div className="qbf-installments">
                      <div>訂金匯款：{money(form.deposit)}</div>
                      <div>尾款：{money(form.balance)}</div>
                    </div>
                  </div>
                  <div className="qbf-terms">
                    <div className="qbf-term-list">
                      {[
                        ['1', '付款條件', paymentConditionText(form)],
                        ['2', '付款期限', pending(form.paymentDeadline)],
                        ['3', '施作日期', pending(form.serviceDate)]
                      ].map(([number, label, value]) => (
                        <div key={label} className="qbf-term-row">
                          <span>{number}</span>
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="qbf-term-note">
                      <p>驗收完畢完成驗收通過（照片/影片或放棄驗收）</p>
                      <p>視同「完成通過驗收」 事後無法要求管家再回現場進行二次清潔。</p>
                    </div>
                  </div>
                </div>
                <div className="qbf-main" style={termsSignatureLayoutStyle}>
                  <div className="qbf-payment">
                    <div className="qbf-section-label">
                      <span>付款資訊</span>
                      <span className="qbf-payment-reminder">匯款後請提供末五碼，以利對帳</span>
                    </div>
                    <div className="qbf-payment-content">
                      <div className="qbf-bank-wrap">
                        <img className="bank-cover-image" src="/assets/bank-cover.png" alt="付款帳戶資訊" />
                      </div>
                      <div className="qbf-transfer-wrap">
                        <div className="payment-qr-label">掃碼付款</div>
                        <img className="payment-transfer-qr" src="/assets/payment-transfer-qr.png" alt="匯款 QR Code" />
                      </div>
                    </div>
                  </div>
                  <div className="qbf-signatures">
                    <div className="qbf-signature-card qbf-signature-quote">
                      <div className="signature-title signature-title-quote">接受報價簽名</div>
                      <div className="qbf-signature-area">
                        <div className="qbf-signature-line">簽名 / 日期</div>
                      </div>
                    </div>
                    <div className="qbf-signature-card qbf-signature-acceptance">
                      <div className="signature-title signature-title-acceptance">驗收簽名</div>
                      <div className="qbf-signature-area">
                        <div className="qbf-signature-line">簽名 / 日期</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="qbf-footer-note">
                  本估價單內容依場勘紀錄與客戶提供資訊整理，實際施作範圍以雙方確認版本為準。
                </div>
              </section>
            </article>
          </div>
        </section>
      </div>
      {confirmDialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-lg border border-[#c8d9bd] bg-white p-5 shadow-[0_24px_80px_rgba(28,45,24,0.28)]">
            <h3 className="text-lg font-bold text-stone-950">{confirmDialog.title}</h3>
            <p className="mt-3 text-sm leading-6 text-stone-600">{confirmDialog.message}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmDialog}
                className="h-10 rounded-md border border-[#cfd8c8] bg-white px-4 text-sm font-bold text-moss-700 transition hover:bg-moss-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmAndClose}
                className="h-10 rounded-md bg-moss-700 px-4 text-sm font-bold text-white transition hover:bg-moss-800"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
